import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/design.dart';
import '../services/localization_service.dart';
import '../services/access_control_service.dart';
import '../utils/app_localizations.dart';
import 'dashboard_screen.dart';

class ValidationResultScreen extends StatefulWidget {
  final String qrCode;
  final Map<String, dynamic> result;
  final String? serialNumber; // Optional serial number for manual input

  const ValidationResultScreen({
    super.key,
    required this.qrCode,
    required this.result,
    this.serialNumber, // Make it optional
  });

  @override
  State<ValidationResultScreen> createState() => _ValidationResultScreenState();
}

class _ValidationResultScreenState extends State<ValidationResultScreen> {
  String? _fetchedSerialNumber;
  bool _isLoadingSerialNumber = false;

  @override
  void initState() {
    super.initState();
    // Try to fetch serial number from database if not in response
    _fetchSerialNumberIfNeeded();
  }

  Future<void> _fetchSerialNumberIfNeeded() async {
    // Only fetch if we don't have a serial number and it's not INVALID_QR
    final data = widget.result['data'];
    final denialReason = data?['denial_reason']?.toString().toUpperCase();
    
    if (denialReason == 'INVALID_QR') {
      return; // Don't fetch for invalid QR codes
    }

    // Check if we already have a serial number
    final hasSerialNumber = widget.serialNumber != null && widget.serialNumber!.isNotEmpty;
    final accessRightSerial = data?['access_right']?['serial_number'];
    final hasSerialInResponse = accessRightSerial != null && 
                                accessRightSerial.toString().isNotEmpty && 
                                accessRightSerial.toString() != 'N/A';

    if (hasSerialNumber || hasSerialInResponse) {
      return; // Already have serial number
    }

    // Fetch from database
    setState(() {
      _isLoadingSerialNumber = true;
    });

    try {
      final qrInfo = await AccessControlService.getQRCodeInfo(widget.qrCode);
      if (qrInfo != null && qrInfo['data'] != null) {
        final serialNumber = qrInfo['data']['serial_number'];
        if (serialNumber != null && serialNumber.toString().isNotEmpty && serialNumber.toString() != 'N/A') {
          setState(() {
            _fetchedSerialNumber = serialNumber.toString();
            _isLoadingSerialNumber = false;
          });
          return;
        }
      }
    } catch (e) {
      print('Error fetching QR code info: $e');
    }

    setState(() {
      _isLoadingSerialNumber = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
    final data = widget.result['data'];
    final error = widget.result['error'];
    final statusCode = widget.result['statusCode'];
    
    // Check if the API call was successful and if access was granted
    // Use the same logic as the HTML demo: check result.data.result === 'GRANTED'
    final isApiSuccess = widget.result['success'] == true;
    final isAccessGranted = data != null && data['result'] == 'GRANTED';
    final isSuccess = isApiSuccess && isAccessGranted;
    
          // Determine what to display for the code (serial number from database)
      final displayCode = _getDisplayCode(context, data, widget.qrCode);

    return Scaffold(
      backgroundColor: DesignSystem.backgroundColor,
      appBar: AppBar(
        backgroundColor: DesignSystem.surfaceColor,
        elevation: 0,
            title: Text(context.l10n('validationResult')),
        // Removed the small back arrow - replaced with large button at top
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(DesignSystem.spacingL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // TOP: Large Return Button (Prominent and Easy to Access)
            Container(
              width: double.infinity,
              height: 60,
              margin: const EdgeInsets.only(bottom: DesignSystem.spacingL),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back, size: 24),
                    label: Text(
                      context.l10n('backToScanner'),
                      style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: DesignSystem.surfaceColor,
                  foregroundColor: DesignSystem.primaryColor,
                  elevation: 2,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                  ),
                ),
              ),
            ),

            // Result Header
            Container(
              width: double.infinity,
              decoration: DesignSystem.cardDecoration,
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              child: Column(
                children: [
                  Icon(
                    isSuccess ? Icons.check_circle : Icons.cancel,
                    size: 64,
                    color: isSuccess ? DesignSystem.successColor : DesignSystem.errorColor,
                  ),
                  const SizedBox(height: DesignSystem.spacingM),
                  Text(
                        _getResultTitle(context, data, isSuccess),
                    style: DesignSystem.heading2.copyWith(
                      color: isSuccess ? DesignSystem.successColor : DesignSystem.errorColor,
                    ),
                  ),
                  const SizedBox(height: DesignSystem.spacingS),
                  Text(
                        '${context.l10n('codeLabel')} $displayCode',
                    style: DesignSystem.body2,
                    textAlign: TextAlign.center,
                  ),
                  if (statusCode != null) ...[
                    const SizedBox(height: DesignSystem.spacingS),
                    Text(
                          '${context.l10n('statusCodeLabel')} $statusCode',
                      style: DesignSystem.caption,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: DesignSystem.spacingL),

            // Result Details
            if (isSuccess && data != null) ...[
              // Essential Information Only - IMPORTANT FIELDS HIGHLIGHTED
                  _buildDetailSection(context.l10n('accessInformation'), [
                    _buildDetailRow(context.l10n('validationTime'), '${data['validation_time_ms'] ?? 'N/A'} ms'),
                    _buildDetailRow(context.l10n('entryGate'), data['subscription_info']?['access_point'] ?? 'N/A', isHighlighted: true, highlightLevel: 3),
                    _buildDetailRow(context.l10n('zoneName'), data['subscription_info']?['zone_name'] ?? 'N/A', isHighlighted: true, highlightLevel: 2),
                    _buildDetailRow(context.l10n('seatNumber'), data['subscription_info']?['seat_number'] ?? 'N/A', isHighlighted: true, highlightLevel: 1),
                    _buildDetailRow(context.l10n('planName'), data['subscription_info']?['plan_name'] ?? 'N/A'),
                    _buildDetailRow(context.l10n('price'), '${data['subscription_info']?['price'] ?? 'N/A'} ${data['subscription_info']?['currency'] ?? 'TND'}'),
                    _buildDetailRow(context.l10n('userName'), data['user_info']?['holder_name'] ?? 'N/A', isHighlighted: true, highlightLevel: 1),
                    _buildDetailRow(context.l10n('status'), context.l10n('valid')),
              ]),
              const SizedBox(height: DesignSystem.spacingL),
            ] else ...[
              // Error Details or Access Denied Details
              Container(
                width: double.infinity,
                decoration: DesignSystem.cardDecoration,
                padding: const EdgeInsets.all(DesignSystem.spacingL),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                          isApiSuccess ? context.l10n('accessDeniedReason') : context.l10n('error'),
                      style: DesignSystem.heading3,
                    ),
                    const SizedBox(height: DesignSystem.spacingM),
                    
                    if (isApiSuccess && data != null) ...[
                      // Show denial details from backend
                      if (data['validation_time_ms'] != null) ...[
                        Text(
                              '${context.l10n('validationTime')}: ${data['validation_time_ms']} ms',
                          style: DesignSystem.caption,
                        ),
                        const SizedBox(height: DesignSystem.spacingS),
                      ],
                      
                      // Show access information with proper highlighting hierarchy for valid QR codes without subscription
                      if (_shouldShowAccessInformation(data)) ...[
                            _buildDetailSection(context.l10n('accessInformation'), [
                              _buildDetailRow(context.l10n('entryGate'), _getPhysicalQRData(data, 'entry_gate') ?? 'N/A', isHighlighted: true, highlightLevel: 3),
                              _buildDetailRow(context.l10n('zoneName'), _getPhysicalQRData(data, 'zone_name') ?? 'N/A', isHighlighted: true, highlightLevel: 2),
                              _buildDetailRow(context.l10n('seatNumber'), _getPhysicalQRData(data, 'seat_number') ?? 'N/A', isHighlighted: true, highlightLevel: 1),
                              _buildDetailRow(context.l10n('planName'), _getPhysicalQRData(data, 'plan_name') ?? 'N/A'),
                              _buildDetailRow(context.l10n('userName'), _getPhysicalQRData(data, 'user_name') ?? data['user_info']?['holder_name'] ?? 'N/A', isHighlighted: true, highlightLevel: 1),
                        ]),
                        const SizedBox(height: DesignSystem.spacingL),
                      ] else ...[
                        // Show Access Information button for cases where we might have some data
                        if (_shouldShowAccessInformationButton(data)) ...[
                          Container(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                // Show access information in a dialog or expand the section
                                _showAccessInformationDialog(context, data);
                              },
                              icon: const Icon(Icons.info_outline),
                                  label: Text(context.l10n('accessInformation')),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: DesignSystem.surfaceColor,
                                foregroundColor: DesignSystem.primaryColor,
                                elevation: 1,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: DesignSystem.spacingM),
                        ],
                      ],
                      
                      // Show Reason field prominently in RED - Same size as Access Information
                      if (data['denial_reason'] != null) ...[
                        Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: DesignSystem.errorColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                            border: Border.all(
                              color: DesignSystem.errorColor.withOpacity(0.3),
                            ),
                          ),
                          padding: const EdgeInsets.all(DesignSystem.spacingL),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                    context.l10n('accessDeniedReason'),
                                style: DesignSystem.heading3.copyWith(
                                  color: DesignSystem.errorColor,
                                ),
                              ),
                              const SizedBox(height: DesignSystem.spacingM),
                                  _buildDetailRow(context.l10n('status'), _getResultTitle(context, data, false), isHighlighted: true),
                                  _buildDetailRow(context.l10n('reason'), data['denial_reason'], isHighlighted: true),
                            ],
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingL),
                      ] else ...[
                        // Show appropriate message when no explicit reason is provided
                        Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: _isUnknownCode(data) 
                                ? Colors.black87.withOpacity(0.1)
                                : DesignSystem.errorColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                            border: Border.all(
                              color: _isUnknownCode(data)
                                  ? Colors.black87.withOpacity(0.3)
                                  : DesignSystem.errorColor.withOpacity(0.3),
                            ),
                          ),
                          padding: const EdgeInsets.all(DesignSystem.spacingL),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                    context.l10n('accessDeniedReason'),
                                style: DesignSystem.heading3.copyWith(
                                  color: _isUnknownCode(data) ? Colors.black87 : DesignSystem.errorColor,
                                ),
                              ),
                              const SizedBox(height: DesignSystem.spacingM),
                                  _buildDetailRow(context.l10n('status'), _getResultTitle(context, data, false), isHighlighted: true),
                                  _buildDetailRow(context.l10n('message'), _getAccessDeniedMessage(context, data), isHighlighted: true),
                            ],
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingL),
                      ],
                      
                      // Show last scan information (if applicable) - Clean and organized
                      if (data['denial_details'] != null && data['denial_details']['last_usage'] != null) ...[
                            _buildDetailSection(context.l10n('lastScanInformation'), [
                              _buildDetailRow(context.l10n('lastScanDate'), _formatLastScanDate(context, data['denial_details']['last_usage']['timestamp'])),
                              _buildDetailRow(context.l10n('scannedBy'), data['denial_details']['last_usage']['agent'] ?? 'N/A'),
                        ]),
                        const SizedBox(height: DesignSystem.spacingL),
                      ],
                    ] else ...[
                      // Show generic error
                      Text(
                        error ?? 'Unknown error occurred',
                        style: DesignSystem.body1,
                      ),
                      if (statusCode != null) ...[
                        const SizedBox(height: DesignSystem.spacingS),
                        Text(
                          'Status Code: $statusCode',
                          style: DesignSystem.caption,
                        ),
                      ],
                      const SizedBox(height: DesignSystem.spacingM),
                      Text(
                            context.l10n('qrCodeNotValid'),
                        style: DesignSystem.body2,
                      ),
                      const SizedBox(height: DesignSystem.spacingS),
                      Text(
                            context.l10n('checkQRCodeValidation'),
                        style: DesignSystem.caption,
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: DesignSystem.spacingL),
            ],

            // Action Button
            Center(
              child: SizedBox(
                height: 50,
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(
                        builder: (context) => const DashboardScreen(),
                      ),
                      (route) => false,
                    );
                  },
                  style: DesignSystem.primaryButtonStyle,
                      child: Text(
                        context.l10n('backToDashboard'),
                        style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
        );
      },
    );
  }

  /// Get the appropriate code to display (serial number instead of QR code)
  String _getDisplayCode(BuildContext context, Map<String, dynamic>? data, String qrCode) {
    // If serialNumber was explicitly passed (e.g., from manual input), use it first
    if (widget.serialNumber != null && widget.serialNumber!.isNotEmpty) {
      return widget.serialNumber!;
    }
    
    // If we fetched serial number from database, use it
    if (_fetchedSerialNumber != null && _fetchedSerialNumber!.isNotEmpty) {
      return _fetchedSerialNumber!;
    }
    
    // Show loading indicator if we're still fetching
    if (_isLoadingSerialNumber) {
      return '...';
    }
    
    // Check for INVALID_QR denial reason first
    if (data != null) {
      final denialReason = data['denial_reason']?.toString().toUpperCase();
      if (denialReason == 'INVALID_QR') {
        return 'INVALID';
      }
      
      // PRIORITY 1: Check access_right.serial_number (backend returns it here for denial cases)
      final accessRightSerial = data['access_right']?['serial_number'];
      if (accessRightSerial != null && accessRightSerial.toString().isNotEmpty && accessRightSerial.toString() != 'N/A') {
        return accessRightSerial.toString();
      }
      
      // PRIORITY 2: Check root level and nested objects comprehensively
      // Check all possible locations where backend might return serial_number
      String? foundSerialNumber;
      
      // Direct fields
      foundSerialNumber = data['serial_number'] ?? 
                         data['physical_qr']?['serial_number'] ??
                         data['qr_code_info']?['serial_number'] ??
                         data['subscription_info']?['serial_number'] ??
                         data['qr_code']?['serial_number'] ??
                         data['access_info']?['serial_number'];
      
      // Check nested in access_right (for GRANTED cases, might be in metadata)
      if (foundSerialNumber == null) {
        foundSerialNumber = data['access_right']?['access_metadata']?['serial_number'] ??
                           data['access_right']?['metadata']?['serial_number'];
      }
      
      // Check subscription_info nested fields
      if (foundSerialNumber == null) {
        foundSerialNumber = data['subscription_info']?['metadata']?['serial_number'] ??
                           data['subscription_info']?['qr_metadata']?['serial_number'];
      }
      
      // Check user_info
      if (foundSerialNumber == null) {
        foundSerialNumber = data['user_info']?['serial_number'];
      }
      
      if (foundSerialNumber != null && foundSerialNumber.toString().isNotEmpty && foundSerialNumber.toString() != 'N/A') {
        return foundSerialNumber.toString();
      }
      
      // PRIORITY 3: Try to extract from message (less reliable, only as last resort)
      final messageText = data['message'] ?? data['status'] ?? '';
      if (messageText.isNotEmpty && denialReason != 'INVALID_QR') {
        final serialPatterns = [
          RegExp(r'Serial:\s*(\d{4})', caseSensitive: false),
          RegExp(r'Serial Number:\s*(\d{4})', caseSensitive: false),
          RegExp(r'SN:\s*(\d{4})', caseSensitive: false),
        ];
        
        for (final pattern in serialPatterns) {
          final match = pattern.firstMatch(messageText);
          if (match != null && match.group(1) != null) {
            return match.group(1)!;
          }
        }
      }
    }
    
    // For invalid QR codes, don't display a fallback code
    if (data != null && _isUnknownCode(data)) {
      return context.l10n('notAvailable');
    }
    
    // If we still don't have a serial number, show "N/A" instead of the QR code
    // Never show the QR code - always show serial number or N/A
    return context.l10n('notAvailable');
  }

  /// Get the appropriate title for the result based on the data
  String _getResultTitle(BuildContext context, Map<String, dynamic>? data, bool isSuccess) {
    if (isSuccess) return context.l10n('accessGranted');
    
    if (data != null) {
      if (_isUnknownCode(data)) {
        return context.l10n('codeNotRecognized');
      } else if (_isValidQRNoSubscription(data)) {
        return context.l10n('validQRNoSubscription');
      }
      
      // Check for specific denial reasons to provide more descriptive titles
      final denialReason = data['denial_reason'];
      if (denialReason != null) {
        switch (denialReason.toString().toUpperCase()) {
          case 'ALREADY_USED':
            return '${context.l10n('accessDenied')} - ${context.l10n('alreadyUsed')}';
          case 'EXPIRED':
            return '${context.l10n('accessDenied')} - ${context.l10n('codeExpired')}';
          case 'INVALID_QR':
            return '${context.l10n('accessDenied')} - ${context.l10n('qrCodeNotRecognized')}';
          case 'NO_SUBSCRIPTION':
            return '${context.l10n('accessDenied')} - ${context.l10n('noActiveSubscription')}';
          case 'WRONG_EVENT':
            return '${context.l10n('accessDenied')} - ${context.l10n('wrongEvent')}';
          case 'WRONG_ZONE':
            return '${context.l10n('accessDenied')} - ${context.l10n('wrongZone')}';
          case 'WRONG_TIME':
            return '${context.l10n('accessDenied')} - ${context.l10n('wrongTime')}';
          case 'BLACKLISTED':
            return '${context.l10n('accessDenied')} - ${context.l10n('accessBlocked')}';
          case 'TECHNICAL_ERROR':
            return '${context.l10n('accessDenied')} - ${context.l10n('technicalError')}';
          default:
            return '${context.l10n('accessDenied')} - $denialReason';
        }
      }
    }
    
    return context.l10n('accessDenied');
  }

  /// Get the appropriate message for access denied scenarios
  String _getAccessDeniedMessage(BuildContext context, Map<String, dynamic>? data) {
    if (data != null) {
      if (_isUnknownCode(data)) {
        return context.l10n('qrCodeNotFound');
      } else if (_isValidQRNoSubscription(data)) {
        return context.l10n('validQRNoSubscription');
      }
    }
    return context.l10n('accessDenied');
  }

  bool _isUnknownValue(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.isEmpty) return true;
    if (normalized == 'n/a' || normalized.startsWith('n/a ')) return true;
    if (normalized == 'unknown' || normalized == 'unknown_unknown') return true;
    return false;
  }

  /// Format the last scan date to be more organized and readable
  String _formatLastScanDate(BuildContext context, String? timestamp) {
    if (timestamp == null || timestamp == 'N/A') return context.l10n('notAvailable');
    
    try {
      final date = DateTime.parse(timestamp);
      final now = DateTime.now();
      final difference = now.difference(date);
      
      // Format based on how recent the scan was
      if (difference.inDays > 0) {
        return '${date.day}/${date.month}/${date.year} ${context.l10n('at')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      } else if (difference.inHours > 0) {
        return '${difference.inHours} ${difference.inHours == 1 ? context.l10n('hourAgo') : context.l10n('hoursAgo')} ${context.l10n('at')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      } else if (difference.inMinutes > 0) {
        return '${difference.inMinutes} ${context.l10n('minutesAgo')} ${context.l10n('at')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      } else {
        return '${context.l10n('justNow')} ${context.l10n('at')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
      }
    } catch (e) {
      // If parsing fails, return the original timestamp
      return timestamp;
    }
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      decoration: DesignSystem.cardDecoration,
      padding: const EdgeInsets.all(DesignSystem.spacingL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: DesignSystem.heading3,
          ),
          const SizedBox(height: DesignSystem.spacingM),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isHighlighted = false, int highlightLevel = 0}) {
    if (_isUnknownValue(value)) {
      return const SizedBox.shrink();
    }
    
    // Determine styling based on highlight level
    Color? labelColor;
    Color? valueColor;
    FontWeight valueWeight;
    double valueFontSize;
    
    if (isHighlighted) {
      switch (highlightLevel) {
        case 3: // Entry Gate - Most highlighted
          labelColor = DesignSystem.primaryColor;
          valueColor = DesignSystem.primaryColor;
          valueWeight = FontWeight.w800;
          valueFontSize = 18;
          break;
        case 2: // Zone - Medium highlight
          labelColor = DesignSystem.primaryColor;
          valueColor = DesignSystem.primaryColor;
          valueWeight = FontWeight.w700;
          valueFontSize = 17;
          break;
        case 1: // Seat - Least highlight
          labelColor = DesignSystem.primaryColor;
          valueColor = DesignSystem.primaryColor;
          valueWeight = FontWeight.w600;
          valueFontSize = 16;
          break;
        default: // Fallback
          labelColor = DesignSystem.primaryColor;
          valueColor = DesignSystem.primaryColor;
          valueWeight = FontWeight.w700;
          valueFontSize = 16;
      }
    } else {
      // Plain text - no highlighting
      labelColor = null;
      valueColor = null;
      valueWeight = FontWeight.w400;
      valueFontSize = 14;
    }
    
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingS),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: DesignSystem.body2.copyWith(
                fontWeight: FontWeight.w600,
                color: labelColor,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: DesignSystem.body1.copyWith(
                fontWeight: valueWeight,
                color: valueColor,
                fontSize: valueFontSize,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Helper to determine if access information should be shown for denied access
  bool _shouldShowAccessInformation(Map<String, dynamic>? data) {
    if (data == null) return false;
    
    // Check if we have physical QR data directly from the source
    // The backend should send this in the response for valid QR codes without subscription
    final hasPhysicalData = _hasPhysicalQRData(data);
    
    if (hasPhysicalData) {
      return true;
    }
    
    // Check if we have subscription_info data (for granted access)
    final subscriptionInfo = data['subscription_info'];
    if (subscriptionInfo != null) {
      if (subscriptionInfo['access_point'] != null || 
          subscriptionInfo['zone_name'] != null || 
          subscriptionInfo['seat_number'] != null) {
        return true;
      }
    }
    
    return false;
  }

  /// Helper to check if we have physical QR data from any source
  bool _hasPhysicalQRData(Map<String, dynamic>? data) {
    if (data == null) return false;
    
    // 1. Check if we have access_right with physical data 
    // (backend creates fake access_right object for NO_SUBSCRIPTION cases)
    final accessRight = data['access_right'];
    if (accessRight != null) {
      // For NO_SUBSCRIPTION, backend creates fake access_right with copied physical QR data
      // Check both field naming conventions
      final hasData = accessRight['entry_gate'] != null || accessRight['access_point'] != null || accessRight['gate'] != null || accessRight['porte'] != null ||
                      accessRight['zone_name'] != null || accessRight['zone'] != null || accessRight['section'] != null ||
                      accessRight['seat_number'] != null || accessRight['seat'] != null || accessRight['row'] != null;
      
      if (hasData) {
        return true;
      }
    }
    
    // 2. Check subscription_info (for granted access)
    final subscriptionInfo = data['subscription_info'];
    if (subscriptionInfo != null) {
      final hasData = subscriptionInfo['access_point'] != null || subscriptionInfo['entry_gate'] != null || subscriptionInfo['gate'] != null || subscriptionInfo['porte'] != null ||
                      subscriptionInfo['zone_name'] != null || subscriptionInfo['zone'] != null || subscriptionInfo['section'] != null ||
                      subscriptionInfo['seat_number'] != null || subscriptionInfo['seat'] != null || subscriptionInfo['row'] != null;
      if (hasData) {
        return true;
      }
    }
    
    // 3. Check root level (if backend sends it directly)
    final hasRootData = data['entry_gate'] != null || data['access_point'] != null || data['gate'] != null || data['porte'] != null ||
                        data['zone_name'] != null || data['zone'] != null || data['section'] != null ||
                        data['seat_number'] != null || data['seat'] != null || data['row'] != null;
    if (hasRootData) {
      return true;
    }
    
    return false;
  }

  /// Helper to get physical QR data from the best available source
  String? _getPhysicalQRData(Map<String, dynamic>? data, String fieldName) {
    if (data == null) return null;
    
    // Priority 1: Check access_right (backend creates fake object for NO_SUBSCRIPTION)
    final accessRight = data['access_right'];
    if (accessRight != null) {
      // Check both field naming conventions
      String? value;
      
      switch (fieldName) {
        case 'entry_gate':
          value = accessRight['entry_gate'] ?? accessRight['access_point'] ?? accessRight['gate'] ?? accessRight['porte'];
          break;
        case 'zone_name':
          value = accessRight['zone_name'] ?? accessRight['zone'] ?? accessRight['section'];
          break;
        case 'seat_number':
          value = accessRight['seat_number'] ?? accessRight['seat'] ?? accessRight['row'];
          break;
        case 'plan_name':
          value = accessRight['plan_name'] ?? accessRight['plan'] ?? accessRight['subscription_plan'];
          break;
        case 'user_name':
          value = accessRight['user_name'] ?? accessRight['user'] ?? accessRight['holder_name'];
          break;
        default:
          value = accessRight[fieldName];
      }
      
      if (value != null) {
        return value.toString();
      }
    }
    
    // Priority 2: Check subscription_info (for granted access)
    final subscriptionInfo = data['subscription_info'];
    if (subscriptionInfo != null) {
      String? value;
      
      switch (fieldName) {
        case 'entry_gate':
          value = subscriptionInfo['access_point'] ?? subscriptionInfo['entry_gate'] ?? subscriptionInfo['gate'] ?? subscriptionInfo['porte'];
          break;
        case 'zone_name':
          value = subscriptionInfo['zone_name'] ?? subscriptionInfo['zone'] ?? subscriptionInfo['section'];
          break;
        case 'seat_number':
          value = subscriptionInfo['seat_number'] ?? subscriptionInfo['seat'] ?? subscriptionInfo['row'];
          break;
        case 'plan_name':
          value = subscriptionInfo['plan_name'] ?? subscriptionInfo['plan'];
          break;
        case 'user_name':
          value = subscriptionInfo['user_name'] ?? subscriptionInfo['user'] ?? subscriptionInfo['holder_name'];
          break;
        default:
          value = subscriptionInfo[fieldName];
      }
      
      if (value != null) {
        return value.toString();
      }
    }
    
    // Priority 3: Check root level
    if (data[fieldName] != null) {
      return data[fieldName].toString();
    }
    
    // Priority 4: Check alternative field names
    if (fieldName == 'entry_gate' && data['access_point'] != null) {
      return data['access_point'].toString();
    }
    
    return null;
  }

  /// Helper to determine if we should show the Access Information button
  bool _shouldShowAccessInformationButton(Map<String, dynamic>? data) {
    if (data == null) return false;
    
    // Show button if we have any access-related data but not enough to show full section
    final accessRight = data['access_right'];
    final subscriptionInfo = data['subscription_info'];
    
    return (accessRight != null && (accessRight['id'] != null || accessRight['access_code'] != null)) ||
           (subscriptionInfo != null && subscriptionInfo['id'] != null);
  }

  /// Helper to determine if this is an unknown QR code (not in physical_qr_codes table)
  bool _isUnknownCode(Map<String, dynamic>? data) {
    return data != null && 
           (data['denial_reason']?.toString().toUpperCase() == 'INVALID_CODE' ||
            data['access_right']?['status']?.toString().toLowerCase() == 'code_non_reconnu');
  }

  /// Helper to determine if this is a valid QR code without subscription
  bool _isValidQRNoSubscription(Map<String, dynamic>? data) {
    return data != null && 
           (data['denial_reason']?.toString().toUpperCase() == 'NO_SUBSCRIPTION' ||
            data['access_right']?['status']?.toString().toLowerCase() == 'no_subscription');
  }

  void _showAccessInformationDialog(BuildContext context, Map<String, dynamic>? data) {
    final List<Widget> details = [];

    // Use the helper method to get data from the best available source
    final entryGate = _getPhysicalQRData(data, 'entry_gate');
    final zoneName = _getPhysicalQRData(data, 'zone_name');
    final seatNumber = _getPhysicalQRData(data, 'seat_number');
    final planName = _getPhysicalQRData(data, 'plan_name');
    final userName = _getPhysicalQRData(data, 'user_name');

    if (entryGate != null) {
      details.add(_buildDetailRow('Entry Gate', entryGate, isHighlighted: true, highlightLevel: 3));
    }
    if (zoneName != null) {
      details.add(_buildDetailRow('Zone', zoneName, isHighlighted: true, highlightLevel: 2));
    }
    if (seatNumber != null) {
      details.add(_buildDetailRow('Seat', seatNumber, isHighlighted: true, highlightLevel: 1));
    }
    if (planName != null) {
      details.add(_buildDetailRow('Plan Name', planName));
    }
    if (userName != null) {
      details.add(_buildDetailRow('User Name', userName, isHighlighted: true, highlightLevel: 1));
    }

    if (details.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n('noSpecificAccessInfo'))),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(context.l10n('accessInformation')),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: details,
            ),
          ),
          actions: <Widget>[
            TextButton(
              child: Text(context.l10n('close')),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }
}
