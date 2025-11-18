import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class AuthService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'user_data';

  // Login user with email and password
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.getFullUrl(ApiConfig.loginEndpoint)),
        headers: ApiConfig.defaultHeaders,
        body: json.encode({
          'email': email,
          'password': password,
        }),
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Store token and user data
        await _storage.write(key: _tokenKey, value: data['data']['tokens']['accessToken']);
        await _storage.write(key: _userKey, value: json.encode(data['data']['user']));
        
        return {
          'success': true,
          'data': data,
        };
      } else {
        final errorData = json.decode(response.body);
        return {
          'success': false,
          'error': errorData['message'] ?? 'Login failed',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
      };
    }
  }

  // Logout method
  static Future<bool> logout() async {
    try {
      final token = await getToken();
      if (token != null) {
        await http.post(
          Uri.parse(ApiConfig.getFullUrl(ApiConfig.logoutEndpoint)),
          headers: {
            ...ApiConfig.defaultHeaders,
            'Authorization': 'Bearer $token',
          },
        ).timeout(ApiConfig.timeout);
      }
      
      // Clear stored data
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
      
      return true;
    } catch (e) {
      // Even if logout fails, clear local data
      await _storage.delete(key: _tokenKey);
      await _storage.delete(key: _userKey);
      return true;
    }
  }

  // Get stored token
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  // Get stored user data
  static Future<Map<String, dynamic>?> getUser() async {
    final userData = await _storage.read(key: _userKey);
    if (userData != null) {
      return json.decode(userData);
    }
    return null;
  }

  // Get user data (alias for getUser for consistency)
  static Future<Map<String, dynamic>?> getUserData() async {
    return await getUser();
  }

  // Get current user ID
  static Future<String?> getCurrentUserId() async {
    try {
      final userData = await getCompleteUserProfile();
      if (userData != null) {
        // Try camelCase first, then snake_case
        final userId = userData['id'] ?? userData['user_id'];
        return userId?.toString();
      }
      return null;
    } catch (e) {
      print('Error getting current user ID: $e');
      return null;
    }
  }

  // Get complete user profile from /users/me endpoint (includes firstName/lastName)
  static Future<Map<String, dynamic>?> getCompleteUserProfile() async {
    try {
      final token = await getToken();
      if (token == null) {
        return null;
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/users/me'),
        headers: {
          ...ApiConfig.defaultHeaders,
          'Authorization': 'Bearer $token',
        },
      ).timeout(ApiConfig.timeout);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] && data['data'] != null) {
          // Update stored user data with complete profile
          await _storage.write(key: _userKey, value: json.encode(data['data']));
          return data['data'];
        }
      }
      
      // Fallback to stored user data if API call fails
      return await getUser();
    } catch (e) {
      print('Error fetching complete user profile: $e');
      // Fallback to stored user data
      return await getUser();
    }
  }

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    try {
      final token = await getToken();
      
      if (token == null) {
        return false;
      }
      
      // Also check if user data exists
      final userData = await getUser();
      
      if (userData == null) {
        await _storage.delete(key: _tokenKey);
        return false;
      }
      
      // CRITICAL SECURITY CHECK: Verify user has valid roles
      final roles = await getUserRoles();
      if (roles.isEmpty) {
        // User has no roles - deny access
        print('SECURITY WARNING: User has no roles, denying access');
        await logout(); // Force logout
        return false;
      }
      
      // Check if user has at least one of the required roles
      final hasValidRole = await hasAnyRole(['ADMIN', 'BADGER', 'CONTROLLER']);
      if (!hasValidRole) {
        // User has roles but none of the required ones - deny access
        print('SECURITY WARNING: User has no valid roles for mobile app access');
        await logout(); // Force logout
        return false;
      }
      
      return true;
    } catch (e) {
      print('Error in isLoggedIn: $e');
      return false;
    }
  }

  // Get headers with authentication
  static Future<Map<String, String>> getAuthHeaders() async {
    final token = await getToken();
    return {
      ...ApiConfig.defaultHeaders,
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Role-based access control methods
  static Future<List<String>> getUserRoles() async {
    try {
      final userData = await getCompleteUserProfile();
      if (userData == null) {
        print('DEBUG: getUserRoles - userData is null');
        return [];
      }

      print('DEBUG: getUserRoles - userData keys: ${userData.keys.toList()}');
      
      // Backend returns 'userRoles' not 'roles'
      final userRoles = userData['userRoles'] as List?;
      if (userRoles == null) {
        print('DEBUG: getUserRoles - userRoles is null');
        return [];
      }

      print('DEBUG: getUserRoles - userRoles: $userRoles');
      
      final extractedRoles = userRoles.map<String>((role) {
        if (role is String) {
          return role.toUpperCase();
        } else if (role is Map) {
          // Extract role code from the userRoles structure
          final roleCode = (role['roleCode'] ?? role['code'] ?? role['name'] ?? '').toString().toUpperCase();
          print('DEBUG: getUserRoles - extracted role: $roleCode from $role');
          return roleCode;
        }
        return '';
      }).where((role) => role.isNotEmpty).toList();
      
      print('DEBUG: getUserRoles - final extracted roles: $extractedRoles');
      return extractedRoles;
    } catch (e) {
      print('Error getting user roles: $e');
      return [];
    }
  }

  // Check if user has specific role
  static Future<bool> hasRole(String roleName) async {
    final roles = await getUserRoles();
    return roles.contains(roleName.toUpperCase());
  }

  // Check if user has any of the specified roles
  static Future<bool> hasAnyRole(List<String> roleNames) async {
    final roles = await getUserRoles();
    return roles.any((role) => roleNames.contains(role.toUpperCase()));
  }

  // Check if user can perform validation (ADMIN, BADGER roles)
  static Future<bool> canPerformValidation() async {
    return await hasAnyRole(['ADMIN', 'BADGER']);
  }

  // Check if user is info-only mode (CONTROLLER role)
  static Future<bool> isInfoOnlyMode() async {
    return await hasRole('CONTROLLER');
  }

  // Get user's access level for display
  static Future<String> getUserAccessLevel() async {
    if (await hasRole('ADMIN')) return 'Admin';
    if (await hasRole('BADGER')) return 'Badger';
    if (await hasRole('CONTROLLER')) return 'Controller';
    return 'User';
  }

  // CRITICAL SECURITY: Validate user has access to mobile app
  static Future<bool> hasMobileAppAccess() async {
    try {
      // Check if user is logged in
      if (!await isLoggedIn()) {
        return false;
      }
      
      // Check if user has required roles
      final roles = await getUserRoles();
      if (roles.isEmpty) {
        print('SECURITY: User has no roles');
        return false;
      }
      
      // Check if user has at least one of the required roles
      final hasValidRole = await hasAnyRole(['ADMIN', 'BADGER', 'CONTROLLER']);
      if (!hasValidRole) {
        print('SECURITY: User has no valid roles for mobile app: $roles');
        return false;
      }
      
      return true;
    } catch (e) {
      print('Error checking mobile app access: $e');
      return false;
    }
  }

  // CRITICAL SECURITY: Validate user can access scanner
  static Future<bool> canAccessScanner() async {
    try {
      if (!await hasMobileAppAccess()) {
        return false;
      }
      
      // Additional scanner-specific checks can go here
      return true;
    } catch (e) {
      print('Error checking scanner access: $e');
      return false;
    }
  }
}
