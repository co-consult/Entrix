import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalizationService extends ChangeNotifier {
  static const String _languageKey = 'selected_language';
  static const String _defaultLanguage = 'en';
  
  Locale _currentLocale = const Locale('en');
  bool _isInitialized = false;
  
  Locale get currentLocale => _currentLocale;
  bool get isInitialized => _isInitialized;
  
  // Supported locales
  static const List<Locale> supportedLocales = [
    Locale('en'), // English
    Locale('fr'), // French
  ];
  
  // Language names for display
  static const Map<String, String> languageNames = {
    'en': 'English',
    'fr': 'Français',
  };
  
  // Initialize the service
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLanguage = prefs.getString(_languageKey) ?? _defaultLanguage;
      
      _currentLocale = Locale(savedLanguage);
      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      // Fallback to default language
      _currentLocale = const Locale(_defaultLanguage);
      _isInitialized = true;
      notifyListeners();
    }
  }
  
  // Change language
  Future<void> changeLanguage(String languageCode) async {
    if (_currentLocale.languageCode == languageCode) return;
    
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, languageCode);
      
      _currentLocale = Locale(languageCode);
      notifyListeners();
    } catch (e) {
      // Handle error silently
      print('Error changing language: $e');
    }
  }
  
  // Get current language code
  String get currentLanguageCode => _currentLocale.languageCode;
  
  // Check if current language is English
  bool get isEnglish => _currentLocale.languageCode == 'en';
  
  // Check if current language is French
  bool get isFrench => _currentLocale.languageCode == 'fr';
  
  // Get language name for current locale
  String get currentLanguageName {
    return languageNames[_currentLocale.languageCode] ?? 'English';
  }
  
  // Get language name for specific locale
  String getLanguageName(String languageCode) {
    return languageNames[languageCode] ?? languageCode;
  }
  
  // Reset to default language
  Future<void> resetToDefault() async {
    await changeLanguage(_defaultLanguage);
  }
}
