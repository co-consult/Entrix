import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/design.dart';
import '../services/auth_service.dart';
import '../services/access_control_service.dart';
import '../services/feedback_service.dart';
import '../services/localization_service.dart';
import '../services/event_service.dart';
import '../widgets/language_selector.dart';
import '../utils/app_localizations.dart';
import '../utils/event_category_utils.dart';
import 'qr_scanner_screen.dart';
import 'scan_history_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with WidgetsBindingObserver {
  Map<String, dynamic>? _userData;
  Map<String, dynamic>? _eventData;
  Map<String, dynamic>? _statsData;
  bool _isLoading = true;
  String _userAccessLevel = 'User'; // User's access level for display
  List<Map<String, dynamic>> _allEvents = [];
  bool _isCategorySwitching = false;
  EventSportCategory _selectedCategory = EventSportCategory.football;
  final Map<String, Map<String, dynamic>> _eventDetailsCache = {};
  final Map<String, Map<String, dynamic>> _eventStatsCache = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeDashboard();
  }

  Future<void> _initializeDashboard() async {
    // Load saved category first, then load data
    await _loadSavedCategory();
    _loadData();
  }

  Future<void> _loadSavedCategory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedCategoryKey = prefs.getString('selected_event_category');
      if (savedCategoryKey != null) {
        final category = EventCategoryUtils.fromKey(savedCategoryKey);
        if (mounted) {
          setState(() {
            _selectedCategory = category;
          });
        }
      }
    } catch (e) {
      print('Error loading saved category: $e');
      // Default to football if loading fails
    }
  }

  Future<void> _saveSelectedCategory(EventSportCategory category) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final categoryKey = EventCategoryUtils.categoryKey(category);
      await prefs.setString('selected_event_category', categoryKey);
    } catch (e) {
      print('Error saving selected category: $e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    // Refresh dashboard when app becomes active
    if (state == AppLifecycleState.resumed) {
      print('DEBUG: App resumed, refreshing data...');
      _loadData(refreshStats: true);
    }
  }

  Future<void> _loadData({bool refreshStats = false}) async {
    setState(() {
      _isLoading = true;
    });

    // Clear stats cache if refresh is requested
    if (refreshStats) {
      _clearStatsCache();
    }

    try {
      final hasAccess = await AuthService.hasMobileAppAccess();
      if (!hasAccess) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          Navigator.of(context).pushReplacementNamed('/login');
        }
        return;
      }

      final isLoggedIn = await AuthService.isLoggedIn();
      if (!isLoggedIn) {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          Navigator.of(context).pushReplacementNamed('/login');
        }
        return;
      }

      final userData = await AuthService.getCompleteUserProfile();
      if (userData == null) {
        await AuthService.logout();
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
          Navigator.of(context).pushReplacementNamed('/login');
        }
        return;
      }

      final accessLevel = await AuthService.getUserAccessLevel();

        print('DEBUG: Loading events from /events/available endpoint...');
        final eventsResponse = await AccessControlService.getEvents();
      final events = (eventsResponse['success'] == true && eventsResponse['data'] != null)
          ? _parseEvents(eventsResponse['data'])
          : <Map<String, dynamic>>[];
          
      if (mounted) {
        setState(() {
          _userData = userData;
          _userAccessLevel = accessLevel;
          _allEvents = events;
        });
      }

      if (events.isEmpty) {
        EventService.instance.clearCurrentEvent();
        if (mounted) {
          setState(() {
            _eventData = null;
            _statsData = null;
          });
        }
      } else {
        // Force refresh stats when loading data
        await _selectCategory(_selectedCategory, triggeredByUser: false, forceRefreshStats: refreshStats);
      }

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading dashboard data: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleLogout() async {
    try {
      await AuthService.logout();
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    } catch (e) {
      print('Error during logout: $e');
    }
  }

  List<Map<String, dynamic>> _parseEvents(dynamic data) {
    if (data is List) {
      return data
          .where((event) => event is Map)
          .map<Map<String, dynamic>>(
            (event) => Map<String, dynamic>.from(event as Map),
          )
          .toList();
    }
    return [];
  }

  Future<void> _selectCategory(EventSportCategory category,
      {bool triggeredByUser = true, bool forceRefreshStats = false}) async {
    if (triggeredByUser) {
      if (_isCategorySwitching) return;
      setState(() {
        _selectedCategory = category;
        _isCategorySwitching = true;
      });
      // Save the selected category when user manually selects it
      await _saveSelectedCategory(category);
    } else {
      setState(() {
        _selectedCategory = category;
      });
    }

    try {
      final selectedEvent = _pickBestEventForCategory(category);
      if (selectedEvent == null) {
        if (mounted) {
          setState(() {
            _eventData = null;
            _statsData = null;
          });
        }
        EventService.instance.clearCurrentEvent();
        return;
      }

      final eventId = selectedEvent['id']?.toString();
      if (eventId == null) {
        if (mounted) {
          setState(() {
            _eventData = null;
            _statsData = null;
          });
        }
        EventService.instance.clearCurrentEvent();
        return;
      }

      final eventDetails = await _getEventDetails(eventId, selectedEvent);
      final statsData = await _getEventStats(eventId, forceRefresh: forceRefreshStats);

      if (mounted) {
        setState(() {
          _eventData = eventDetails;
          _statsData = statsData;
        });
      }

      EventService.instance.setCurrentEvent(
        eventId,
        eventDetails,
        categoryKey: EventCategoryUtils.categoryKey(category),
      );
    } finally {
      if (triggeredByUser && mounted) {
        setState(() {
          _isCategorySwitching = false;
        });
      }
    }
  }

  Future<Map<String, dynamic>> _getEventDetails(
    String eventId,
    Map<String, dynamic> fallback,
  ) async {
    if (_eventDetailsCache.containsKey(eventId)) {
      return Map<String, dynamic>.from(_eventDetailsCache[eventId]!);
    }

    final result = await AccessControlService.getEventDetails(eventId);
    if (result['success'] == true && result['data'] is Map<String, dynamic>) {
      final details = Map<String, dynamic>.from(result['data']);
      _eventDetailsCache[eventId] = details;
      return details;
    }

    final fallbackMap = Map<String, dynamic>.from(fallback);
    _eventDetailsCache[eventId] = fallbackMap;
    return fallbackMap;
  }

  Future<Map<String, dynamic>?> _getEventStats(String eventId, {bool forceRefresh = false}) async {
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      _eventStatsCache.remove(eventId);
    } else if (_eventStatsCache.containsKey(eventId)) {
      return Map<String, dynamic>.from(_eventStatsCache[eventId]!);
    }

    final result = await AccessControlService.getEventStatistics(eventId);
    if (result['success'] == true && result['data'] is Map<String, dynamic>) {
      final stats = Map<String, dynamic>.from(result['data']);
      _eventStatsCache[eventId] = stats;
      return stats;
    }

    return null;
  }

  /// Clear event stats cache to force refresh
  void _clearStatsCache() {
    _eventStatsCache.clear();
  }

  Map<String, dynamic>? _pickBestEventForCategory(
      EventSportCategory category) {
    if (_allEvents.isEmpty) return null;
    final filtered = _allEvents
        .where((event) =>
            EventCategoryUtils.determineCategory(event) == category)
        .toList();
    if (filtered.isEmpty) return null;

    final live = _findEventByStatus(filtered, 'LIVE');
    if (live != null) return live;

    final published = _findEventByStatus(filtered, 'PUBLISHED');
    if (published != null) return published;

    return filtered.first;
  }

  Map<String, dynamic>? _findEventByStatus(
      List<Map<String, dynamic>> events, String status) {
    for (final event in events) {
      if (_eventStatus(event) == status) {
        return event;
      }
    }
    return null;
  }

  String _eventStatus(Map<String, dynamic> event) {
    final status = event['status'] ??
        event['event_status'] ??
        event['state'] ??
        event['eventState'];
    return status?.toString().toUpperCase() ?? '';
  }

  String _truncateDescription(String description, {int maxLines = 3}) {
    if (description.length <= 120) return description; // Approximate 3 lines
    
    // Find the last complete sentence within the limit
    final truncated = description.substring(0, 120);
    final lastPeriod = truncated.lastIndexOf('.');
    final lastSpace = truncated.lastIndexOf(' ');
    
    if (lastPeriod > 0 && lastPeriod > lastSpace - 20) {
      return description.substring(0, lastPeriod + 1);
    } else if (lastSpace > 0) {
      return description.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
        return Scaffold(
          backgroundColor: DesignSystem.backgroundColor,
          appBar: AppBar(
            title: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: DesignSystem.primaryColor,
                    borderRadius: BorderRadius.circular(DesignSystem.borderRadiusS),
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: DesignSystem.spacingS),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.l10n('entrixScanner')),
                    Text(
                      '${context.l10n('accessLevel')}: $_userAccessLevel',
                      style: DesignSystem.caption.copyWith(
                        fontSize: 10,
                        color: DesignSystem.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              // Language selector
              const LanguageSelector(),
              const SizedBox(width: DesignSystem.spacingS),
              // Logout button
              IconButton(
                icon: const Icon(Icons.logout),
                onPressed: _handleLogout,
                tooltip: 'Logout',
              ),
            ],
          ),
          body: _isLoading
              ? const Center(
                  child: CircularProgressIndicator(),
                )
              : RefreshIndicator(
                  onRefresh: () => _loadData(refreshStats: true),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(DesignSystem.spacingL),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildCategorySelector(),
                        const SizedBox(height: DesignSystem.spacingL),
                        // TOP: Start Scanning Button (Large and Prominent)
                        Container(
                          width: double.infinity,
                          height: 80,
                          child: ElevatedButton.icon(
                            onPressed: (_eventData == null || _isCategorySwitching)
                                ? null
                                : () async {
                              await FeedbackService.onButtonPress();
                              // Clear stats cache before navigating to scanner
                              _clearStatsCache();
                              await Navigator.of(context).push(
                                MaterialPageRoute(
                                        builder: (context) =>
                                            const QRScannerScreen(),
                                ),
                              );
                              // Refresh stats when returning from scanner
                              if (mounted && _eventData != null) {
                                final eventId = _eventData!['id']?.toString();
                                if (eventId != null) {
                                  final refreshedStats = await _getEventStats(eventId, forceRefresh: true);
                                  if (mounted) {
                                    setState(() {
                                      _statsData = refreshedStats;
                                    });
                                  }
                                }
                              }
                            },
                            icon: const Icon(Icons.qr_code_scanner, size: 32),
                            label: _isCategorySwitching
                                ? const SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 3,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : Text(
                              context.l10n('startScanning'),
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: DesignSystem.primaryButtonStyle.copyWith(
                              padding: WidgetStateProperty.all(
                                const EdgeInsets.symmetric(
                                  horizontal: DesignSystem.spacingXL,
                                  vertical: DesignSystem.spacingL,
                                ),
                              ),
                            ),
                          ),
                        ),
                        if (_eventData == null)
                          Padding(
                            padding: const EdgeInsets.only(
                              top: DesignSystem.spacingS,
                              left: DesignSystem.spacingS,
                              right: DesignSystem.spacingS,
                            ),
                            child: Text(
                              context.l10n('noActiveEventsFound'),
                              textAlign: TextAlign.center,
                              style: DesignSystem.caption.copyWith(
                                color: DesignSystem.textSecondary,
                            ),
                          ),
                        ),
                        const SizedBox(height: DesignSystem.spacingXL),

                        // MIDDLE: Event Information (with limited description)
                        Container(
                          decoration: DesignSystem.cardDecoration,
                          padding: const EdgeInsets.all(DesignSystem.spacingL),
                          child: _isCategorySwitching
                              ? const SizedBox(
                                  height: 120,
                                  child: Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                )
                              : (_eventData != null
                                  ? Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.event, size: 24),
                                            const SizedBox(
                                                width: DesignSystem.spacingS),
                                  Text(
                                    context.l10n('currentEvent'),
                                    style: DesignSystem.heading3,
                                  ),
                                            const SizedBox(
                                                width: DesignSystem.spacingS),
                                            Chip(
                                              label: Text(
                                                EventCategoryUtils.label(
                                                    _selectedCategory),
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                  ),
                                ],
                              ),
                                        const SizedBox(
                                            height: DesignSystem.spacingM),
                                Text(
                                          _eventData!['name'] ??
                                              context.l10n('eventName'),
                                  style: DesignSystem.body1.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                        const SizedBox(
                                            height: DesignSystem.spacingS),
                                Text(
                                          _truncateDescription(
                                            _eventData!['description'] ??
                                                context
                                                    .l10n('eventDescription'),
                                          ),
                                  style: DesignSystem.body2,
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                      ],
                                    )
                                  : Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(Icons.event_busy,
                                                size: 24),
                                            const SizedBox(
                                                width: DesignSystem.spacingS),
                                Text(
                                  context.l10n('noActiveEventsFound'),
                                              style: DesignSystem.body1
                                                  .copyWith(
                                    fontWeight: FontWeight.w600,
                                                color:
                                                    DesignSystem.textSecondary,
                                  ),
                                ),
                                          ],
                                        ),
                                        const SizedBox(
                                            height: DesignSystem.spacingS),
                                Text(
                                  context.l10n('contactAdministrator'),
                                          style:
                                              DesignSystem.body2.copyWith(
                                    color: DesignSystem.textSecondary,
                                  ),
                                ),
                              ],
                                    )),
                        ),
                        const SizedBox(height: DesignSystem.spacingL),

                        // MIDDLE: Statistics Grid
                        if (_eventData != null) ...[
                        Text(
                          context.l10n('statistics'),
                          style: DesignSystem.heading3,
                        ),
                        const SizedBox(height: DesignSystem.spacingM),
                        GridView.count(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisCount: 2,
                          crossAxisSpacing: DesignSystem.spacingM,
                          mainAxisSpacing: DesignSystem.spacingM,
                          childAspectRatio: 1.8,
                          children: [
                            _buildStatCard(
                              context.l10n('totalScans'),
                              _statsData?['totalTickets']?.toString() ?? '0',
                              Icons.qr_code_scanner,
                              DesignSystem.infoColor,
                            ),
                            _buildStatCard(
                              context.l10n('successfulScans'),
                                _statsData?['validatedTickets']?.toString() ??
                                    '0',
                              Icons.check_circle,
                              DesignSystem.successColor,
                            ),
                            _buildStatCard(
                              context.l10n('failedScans'),
                              _statsData?['refusedTickets']?.toString() ?? '0',
                              Icons.cancel,
                              DesignSystem.errorColor,
                            ),
                            _buildStatCard(
                              context.l10n('successRate'),
                              '${_calculateSuccessRate()}%',
                              Icons.trending_up,
                              DesignSystem.warningColor,
                            ),
                          ],
                        ),
                        ],
                        const SizedBox(height: DesignSystem.spacingXL),

                        // BOTTOM: History Button
                        Container(
                          width: double.infinity,
                          height: 60,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await FeedbackService.onButtonPress();
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => const ScanHistoryScreen(),
                                ),
                              );
                            },
                            icon: const Icon(Icons.history, size: 24),
                            label: Text(
                              context.l10n('history'),
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
                      ],
                    ),
                  ),
                ),
            );
      },
    );
  }

  double _calculateSuccessRate() {
    if (_statsData == null) return 0.0;
    
    final totalTickets = _statsData!['totalTickets'] ?? 0;
    final validatedTickets = _statsData!['validatedTickets'] ?? 0;
    
    if (totalTickets == 0) return 0.0;
    
    return ((validatedTickets / totalTickets) * 100).roundToDouble();
  }

  // Helper methods to handle both snake_case and camelCase
  String _getUserFirstName() {
    if (_userData == null) return '';
    
    // Try camelCase first, then snake_case
    final firstName = _userData!['firstName'] ?? _userData!['first_name'];
    return firstName?.toString() ?? '';
  }

  String _getUserLastName() {
    if (_userData == null) return '';
    
    // Try camelCase first, then snake_case
    final lastName = _userData!['lastName'] ?? _userData!['last_name'];
    return lastName?.toString() ?? '';
  }

  String _getUserEmail() {
    if (_userData == null) return '';
    final email = _userData!['email']?.toString() ?? '';
    print('DEBUG _getUserEmail: email = "$email"');
    return email;
  }

  String _getUserDisplayName() {
    final firstName = _getUserFirstName();
    final lastName = _getUserLastName();
    final email = _getUserEmail();
    
    if (firstName.isNotEmpty && lastName.isNotEmpty) {
      return '$firstName $lastName';
    } else if (firstName.isNotEmpty) {
      return firstName;
    } else if (lastName.isNotEmpty) {
      return lastName;
    } else if (email.isNotEmpty) {
      return email;
    } else {
      return 'User';
    }
  }

  String _getAgentId() {
    final firstName = _getUserFirstName();
    final lastName = _getUserLastName();
    final email = _getUserEmail();
    
    if (firstName.isNotEmpty && lastName.isNotEmpty) {
      return '${firstName}_$lastName';
    } else if (firstName.isNotEmpty) {
      return firstName;
    } else if (lastName.isNotEmpty) {
      return lastName;
    } else if (email.isNotEmpty) {
      // Use email prefix as agent ID
      final emailPrefix = email.split('@').first;
      return emailPrefix.isNotEmpty ? emailPrefix : 'agent';
    } else {
      return 'mobile-agent';
    }
  }

  String? _getUserId() {
    if (_userData == null) return null;
    
    // Try camelCase first, then snake_case
    final userId = _userData!['id'] ?? _userData!['user_id'];
    return userId?.toString();
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      decoration: DesignSystem.cardDecoration,
      padding: const EdgeInsets.all(DesignSystem.spacingS),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 24,
            color: color,
          ),
          const SizedBox(height: DesignSystem.spacingXS),
          Text(
            value,
            style: DesignSystem.heading3.copyWith(
              color: color,
            ),
          ),
          const SizedBox(height: DesignSystem.spacingXS),
          Text(
            title,
            style: DesignSystem.caption,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    final categories = EventSportCategory.values;
    return Row(
      children: categories.map((category) {
        final isSelected = _selectedCategory == category;
        return Expanded(
          child: GestureDetector(
            onTap: () {
              if (_selectedCategory != category && !_isCategorySwitching) {
                _selectCategory(category);
              }
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              padding: const EdgeInsets.symmetric(
                vertical: DesignSystem.spacingM,
              ),
              decoration: BoxDecoration(
                color: isSelected
                    ? DesignSystem.primaryColor
                    : DesignSystem.surfaceColor,
                borderRadius:
                    BorderRadius.circular(DesignSystem.borderRadiusM),
                border: Border.all(
                  color: isSelected
                      ? DesignSystem.primaryColor
                      : DesignSystem.borderColor,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color:
                              DesignSystem.primaryColor.withValues(alpha: 0.2),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    EventCategoryUtils.icon(category),
                    color:
                        isSelected ? Colors.white : DesignSystem.textSecondary,
                  ),
                  const SizedBox(height: DesignSystem.spacingS),
                  Text(
                    EventCategoryUtils.label(category),
                    style: DesignSystem.body2.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? Colors.white
                          : DesignSystem.textPrimary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
