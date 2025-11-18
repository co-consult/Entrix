import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';
import 'device_info_service.dart';

class AccessControlService {

  // Get QR code info by QR code string (to get serial_number from physical_qr_codes table)
  static Future<Map<String, dynamic>?> getQRCodeInfo(String qrCode) async {
    try {
      final token = await AuthService.getToken();
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      print('DEBUG: Getting QR code info for: $qrCode');
      
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/subscription-sales/qr-code-info/$qrCode'),
        headers: headers,
      );
      
      print('DEBUG: QR code info response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        print('DEBUG: getQRCodeInfo - Found QR code info: ${responseData['data']?['serial_number']}');
        return responseData;
      } else if (response.statusCode == 404) {
        print('DEBUG: getQRCodeInfo - QR code not found: $qrCode');
        return null;
      } else {
        print('DEBUG: getQRCodeInfo - Error response: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('DEBUG: getQRCodeInfo - Exception: $e');
      return null;
    }
  }

  // Get QR code by serial number
  static Future<Map<String, dynamic>?> getQRCodeBySerialNumber(String serialNumber, {String? suffix}) async {
    try {
      final token = await AuthService.getToken();
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      print('DEBUG: Searching for QR code with serial number: $serialNumber${suffix != null ? ", suffix: $suffix" : ""}');
      
      // Build URL with optional suffix parameter
      final uri = Uri.parse('${ApiConfig.baseUrl}/subscription-sales/qr-code-by-serial/$serialNumber');
      final uriWithParams = suffix != null 
        ? uri.replace(queryParameters: {'suffix': suffix})
        : uri;
      
      final response = await http.get(
        uriWithParams,
        headers: headers,
      );
      
      print('DEBUG: Serial number search response status: ${response.statusCode}');
      print('DEBUG: Serial number search response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        print('DEBUG: getQRCodeBySerialNumber - Found QR code: $responseData');
        return responseData;
      } else if (response.statusCode == 404) {
        print('DEBUG: getQRCodeBySerialNumber - Serial number not found: $serialNumber');
        return null;
      } else {
        print('DEBUG: getQRCodeBySerialNumber - Error response: ${response.statusCode} - ${response.body}');
        throw Exception('Failed to search for serial number: ${response.statusCode}');
      }
    } catch (e) {
      print('DEBUG: getQRCodeBySerialNumber - Exception: $e');
      rethrow;
    }
  }

  // Get ticket information without validation (info-only mode)
  static Future<Map<String, dynamic>> getTicketInfo({
    required String qrCode,
    required String venueId,
    required String entryPoint,
    required String zoneId,
    String? agentId,
    String? terminalId,
    required String eventId,
  }) async {
    try {
      // For info-only mode, we need to call the backend to get complete ticket information
      // but without creating access control logs
      final token = await AuthService.getToken();
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      // Get real device info
      final deviceInfo = await DeviceInfoService.getDeviceInfo();
      
      // Get authenticated user info for agent
      final userData = await AuthService.getCompleteUserProfile();
      
      // Helper function to get user name handling both snake_case and camelCase
      String getUserName(Map<String, dynamic> userData, String fieldName) {
        final camelCase = userData[fieldName];
        final snakeCase = userData[fieldName.contains('Name') ? fieldName.replaceAll('Name', '_name') : fieldName];
        final variations = [camelCase, snakeCase, userData[fieldName.toLowerCase()], userData[fieldName.toUpperCase()]];
        
        for (final variation in variations) {
          if (variation != null && variation.toString().isNotEmpty) {
            return variation.toString();
          }
        }
        return 'Unknown';
      }
      
      // Improved agent ID generation
      String generateAgentId(Map<String, dynamic>? userData, String? fallbackAgentId) {
        if (userData == null) {
          return fallbackAgentId ?? 'mobile-agent';
        }
        
        final firstName = getUserName(userData, 'firstName');
        final lastName = getUserName(userData, 'lastName');
        final email = userData['email']?.toString() ?? '';
        
        if (firstName != 'Unknown' && lastName != 'Unknown') {
          return '${firstName}_$lastName';
        } else if (firstName != 'Unknown') {
          return firstName;
        } else if (lastName != 'Unknown') {
          return lastName;
        } else if (email.isNotEmpty) {
          final emailPrefix = email.split('@').first;
          return emailPrefix.isNotEmpty ? emailPrefix : 'mobile-agent';
        } else {
          return fallbackAgentId ?? 'mobile-agent';
        }
      }
      
      final userAgentId = generateAgentId(userData, agentId);
      final realTerminalId = terminalId ?? await DeviceInfoService.getTerminalId();
      
      // Call the subscription-sales QR code info endpoint to get complete ticket information
      // without creating access control logs
      print('DEBUG: Getting QR code info for: $qrCode');
      
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/subscription-sales/qr-code-info/$qrCode'),
        headers: headers,
      );
      
      print('DEBUG: QR code info response status: ${response.statusCode}');
      print('DEBUG: QR code info response body: ${response.body}');
      
              if (response.statusCode == 200) {
          final responseData = json.decode(response.body);
          
          // Debug logging to see what we're receiving
          print('DEBUG: getTicketInfo - Raw response: $responseData');
          print('DEBUG: getTicketInfo - Data section: ${responseData['data']}');
          
          // Extract metadata directly from physical_qr_codes.metadata
          final metadata = responseData['data']?['metadata'];
          final hasMetadata = metadata != null && metadata is Map<String, dynamic>;
          
          // Transform the response to match the validation result format
          // For info mode, we always use the metadata from physical_qr_codes table
          final transformedData = {
            'result': 'INFO_ONLY',
            'validation_time_ms': 0,
            'serial_number': responseData['data']?['serial_number'] ?? 'N/A',
            'subscription_info': {
              'plan_name': 'No Plan', // Info mode doesn't have subscription details
              'zone_name': hasMetadata ? (metadata['zone_name'] ?? metadata['zone'] ?? metadata['section'] ?? 'N/A') : 'N/A',
              'seat_number': hasMetadata ? (metadata['seat_number'] ?? metadata['seat'] ?? metadata['row'] ?? 'N/A') : 'N/A',
              'access_point': hasMetadata ? (metadata['entry_gate'] ?? metadata['access_point'] ?? metadata['gate'] ?? metadata['porte'] ?? 'N/A') : 'N/A',
              'price': 'N/A', // No subscription = no price
              'currency': 'TND',
            },
            'user_info': {
              'holder_name': hasMetadata ? (metadata['user_name'] ?? metadata['user'] ?? 'N/A') : 'N/A',
            },
          };
          
          print('DEBUG: getTicketInfo - Transformed data: $transformedData');
        
        return {
          'success': true,
          'data': transformedData,
          'statusCode': 200,
        };
      } else if (response.statusCode == 404) {
        // QR code not found in database - return clear error
        return {
          'success': false,
          'error': 'QR Code Not Valid',
          'message': 'This QR code does not exist in our system. Please verify the code or contact support.',
          'statusCode': 404,
        };
      } else {
        // If QR code info endpoint fails with other error, fall back to local parsing
        print('DEBUG: QR code info endpoint failed with status ${response.statusCode}, falling back to local parsing');
        final ticketInfo = await _decodeTicketFromQR(qrCode);
        return {
          'success': true,
          'data': ticketInfo,
          'statusCode': 200,
        };
      }
    } catch (e) {
      print('DEBUG: Error in getTicketInfo: $e');
      // Fall back to local parsing if API call fails
      try {
        final ticketInfo = await _decodeTicketFromQR(qrCode);
        return {
          'success': true,
          'data': ticketInfo,
          'statusCode': 200,
        };
      } catch (fallbackError) {
        return {
          'success': false,
          'error': 'Failed to get ticket information: $e',
          'statusCode': 0,
        };
      }
    }
  }
  
  // Decode ticket information from QR code without validation
  static Future<Map<String, dynamic>> _decodeTicketFromQR(String qrCode) async {
    // Try to parse the QR code as JSON first
    try {
      final Map<String, dynamic> jsonData = json.decode(qrCode);
      return _extractTicketInfoFromJSON(jsonData, qrCode);
    } catch (e) {
      // If not JSON, try to extract information from the string
      return _extractTicketInfoFromString(qrCode);
    }
  }
  
  // Extract ticket information from JSON data
  static Map<String, dynamic> _extractTicketInfoFromJSON(Map<String, dynamic> jsonData, String qrCode) {
    final Map<String, dynamic> ticketInfo = {
      'result': 'INFO_ONLY',
      'validation_time_ms': 0,
    };
    
    // Extract subscription information - only essential fields
    if (jsonData.containsKey('subscription_info') || jsonData.containsKey('subscriptionInfo')) {
      final subscriptionInfo = jsonData['subscription_info'] ?? jsonData['subscriptionInfo'];
      if (subscriptionInfo is Map<String, dynamic>) {
        ticketInfo['subscription_info'] = {
          'plan_name': subscriptionInfo['plan_name'] ?? subscriptionInfo['planName'] ?? 'N/A',
          'zone_name': subscriptionInfo['zone_name'] ?? subscriptionInfo['zoneName'] ?? 'N/A',
          'seat_number': subscriptionInfo['seat_number'] ?? subscriptionInfo['seatNumber'] ?? 'N/A',
          'access_point': subscriptionInfo['access_point'] ?? subscriptionInfo['accessPoint'] ?? 'N/A',
          'price': subscriptionInfo['price'] ?? 'N/A',
          'currency': subscriptionInfo['currency'] ?? 'TND',
        };
      }
    }
    
    // Extract user information - only holder name
    if (jsonData.containsKey('user_info') || jsonData.containsKey('userInfo')) {
      final userInfo = jsonData['user_info'] ?? jsonData['userInfo'];
      if (userInfo is Map<String, dynamic>) {
        ticketInfo['user_info'] = {
          'holder_name': userInfo['holder_name'] ?? userInfo['holderName'] ?? 'N/A',
        };
      }
    }
    
    return ticketInfo;
  }
  
  // Extract ticket information from string
  static Map<String, dynamic> _extractTicketInfoFromString(String qrCode) {
    final Map<String, dynamic> ticketInfo = {
      'result': 'INFO_ONLY',
      'validation_time_ms': 0,
      'subscription_info': {
        'plan_name': 'N/A',
        'zone_name': 'N/A',
        'seat_number': 'N/A',
        'access_point': 'N/A',
        'price': 'N/A',
        'currency': 'TND',
      },
      'user_info': {
        'holder_name': 'N/A',
      },
    };
    
    // Try to extract common patterns from the QR code string
    if (qrCode.contains('NTRX:')) {
      // This appears to be an Entrix QR code format
      final parts = qrCode.split(':');
      if (parts.length >= 5) {
        ticketInfo['subscription_info']['plan_name'] = parts[2] ?? 'N/A';
        ticketInfo['subscription_info']['zone_name'] = parts[3] ?? 'N/A';
        ticketInfo['subscription_info']['seat_number'] = parts[4] ?? 'N/A';
      }
    }
    
    return ticketInfo;
  }

  // Validate QR code for access control
  static Future<Map<String, dynamic>> validateAccessControl({
    required String qrCode,
    required String venueId,
    required String entryPoint,
    required String zoneId,
    String? agentId,
    String? terminalId,
    required String eventId,
  }) async {
    try {
      // Get authentication token and add to headers
      final token = await AuthService.getToken();
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      // Get real device info
      final deviceInfo = await DeviceInfoService.getDeviceInfo();
      
      // Get authenticated user info for agent - use complete profile to get firstName/lastName
      final userData = await AuthService.getCompleteUserProfile();
      
      // Get user data for agent identification
      
      // Helper function to get user name handling both snake_case and camelCase
      String getUserName(Map<String, dynamic> userData, String fieldName) {
        // Try camelCase first (firstName, lastName)
        final camelCase = userData[fieldName];
        
        // Try snake_case (first_name, last_name)
        final snakeCase = userData[fieldName.contains('Name') ? fieldName.replaceAll('Name', '_name') : fieldName];
        
        // Try alternative variations
        final variations = [
          camelCase,
          snakeCase,
          userData[fieldName.toLowerCase()], // lowercase
          userData[fieldName.toUpperCase()], // uppercase
        ];
        
        // Return the first non-null value, or 'Unknown' if all are null
        for (final variation in variations) {
          if (variation != null && variation.toString().isNotEmpty) {
            return variation.toString();
          }
        }
        

        
        return 'Unknown';
      }
      
      // Improved agent ID generation
      String generateAgentId(Map<String, dynamic>? userData, String? fallbackAgentId) {
        if (userData == null) {
          return fallbackAgentId ?? 'mobile-agent';
        }
        
        final firstName = getUserName(userData, 'firstName');
        final lastName = getUserName(userData, 'lastName');
        final email = userData['email']?.toString() ?? '';
        
        if (firstName != 'Unknown' && lastName != 'Unknown') {
          return '${firstName}_$lastName';
        } else if (firstName != 'Unknown') {
          return firstName;
        } else if (lastName != 'Unknown') {
          return lastName;
        } else if (email.isNotEmpty) {
          // Use email prefix as agent ID
          final emailPrefix = email.split('@').first;
          return emailPrefix.isNotEmpty ? emailPrefix : 'mobile-agent';
        } else {
          return fallbackAgentId ?? 'mobile-agent';
        }
      }
      
      final userAgentId = generateAgentId(userData, agentId);
      
      // Get real terminal ID from device
      final realTerminalId = terminalId ?? await DeviceInfoService.getTerminalId();
      
      final requestBody = {
        'qr_code': qrCode,
        'venue_id': venueId,
        'entry_point': entryPoint,
        'zone_id': zoneId,
        'event_id': eventId, // CRITICAL: Add the event ID to the request
        'agent_id': userAgentId,
        'terminal_id': realTerminalId,
        'scan_timestamp': DateTime.now().toIso8601String(),
        'security_context': {
          'security_level': 'STANDARD',
          'crowd_status': 'NORMAL',
        },
        'device_info': {
          'device_type': deviceInfo['device_type'] ?? 'MOBILE_APP',
          'device_id': deviceInfo['device_id'] ?? 'unknown-device',
          'device_model': deviceInfo['device_model'] ?? 'Unknown Device',
          'platform': deviceInfo['platform'] ?? 'Unknown',
          'os_version': deviceInfo['os_version'] ?? 'Unknown',
          'software_version': deviceInfo['software_version'] ?? '1.0.0',
          'app_name': deviceInfo['app_name'] ?? 'Entrix Scanner',
          'manufacturer': deviceInfo['device_manufacturer'] ?? 'Unknown',
        },
      };
      
      print('DEBUG: validateAccessControl - Sending event_id: $eventId');
      print('DEBUG: validateAccessControl - Request body: $requestBody');
      
      final response = await http.post(
        Uri.parse(ApiConfig.getFullUrl(ApiConfig.accessControlValidateEndpoint)),
        headers: headers,
        body: json.encode(requestBody),
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? data, // Handle both nested and direct response
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['message'] ?? 'Validation failed',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get list of events
  static Future<Map<String, dynamic>> getEvents() async {
    try {
      final token = await AuthService.getToken();
      
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      final response = await http.get(
        Uri.parse(ApiConfig.getFullUrl('/events/available')),
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('DEBUG: /events/available response: $data');
        return {
          'success': true,
          'data': data, // /events/available returns direct array, not wrapped
        };
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'error': 'Authentication required',
          'statusCode': response.statusCode,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['message'] ?? 'Failed to load events',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get event statistics
  static Future<Map<String, dynamic>> getEventStatistics(String eventId) async {
    try {
      final token = await AuthService.getToken();
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      final response = await http.get(
        Uri.parse(ApiConfig.getEventStatsUrl(eventId)),
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? data, // Handle both nested and direct response
        };
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'error': 'Authentication required',
          'statusCode': response.statusCode,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['message'] ?? 'Failed to load statistics',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Get event details
  static Future<Map<String, dynamic>> getEventDetails(String eventId) async {
    try {
      final token = await AuthService.getToken();
      final headers = Map<String, String>.from(ApiConfig.defaultHeaders);
      
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
      
      final response = await http.get(
        Uri.parse(ApiConfig.getFullUrl('${ApiConfig.eventsEndpoint}/$eventId')),
        headers: headers,
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return {
          'success': true,
          'data': data['data'] ?? data, // Handle both nested and direct response
        };
      } else if (response.statusCode == 401) {
        return {
          'success': false,
          'error': 'Authentication required',
          'statusCode': response.statusCode,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['message'] ?? 'Failed to load event details',
          'statusCode': response.statusCode,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }
}
