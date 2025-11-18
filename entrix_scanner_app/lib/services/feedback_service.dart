import 'package:flutter/services.dart';

class FeedbackService {
  // Haptic feedback patterns
  static const _successHaptic = HapticFeedback.lightImpact;
  static const _errorHaptic = HapticFeedback.heavyImpact;
  static const _warningHaptic = HapticFeedback.mediumImpact;
  static const _scanHaptic = HapticFeedback.selectionClick;
  
  // Initialize the service
  static Future<void> initialize() async {
    // No initialization needed for haptic feedback
  }
  
  // QR Code detected
  static Future<void> onQRCodeDetected() async {
    await HapticFeedback.selectionClick();
  }
  
  // Successful scan
  static Future<void> onScanSuccess() async {
    await HapticFeedback.lightImpact();
  }
  
  // Failed scan
  static Future<void> onScanError() async {
    await HapticFeedback.heavyImpact();
  }
  
  // Warning/Invalid QR code
  static Future<void> onScanWarning() async {
    await HapticFeedback.mediumImpact();
  }
  
  // Loading state
  static Future<void> onLoading() async {
    await HapticFeedback.selectionClick();
  }
  
  // Button press
  static Future<void> onButtonPress() async {
    await HapticFeedback.selectionClick();
  }
  
  // Navigation
  static Future<void> onNavigation() async {
    await HapticFeedback.lightImpact();
  }
  
  // Helper method for vibration (removed - using HapticFeedback instead)
  // static Future<void> _vibrate(List<int> pattern) async {
  //   try {
  //     if (await Vibration.hasVibrator() ?? false) {
  //       await Vibration.vibrate(pattern: pattern);
  //     }
  //   } catch (e) {
  //     print('FeedbackService: Vibration error: $e');
  //   }
  // }
  
  // Dispose resources
  static Future<void> dispose() async {
    // No disposal needed for haptic feedback
  }
}
