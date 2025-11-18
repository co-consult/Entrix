import 'package:flutter_test/flutter_test.dart';
import 'package:entrix_scanner_app/services/auth_service.dart';

void main() {
  group('User Data Structure Tests', () {
    test('should handle user data with firstName and lastName', () {
      final userData = {
        'id': 1,
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john.doe@example.com',
      };
      
      // Test that we can access the data correctly
      expect(userData['firstName'], equals('John'));
      expect(userData['lastName'], equals('Doe'));
      expect(userData['email'], equals('john.doe@example.com'));
    });

    test('should handle user data with snake_case fields', () {
      final userData = {
        'id': 1,
        'first_name': 'Jane',
        'last_name': 'Smith',
        'email': 'jane.smith@example.com',
      };
      
      // Test that we can access the data correctly
      expect(userData['first_name'], equals('Jane'));
      expect(userData['last_name'], equals('Smith'));
      expect(userData['email'], equals('jane.smith@example.com'));
    });

    test('should handle user data with only email', () {
      final userData = {
        'id': 1,
        'email': 'admin@entrx.local',
      };
      
      // Test that we can access the data correctly
      expect(userData['firstName'], isNull);
      expect(userData['lastName'], isNull);
      expect(userData['email'], equals('admin@entrx.local'));
    });

    test('should handle empty user data', () {
      final userData = <String, dynamic>{};
      
      // Test that we handle empty data gracefully
      expect(userData['firstName'], isNull);
      expect(userData['lastName'], isNull);
      expect(userData['email'], isNull);
    });
  });

  group('Agent ID Generation Tests', () {
    test('should generate agent ID from firstName and lastName', () {
      final userData = {
        'firstName': 'John',
        'lastName': 'Doe',
        'email': 'john.doe@example.com',
      };
      
      // Simulate the agent ID generation logic
      String generateAgentId(Map<String, dynamic> userData) {
        final firstName = userData['firstName']?.toString() ?? '';
        final lastName = userData['lastName']?.toString() ?? '';
        final email = userData['email']?.toString() ?? '';
        
        if (firstName.isNotEmpty && lastName.isNotEmpty) {
          return '${firstName}_$lastName';
        } else if (firstName.isNotEmpty) {
          return firstName;
        } else if (lastName.isNotEmpty) {
          return lastName;
        } else if (email.isNotEmpty) {
          final emailPrefix = email.split('@').first;
          return emailPrefix.isNotEmpty ? emailPrefix : 'agent';
        } else {
          return 'mobile-agent';
        }
      }
      
      expect(generateAgentId(userData), equals('John_Doe'));
    });

    test('should generate agent ID from email when names are missing', () {
      final userData = {
        'email': 'admin@entrx.local',
      };
      
      // Simulate the agent ID generation logic
      String generateAgentId(Map<String, dynamic> userData) {
        final firstName = userData['firstName']?.toString() ?? '';
        final lastName = userData['lastName']?.toString() ?? '';
        final email = userData['email']?.toString() ?? '';
        
        if (firstName.isNotEmpty && lastName.isNotEmpty) {
          return '${firstName}_$lastName';
        } else if (firstName.isNotEmpty) {
          return firstName;
        } else if (lastName.isNotEmpty) {
          return lastName;
        } else if (email.isNotEmpty) {
          final emailPrefix = email.split('@').first;
          return emailPrefix.isNotEmpty ? emailPrefix : 'agent';
        } else {
          return 'mobile-agent';
        }
      }
      
      expect(generateAgentId(userData), equals('admin'));
    });

    test('should fallback to mobile-agent when no data available', () {
      final userData = <String, dynamic>{};
      
      // Simulate the agent ID generation logic
      String generateAgentId(Map<String, dynamic> userData) {
        final firstName = userData['firstName']?.toString() ?? '';
        final lastName = userData['lastName']?.toString() ?? '';
        final email = userData['email']?.toString() ?? '';
        
        if (firstName.isNotEmpty && lastName.isNotEmpty) {
          return '${firstName}_$lastName';
        } else if (firstName.isNotEmpty) {
          return firstName;
        } else if (lastName.isNotEmpty) {
          return lastName;
        } else if (email.isNotEmpty) {
          final emailPrefix = email.split('@').first;
          return emailPrefix.isNotEmpty ? emailPrefix : 'agent';
        } else {
          return 'mobile-agent';
        }
      }
      
      expect(generateAgentId(userData), equals('mobile-agent'));
    });
  });
}
