import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';

class DeviceInfoService {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  static PackageInfo? _packageInfo;
  
  // Cache for device info to avoid repeated calls
  static Map<String, dynamic>? _cachedDeviceInfo;

  /// Get comprehensive device information
  static Future<Map<String, dynamic>> getDeviceInfo() async {
    if (_cachedDeviceInfo != null) {
      return _cachedDeviceInfo!;
    }

    try {
      // Get package info for app version
      _packageInfo ??= await PackageInfo.fromPlatform();
      
      Map<String, dynamic> deviceInfo = {
        'device_type': 'MOBILE_APP',
        'software_version': _packageInfo?.version ?? '1.0.0',
        'build_number': _packageInfo?.buildNumber ?? '1',
        'app_name': _packageInfo?.appName ?? 'Entrix Scanner',
        'package_name': _packageInfo?.packageName ?? 'com.entrix.scanner',
      };

      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfo.androidInfo;
        deviceInfo.addAll({
          'platform': 'Android',
          'device_id': androidInfo.id,
          'device_model': androidInfo.model,
          'device_manufacturer': androidInfo.manufacturer,
          'os_version': 'Android ${androidInfo.version.release}',
          'os_sdk': androidInfo.version.sdkInt.toString(),
          'device_brand': androidInfo.brand,
          'device_product': androidInfo.product,
          'device_fingerprint': androidInfo.fingerprint,
        });
      } else if (Platform.isIOS) {
        final iosInfo = await _deviceInfo.iosInfo;
        deviceInfo.addAll({
          'platform': 'iOS',
          'device_id': iosInfo.identifierForVendor,
          'device_model': iosInfo.model,
          'device_name': iosInfo.name,
          'os_version': 'iOS ${iosInfo.systemVersion}',
          'device_system_name': iosInfo.systemName,
          'device_localized_model': iosInfo.localizedModel,
        });
      }

      _cachedDeviceInfo = deviceInfo;
      return deviceInfo;
    } catch (e) {
      // Fallback device info if we can't get real device info
      return {
        'device_type': 'MOBILE_APP',
        'device_id': 'unknown-device',
        'device_model': 'Unknown Device',
        'platform': Platform.isAndroid ? 'Android' : Platform.isIOS ? 'iOS' : 'Unknown',
        'os_version': 'Unknown',
        'software_version': '1.0.0',
        'app_name': 'Entrix Scanner',
      };
    }
  }

  /// Get a unique device identifier for the agent
  static Future<String> getDeviceId() async {
    final deviceInfo = await getDeviceInfo();
    return deviceInfo['device_id'] ?? 'unknown-device';
  }

  /// Get device model for display
  static Future<String> getDeviceModel() async {
    final deviceInfo = await getDeviceInfo();
    return deviceInfo['device_model'] ?? 'Unknown Device';
  }

  /// Get OS version
  static Future<String> getOsVersion() async {
    final deviceInfo = await getDeviceInfo();
    return deviceInfo['os_version'] ?? 'Unknown';
  }

  /// Get app version
  static Future<String> getAppVersion() async {
    final deviceInfo = await getDeviceInfo();
    return deviceInfo['software_version'] ?? '1.0.0';
  }

  /// Get formatted device info for agent ID
  static Future<String> getAgentId() async {
    final deviceInfo = await getDeviceInfo();
    final deviceId = deviceInfo['device_id'] ?? 'unknown';
    final platform = deviceInfo['platform'] ?? 'unknown';
    return '${platform.toLowerCase()}-${deviceId.substring(0, 8)}';
  }

  /// Get formatted device info for terminal ID
  static Future<String> getTerminalId() async {
    final deviceInfo = await getDeviceInfo();
    final deviceModel = deviceInfo['device_model'] ?? 'Unknown';
    final deviceId = deviceInfo['device_id'] ?? 'unknown';
    return '${deviceModel.replaceAll(' ', '_')}_${deviceId.substring(0, 8)}';
  }
}
