import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/design.dart';
import '../services/access_control_service.dart';
import '../services/auth_service.dart';
import '../services/feedback_service.dart';
import '../services/scan_history_service.dart';
import '../services/event_service.dart';
import 'validation_result_screen.dart';
import 'scan_information_screen.dart';
import '../services/localization_service.dart';
import '../utils/app_localizations.dart';
import '../utils/event_category_utils.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with TickerProviderStateMixin, WidgetsBindingObserver {
  MobileScannerController? controller;
  bool _isScanning = true;
  bool _isFlashOn = false;
  bool _isFrontCamera = false;
  bool _isInfoOnlyMode = false; // Role-based mode flag
  bool _canPerformValidation = false; // Role-based validation permission
  bool _isControllerRole = false; // CONTROLLER role flag
  String _userAccessLevel = 'User'; // User's access level for display
  bool _isLoadingRoles = true; // Loading state for role permissions
  // Note: Zoom functionality not available in current mobile_scanner version
  // double _zoomLevel = 1.0;
  final TextEditingController _manualController = TextEditingController();
  
  // Scan cooldown and duplicate prevention
  String? _lastScannedCode;
  DateTime? _lastScanTime;
  static const Duration _scanCooldown = Duration(seconds: 3); 
  
  // Animation controllers for scanning effect
  late AnimationController _scanLineController;
  late AnimationController _cornerAnimationController;
  late Animation<double> _scanLineAnimation;
  late Animation<double> _cornerAnimation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeScanner();
    _loadUserRolePermissions();
    
    // Initialize animation controllers
    _scanLineController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _cornerAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    // Create animations
    _scanLineAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _scanLineController,
      curve: Curves.easeInOut,
    ));
    
    _cornerAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _cornerAnimationController,
      curve: Curves.easeInOut,
    ));
    
    // Start animations
    _startAnimations();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Check access permissions when dependencies change
    _checkAccessPermissions();
  }

  // CRITICAL SECURITY: Check if user can access this screen
  Future<void> _checkAccessPermissions() async {
    try {
      final hasAccess = await AuthService.canAccessScanner();
      if (!hasAccess) {
        // User doesn't have access - redirect to login or show error
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/login');
        }
        return;
      }
    } catch (e) {
      print('Error checking access permissions: $e');
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  // Load user role permissions
  Future<void> _loadUserRolePermissions() async {
    try {
      // Get all roles at once to avoid multiple storage reads
      final roles = await AuthService.getUserRoles();
      
      if (mounted) {
        setState(() {
          // Check if user can perform validation (ADMIN, BADGER roles)
          _canPerformValidation = roles.contains('ADMIN') || roles.contains('BADGER');
          
          // Check if user is controller role (info-only mode)
          _isControllerRole = roles.contains('CONTROLLER');
          
          // Set access level based on highest role
          if (roles.contains('ADMIN')) {
            _userAccessLevel = 'Admin';
          } else if (roles.contains('BADGER')) {
            _userAccessLevel = 'Badger';
          } else if (roles.contains('CONTROLLER')) {
            _userAccessLevel = 'Controller';
          } else {
            _userAccessLevel = 'User';
          }
          
          // Set initial mode based on role
          if (_isControllerRole) {
            _isInfoOnlyMode = true; // CONTROLLER role is always info-only
          } else {
            _isInfoOnlyMode = false; // ADMIN/BADGER start in validation mode
          }
          _isLoadingRoles = false; // Set loading to false after roles are loaded
        });
      }
    } catch (e) {
      print('Error loading user role permissions: $e');
    }
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    // Refresh scanner when app becomes active
    if (state == AppLifecycleState.resumed) {
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) {
          _refreshScanner();
        }
      });
    }
  }
  
  void _initializeScanner() {
    controller?.dispose();
    controller = MobileScannerController();
    setState(() {
      _isScanning = true;
      _isFlashOn = false;
      _isFrontCamera = false;
      // _zoomLevel = 1.0;
    });
  }
  
  void _startAnimations() {
    _scanLineController.repeat(reverse: true);
    _cornerAnimationController.repeat(reverse: true);
  }
  
  // Helper method to get current event ID with proper error handling
  String _getCurrentEventId() {
    final currentEventId = EventService.instance.getEventIdWithFallback();
    print('DEBUG: _getCurrentEventId() - Retrieved event ID: $currentEventId');
    if (currentEventId == null) {
      throw Exception('No current event is set. Please ensure the app has loaded events properly.');
    }
    return currentEventId;
  }
  
  void _refreshScanner() {
    if (controller != null) {
      controller!.stop().then((_) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            controller!.start();
            setState(() {
              _isScanning = true;
            });
          }
        });
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    controller?.dispose();
    _manualController.dispose();
    _scanLineController.dispose();
    _cornerAnimationController.dispose();
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
          return; // Skip this scan
        }
        
        // Provide feedback when QR code is detected
        FeedbackService.onQRCodeDetected();
        _handleQRCode(qrCode);
        break;
      }
    }
  }
  
  bool _isDuplicateScan(String qrCode) {
    final now = DateTime.now();
    
    // Check if this is the same QR code we just scanned
    if (_lastScannedCode == qrCode) {
      // Check if enough time has passed since last scan
      if (_lastScanTime != null && 
          now.difference(_lastScanTime!) < _scanCooldown) {
        return true; // This is a duplicate scan
      }
    }
    
    // Also check if we're currently processing a scan
    if (!_isScanning) {
      return true; // Block scans when scanner is paused
    }
    
    // Update last scanned code and time
    _lastScannedCode = qrCode;
    _lastScanTime = now;
    return false;
  }

  Future<void> _handleQRCode(String qrCode) async {
    if (qrCode.isEmpty) return;
    
    // CRITICAL: Check if there's a live event before allowing any scanning
    try {
      final currentEventId = EventService.instance.getEventIdWithFallback();
      if (currentEventId == null) {
        await FeedbackService.onScanError();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('No live event available. Please ensure an event is active before scanning.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
            ),
          );
        }
        setState(() {
          _isScanning = true; // Resume scanning
        });
        return;
      }
    } catch (e) {
      await FeedbackService.onScanError();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('No live event available. Please ensure an event is active before scanning.'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
      setState(() {
        _isScanning = true; // Resume scanning
      });
      return;
    }
    
    // Validate QR suffix - if invalid, send to backend as denial and show denial screen
    final suffixValidation = await _validateQrSuffix(qrCode);
    if (!suffixValidation['isValid']) {
      // Send to backend as WRONG_EVENT denial
      await _handleWrongSuffixDenial(qrCode, suffixValidation['requiredSuffix'], suffixValidation['foundSuffix']);
      return;
    }
    
    setState(() {
      _isScanning = false; // Stop scanning while processing
    });
    
    // Show loading feedback
    await FeedbackService.onLoading();
    
    try {
      if (_isInfoOnlyMode) {
        // Info-only mode - get ticket information without validation
        final result = await AccessControlService.getTicketInfo(
          qrCode: qrCode,
          venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
          entryPoint: 'AUTO_DETECT',
          zoneId: 'AUTO_DETECT',
          eventId: _getCurrentEventId(),
        );
        
        FeedbackService.onScanSuccess();
        
        // Extract serial number from the result for scanned QR codes
        String? extractedSerialNumber;
        if (result['data'] != null) {
          final data = result['data'];
          extractedSerialNumber = data['serial_number'] ?? 
                                 data['physical_qr']?['serial_number'] ??
                                 data['qr_code_info']?['serial_number'] ??
                                 data['subscription_info']?['serial_number'] ??
                                 data['qr_code']?['serial_number'] ??
                                 data['access_info']?['serial_number'];
        }
        
        // Save info mode scan to history
        await _saveInfoModeToScanHistory(qrCode, result, extractedSerialNumber ?? '');
        
        if (mounted) {
          // Stop scanning before navigating to prevent background scanning
          setState(() {
            _isScanning = false;
          });
          
          // Also stop the scanner controller to prevent any background scanning
          await controller?.stop();
          
          // Navigate to scan information page
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ScanInformationScreen(
                qrCode: qrCode,
                result: result,
                serialNumber: extractedSerialNumber, // Pass the extracted serial number
              ),
            ),
          ).then((_) async {
            // Resume scanning when returning from scan information page
            if (mounted) {
              // Add a delay before resuming to ensure proper cleanup
              await Future.delayed(const Duration(milliseconds: 500));
              if (mounted) {
                setState(() {
                  _isScanning = true;
                });
                // Restart the scanner controller
                await controller?.start();
              }
            }
          });
        }
      } else {
        // Full validation mode - call validation endpoint
              final result = await AccessControlService.validateAccessControl(
        qrCode: qrCode,
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
        entryPoint: 'AUTO_DETECT',
        zoneId: 'AUTO_DETECT',
        eventId: _getCurrentEventId(),
      );
        
        // Save to scan history - extract the actual validation data
        final validationData = result['data'] ?? result;
        
        // Extract serial number from the result for scanned QR codes
        String? extractedSerialNumber;
        if (result['data'] != null) {
          final data = result['data'];
          extractedSerialNumber = data['serial_number'] ?? 
                                 data['physical_qr']?['serial_number'] ??
                                 data['qr_code_info']?['serial_number'] ??
                                 data['subscription_info']?['serial_number'] ??
                                 data['qr_code']?['serial_number'] ??
                                 data['access_info']?['serial_number'];
        }
        
        // Always save to scan history - pass extracted serial number if available
        await _saveToScanHistory(qrCode, result, providedSerialNumber: extractedSerialNumber);
        
        // Provide success feedback
        await FeedbackService.onScanSuccess();
      
        if (mounted) {
          // Stop scanning before navigating to prevent background scanning
          setState(() {
            _isScanning = false;
          });
          
          // Also stop the scanner controller to prevent any background scanning
          await controller?.stop();
          
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ValidationResultScreen(
                qrCode: qrCode,
                result: result,
                serialNumber: extractedSerialNumber, // Pass the extracted serial number
              ),
            ),
          ).then((_) async {
            // Resume scanning when returning from validation page
            if (mounted) {
              // Add a delay before resuming to ensure proper cleanup
              await Future.delayed(const Duration(milliseconds: 500));
              if (mounted) {
                setState(() {
                  _isScanning = true;
                });
                // Restart the scanner controller
                await controller?.start();
              }
            }
          });
        }
      }
    } catch (e) {
      if (!_isInfoOnlyMode) {
        // Save error to scan history only for validation mode
        await _saveToScanHistory(qrCode, {'error': e.toString()}, status: 'error');
      }
      
      // Provide error feedback
      await FeedbackService.onScanError();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isInfoOnlyMode 
              ? 'Error processing QR code: ${e.toString()}'
              : 'Error validating QR code: ${e.toString()}'),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) {
        // Add a small delay before resuming scanning to prevent immediate re-scan
        await Future.delayed(const Duration(milliseconds: 500));
        setState(() {
          _isScanning = true; // Resume scanning
        });
      }
    }
  }
  

  

  

  

  

  

  

  
  Future<void> _saveToScanHistory(String qrCode, Map<String, dynamic> result, {String? status, String? providedSerialNumber}) async {
    try {
      // Determine the actual status from the API response
      String actualStatus = 'unknown';
      String message = context.l10n('noMessage');
      
      if (status != null) {
        // If status is explicitly provided (e.g., for errors), use it
        actualStatus = status;
        message = result['error'] ?? result['message'] ?? context.l10n('errorOccurred');
      } else {
        // Determine status from API response based on backend documentation
        final success = result['success'];
        final messageText = result['message'] ?? result['status'] ?? '';
        
        // Check the actual access status from the backend response
        final accessStatus = result['data']?['result'] ?? result['result'];
        final accessGranted = result['data']?['access_granted'] ?? result['access_granted'];
        final denialReason = result['data']?['denial_reason'] ?? result['denial_reason'];
        
        // Use the backend's AccessStatus enum values
        if (accessStatus == 'GRANTED' || accessGranted == true) {
          actualStatus = 'success';
          message = messageText.isNotEmpty ? messageText : context.l10n('accessGranted');
        } else if (accessStatus == 'DENIED' || accessGranted == false) {
          actualStatus = 'error';
          // Use the specific denial reason if available
          if (denialReason != null) {
            switch (denialReason) {
              case 'INVALID_QR':
                message = context.l10n('qrCodeNotRecognized');
                break;
              case 'EXPIRED':
                message = context.l10n('codeExpired');
                break;
              case 'ALREADY_USED':
                message = context.l10n('alreadyUsed');
                break;
              case 'NO_SUBSCRIPTION':
                message = context.l10n('noActiveSubscription');
                break;
              case 'WRONG_EVENT':
                message = context.l10n('wrongEvent');
                break;
              case 'WRONG_ZONE':
                message = context.l10n('wrongZone');
                break;
              case 'WRONG_TIME':
                message = context.l10n('wrongTime');
                break;
              case 'BLACKLISTED':
                message = context.l10n('accessBlocked');
                break;
              case 'TECHNICAL_ERROR':
                message = context.l10n('technicalError');
                break;
              default:
                message = messageText.isNotEmpty ? messageText : context.l10n('accessDenied');
            }
        } else {
            message = messageText.isNotEmpty ? messageText : context.l10n('accessDenied');
          }
        } else if (accessStatus == 'CONDITIONAL') {
          actualStatus = 'warning';
          message = messageText.isNotEmpty ? messageText : context.l10n('conditionalAccess');
        } else {
          // Fallback: analyze message content for status
          final lowerMessage = messageText.toLowerCase();
          if (lowerMessage.contains('granted') || 
              lowerMessage.contains('approved') || 
              lowerMessage.contains('valid') ||
              lowerMessage.contains('success') ||
              lowerMessage.contains('autorisé') ||
              lowerMessage.contains('approuvé') ||
              lowerMessage.contains('valide') ||
              lowerMessage.contains('succès')) {
            actualStatus = 'success';
            message = messageText.isNotEmpty ? messageText : context.l10n('accessGranted');
          } else if (lowerMessage.contains('denied') ||
                     lowerMessage.contains('refused') ||
                     lowerMessage.contains('invalid') ||
              lowerMessage.contains('expired') ||
                     lowerMessage.contains('no subscription') ||
                     lowerMessage.contains('pas d\'abonnement') ||
                     lowerMessage.contains('refusé') ||
                     lowerMessage.contains('invalide') ||
                     lowerMessage.contains('expiré')) {
            actualStatus = 'error';
            message = messageText.isNotEmpty ? messageText : context.l10n('accessDenied');
          } else {
            // Default to error if we can't determine status
            actualStatus = 'error';
            message = messageText.isNotEmpty ? messageText : context.l10n('accessDenied');
          }
        }
      }
      
      // Get current user ID for the record
      final currentUserId = await AuthService.getCurrentUserId();
      
      // Extract denial reason from the result
      final data = result['data'];
      final denialReason = data?['denial_reason']?.toString().toUpperCase();
      
      // Include denial reason in message if available (for display detection)
      if (denialReason != null && denialReason.isNotEmpty) {
        // Append denial reason to message if not already present
        if (!message.toUpperCase().contains(denialReason)) {
          message = '$message (${denialReason})';
        }
      }
      
      // Try to extract serial number from the result data
      // Handle different denial reasons appropriately
      String? serialNumber;
      
      // If serial number was explicitly provided (e.g., from manual input), use it
      if (providedSerialNumber != null && providedSerialNumber.isNotEmpty) {
        serialNumber = providedSerialNumber;
      }
      // For INVALID_QR - no valid QR code exists, so no serial number (will show N/A)
      else if (denialReason == 'INVALID_QR') {
        serialNumber = null; // Don't store serial number for invalid QR codes
      }
      // For WRONG_EVENT and SUSPENDED_USER - QR code is valid, fetch from database
      else if (denialReason == 'WRONG_EVENT' || denialReason == 'SUSPENDED_USER' || 
               denialReason == 'EXPIRED' || denialReason == 'ALREADY_USED') {
        // First, check if backend response has it
        if (data != null) {
          serialNumber = data['access_right']?['serial_number'] ?? 
                       data['serial_number'] ?? 
                       data['physical_qr']?['serial_number'] ??
                       data['qr_code_info']?['serial_number'];
        }
        
        // If not in response, fetch from database (QR code is valid and exists in physical_qr_codes table)
        if ((serialNumber == null || serialNumber.isEmpty || serialNumber == 'N/A')) {
          try {
            final qrInfo = await AccessControlService.getQRCodeInfo(qrCode);
            if (qrInfo != null && qrInfo['data'] != null) {
              final fetchedSerial = qrInfo['data']['serial_number'];
              if (fetchedSerial != null && fetchedSerial.toString().isNotEmpty && fetchedSerial.toString() != 'N/A') {
                serialNumber = fetchedSerial.toString();
              }
            }
          } catch (e) {
            print('Error fetching serial number from database for QR code $qrCode: $e');
          }
        }
      }
      // For other denial reasons - check backend response first, then try database
      else {
        // Check the data structure for serial number
        if (data != null) {
          serialNumber = data['access_right']?['serial_number'] ?? 
                       data['serial_number'] ?? 
                       data['physical_qr']?['serial_number'] ??
                       data['qr_code_info']?['serial_number'] ??
                       data['subscription_info']?['serial_number'] ??
                       data['qr_code']?['serial_number'] ??
                       data['access_info']?['serial_number'];
        }
        
        // If not in response, try fetching from database
        if ((serialNumber == null || serialNumber.isEmpty || serialNumber == 'N/A')) {
          try {
            final qrInfo = await AccessControlService.getQRCodeInfo(qrCode);
            if (qrInfo != null && qrInfo['data'] != null) {
              final fetchedSerial = qrInfo['data']['serial_number'];
              if (fetchedSerial != null && fetchedSerial.toString().isNotEmpty && fetchedSerial.toString() != 'N/A') {
                serialNumber = fetchedSerial.toString();
              }
            }
          } catch (e) {
            print('Error fetching serial number from database for QR code $qrCode: $e');
          }
        }
      }
      
      // For success cases (GRANTED), always try to get serial number from backend first, then database
      if (actualStatus == 'success' && serialNumber == null) {
        if (data != null) {
          serialNumber = data['access_right']?['serial_number'] ?? 
                       data['serial_number'] ?? 
                       data['physical_qr']?['serial_number'] ??
                       data['qr_code_info']?['serial_number'] ??
                       data['subscription_info']?['serial_number'] ??
                       data['qr_code']?['serial_number'] ??
                       data['access_info']?['serial_number'];
        }
        
        // If not in response, fetch from database
        if ((serialNumber == null || serialNumber.isEmpty || serialNumber == 'N/A')) {
          try {
            final qrInfo = await AccessControlService.getQRCodeInfo(qrCode);
            if (qrInfo != null && qrInfo['data'] != null) {
              final fetchedSerial = qrInfo['data']['serial_number'];
              if (fetchedSerial != null && fetchedSerial.toString().isNotEmpty && fetchedSerial.toString() != 'N/A') {
                serialNumber = fetchedSerial.toString();
              }
            }
          } catch (e) {
            print('Error fetching serial number from database for QR code $qrCode: $e');
          }
        }
      }
      
      final record = ScanRecord(
        qrCode: qrCode,
        result: result['success']?.toString() ?? 'unknown',
        status: actualStatus,
        message: message,
        agentId: currentUserId,
        timestamp: DateTime.now(),
        eventId: 'f1e2d5c4-b5a6-7890-1234-567890abcdef',
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
        serialNumber: serialNumber,
      );
      
      await ScanHistoryService.addScanRecord(record);
    } catch (e) {
      print('Error saving to scan history: $e');
    }
  }

  // Save to scan history with explicit serial number (for manual input)
  Future<void> _saveToScanHistoryWithSerial(String qrCode, Map<String, dynamic> result, String serialNumber) async {
    try {
      // Determine status from API response based on backend documentation
      String actualStatus;
      String message;
      
      if (result['error'] != null) {
        actualStatus = 'error';
        message = result['error'] ?? result['message'] ?? context.l10n('errorOccurred');
          } else {
        // Check the actual access status from the backend response
        final accessStatus = result['data']?['result'] ?? result['result'];
        final accessGranted = result['data']?['access_granted'] ?? result['access_granted'];
        final denialReason = result['data']?['denial_reason'] ?? result['denial_reason'];
        
        // Use the backend's AccessStatus enum values
        if (accessStatus == 'GRANTED' || accessGranted == true) {
          actualStatus = 'success';
          message = context.l10n('accessGranted');
        } else if (accessStatus == 'DENIED' || accessGranted == false) {
          actualStatus = 'error';
          // Use the specific denial reason if available
          if (denialReason != null) {
            switch (denialReason) {
              case 'INVALID_QR':
                message = context.l10n('qrCodeNotRecognized');
                break;
              case 'EXPIRED':
                message = context.l10n('codeExpired');
                break;
              case 'ALREADY_USED':
                message = context.l10n('alreadyUsed');
                break;
              case 'NO_SUBSCRIPTION':
                message = context.l10n('noActiveSubscription');
                break;
              case 'WRONG_EVENT':
                message = context.l10n('wrongEvent');
                break;
              case 'WRONG_ZONE':
                message = context.l10n('wrongZone');
                break;
              case 'WRONG_TIME':
                message = context.l10n('wrongTime');
                break;
              case 'BLACKLISTED':
                message = context.l10n('accessBlocked');
                break;
              case 'TECHNICAL_ERROR':
                message = context.l10n('technicalError');
                break;
              default:
                message = context.l10n('accessDenied');
          }
        } else {
            message = context.l10n('accessDenied');
        }
        } else if (accessStatus == 'CONDITIONAL') {
          actualStatus = 'warning';
          message = context.l10n('conditionalAccess');
      } else {
          // Default to error if we can't determine status
          actualStatus = 'error';
          message = context.l10n('accessDenied');
        }
      }
      
      // Get current user ID for the record
      final currentUserId = await AuthService.getCurrentUserId();
      
      // Use the explicit serial number passed from manual input
      final record = ScanRecord(
        qrCode: qrCode,
        result: 'MANUAL_INPUT',
        status: actualStatus,
        message: message,
        agentId: currentUserId,
        timestamp: DateTime.now(),
        eventId: _getCurrentEventId(),
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
        serialNumber: serialNumber, // Use the explicit serial number
      );
      
      await ScanHistoryService.addScanRecord(record);
    } catch (e) {
      print('Error saving manual input to scan history: $e');
    }
  }

  // Save info mode to scan history with explicit serial number (for manual input)
  Future<void> _saveInfoModeToScanHistory(String qrCode, Map<String, dynamic> result, String serialNumber) async {
    try {
      // Get current user ID for the record
      final currentUserId = await AuthService.getCurrentUserId();
      
      // Use the explicit serial number passed from manual input
      final record = ScanRecord(
        qrCode: qrCode,
        result: 'INFO_ONLY',
        status: 'info',
        message: 'Info mode scan',
        agentId: currentUserId,
        timestamp: DateTime.now(),
        eventId: _getCurrentEventId(),
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
        serialNumber: serialNumber, // Use the explicit serial number
      );
      
      await ScanHistoryService.addScanRecord(record);
    } catch (e) {
      print('Error saving info mode to scan history: $e');
    }
  }

  Future<void> _handleManualInput() async {
    final serialNumber = _manualController.text.trim();
    if (serialNumber.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n('pleaseEnterSerialNumber')),
          backgroundColor: DesignSystem.errorColor,
        ),
      );
      return;
    }

    // Validate that it's a 4-digit number
    if (!RegExp(r'^\d{4}$').hasMatch(serialNumber)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n('serialNumberMustBe4Digits')),
          backgroundColor: DesignSystem.errorColor,
        ),
      );
      return;
    }

    // Show loading feedback
    await FeedbackService.onLoading();

    try {
      // Get the required suffix for the current event category
      final category = _currentSportCategory();
      final requiredSuffix = EventCategoryUtils.requiredSuffix(category);
      
      // First, get the QR code by serial number, filtering by the required suffix
      final qrCodeResult = await AccessControlService.getQRCodeBySerialNumber(serialNumber, suffix: requiredSuffix);
      
      if (qrCodeResult != null) {
        // Extract QR code from the response - check multiple possible locations
        String? qrCode;
        
        // Check different possible response structures
        if (qrCodeResult['qr_code'] != null) {
          qrCode = qrCodeResult['qr_code'];
        } else if (qrCodeResult['data']?['qr_code'] != null) {
          qrCode = qrCodeResult['data']['qr_code'];
        } else if (qrCodeResult['qrCode'] != null) {
          qrCode = qrCodeResult['qrCode'];
        } else if (qrCodeResult['data']?['qrCode'] != null) {
          qrCode = qrCodeResult['data']['qrCode'];
        }
        
        if (qrCode != null && qrCode.isNotEmpty) {
          print('DEBUG: Manual input - Serial number: $serialNumber');
          print('DEBUG: Manual input - QR code from backend: $qrCode');
          print('DEBUG: Manual input - Full response: $qrCodeResult');
          
          // Validate that the QR code suffix matches the current event category
          final category = _currentSportCategory();
          final requiredSuffix = EventCategoryUtils.requiredSuffix(category);
          final extractedSuffix = _extractQrSuffix(qrCode);
          
          print('DEBUG: Manual input - Category: $category');
          print('DEBUG: Manual input - Required suffix: $requiredSuffix');
          print('DEBUG: Manual input - Extracted suffix: $extractedSuffix');
          
          if (extractedSuffix != requiredSuffix) {
            // QR code suffix doesn't match the event category
            final categoryLabel = EventCategoryUtils.label(category);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'Le QR code trouvé (suffixe: $extractedSuffix) ne correspond pas à $categoryLabel. Suffixe requis: $requiredSuffix. Veuillez utiliser un QR code avec le bon suffixe.',
                  ),
                  backgroundColor: DesignSystem.errorColor,
                  duration: const Duration(seconds: 5),
                ),
              );
            }
            return;
          }
          
          // For manual input, we want to use the serial number directly
          // Call a modified version that handles manual input properly
          await _handleManualQRCode(qrCode, serialNumber);
        } else {
          // QR code not found in response
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.l10n('serialNumberNotFound')),
              backgroundColor: DesignSystem.errorColor,
            ),
          );
        }
      } else {
        // Serial number not found
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.l10n('serialNumberNotFound')),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
      }
    } catch (e) {
      // Handle error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.l10n('errorFindingSerialNumber')),
          backgroundColor: DesignSystem.errorColor,
        ),
      );
    }
  }

  // Handle manual input QR code with explicit serial number
  Future<void> _handleManualQRCode(String qrCode, String serialNumber) async {
    if (qrCode.isEmpty) return;
    
    print('DEBUG: _handleManualQRCode - QR code: $qrCode');
    print('DEBUG: _handleManualQRCode - Serial number: $serialNumber');
    
    // Validate QR suffix - if invalid, send to backend as denial and show denial screen
    final suffixValidation = await _validateQrSuffix(qrCode);
    if (!suffixValidation['isValid']) {
      print('DEBUG: _handleManualQRCode - Suffix validation failed');
      // Send to backend as WRONG_EVENT denial
      await _handleWrongSuffixDenial(qrCode, suffixValidation['requiredSuffix'], suffixValidation['foundSuffix']);
      return;
    }
    
    print('DEBUG: _handleManualQRCode - Suffix validation passed');
    
    setState(() {
      _isScanning = false; // Stop scanning while processing
    });
    
    // Show loading feedback
    await FeedbackService.onLoading();
    
    try {
      if (_isInfoOnlyMode) {
        // Info-only mode - get ticket information without validation
        final result = await AccessControlService.getTicketInfo(
          qrCode: qrCode,
          venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
          entryPoint: 'AUTO_DETECT',
          zoneId: 'AUTO_DETECT',
          eventId: _getCurrentEventId(),
        );
        
        FeedbackService.onScanSuccess();
        
        // Save info mode scan to history with explicit serial number
        await _saveInfoModeToScanHistory(qrCode, result, serialNumber);
        
        if (mounted) {
          // Stop scanning before navigating to prevent background scanning
          setState(() {
            _isScanning = false;
          });
          
          // Also stop the scanner controller to prevent any background scanning
          await controller?.stop();
          
          // Navigate to scan information page
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ScanInformationScreen(
                qrCode: qrCode,
                result: result,
              ),
            ),
          ).then((_) async {
            // Resume scanning when returning from scan information page
            if (mounted) {
              // Add a delay before resuming to ensure proper cleanup
              await Future.delayed(const Duration(milliseconds: 500));
              if (mounted) {
                setState(() {
                  _isScanning = true;
                });
                // Restart the scanner controller
                await controller?.start();
              }
            }
          });
        }
      } else {
        // Full validation mode - call validation endpoint
        final result = await AccessControlService.validateAccessControl(
          qrCode: qrCode,
          venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
          entryPoint: 'AUTO_DETECT',
          zoneId: 'AUTO_DETECT',
          eventId: _getCurrentEventId(),
        );
        
        // Save to scan history with explicit serial number
        await _saveToScanHistoryWithSerial(qrCode, result, serialNumber);
        
        // Provide success feedback
        await FeedbackService.onScanSuccess();
      
        if (mounted) {
          // Stop scanning before navigating to prevent background scanning
          setState(() {
            _isScanning = false;
          });
          
          // Also stop the scanner controller to prevent any background scanning
          await controller?.stop();
          
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ValidationResultScreen(
                qrCode: qrCode,
                result: result,
                serialNumber: serialNumber, // Pass the explicit serial number
              ),
            ),
          ).then((_) async {
            // Resume scanning when returning from validation result page
            if (mounted) {
              // Add a delay before resuming to ensure proper cleanup
              await Future.delayed(const Duration(milliseconds: 500));
              if (mounted) {
                setState(() {
                  _isScanning = true;
                });
                // Restart the scanner controller
                await controller?.start();
              }
            }
          });
        }
      }
    } catch (e) {
      print('Error handling manual QR code: $e');
      
      // Provide error feedback
      await FeedbackService.onScanError();
      
      if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
            content: Text(context.l10n('errorWithDetails').replaceAll('{0}', e.toString())),
            backgroundColor: DesignSystem.errorColor,
          ),
        );
        
        // Resume scanning on error
        setState(() {
          _isScanning = true;
        });
        await controller?.start();
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
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.l10n('qrScanner')),
                // Live event status indicator
                Consumer<EventService>(
                  builder: (context, eventService, child) {
                    final currentEventId = eventService.getEventIdWithFallback();
                    final currentEventData = eventService.currentEventData;
                    return Row(
                      children: [
                        Icon(
                          currentEventId != null ? Icons.event_available : Icons.event_busy,
                          size: 12,
                          color: currentEventId != null ? Colors.green : Colors.red,
                        ),
                        SizedBox(width: 4),
                        Text(
                          currentEventId != null 
                            ? (currentEventData?['name'] ?? 'Live Event Active')
                            : 'No Live Event',
                          style: TextStyle(
                            fontSize: 10,
                            color: currentEventId != null ? Colors.green : Colors.red,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () {
                FeedbackService.onNavigation();
                Navigator.of(context).pop();
              },
            ),
            actions: [
              // Mode toggle button removed - controller can only scan for info mode
          // Info mode indicator for CONTROLLER role
          if (_isControllerRole) ...[
            IconButton(
              icon: const Icon(
                Icons.info,
                color: DesignSystem.warningColor,
              ),
              onPressed: null, // Disabled for CONTROLLER role
                  tooltip: context.l10n('infoModeOnly'),
            ),
          ],
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _refreshScanner();
              ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(context.l10n('scannerRefreshed')),
                  duration: Duration(seconds: 1),
                ),
              );
            },
          ),
          IconButton(
            icon: Icon(_isFlashOn ? Icons.flash_on : Icons.flash_off),
            onPressed: () async {
                  FeedbackService.onButtonPress();
              await controller?.toggleTorch();
              setState(() {
                _isFlashOn = !_isFlashOn;
              });
            },
                tooltip: _isFlashOn ? context.l10n('flashOff') : context.l10n('flashOn'),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () async {
                  FeedbackService.onButtonPress();
              await controller?.switchCamera();
              setState(() {
                _isFrontCamera = !_isFrontCamera;
              });
            },
                tooltip: context.l10n('switchCamera'),
          ),
        ],
      ),
      body: Column(
        children: [
          // Show loading indicator while roles are being loaded
          if (_isLoadingRoles) ...[
            Container(
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              child: const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: DesignSystem.spacingM),
                    Text('Loading permissions...'),
                  ],
                ),
              ),
            ),
          ] else ...[
          // Scanner View
          Expanded(
            flex: 3,
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
                    // Scanning overlay with animations
                    _buildScanningOverlay(),
                    // No live event overlay
                    Consumer<EventService>(
                      builder: (context, eventService, child) {
                        final currentEventId = eventService.getEventIdWithFallback();
                        if (currentEventId == null) {
                          return Container(
                            color: Colors.black.withOpacity(0.7),
                            child: Center(
                              child: Container(
                                margin: EdgeInsets.all(20),
                                padding: EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.event_busy,
                                      color: Colors.white,
                                      size: 48,
                                    ),
                                    SizedBox(height: 16),
                                    Text(
                                      'No Live Event Available',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    SizedBox(height: 8),
                                    Text(
                                      'Please ensure an event is active before scanning',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }
                        return SizedBox.shrink();
                      },
                    ),
                    // Zoom controls (disabled - not supported in current mobile_scanner version)
                    // _buildZoomControls(),
                  ],
                ),
              ),
            ),
          ),

          // Manual Input Section
          Container(
            decoration: DesignSystem.cardDecoration,
            margin: const EdgeInsets.all(DesignSystem.spacingL),
            padding: const EdgeInsets.all(DesignSystem.spacingL),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                        context.l10n('manualInput'),
                  style: DesignSystem.heading3,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: DesignSystem.spacingM),
                TextFormField(
                  controller: _manualController,
                  decoration: DesignSystem.inputDecoration(
                        labelText: context.l10n('serialNumber'),
                        hintText: context.l10n('enterSerialNumberManually'),
                        prefixIcon: const Icon(Icons.confirmation_number),
                      ),
                      keyboardType: TextInputType.number,
                      maxLength: 4,
                  onFieldSubmitted: (_) => _handleManualInput(),
                ),
                const SizedBox(height: DesignSystem.spacingM),
                ElevatedButton(
                  onPressed: _handleManualInput,
                  style: DesignSystem.primaryButtonStyle,
                  child: Text(
                        _isInfoOnlyMode ? context.l10n('checkInfo') : context.l10n('validateSerialNumber'),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Instructions
          Container(
            padding: const EdgeInsets.all(DesignSystem.spacingL),
            child: Column(
              children: [
                Text(
                      context.l10n('instructions'),
                  style: DesignSystem.heading3,
                ),
                const SizedBox(height: DesignSystem.spacingS),
                Text(
                  _isInfoOnlyMode 
                        ? context.l10n('pointCameraAtQrOrEnterSerialNumberToCheckSubscription')
                        : context.l10n('pointCameraAtQrOrEnterSerialNumberToValidateAccess'),
                  style: DesignSystem.body2,
                  textAlign: TextAlign.center,
                ),
                if (_isControllerRole) ...[
                  const SizedBox(height: DesignSystem.spacingS),
                  Text(
                        context.l10n('controllerRoleInfoOnlyNoAccessValidation'),
                    style: DesignSystem.caption.copyWith(
                      color: DesignSystem.warningColor,
                      fontStyle: FontStyle.italic,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ], // Close the else block
        ], // Close the else block
      ),
        );
      },
    );
  }
  
  Widget _buildScanningOverlay() {
    return AnimatedBuilder(
      animation: Listenable.merge([_scanLineAnimation, _cornerAnimation]),
      builder: (context, child) {
        return Stack(
          children: [
            CustomPaint(
              painter: ScanningOverlayPainter(
                scanLineProgress: _scanLineAnimation.value,
                cornerProgress: _cornerAnimation.value,
                primaryColor: DesignSystem.primaryColor,
              ),
              size: Size.infinite,
            ),
            // Show role-based mode indicator
            Positioned(
              top: DesignSystem.spacingL,
              left: DesignSystem.spacingL,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignSystem.spacingM,
                  vertical: DesignSystem.spacingS,
                ),
                decoration: BoxDecoration(
                  color: (_isInfoOnlyMode ? DesignSystem.warningColor : DesignSystem.successColor).withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _isInfoOnlyMode ? Icons.info : Icons.verified,
                          size: 16,
                          color: Colors.white,
                        ),
                        const SizedBox(width: DesignSystem.spacingS),
                        Text(
                          _isInfoOnlyMode ? context.l10n('infoOnly') : context.l10n('validation'),
                          style: DesignSystem.caption.copyWith(
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      context.l10n('role') + ': $_userAccessLevel',
                      style: DesignSystem.caption.copyWith(
                        fontSize: 10,
                        color: Colors.white.withValues(alpha: 0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Show scanning status indicator
            if (!_isScanning)
              Positioned(
                top: DesignSystem.spacingL,
                right: DesignSystem.spacingL,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: DesignSystem.spacingM,
                    vertical: DesignSystem.spacingS,
                  ),
                  decoration: BoxDecoration(
                    color: DesignSystem.surfaceColor.withValues(alpha: 0.9),
                    borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(DesignSystem.primaryColor),
                        ),
                      ),
                      const SizedBox(width: DesignSystem.spacingS),
                      Text(
                        context.l10n('scannerPaused'),
                        style: DesignSystem.caption.copyWith(
                          fontWeight: FontWeight.w600,
                          color: DesignSystem.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
  
  EventSportCategory _currentSportCategory() {
    final categoryKey = EventService.instance.currentCategoryKey;
    if (categoryKey != null) {
      return EventCategoryUtils.fromKey(categoryKey);
    }
    return EventCategoryUtils.categoryFromMap(
      EventService.instance.currentEventData,
    );
  }

  String? _extractQrSuffix(String qrCode) {
    // Trim whitespace and remove any JSON wrapping if present
    final cleaned = qrCode.trim();
    
    // Try to parse as JSON first (in case QR code is JSON-encoded)
    try {
      final jsonData = json.decode(cleaned);
      if (jsonData is Map && jsonData.containsKey('qr_code')) {
        final qrCodeString = jsonData['qr_code'].toString();
        final parts = qrCodeString.split(':');
        if (parts.length >= 3) {
          print('DEBUG: Extracted suffix from JSON: ${parts[2].toUpperCase()}');
          return parts[2].toUpperCase();
        }
      }
    } catch (e) {
      // Not JSON, continue with string parsing
    }
    
    // Parse as colon-separated string
    final parts = cleaned.split(':');
    print('DEBUG: QR Code: $cleaned');
    print('DEBUG: Parts: $parts');
    print('DEBUG: Parts length: ${parts.length}');
    
    if (parts.length >= 3) {
      final suffix = parts[2].trim().toUpperCase();
      print('DEBUG: Extracted suffix: $suffix');
      return suffix;
    }
    
    print('DEBUG: Failed to extract suffix - parts.length < 3');
    return null;
  }

  Future<Map<String, dynamic>> _validateQrSuffix(String qrCode) async {
    final category = _currentSportCategory();
    final requiredSuffix = EventCategoryUtils.requiredSuffix(category);
    final suffix = _extractQrSuffix(qrCode);
    
    print('DEBUG: Category: $category');
    print('DEBUG: Required suffix: $requiredSuffix');
    print('DEBUG: Extracted suffix: $suffix');
    
    final isValid = suffix != null && suffix == requiredSuffix;

    return {
      'isValid': isValid,
      'requiredSuffix': requiredSuffix,
      'foundSuffix': suffix,
      'category': category,
    };
  }

  Future<void> _handleWrongSuffixDenial(String qrCode, String requiredSuffix, String? foundSuffix) async {
    setState(() {
      _isScanning = false; // Stop scanning while processing
    });

    await FeedbackService.onScanError();

    try {
      final currentEventId = EventService.instance.getEventIdWithFallback();
      if (currentEventId == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('No live event available. Please ensure an event is active before scanning.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
            ),
          );
        }
        setState(() {
          _isScanning = true; // Resume scanning
        });
        return;
      }

      // Send to backend - it will detect wrong suffix and return WRONG_EVENT denial
      final result = await AccessControlService.validateAccessControl(
        qrCode: qrCode,
        venueId: 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a',
        entryPoint: 'AUTO_DETECT',
        zoneId: 'AUTO_DETECT',
        eventId: currentEventId,
      );

      // Save to scan history - extraction logic will handle serial number based on denial reason
      await _saveToScanHistory(qrCode, result);

      if (mounted) {
        setState(() {
          _isScanning = false;
        });
        
        await controller?.stop();
        
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => ValidationResultScreen(
              qrCode: qrCode,
              result: result,
            ),
          ),
        ).then((_) async {
          await controller?.start();
          if (mounted) {
            setState(() {
              _isScanning = true;
            });
          }
        });
      }
    } catch (e) {
      print('Error handling wrong suffix denial: $e');
      if (mounted) {
        setState(() {
          _isScanning = true; // Resume scanning
        });
      }
    }
  }
  
  // Zoom controls method removed - not supported in current mobile_scanner version
  // Widget _buildZoomControls() { ... }
}

// Custom painter for scanning overlay
class ScanningOverlayPainter extends CustomPainter {
  final double scanLineProgress;
  final double cornerProgress;
  final Color primaryColor;
  
  ScanningOverlayPainter({
    required this.scanLineProgress,
    required this.cornerProgress,
    required this.primaryColor,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;
    
    final glowPaint = Paint()
      ..color = primaryColor.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8.0);
    
    // Calculate scan area (80% of screen)
    final scanAreaSize = size.width * 0.8;
    final scanAreaLeft = (size.width - scanAreaSize) / 2;
    final scanAreaTop = (size.height - scanAreaSize) / 2;
    final scanAreaRect = Rect.fromLTWH(scanAreaLeft, scanAreaTop, scanAreaSize, scanAreaSize);
    
    // Draw corner brackets
    _drawCornerBrackets(canvas, scanAreaRect, paint, glowPaint);
    
    // Draw scanning line
    _drawScanningLine(canvas, scanAreaRect, paint, glowPaint);
    
    // Draw semi-transparent overlay
    _drawOverlay(canvas, size, scanAreaRect);
  }
  
  void _drawCornerBrackets(Canvas canvas, Rect scanArea, Paint paint, Paint glowPaint) {
    final cornerLength = scanArea.width * 0.15;
    final cornerThickness = 4.0;
    
    // Top-left corner
    _drawCorner(canvas, scanArea.topLeft, cornerLength, cornerThickness, paint, glowPaint, 0);
    // Top-right corner
    _drawCorner(canvas, scanArea.topRight, cornerLength, cornerThickness, paint, glowPaint, 1);
    // Bottom-right corner
    _drawCorner(canvas, scanArea.bottomRight, cornerLength, cornerThickness, paint, glowPaint, 2);
    // Bottom-left corner
    _drawCorner(canvas, scanArea.bottomLeft, cornerLength, cornerThickness, paint, glowPaint, 3);
  }
  
  void _drawCorner(Canvas canvas, Offset position, double length, double thickness, Paint paint, Paint glowPaint, int cornerIndex) {
    final path = Path();
    final glowPath = Path();
    
    switch (cornerIndex) {
      case 0: // Top-left
        path.moveTo(position.dx, position.dy + length);
        path.lineTo(position.dx, position.dy);
        path.lineTo(position.dx + length, position.dy);
        glowPath.moveTo(position.dx, position.dy + length);
        glowPath.lineTo(position.dx, position.dy);
        glowPath.lineTo(position.dx + length, position.dy);
        break;
      case 1: // Top-right
        path.moveTo(position.dx - length, position.dy);
        path.lineTo(position.dx, position.dy);
        path.lineTo(position.dx, position.dy + length);
        glowPath.moveTo(position.dx - length, position.dy);
        glowPath.lineTo(position.dx, position.dy);
        glowPath.lineTo(position.dx, position.dy + length);
        break;
      case 2: // Bottom-right
        path.moveTo(position.dx, position.dy - length);
        path.lineTo(position.dx, position.dy);
        path.lineTo(position.dx - length, position.dy);
        glowPath.moveTo(position.dx, position.dy - length);
        glowPath.lineTo(position.dx, position.dy);
        glowPath.lineTo(position.dx - length, position.dy);
        break;
      case 3: // Bottom-left
        path.moveTo(position.dx + length, position.dy);
        path.lineTo(position.dx, position.dy);
        path.lineTo(position.dx, position.dy - length);
        glowPath.moveTo(position.dx + length, position.dy);
        glowPath.lineTo(position.dx, position.dy);
        glowPath.lineTo(position.dx, position.dy - length);
        break;
    }
    
    // Draw glow effect
    canvas.drawPath(glowPath, glowPaint);
    // Draw main corner
    canvas.drawPath(path, paint);
  }
  
  void _drawScanningLine(Canvas canvas, Rect scanArea, Paint paint, Paint glowPaint) {
    final lineY = scanArea.top + (scanArea.height * scanLineProgress);
    
    // Draw glow effect
    canvas.drawLine(
      Offset(scanArea.left, lineY),
      Offset(scanArea.right, lineY),
      glowPaint,
    );
    
    // Draw main scanning line
    canvas.drawLine(
      Offset(scanArea.left, lineY),
      Offset(scanArea.right, lineY),
      paint,
    );
  }
  
  void _drawOverlay(Canvas canvas, Size size, Rect scanArea) {
    final overlayPaint = Paint()
      ..color = Colors.black.withValues(alpha: 0.5)
      ..style = PaintingStyle.fill;
    
    // Draw semi-transparent overlay around scan area
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRect(scanArea)
      ..fillType = PathFillType.evenOdd;
    
    canvas.drawPath(path, overlayPaint);
  }
  
  @override
  bool shouldRepaint(ScanningOverlayPainter oldDelegate) {
    return oldDelegate.scanLineProgress != scanLineProgress ||
           oldDelegate.cornerProgress != cornerProgress ||
           oldDelegate.primaryColor != primaryColor;
  }
}
