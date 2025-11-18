import 'package:flutter/foundation.dart';

class EventService extends ChangeNotifier {
  static EventService? _instance;
  static EventService get instance {
    _instance ??= EventService._();
    return _instance!;
  }

  EventService._();

  String? _currentEventId;
  Map<String, dynamic>? _currentEventData;
  String? _currentCategoryKey;

  String? get currentEventId => _currentEventId;
  Map<String, dynamic>? get currentEventData => _currentEventData;
  String? get currentCategoryKey => _currentCategoryKey;

  void setCurrentEvent(
    String? eventId,
    Map<String, dynamic>? eventData, {
    String? categoryKey,
  }) {
    _currentEventId = eventId;
    _currentEventData = eventData;
    _currentCategoryKey = categoryKey;
    notifyListeners();
  }

  void clearCurrentEvent() {
    _currentEventId = null;
    _currentEventData = null;
    _currentCategoryKey = null;
    notifyListeners();
  }

  // Get event ID with fallback - returns null if no event is set
  String? getEventIdWithFallback() {
    return _currentEventId;
  }
  
  // Get event ID or throw error if none is set
  String getEventIdOrThrow() {
    if (_currentEventId == null) {
      throw Exception('No current event is set. Please ensure events are loaded properly.');
    }
    return _currentEventId!;
  }
}
