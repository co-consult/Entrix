import 'package:flutter/material.dart';

enum EventSportCategory {
  football,
  basketball,
  volleyball,
}

class EventCategoryUtils {
  static const Map<EventSportCategory, String> _labels = {
    EventSportCategory.football: 'Football',
    EventSportCategory.basketball: 'Basketball',
    EventSportCategory.volleyball: 'Volleyball',
  };

  static const Map<EventSportCategory, IconData> _icons = {
    EventSportCategory.football: Icons.sports_soccer,
    EventSportCategory.basketball: Icons.sports_basketball,
    EventSportCategory.volleyball: Icons.sports_volleyball,
  };

  static const Map<EventSportCategory, String> _categoryKeys = {
    EventSportCategory.football: 'football',
    EventSportCategory.basketball: 'basketball',
    EventSportCategory.volleyball: 'volleyball',
  };

  static String label(EventSportCategory category) => _labels[category]!;

  static IconData icon(EventSportCategory category) => _icons[category]!;

  static String categoryKey(EventSportCategory category) =>
      _categoryKeys[category]!;

  static EventSportCategory fromKey(String? key) {
    if (key == null) return EventSportCategory.football;
    switch (key.toLowerCase()) {
      case 'basketball':
        return EventSportCategory.basketball;
      case 'volleyball':
        return EventSportCategory.volleyball;
      default:
        return EventSportCategory.football;
    }
  }

  static String requiredSuffix(EventSportCategory category) {
    return category == EventSportCategory.football ? 'SUB' : 'SUBVB';
  }

  static EventSportCategory categoryFromMap(Map<String, dynamic>? event) {
    if (event == null) return EventSportCategory.football;
    final key = event['__sportCategory']?.toString();
    if (key != null && key.isNotEmpty) {
      return fromKey(key);
    }
    return determineCategory(event);
  }

  static EventSportCategory determineCategory(Map<String, dynamic>? event) {
    final hint = _extractCategoryHint(event);
    if (hint.contains('basket')) {
      return EventSportCategory.basketball;
    }
    if (hint.contains('volley')) {
      return EventSportCategory.volleyball;
    }
    return EventSportCategory.football;
  }

  static String _extractCategoryHint(Map<String, dynamic>? event) {
    if (event == null) return '';

    String? _asString(dynamic value) {
      if (value == null) return null;
      final stringValue = value.toString().trim();
      if (stringValue.isEmpty) return null;
      return stringValue.toLowerCase();
    }

    final metadata = event['metadata'];
    final List<String?> candidates = [
      _asString(event['sport']),
      _asString(event['sport_type']),
      _asString(event['sportType']),
      _asString(event['category']),
      _asString(event['event_category']),
      _asString(event['eventCategory']),
      _asString(event['event_type']),
      _asString(event['eventType']),
      _asString(event['type']),
      _asString(event['name']),
      if (metadata is Map<String, dynamic>) ...[
        _asString(metadata['sport']),
        _asString(metadata['category']),
        _asString(metadata['event_type']),
      ],
    ];

    for (final candidate in candidates) {
      if (candidate != null && candidate.isNotEmpty) {
        return candidate;
      }
    }

    return '';
  }
}

