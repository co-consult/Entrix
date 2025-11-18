class ApiConfig {
  // Base URL for the API
  // Production: https://css.cloud.ms2tech.fr/api/v1
  // Pre-Production: https://preprod.css.cloud.ms2tech.fr/api/v1
  // Local (emulator): http://10.0.2.2:3000/api/v1
  // Local (physical device): http://192.168.100.9:3000/api/v1
  static const String baseUrl = 'https://css.cloud.ms2tech.fr/api/v1';
  
  // Authentication endpoints
  static const String loginEndpoint = '/auth/login';
  static const String logoutEndpoint = '/auth/logout';
  
  // Event endpoints
  static const String eventsEndpoint = '/events';
  static const String eventStatsEndpoint = '/events/{eventId}/stats';
  
  // Access control endpoints
  static const String accessControlValidateEndpoint = '/access-control/validate';
  
  // Subscription endpoints
  static const String subscriptionValidateEndpoint = '/subscription-sales/qr-codes/validate';
  
  // Headers
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Timeout duration
  static const Duration timeout = Duration(seconds: 30);
  
  // Helper method to get full URL
  static String getFullUrl(String endpoint) {
    return '$baseUrl$endpoint';
  }
  
  // Helper method to get event stats URL
  static String getEventStatsUrl(String eventId) {
    return getFullUrl(eventStatsEndpoint.replaceAll('{eventId}', eventId));
  }
}
