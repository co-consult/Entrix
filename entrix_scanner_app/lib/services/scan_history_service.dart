import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:intl/intl.dart';

class ScanRecord {
  final int? id;
  final String qrCode;
  final String result;
  final String status;
  final String? message;
  final String? agentId;
  final DateTime timestamp;
  final String? eventId;
  final String? venueId;
  final String? serialNumber;

  ScanRecord({
    this.id,
    required this.qrCode,
    required this.result,
    required this.status,
    this.message,
    this.agentId,
    required this.timestamp,
    this.eventId,
    this.venueId,
    this.serialNumber,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'qr_code': qrCode,
      'result': result,
      'status': status,
      'message': message,
      'agent_id': agentId,
      'timestamp': timestamp.toIso8601String(),
      'event_id': eventId,
      'venue_id': venueId,
      'serial_number': serialNumber,
    };
  }

  factory ScanRecord.fromMap(Map<String, dynamic> map) {
    return ScanRecord(
      id: map['id'],
      qrCode: map['qr_code'],
      result: map['result'],
      status: map['status'],
      message: map['message'],
      agentId: map['agent_id'],
      timestamp: DateTime.parse(map['timestamp']),
      eventId: map['event_id'],
      venueId: map['venue_id'],
      serialNumber: map['serial_number'],
    );
  }
}

class ScanHistoryService {
  static Database? _database;
  static const String _tableName = 'scan_history';

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'scan_history.db');

    return await openDatabase(
      path,
      version: 2,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE $_tableName (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            qr_code TEXT NOT NULL,
            result TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT,
            agent_id TEXT,
            timestamp TEXT NOT NULL,
            event_id TEXT,
            venue_id TEXT,
            serial_number TEXT
          )
        ''');
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) {
          // Add serial_number column to existing databases
          await db.execute('ALTER TABLE $_tableName ADD COLUMN serial_number TEXT');
        }
      },
    );
  }

  // Add a new scan record
  static Future<int> addScanRecord(ScanRecord record) async {
    final db = await database;
    return await db.insert(_tableName, record.toMap());
  }

  // Get all scan records
  static Future<List<ScanRecord>> getAllScanRecords() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _tableName,
      orderBy: 'timestamp DESC',
    );
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  // Get scan records by date range
  static Future<List<ScanRecord>> getScanRecordsByDateRange(
    DateTime startDate,
    DateTime endDate,
  ) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _tableName,
      where: 'timestamp BETWEEN ? AND ?',
      whereArgs: [startDate.toIso8601String(), endDate.toIso8601String()],
      orderBy: 'timestamp DESC',
    );
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  // Get scan records by status
  static Future<List<ScanRecord>> getScanRecordsByStatus(String status) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _tableName,
      where: 'status = ?',
      whereArgs: [status],
      orderBy: 'timestamp DESC',
    );
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  // Get all info mode scan records
  static Future<List<ScanRecord>> getInfoModeScanRecords() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _tableName,
      where: 'status LIKE ?',
      whereArgs: ['info%'],
      orderBy: 'timestamp DESC',
    );
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  // Get scan records by QR code
  static Future<List<ScanRecord>> getScanRecordsByQRCode(String qrCode) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _tableName,
      where: 'qr_code = ?',
      whereArgs: [qrCode],
      orderBy: 'timestamp DESC',
    );
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  // Get scan records by serial number (search in message field for serial number)
  static Future<List<ScanRecord>> getScanRecordsBySerialNumber(String serialNumber) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      _tableName,
      where: 'message LIKE ? OR qr_code LIKE ?',
      whereArgs: ['%$serialNumber%', '%$serialNumber%'],
      orderBy: 'timestamp DESC',
    );
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  // Search scan records by both QR code and serial number
  static Future<List<ScanRecord>> searchScanRecords(String query) async {
    final db = await database;
    
    // Enhanced search that prioritizes exact matches for 4-digit serial numbers
    List<Map<String, dynamic>> maps = [];
    
    // First, try exact matches
    maps = await db.query(
      _tableName,
      where: 'qr_code = ? OR serial_number = ?',
      whereArgs: [query, query],
      orderBy: 'timestamp DESC',
    );
    
    // If no exact matches, try partial matches
    if (maps.isEmpty) {
      maps = await db.query(
        _tableName,
        where: 'qr_code LIKE ? OR serial_number LIKE ? OR message LIKE ?',
        whereArgs: [
          '%$query%',           // QR code match
          '%$query%',           // Serial number match
          '%$query%',           // Message match
        ],
        orderBy: 'timestamp DESC',
      );
    }
    
    return List.generate(maps.length, (i) => ScanRecord.fromMap(maps[i]));
  }

  /// Extract serial number from a message string
  static String? extractSerialNumber(String? message) {
    if (message == null || message.isEmpty) return null;
    
    // Common serial number patterns - focus on 4-digit patterns
    final serialPatterns = [
      RegExp(r'Serial:\s*(\d{4})', caseSensitive: false), // Serial: 0832
      RegExp(r'Serial Number:\s*(\d{4})', caseSensitive: false), // Serial Number: 0832
      RegExp(r'SN:\s*(\d{4})', caseSensitive: false), // SN: 0832
      RegExp(r'(\d{4})', caseSensitive: false), // Just 4 digits anywhere
    ];
    
    for (final pattern in serialPatterns) {
      final match = pattern.firstMatch(message);
      if (match != null && match.group(1) != null) {
        return match.group(1);
      }
    }
    
    // If no pattern matches, check if the message itself looks like a serial number
    if (message.length == 4 && RegExp(r'^\d{4}$').hasMatch(message)) {
      return message;
    }
    
    return null;
  }
  
  /// Get the display title for a scan record (prioritize serial number from database over QR code)
  static String getDisplayTitle(ScanRecord record) {
    // Check if this is an INVALID_QR case - show "N/A" (not "INVALID")
    if (record.message != null) {
      final message = record.message!.toUpperCase();
      if (message.contains('INVALID_QR') || 
          (message.contains('QR CODE NON RECONNU') || message.contains('QR CODE NOT RECOGNIZED'))) {
        // For invalid QR codes, show "N/A" for serial number
        return 'N/A';
      }
    }
    
    // First, check if we have a stored serial number from database
    if (record.serialNumber != null && 
        record.serialNumber!.isNotEmpty && 
        record.serialNumber != 'N/A') {
      return record.serialNumber!;
    }
    
    // Don't extract from QR code string or message - serial number should come from database
    // If we don't have it, show "N/A"
    return 'N/A';
  }
  
  /// Get the display subtitle for a scan record
  static String? getDisplaySubtitle(ScanRecord record) {
    // If we're showing a serial number as title, show QR code as subtitle
    if (record.serialNumber != null && 
        record.serialNumber!.isNotEmpty && 
        record.serialNumber != 'N/A') {
      return record.qrCode;
    }
    
    // If title is "N/A" or "INVALID", don't show subtitle
    // (to avoid redundancy)
    return null;
  }

  // Update a scan record
  static Future<int> updateScanRecord(int id, ScanRecord record) async {
    final db = await database;
    return await db.update(
      _tableName,
      record.toMap(),
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Delete a scan record
  static Future<int> deleteScanRecord(int id) async {
    final db = await database;
    return await db.delete(
      _tableName,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Get database version
  static Future<int> getDatabaseVersion() async {
    final db = await database;
    return await db.getVersion();
  }

  // Debug method to log all records
  static Future<void> debugLogAllRecords() async {
    final records = await getAllScanRecords();
    print('Total records in database: ${records.length}');
    
    for (int i = 0; i < records.length; i++) {
      final record = records[i];
      print('Record $i: ID=${record.id}, QR=${record.qrCode}, Serial=${record.serialNumber}, Status=${record.status}');
    }
  }
  
  // Debug method to check raw database contents
  static Future<void> debugRawDatabaseContents() async {
    final db = await database;
    print('Checking raw database contents...');
    
    final List<Map<String, dynamic>> rawMaps = await db.query(
      _tableName,
      orderBy: 'timestamp DESC',
    );
    
    print('Raw database records: ${rawMaps.length}');
    for (int i = 0; i < rawMaps.length; i++) {
      final map = rawMaps[i];
      print('Raw Record $i: QR=${map['qr_code']}, Serial=${map['serial_number']}, Status=${map['status']}');
    }
  }

  // Clear all scan records
  static Future<void> clearAllScanRecords() async {
    final db = await database;
    await db.delete(_tableName);
  }

  // Get scan statistics
  static Future<Map<String, dynamic>> getScanStatistics() async {
    final db = await database;
    
    // Total scans
    final totalResult = await db.rawQuery('SELECT COUNT(*) as count FROM $_tableName');
    final total = totalResult.first['count'] as int;
    
    // Successful scans
    final successResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tableName WHERE status = "success"'
    );
    final success = successResult.first['count'] as int;
    
    // Failed scans
    final failedResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tableName WHERE status = "error"'
    );
    final failed = failedResult.first['count'] as int;
    
    // Info mode scans
    final infoResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tableName WHERE status LIKE "info%"'
    );
    final info = infoResult.first['count'] as int;
    
    // Today's scans
    final today = DateTime.now();
    final todayStart = DateTime(today.year, today.month, today.day);
    final todayEnd = todayStart.add(const Duration(days: 1));
    
    final todayResult = await db.rawQuery(
      'SELECT COUNT(*) as count FROM $_tableName WHERE timestamp BETWEEN ? AND ?',
      [todayStart.toIso8601String(), todayEnd.toIso8601String()]
    );
    final todayScans = todayResult.first['count'] as int;
    
    return {
      'total': total,
      'success': success,
      'failed': failed,
      'info': info,
      'today': todayScans,
      'successRate': total > 0 ? (success / total * 100).toStringAsFixed(1) : '0.0',
    };
  }

  // Export scan records as CSV
  static Future<String> exportAsCSV() async {
    final records = await getAllScanRecords();
    final dateFormat = DateFormat('yyyy-MM-dd HH:mm:ss');
    
    final csv = StringBuffer();
    csv.writeln('ID,QR Code,Result,Status,Message,Agent ID,Timestamp,Event ID,Venue ID');
    
    for (final record in records) {
      csv.writeln([
        record.id,
        '"${record.qrCode}"',
        '"${record.result}"',
        '"${record.status}"',
        '"${record.message ?? ""}"',
        '"${record.agentId ?? ""}"',
        '"${dateFormat.format(record.timestamp)}"',
        '"${record.eventId ?? ""}"',
        '"${record.venueId ?? ""}"',
      ].join(','));
    }
    
    return csv.toString();
  }

  // Close database
  static Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
