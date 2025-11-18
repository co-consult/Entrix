import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../config/design.dart';
import '../services/scan_history_service.dart';
import '../services/feedback_service.dart';
import '../services/access_control_service.dart';
import '../services/auth_service.dart';
import '../services/event_service.dart';
import '../utils/app_localizations.dart';
import '../services/localization_service.dart';

class ScanHistoryScreen extends StatefulWidget {
  const ScanHistoryScreen({super.key});

  @override
  State<ScanHistoryScreen> createState() => _ScanHistoryScreenState();
}

class _ScanHistoryScreenState extends State<ScanHistoryScreen> {
  List<ScanRecord> _scanRecords = [];
  List<ScanRecord> _filteredRecords = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _statusFilter = 'all';
  Map<String, dynamic> _statistics = {};
  
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadScanHistory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadScanHistory() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final records = await ScanHistoryService.getAllScanRecords();
      final stats = await ScanHistoryService.getScanStatistics();
      
      // Fetch serial numbers from database for records that don't have them
      final updatedRecords = await _fetchMissingSerialNumbers(records);
      
      setState(() {
        _scanRecords = updatedRecords;
        _statistics = stats;
        _filterRecords();
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading scan history: $e');
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('errorLoadingHistory')),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
      }
    }
  }

  /// Fetch serial numbers from database for records that don't have them
  Future<List<ScanRecord>> _fetchMissingSerialNumbers(List<ScanRecord> records) async {
    final updatedRecords = <ScanRecord>[];
    
    for (final record in records) {
      // Skip if already has serial number or is INVALID_QR
      final message = record.message?.toUpperCase() ?? '';
      if (message.contains('INVALID_QR') || 
          message.contains('QR CODE NON RECONNU') || 
          message.contains('QR CODE NOT RECOGNIZED')) {
        updatedRecords.add(record);
        continue;
      }
      
      // If record already has a valid serial number, keep it
      if (record.serialNumber != null && 
          record.serialNumber!.isNotEmpty && 
          record.serialNumber != 'N/A') {
        updatedRecords.add(record);
        continue;
      }
      
      // Try to fetch serial number from database
      try {
        final qrInfo = await AccessControlService.getQRCodeInfo(record.qrCode);
        if (qrInfo != null && qrInfo['data'] != null) {
          final serialNumber = qrInfo['data']['serial_number'];
          if (serialNumber != null && serialNumber.toString().isNotEmpty && serialNumber.toString() != 'N/A') {
            // Update the record with the fetched serial number
            final updatedRecord = ScanRecord(
              id: record.id,
              qrCode: record.qrCode,
              result: record.result,
              status: record.status,
              message: record.message,
              agentId: record.agentId,
              timestamp: record.timestamp,
              eventId: record.eventId,
              venueId: record.venueId,
              serialNumber: serialNumber.toString(),
            );
            
            // Update in database
            if (record.id != null) {
              await ScanHistoryService.updateScanRecord(record.id!, updatedRecord);
            }
            
            updatedRecords.add(updatedRecord);
            continue;
          }
        }
      } catch (e) {
        print('Error fetching serial number for QR code ${record.qrCode}: $e');
      }
      
      // If we couldn't fetch, keep the original record
      updatedRecords.add(record);
    }
    
    return updatedRecords;
  }

  void _filterRecords() async {
    if (_searchQuery.isEmpty && _statusFilter == 'all') {
      _filteredRecords = _scanRecords;
    } else {
      List<ScanRecord> searchResults = [];
      
      // If there's a search query, use the new search functionality
      if (_searchQuery.isNotEmpty) {
        searchResults = await ScanHistoryService.searchScanRecords(_searchQuery);
      } else {
        searchResults = _scanRecords;
      }
      
      // Apply status filter
      if (_statusFilter != 'all') {
        searchResults = searchResults.where((record) => record.status == _statusFilter).toList();
      }
      
      setState(() {
        _filteredRecords = searchResults;
      });
    }
  }

  Future<void> _exportToCSV() async {
    try {
      await FeedbackService.onButtonPress();
      final csv = await ScanHistoryService.exportAsCSV();
      
      // In a real app, you'd save this to a file and share it
      // For now, we'll just show a success message
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('csvExportReady').replaceAll('{0}', csv.length.toString())),
            backgroundColor: DesignSystem.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('errorExportingCsv').replaceAll('{0}', e.toString())),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
        return Scaffold(
          backgroundColor: DesignSystem.backgroundColor,
          appBar: AppBar(
            backgroundColor: DesignSystem.surfaceColor,
            elevation: 0,
            title: Text(context.l10n('scanHistory')),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                FeedbackService.onNavigation();
                Navigator.of(context).pop();
              },
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () {
                  FeedbackService.onButtonPress();
                  _loadScanHistory();
                },
              ),
              IconButton(
                icon: const Icon(Icons.file_download),
                onPressed: _exportToCSV,
              ),
            ],
          ),
          body: Column(
            children: [
              // Statistics Cards
              _buildStatisticsCards(),
              
              // Search and Filter
              _buildSearchAndFilter(),
              
              // Scan Records List
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _filteredRecords.isEmpty
                        ? _buildEmptyState()
                        : _buildScanRecordsList(),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatisticsCards() {
    return Container(
      padding: const EdgeInsets.all(DesignSystem.spacingL),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              context.l10n('totalScans'),
              '${_statistics['total'] ?? 0}',
              Icons.qr_code_scanner,
              DesignSystem.primaryColor,
            ),
          ),
          const SizedBox(width: DesignSystem.spacingM),
          Expanded(
            child: _buildStatCard(
              context.l10n('successfulScans'),
              '${_statistics['success'] ?? 0}',
              Icons.check_circle,
              DesignSystem.successColor,
            ),
          ),
          const SizedBox(width: DesignSystem.spacingM),
          Expanded(
            child: _buildStatCard(
              context.l10n('infoScans'),
              '${_statistics['info'] ?? 0}',
              Icons.info,
              DesignSystem.primaryColor,
            ),
          ),
          const SizedBox(width: DesignSystem.spacingM),
          Expanded(
            child: _buildStatCard(
              context.l10n('todayScans'),
              '${_statistics['today'] ?? 0}',
              Icons.today,
              DesignSystem.warningColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(DesignSystem.spacingM),
      decoration: BoxDecoration(
        color: DesignSystem.surfaceColor,
        borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: DesignSystem.spacingS),
          Text(
            value,
            style: DesignSystem.heading2.copyWith(color: color),
          ),
          Text(
            title,
            style: DesignSystem.caption,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingL),
      child: Column(
        children: [
          // Search Bar
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              labelText: context.l10n('searchRecords'),
              hintText: context.l10n('enterSerialNumberOrQrCode'),
              prefixIcon: const Icon(Icons.search),
              suffixIcon: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_searchQuery.isNotEmpty)
                    IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                          _filterRecords();
                        });
                      },
                    ),
                  IconButton(
                    icon: const Icon(Icons.qr_code_scanner),
                    onPressed: () {
                      FeedbackService.onButtonPress();
                      _showSearchScannerDialog();
                    },
                  ),
                ],
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                borderSide: const BorderSide(color: DesignSystem.borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                borderSide: const BorderSide(color: DesignSystem.borderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                borderSide: const BorderSide(color: DesignSystem.primaryColor, width: 2),
              ),
              filled: true,
              fillColor: DesignSystem.surfaceColor,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: DesignSystem.spacingM,
                vertical: DesignSystem.spacingS,
              ),
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
                _filterRecords();
              });
            },
          ),
          const SizedBox(height: DesignSystem.spacingM),
          
          // Status Filter
          Row(
            children: [
              Text(context.l10n('filterByStatus'), style: DesignSystem.body1),
              const SizedBox(width: DesignSystem.spacingM),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _statusFilter,
                  decoration: InputDecoration(
                    labelText: context.l10n('status'),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                      borderSide: const BorderSide(color: DesignSystem.borderColor),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                      borderSide: const BorderSide(color: DesignSystem.borderColor),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                      borderSide: const BorderSide(color: DesignSystem.primaryColor, width: 2),
                    ),
                    filled: true,
                    fillColor: DesignSystem.surfaceColor,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: DesignSystem.spacingM,
                      vertical: DesignSystem.spacingS,
                    ),
                  ),
                  items: [
                    DropdownMenuItem(value: 'all', child: Text(context.l10n('all'))),
                    DropdownMenuItem(value: 'success', child: Text(context.l10n('success'))),
                    DropdownMenuItem(value: 'error', child: Text(context.l10n('error'))),
                    DropdownMenuItem(value: 'warning', child: Text(context.l10n('warning'))),
                    DropdownMenuItem(value: 'info', child: Text(context.l10n('infoModeLabel'))),
                    DropdownMenuItem(value: 'info_success', child: Text(context.l10n('infoSuccess'))),
                    DropdownMenuItem(value: 'info_not_found', child: Text(context.l10n('infoNotFound'))),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _statusFilter = value!;
                      _filterRecords();
                    });
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: DesignSystem.spacingL),
          Text(
            context.l10n('noRecordsFound'),
            style: DesignSystem.heading3.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: DesignSystem.spacingM),
          Text(
            context.l10n('startScanningToSeeHistory'),
            style: DesignSystem.body2.copyWith(color: Colors.grey[500]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildScanRecordsList() {
    return ListView.builder(
      padding: const EdgeInsets.all(DesignSystem.spacingL),
      itemCount: _filteredRecords.length,
      itemBuilder: (context, index) {
        final record = _filteredRecords[index];
        return _buildScanRecordCard(record);
      },
    );
  }

  Widget _buildScanRecordCard(ScanRecord record) {
    final dateFormat = DateFormat('MMM dd, yyyy HH:mm');
    final statusColor = _getStatusColor(record.status);
    final statusIcon = _getStatusIcon(record.status);
    
    // Use the new helper functions for consistent display
    final displayTitle = ScanHistoryService.getDisplayTitle(record);
    final displaySubtitle = ScanHistoryService.getDisplaySubtitle(record);
    
    // Extract explicit denial reason if available
    final denialReason = _extractDenialReason(context, record);

    return Card(
      margin: const EdgeInsets.only(bottom: DesignSystem.spacingM),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.1),
          child: Icon(statusIcon, color: statusColor),
        ),
        title: Text(
          displayTitle,
          style: DesignSystem.body1.copyWith(fontWeight: FontWeight.w600),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Show QR code below if we have a serial number as title
            if (displaySubtitle != null) ...[
              Text(
                '${context.l10n('qrCode')}: $displaySubtitle',
                style: DesignSystem.caption.copyWith(
                  color: Colors.grey[600],
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: DesignSystem.spacingXS),
            ],
            // Show explicit denial reason prominently if available
            if (denialReason != null && denialReason.isNotEmpty) ...[
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignSystem.spacingS,
                  vertical: DesignSystem.spacingXS,
                ),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusS),
                  border: Border.all(
                    color: statusColor.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Text(
                  denialReason,
                  style: DesignSystem.caption.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: DesignSystem.spacingS),
            ],
            // Show additional message details if available (but not the duplicate denial reason)
            if (record.message != null && record.message!.isNotEmpty && denialReason == null)
              Text(
                record.message!,
                style: DesignSystem.caption,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            const SizedBox(height: DesignSystem.spacingS),
            Text(
              dateFormat.format(record.timestamp),
              style: DesignSystem.caption.copyWith(color: Colors.grey[600]),
            ),
          ],
        ),
        trailing: null, // Removed delete functionality
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'success':
        return DesignSystem.successColor;
      case 'error':
        return DesignSystem.errorColor;
      case 'warning':
        return DesignSystem.warningColor;
      case 'info':
      case 'info_success':
        return DesignSystem.primaryColor;
      case 'info_not_found':
      case 'info_error':
      case 'info_no_data':
        return DesignSystem.warningColor;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'success':
        return Icons.check_circle;
      case 'error':
        return Icons.error;
      case 'warning':
        return Icons.warning;
      case 'info':
      case 'info_success':
        return Icons.info;
      case 'info_not_found':
        return Icons.search_off;
      case 'info_error':
      case 'info_no_data':
        return Icons.info_outline;
      default:
        return Icons.info;
    }
  }

  /// Extract explicit denial reason from scan record message or return null if not found
  String? _extractDenialReason(BuildContext context, ScanRecord record) {
    if (record.message != null && record.message!.isNotEmpty) {
      final message = record.message!;
      final lowerMessage = message.toLowerCase();
      
      // Check if this is a denial/error record
      if (lowerMessage.contains('denied') || 
          lowerMessage.contains('invalid') || 
          lowerMessage.contains('error') || 
          lowerMessage.contains('unauthorized') ||
          lowerMessage.contains('refused') ||
          lowerMessage.contains('failed') ||
          lowerMessage.contains('rejected')) {
        
        // Clean the message by removing serial number prefixes
        String cleanMessage = message
            .replaceAll(RegExp(r'^Serial:\s*[^\s-]+\s*-\s*'), '')
            .replaceAll(RegExp(r'^Serial Number:\s*[^\s-]+\s*-\s*', caseSensitive: false), '')
            .replaceAll(RegExp(r'^SN:\s*[^\s-]+\s*-\s*', caseSensitive: false), '')
            .trim();
        
        // If the cleaned message is empty, return the original message
        if (cleanMessage.isEmpty) {
          return message;
        }
        
        // Check for specific denial patterns and provide explicit reasons
        if (lowerMessage.contains('already used') || lowerMessage.contains('already scanned')) {
          return context.l10n('alreadyUsed');
        } else if (lowerMessage.contains('expired') || lowerMessage.contains('expiration')) {
          return context.l10n('expired');
        } else if (lowerMessage.contains('no subscription') || lowerMessage.contains('subscription')) {
          return context.l10n('noActiveSubscription');
        } else if (lowerMessage.contains('not found') || lowerMessage.contains('does not exist')) {
          return context.l10n('codeNotRecognized');
        } else if (lowerMessage.contains('invalid') || lowerMessage.contains('not valid')) {
          return context.l10n('qrCodeNotValid');
        } else if (lowerMessage.contains('access denied') || lowerMessage.contains('denied')) {
          return context.l10n('accessDenied');
        }
        
        return cleanMessage;
      }
    }
    return null;
  }

  /// Get clean message without serial number prefix
  String _getCleanMessage(String message) {
    // Remove "Serial: XXXX - " prefix if present
    final cleanMessage = message.replaceAll(RegExp(r'^Serial:\s*[^\s-]+\s*-\s*'), '');
    
    // Also remove other serial number patterns
    final cleanedMessage = cleanMessage
        .replaceAll(RegExp(r'^Serial Number:\s*[^\s-]+\s*-\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'^SN:\s*[^\s-]+\s*-\s*', caseSensitive: false), '');
    
    return cleanedMessage.trim();
  }

  void _showScannerDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const ScannerDialog(),
    );
  }
  
  void _showSearchScannerDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => SearchScannerDialog(
        onQRCodeScanned: (qrCode) {
          _searchController.text = qrCode;
          setState(() {
            _searchQuery = qrCode;
            _filterRecords();
          });
        },
      ),
    );
  }
}

// Search Scanner Dialog for filling search field with scanned QR code
class SearchScannerDialog extends StatefulWidget {
  final Function(String) onQRCodeScanned;
  
  const SearchScannerDialog({
    super.key,
    required this.onQRCodeScanned,
  });

  @override
  State<SearchScannerDialog> createState() => _SearchScannerDialogState();
}

class _SearchScannerDialogState extends State<SearchScannerDialog> {
  MobileScannerController? controller;
  bool _isScanning = true;
  String? _lastScannedCode;
  DateTime? _lastScanTime;
  static const Duration _scanCooldown = Duration(seconds: 2);

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController();
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        final qrCode = barcode.rawValue!;
        
        // Check for duplicate scan and cooldown
        if (_isDuplicateScan(qrCode)) {
          return;
        }
        
        FeedbackService.onQRCodeDetected();
        _handleQRCode(qrCode);
        break;
      }
    }
  }

  bool _isDuplicateScan(String qrCode) {
    final now = DateTime.now();
    
    if (_lastScannedCode == qrCode) {
      if (_lastScanTime != null && 
          now.difference(_lastScanTime!) < _scanCooldown) {
        return true;
      }
    }
    
    _lastScannedCode = qrCode;
    _lastScanTime = now;
    return false;
  }

  void _handleQRCode(String qrCode) async {
    if (qrCode.isEmpty) return;
    
    setState(() {
      _isScanning = false;
    });
    
    try {
      // Just return the QR code to fill the search field
      widget.onQRCodeScanned(qrCode);
      
      FeedbackService.onScanSuccess();
      
      if (mounted) {
        Navigator.of(context).pop(); // Close scanner dialog
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('qrCodeScanned').replaceAll('{0}', qrCode.substring(0, qrCode.length > 20 ? 20 : qrCode.length))),
            backgroundColor: DesignSystem.successColor,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      FeedbackService.onScanError();
      
      if (mounted) {
        Navigator.of(context).pop(); // Close scanner dialog
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('errorScanningQrCode').replaceAll('{0}', e.toString())),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isScanning = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: DesignSystem.surfaceColor,
          borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              decoration: BoxDecoration(
                color: DesignSystem.primaryColor,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(DesignSystem.borderRadiusL),
                  topRight: Radius.circular(DesignSystem.borderRadiusL),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Scan QR Code for Search',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Scanner
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(DesignSystem.spacingL),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
                  border: Border.all(
                    color: DesignSystem.primaryColor,
                    width: 2,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
                  child: Stack(
                    children: [
                      MobileScanner(
                        controller: controller,
                        onDetect: _onDetect,
                      ),
                      // Scanning overlay
                      if (!_isScanning)
                        Container(
                          color: Colors.black.withValues(alpha: 0.5),
                          child: const Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Instructions
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              child: const Text(
                'Point your camera at a QR code to fill the search field',
                style: TextStyle(
                  fontSize: 16,
                  color: DesignSystem.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Scanner Dialog for scanning QR codes directly in history
class ScannerDialog extends StatefulWidget {
  const ScannerDialog({super.key});

  @override
  State<ScannerDialog> createState() => _ScannerDialogState();
}

class _ScannerDialogState extends State<ScannerDialog> {
  MobileScannerController? controller;
  bool _isScanning = true;
  String? _lastScannedCode;
  DateTime? _lastScanTime;
  static const Duration _scanCooldown = Duration(seconds: 2);

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController();
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      if (barcode.rawValue != null) {
        final qrCode = barcode.rawValue!;
        
        // Check for duplicate scan and cooldown
        if (_isDuplicateScan(qrCode)) {
          return;
        }
        
        FeedbackService.onQRCodeDetected();
        _handleQRCode(qrCode);
        break;
      }
    }
  }

  bool _isDuplicateScan(String qrCode) {
    final now = DateTime.now();
    
    if (_lastScannedCode == qrCode) {
      if (_lastScanTime != null && 
          now.difference(_lastScanTime!) < _scanCooldown) {
        return true;
      }
    }
    
    _lastScannedCode = qrCode;
    _lastScanTime = now;
    return false;
  }

  Future<void> _handleQRCode(String qrCode) async {
    if (qrCode.isEmpty) return;
    
    setState(() {
      _isScanning = false;
    });
    
    try {
      // Validate the QR code
      final result = await AccessControlService.validateAccessControl(
        qrCode: qrCode,
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
        entryPoint: 'AUTO_DETECT',
        zoneId: 'AUTO_DETECT',
        eventId: EventService.instance.getEventIdOrThrow(),
      );
      
      // Save to scan history
      final validationData = result['data'] ?? result;
      await _saveToScanHistory(qrCode, validationData);
      
      FeedbackService.onScanSuccess();
      
      if (mounted) {
        Navigator.of(context).pop(); // Close scanner dialog
        
        // Show result and refresh history
        _showScanResult(qrCode, result);
      }
    } catch (e) {
      // Save error to scan history
      await _saveToScanHistory(qrCode, {'error': e.toString()}, status: 'error');
      
      FeedbackService.onScanError();
      
      if (mounted) {
        Navigator.of(context).pop(); // Close scanner dialog
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('errorValidatingQrCode').replaceAll('{0}', e.toString())),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isScanning = true;
        });
      }
    }
  }

  Future<void> _saveToScanHistory(String qrCode, Map<String, dynamic> result, {String? status}) async {
    try {
      String actualStatus = 'unknown';
      String message = 'No message';
      
      if (status != null) {
        actualStatus = status;
        message = result['error'] ?? result['message'] ?? context.l10n('errorOccurred');
      } else {
        final success = result['success'];
        final messageText = result['message'] ?? result['status'] ?? '';
        final validationStatus = result['validation_status'] ?? result['status'] ?? '';
        final accessGranted = result['access_granted'];
        final isValid = result['is_valid'];
        
        if (success == true || 
            validationStatus == 'VALID' || 
            validationStatus == 'APPROVED' ||
            accessGranted == true ||
            isValid == true) {
          actualStatus = 'success';
          message = messageText.isNotEmpty ? messageText : context.l10n('accessGranted');
        } else if (success == false || 
                   validationStatus == 'INVALID' || 
                   validationStatus == 'DENIED' ||
                   accessGranted == false ||
                   isValid == false) {
          actualStatus = 'error';
          message = messageText.isNotEmpty ? messageText : context.l10n('accessDenied');
        } else {
          final lowerMessage = messageText.toLowerCase();
          if (lowerMessage.contains('invalid') || 
              lowerMessage.contains('denied') ||
              lowerMessage.contains('error') ||
              lowerMessage.contains('not found') ||
              lowerMessage.contains('expired') ||
              lowerMessage.contains('unauthorized')) {
            actualStatus = 'error';
            message = messageText;
          } else if (lowerMessage.contains('warning') ||
                     lowerMessage.contains('pending') ||
                     lowerMessage.contains('suspended')) {
            actualStatus = 'warning';
            message = messageText;
          } else {
            actualStatus = 'error';
            message = messageText.isNotEmpty ? messageText : context.l10n('accessDenied');
          }
        }
      }
      
      // Get current user ID for the record
      final currentUserId = await AuthService.getCurrentUserId();
      
      final record = ScanRecord(
        qrCode: qrCode,
        result: result['success']?.toString() ?? 'unknown',
        status: actualStatus,
        message: message,
        agentId: result['agentId'] ?? currentUserId ?? 'unknown',
        timestamp: DateTime.now(),
        eventId: EventService.instance.getEventIdOrThrow(),
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
      );
      
      await ScanHistoryService.addScanRecord(record);
    } catch (e) {
      print('Error saving to scan history: $e');
    }
  }

  void _showScanResult(String qrCode, Map<String, dynamic> result) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.l10n('scanResult')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${context.l10n('qrCode')}: ${qrCode.substring(0, qrCode.length > 20 ? 20 : qrCode.length)}...'),
            const SizedBox(height: 8),
            Text('${context.l10n('status')}: ${result['success'] == true ? context.l10n('success') : context.l10n('error')}'),
            if (result['message'] != null) ...[
              const SizedBox(height: 8),
              Text('${context.l10n('message')}: ${result['message']}'),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Refresh the scan history
              if (context.mounted) {
                final scanHistoryState = context.findAncestorStateOfType<_ScanHistoryScreenState>();
                scanHistoryState?._loadScanHistory();
              }
            },
            child: Text(context.l10n('ok')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: BoxDecoration(
          color: DesignSystem.surfaceColor,
          borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              decoration: BoxDecoration(
                color: DesignSystem.primaryColor,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(DesignSystem.borderRadiusL),
                  topRight: Radius.circular(DesignSystem.borderRadiusL),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const Expanded(
                    child: Text(
                      'Scan QR Code',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            // Scanner
            Expanded(
              child: Container(
                margin: const EdgeInsets.all(DesignSystem.spacingL),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
                  border: Border.all(
                    color: DesignSystem.primaryColor,
                    width: 2,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
                  child: Stack(
                    children: [
                      MobileScanner(
                        controller: controller,
                        onDetect: _onDetect,
                      ),
                      // Scanning overlay
                      if (!_isScanning)
                        Container(
                          color: Colors.black.withValues(alpha: 0.5),
                          child: const Center(
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
            
            // Instructions
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              child: const Text(
                'Point your camera at a QR code to scan',
                style: TextStyle(
                  fontSize: 16,
                  color: DesignSystem.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
