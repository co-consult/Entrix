import 'package:flutter/material.dart';
import '../config/design.dart';

class LogViewerScreen extends StatefulWidget {
  const LogViewerScreen({super.key});

  @override
  State<LogViewerScreen> createState() => _LogViewerScreenState();
}

class _LogViewerScreenState extends State<LogViewerScreen> {
  List<String> logs = [];
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Add some sample logs for testing
    logs.add('🔍 App started');
    logs.add('🔍 User logged in successfully');
    logs.add('🔍 QR Code scanned: TEST123');
    logs.add('🔍 API call started');
    logs.add('🔍 Response received: 200 OK');
  }

  void addLog(String message) {
    setState(() {
      logs.add('${DateTime.now().toString().substring(11, 19)}: $message');
    });
    // Auto-scroll to bottom
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void clearLogs() {
    setState(() {
      logs.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DesignSystem.backgroundColor,
      appBar: AppBar(
        backgroundColor: DesignSystem.surfaceColor,
        elevation: 0,
        title: Text(context.l10n('debugLogs')),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.clear_all),
            onPressed: clearLogs,
            tooltip: 'Clear Logs',
          ),
        ],
      ),
      body: Column(
        children: [
          // Info Card
          Container(
            margin: const EdgeInsets.all(DesignSystem.spacingL),
            decoration: DesignSystem.cardDecoration,
            padding: const EdgeInsets.all(DesignSystem.spacingM),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: DesignSystem.infoColor,
                  size: 24,
                ),
                const SizedBox(width: DesignSystem.spacingS),
                Expanded(
                  child: Text(
                    'Debug logs will appear here when you scan QR codes',
                    style: DesignSystem.body2,
                  ),
                ),
              ],
            ),
          ),
          
          // Logs List
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingL),
              decoration: DesignSystem.cardDecoration,
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.all(DesignSystem.spacingM),
                itemCount: logs.length,
                itemBuilder: (context, index) {
                  final log = logs[index];
                  final isError = log.contains('ERROR') || log.contains('Exception');
                  final isSuccess = log.contains('SUCCESS') || log.contains('200');
                  
                  return Container(
                    margin: const EdgeInsets.only(bottom: DesignSystem.spacingS),
                    padding: const EdgeInsets.all(DesignSystem.spacingS),
                    decoration: BoxDecoration(
                      color: isError 
                          ? DesignSystem.errorColor.withValues(alpha: 0.1)
                          : isSuccess 
                              ? DesignSystem.successColor.withValues(alpha: 0.1)
                              : DesignSystem.backgroundColor,
                      borderRadius: BorderRadius.circular(DesignSystem.borderRadiusS),
                      border: Border.all(
                        color: isError 
                            ? DesignSystem.errorColor.withValues(alpha: 0.3)
                            : isSuccess 
                                ? DesignSystem.successColor.withValues(alpha: 0.3)
                                : DesignSystem.borderColor,
                      ),
                    ),
                    child: Text(
                      log,
                      style: DesignSystem.caption.copyWith(
                        fontFamily: 'monospace',
                        color: isError 
                            ? DesignSystem.errorColor
                            : isSuccess 
                                ? DesignSystem.successColor
                                : DesignSystem.textPrimary,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          
          // Bottom Info
          Container(
            margin: const EdgeInsets.all(DesignSystem.spacingL),
            child: Text(
              '${logs.length} log entries',
              style: DesignSystem.caption,
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
