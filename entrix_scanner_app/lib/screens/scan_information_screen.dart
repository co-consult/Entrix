import 'package:flutter/material.dart';
import '../config/design.dart';
import '../utils/app_localizations.dart';

class ScanInformationScreen extends StatelessWidget {
  final String qrCode;
  final Map<String, dynamic> result;
  final String? serialNumber; // Optional serial number for manual input

  const ScanInformationScreen({
    super.key,
    required this.qrCode,
    required this.result,
    this.serialNumber, // Make it optional
  });

  /// Get the appropriate code to display (serial number if available, otherwise QR code)
  String _getDisplayCode(Map<String, dynamic>? data, String qrCode) {
    // If serialNumber was explicitly passed (e.g., from manual input), use it first
    if (serialNumber != null && serialNumber!.isNotEmpty) {
      return serialNumber!;
    }
    
    if (data != null) {
      // For info mode, check if serial_number is available
      final serialNumber = data['serial_number'];
      if (serialNumber != null && serialNumber.toString().isNotEmpty && serialNumber.toString() != 'N/A') {
        return serialNumber.toString();
      }
    }
    // Default to QR code
    return qrCode;
  }

  /// Check if a value should be considered unknown/empty
  bool _isUnknownValue(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.isEmpty) return true;
    if (normalized == 'n/a' || normalized.startsWith('n/a ')) return true;
    if (normalized == 'unknown' || normalized == 'unknown_unknown') return true;
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final data = result['data'];
    final error = result['error'];
    final statusCode = result['statusCode'];
    
    // Check if the API call was successful
    final isApiSuccess = result['success'] == true;

    return Scaffold(
      backgroundColor: DesignSystem.backgroundColor,
      appBar: AppBar(
        backgroundColor: DesignSystem.surfaceColor,
        elevation: 0,
        title: Text(context.l10n('scanInformation')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(DesignSystem.spacingL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Result Header
            Container(
              decoration: DesignSystem.cardDecoration,
              padding: const EdgeInsets.all(DesignSystem.spacingL),
              child: Column(
                children: [
                  Icon(
                    isApiSuccess ? Icons.info : Icons.error,
                    size: 64,
                    color: isApiSuccess ? DesignSystem.primaryColor : DesignSystem.errorColor,
                  ),
                  const SizedBox(height: DesignSystem.spacingM),
                  Text(
                    'Scan Information',
                    style: DesignSystem.heading2.copyWith(
                      color: isApiSuccess ? DesignSystem.primaryColor : DesignSystem.errorColor,
                    ),
                  ),
                  const SizedBox(height: DesignSystem.spacingS),
                  if (isApiSuccess) ...[
                    Text(
                      'Code: ${_getDisplayCode(data, qrCode)}',
                      style: DesignSystem.body2,
                      textAlign: TextAlign.center,
                    ),
                  ] else ...[
                    Text(
                      'QR Code: $qrCode',
                      style: DesignSystem.body2.copyWith(
                        color: DesignSystem.errorColor,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                  if (statusCode != null) ...[
                    const SizedBox(height: DesignSystem.spacingS),
                    Text(
                      'Status Code: $statusCode',
                      style: DesignSystem.caption,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: DesignSystem.spacingL),

            // Scan Details
            if (isApiSuccess && data != null) ...[
              // For info-only mode, always show Access Information regardless of result
              Builder(
                builder: (context) {
                  final isAccessGranted = data['result'] == 'GRANTED';
                  final isInfoOnly = data['result'] == 'INFO_ONLY';
                  
                  // For info-only mode, always show Access Information
                  if (isAccessGranted || isInfoOnly) {
                    return Column(
                      children: [
                        // Access Information for granted access or info-only mode
                        _buildDetailSection('Access Information', [
                          _buildDetailRow('Validation Time', '${data['validation_time_ms'] ?? 'N/A'} ms'),
                          _buildDetailRow('Zone', data['subscription_info']?['zone_name'] ?? 'N/A', isHighlighted: true),
                          _buildDetailRow('Seat', data['subscription_info']?['seat_number'] ?? 'N/A', isHighlighted: true),
                          _buildDetailRow('Entry Gate', data['subscription_info']?['access_point'] ?? 'N/A', isHighlighted: true),
                          _buildDetailRow('Price', '${data['subscription_info']?['price'] ?? 'N/A'} ${data['subscription_info']?['currency'] ?? 'TND'}'),
                          _buildDetailRow('User Name', data['user_info']?['holder_name'] ?? 'N/A'),
                          _buildDetailRow('Status', isInfoOnly ? 'Info Only' : 'Valid'),
                        ]),
                        const SizedBox(height: DesignSystem.spacingL),
                      ],
                    );
                  } else {
                    return Column(
                      children: [
                        // Access Denied Details (same as validation screen)
                        Container(
                          decoration: DesignSystem.cardDecoration,
                          padding: const EdgeInsets.all(DesignSystem.spacingL),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Access Denied Details',
                                style: DesignSystem.heading3,
                              ),
                              const SizedBox(height: DesignSystem.spacingM),
                              
                              // Show denial details from backend
                              if (data['validation_time_ms'] != null) ...[
                                Text(
                                  'Validation Time: ${data['validation_time_ms']} ms',
                                  style: DesignSystem.caption,
                                ),
                                const SizedBox(height: DesignSystem.spacingS),
                              ],
                              if (data['denial_reason'] != null) ...[
                                Text(
                                  'Reason: ${data['denial_reason']}',
                                  style: DesignSystem.body1.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: DesignSystem.errorColor,
                                  ),
                                ),
                                const SizedBox(height: DesignSystem.spacingS),
                              ],
                              if (data['denial_details'] != null) ...[
                                if (data['denial_details']['primary_reason'] != null) ...[
                                  Text(
                                    'Primary Reason: ${data['denial_details']['primary_reason']}',
                                    style: DesignSystem.body1,
                                  ),
                                  const SizedBox(height: DesignSystem.spacingS),
                                ],
                                if (data['denial_details']['technical_reason'] != null) ...[
                                  Text(
                                    'Technical Reason: ${data['denial_details']['technical_reason']}',
                                    style: DesignSystem.body2,
                                  ),
                                  const SizedBox(height: DesignSystem.spacingS),
                                ],
                                if (data['denial_details']['last_usage'] != null) ...[
                                  const SizedBox(height: DesignSystem.spacingM),
                                  Text(
                                    'Last Usage:',
                                    style: DesignSystem.body2.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: DesignSystem.spacingS),
                                  Text(
                                    'Timestamp: ${data['denial_details']['last_usage']['timestamp']}',
                                    style: DesignSystem.body2,
                                  ),
                                  Text(
                                    'Entry Point: ${data['denial_details']['last_usage']['entry_point']}',
                                    style: DesignSystem.body2,
                                  ),
                                  Text(
                                    'Agent: ${data['denial_details']['last_usage']['agent']}',
                                    style: DesignSystem.body2,
                                  ),
                                  const SizedBox(height: DesignSystem.spacingS),
                                ],
                              ],
                              if (data['access_right'] != null) ...[
                                const SizedBox(height: DesignSystem.spacingM),
                                Text(
                                  'Access Right Information:',
                                  style: DesignSystem.body2.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: DesignSystem.spacingS),
                                Text(
                                  'QR Code: ${data['access_right']['qr_code']}',
                                  style: DesignSystem.body2,
                                ),
                                Text(
                                  'Status: ${data['access_right']['status']}',
                                  style: DesignSystem.body2,
                                ),
                                Text(
                                  'Source Type: ${data['access_right']['source_type']}',
                                  style: DesignSystem.body2,
                                ),
                                const SizedBox(height: DesignSystem.spacingS),
                              ],
                              if (data['suggested_actions'] != null && data['suggested_actions'].isNotEmpty) ...[
                                const SizedBox(height: DesignSystem.spacingM),
                                Text(
                                  'Suggested Actions:',
                                  style: DesignSystem.body2.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: DesignSystem.spacingS),
                                ...data['suggested_actions'].map<Widget>((action) => 
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: DesignSystem.spacingS),
                                    child: Text(
                                      '• $action',
                                      style: DesignSystem.body2,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingL),
                      ],
                    );
                  }
                },
              ),
            ] else ...[
              // Error Details
              Container(
                decoration: DesignSystem.cardDecoration,
                padding: const EdgeInsets.all(DesignSystem.spacingL),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Show different styling for QR Code Not Valid vs other errors
                    if (result['error'] == 'QR Code Not Valid') ...[
                      Icon(
                        Icons.error_outline,
                        size: 48,
                        color: DesignSystem.errorColor,
                      ),
                      const SizedBox(height: DesignSystem.spacingM),
                      Text(
                        'QR Code Not Valid',
                        style: DesignSystem.heading2.copyWith(
                          color: DesignSystem.errorColor,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: DesignSystem.spacingS),
                      Text(
                        result['message'] ?? 'This QR code does not exist in our system.',
                        style: DesignSystem.body1.copyWith(
                          color: DesignSystem.errorColor,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ] else ...[
                      Text(
                        'Error Details',
                        style: DesignSystem.heading3,
                      ),
                      const SizedBox(height: DesignSystem.spacingM),
                      Text(
                        error?.toString() ?? 'Unknown error occurred',
                        style: DesignSystem.body1.copyWith(
                          color: DesignSystem.errorColor,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return Container(
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
  
  Widget _buildDetailRow(String label, String value, {bool isHighlighted = false}) {
    if (_isUnknownValue(value)) {
      return const SizedBox.shrink();
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
                color: isHighlighted ? DesignSystem.primaryColor : DesignSystem.textSecondary,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: DesignSystem.body1.copyWith(
                fontWeight: isHighlighted ? FontWeight.w700 : FontWeight.w400,
                color: isHighlighted ? DesignSystem.primaryColor : null,
                fontSize: isHighlighted ? 16 : 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
