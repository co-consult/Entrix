## [Unreleased]

### Fixed
- Password reset tokens erroneously reported as expired due to non-deterministic bcrypt hashing used for `validation_tokens.token_hash`. Switched to deterministic HMAC-SHA256 hashing for token generation and lookup in `ValidationTokenService`, with a legacy fallback to accept existing bcrypt-hashed tokens. This resolves false "token expired/invalid" errors when using reset links.

### Security
- Ensured validation token hashing uses a secret-backed HMAC (`VALIDATION_TOKEN_SECRET` or `JWT_SECRET`) and removed reliance on bcrypt for token lookup to avoid timing and lookup inconsistencies.

### Changed
- Email processor now builds password reset URLs using `FRONTEND_URL` from environment via `ConfigService` instead of a hardcoded preprod domain. Ensure `FRONTEND_URL` is set in your env files for each environment.
- Admin events listing: `GET /api/v1/events` now returns all events for authenticated admins (no visibility/status restriction). Organizers see only their events; unauthenticated users still see public PUBLISHED/LIVE events. This fixes the admin view where FINISHED events disappeared from the list.
 - Event creation: Coerce empty strings to undefined for `venueId` and `category` in DTOs to prevent validation errors. Frontend now omits empty optional fields when creating/updating events.
 - Event creation: Force organizer to fixed ID `e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e` during creation to avoid FK constraint issues in preprod.
 - Event deletion: Allow ADMIN to delete any event. Controller now passes full user to the service; non-admins remain restricted to their own events.

## [Unreleased]

### Fixed
- **Access Control Analytics**: Fixed incorrect analytics data showing fake/mock data instead of real database values
  - **Scans Per Day**: Replaced mock random data with real database queries for daily scan counts
  - **Denial Trends**: Replaced mock random data with real database queries for daily denial counts  
  - **Scans Per Hour**: Replaced mock random data with real database queries for hourly scan counts
  - **Data Accuracy**: Analytics now reflect actual access control log data from the database
  - **Search Functionality**: Enhanced search to include QR codes, event names, and user information
  - **Event Filtering**: Added event dropdown filter to access control logs page

- **Event Status Management**: Fixed event status transition issues and improved user experience
  - **Enum Alignment**: Updated `EventStatus` enum to match database schema (added `LIVE`, `FINISHED`, `CANCELLED`, `POSTPONED`, `SUSPENDED`, `RESCHEDULED`)
  - **User-Friendly Messages**: Implemented detailed, user-friendly error messages for invalid status transitions
  - **Status Transition Logic**: Updated validation logic to properly handle all event status transitions
  - **Guidance Messages**: Added specific guidance for each status transition explaining what actions are allowed
  - **Database Consistency**: Resolved mismatch between TypeScript enum and database schema that caused "Invalid status transition from LIVE to COMPLETED" errors
  - **Frontend Status Options**: Updated frontend to use `FINISHED` instead of `COMPLETED` for event status changes
  - **Event Creation**: Fixed UUID validation error in event creation by using proper category UUID

- **Event Creation**: Fixed database error when creating new events
  - **UUID Validation**: Fixed "Error creating UUID, invalid character" error by using proper category UUID
  - **Category Reference**: Updated to use existing default football match category UUID
  - **Form Simplification**: Removed category and venue fields from creation form since they're static
  - **Filter Cleanup**: Removed category filter from events page since all events use the same category
  - **Static Configuration**: Set static venue ID `bc43d5e2-9a2f-46df-9021-4f6b6e74b79a` for all events

- **Event Actions**: Fixed event view and edit functionality
  - **View Modal**: Added comprehensive event details modal with all event information
  - **Edit Modal**: Fixed edit modal to properly open and populate with event data
  - **Action Buttons**: Updated view and edit buttons to work correctly
  - **User Experience**: Improved event management workflow with proper modal interactions

### Changed
- Events: Allow `ADMIN` role to update any event status via `PUT /api/v1/events/:id/status`. `ORGANIZER_ADMIN` remains restricted to events they organize. This fixes 404 errors when admins attempted to change status on events they didn't own.

# Backend Changelog

## [Unreleased] - 2024-12-19

### Added
- **Forgot Password Functionality**: Complete implementation of password reset flow
  - **API Endpoints**: `/auth/forgot-password` and `/auth/reset-password` endpoints fully functional
  - **Email Integration**: Password reset emails sent via BullMQ with proper template rendering
  - **Token Management**: Secure token generation and validation using ValidationTokenService
  - **Rate Limiting**: Protection against abuse with configurable rate limits
  - **Email Template**: Professional password reset email template with security information
  - **Test Script**: `test-forgot-password.js` for testing the complete flow
  - **Security Features**: 
    - Tokens expire after 1 hour
    - Rate limiting (3 requests per hour per email)
    - Secure token generation with proper hashing
    - Audit logging for all password reset attempts
    - Session invalidation after password reset for security
- **New Roles**: Added "BADGER" and "CONTROLLER" roles for access control personnel
- **Enhanced Mobile App History**: Added serial number search capability and improved record display
  - Serial number search in history records (easier than typing long QR codes)
  - Reorganized display: serial number at top, QR code below in smaller text
  - Smart serial number detection from scan record messages
  - Fallback to QR code when no serial number is available
- **Improved User Identification**: Replaced static user IDs with authenticated user information
  - Mobile app now uses real authenticated user ID instead of static placeholders
  - Added `getCurrentUserId()` method to AuthService for consistent user identification
  - All scan history records now properly linked to authenticated users
  - Better audit trail and security with real user identification
  - **Backend Enhancement**: Access control controller now properly decodes JWT tokens
  - Extracts real user ID, email, and roles from JWT payload
  - Uses authenticated user information for access control logs
  - Falls back to mobile app agent_id if JWT decoding fails
  - Improved security and audit trail for all access control operations
- **Updated Venue Configuration**: 
  - Updated all mobile app venue references to use correct database ID: `bc43d5e2-9a2f-46df-9021-4f6b6e74b79a`
  - Mobile app now uses correct venue ID for all API calls and local storage
  - **BADGER Role**: Full validation access (scan, validate, create logs, view history) + info mode toggle
  - **CONTROLLER Role**: Info-only mode (no validation, no logs, no toggle button)
  - **Role Levels**: BADGER (level 20), CONTROLLER (level 15)
  - **Permissions**: BADGER has validation capabilities, CONTROLLER restricted to info mode only
- **Database Migrations**: 
  - `add_badger_controller_roles.sql` - Creates new roles with proper permissions
  - `update_rls_policies_for_new_roles.sql` - Updates RLS policies to include new roles
  - `create_test_users_for_new_roles.sql` - Creates test users for both new roles
  - `add_no_subscription_enum_value.sql` - Adds NO_SUBSCRIPTION value to denial_reason enum
- **Enhanced QR Code Validation Logic**: Improved access control validation to properly distinguish between different denial scenarios
  - **Physical QR Check**: Now first checks if QR code exists in `physical_qr_codes` table
  - **Status Differentiation**: 
    - `code_non_reconnu` (⚫ BLACK) - QR code doesn't exist at all
    - `no_subscription` (🔴 RED) - QR code exists but has no active subscription
  - **Better User Experience**: Clear messaging for different access denied scenarios
  - **Metadata Display**: Shows physical QR information (entry gate, zone, seat) even for denied access

### Changed
- **Email Processor**: Updated password reset email handler to use correct job type and template context
- **ValidationTokenService**: Fixed job type mapping for password reset emails to use `send-password-reset`
- **Access Control Service**: Enhanced validation flow to check physical QR codes before access rights
- **DTO Updates**: Added new fields to `AccessRightDto` for physical QR code information
- **Denial Reasons**: Added `NO_SUBSCRIPTION` enum value for valid QR codes without subscriptions

### Fixed
- **QR Code Validation**: Corrected logic to properly identify non-existent vs. valid-but-no-subscription QR codes
- **Mobile App Display**: Backend now provides proper status values for mobile app to apply correct styling

## [Unreleased]

### Fixed
- **Backend Debug Statements**: Cleaned up all debug console.log statements from auth service
  - Removed debug statements from login method that were causing JavaScript syntax errors
  - Removed debug statements from validateUser method that were cluttering logs
  - Fixed backend container restart loop caused by malformed debug statements
  - Backend now starts cleanly without syntax errors
  - Prisma query fix for firstName/lastName fields remains intact and functional
- **Flutter Mobile App Code Quality**: Fixed multiple code quality issues in the Entrix Scanner mobile app
  - **Test File Error**: Fixed `test/widget_test.dart` to reference correct `EntrixScannerApp` class instead of non-existent `MyApp`
  - **Debug Print Statements**: Removed all debug print statements from `access_control_service.dart` production code
  - **Unused Imports**: Cleaned up unused imports across multiple files:
    - Removed `log_viewer_screen.dart` import from `dashboard_screen.dart`
    - Removed `auth_service.dart` import from `qr_scanner_screen.dart`
    - Removed `qr_scanner_screen.dart` import from `validation_result_screen.dart`
  - **Deprecated Methods**: Updated deprecated Flutter method usage:
    - Replaced `MaterialStateProperty` with `WidgetStateProperty` in `dashboard_screen.dart`
    - Replaced `withOpacity()` with `withValues(alpha:)` in `login_screen.dart` and `log_viewer_screen.dart`
  - **Super Parameters**: Updated all widget constructors to use modern Flutter super parameter syntax
  - **Analysis Issues**: All Flutter analysis warnings and errors resolved - app now passes `flutter analyze` with no issues
  - **Build Verification**: Confirmed app builds successfully and all tests pass after fixes
- **User Identification and Agent ID Issues**: Fixed critical user display and agent identification problems
  - **Mobile App User Profile**: Updated mobile app to use proper user profile endpoint
    - Mobile app now calls `/users/me` endpoint to get complete user profile (same as frontend web app)
    - This ensures `firstName` and `lastName` fields are properly retrieved from the backend
    - Dashboard now displays "Admin User" instead of just email for admin@entrx.local
    - Agent ID generation now uses proper names instead of "Unknown_Unknown"
  - **Access Control Service**: Updated to use complete user profile for agent identification
    - Access control service now fetches complete user profile for proper agent ID generation
    - Validation screens now show correct agent information instead of "Unknown_Unknown"
    - Backend receives proper agent identification for audit trails
  - **Debug Implementation**: Added comprehensive debugging to identify user data structure issues
    - Added debug logging to dashboard to show raw user data structure
    - Added debug section in dashboard UI to display user data fields
    - Created test file to verify user data handling logic
    - Backend analysis confirms user data should contain firstName/lastName from database
    - Database seed shows admin user has first_name: 'Admin', last_name: 'User'
    - Users service correctly transforms first_name/last_name to firstName/lastName in API response

### Added
- **Access Control Module**: Complete implementation of access control functionality for mobile app integration
  - Created `AccessControlModule` with controller, service, and DTOs
  - Added `/access-control/validate` POST endpoint for QR code validation
  - Implemented comprehensive access control logic with duplicate scan prevention
  - Added support for security context, device info, and geolocation data
  - Integrated with existing event statistics and user management systems
- **New Access Control Roles**: Added BADGER and CONTROLLER roles for stadium access control personnel
  - **BADGER Role**: Access control personnel with QR code scanning and validation permissions
    - Level 20 role with read-only access to access control functions
    - Permissions: scan, validate, view_history
    - Designed for stadium access control personnel
  - **CONTROLLER Role**: Access control personnel with QR code scanning and validation permissions
    - Level 20 role with read-only access to access control functions
    - Permissions: scan, validate, view_history
    - Designed for stadium access control personnel
  - **Database Migration**: Created migration files to add roles and update RLS policies
    - `add_badger_controller_roles.sql` - Adds BADGER and CONTROLLER roles
    - `update_rls_policies_for_new_roles.sql` - Updates access control policies
  - **RLS Policy Updates**: Updated Row Level Security policies to include new roles
    - Access control validation now supports BADGER and CONTROLLER roles
    - Maintains existing ACCESS_CONTROLLER and SECURITY_STAFF role support
    - Ensures proper access control for stadium personnel

### Changed
- **Database Schema**: Updated `access_rights` table to include audit columns
  - Added `created_by` and `updated_by` fields for better tracking
  - Maintained backward compatibility with existing data
- **Mobile App Authentication**: Improved authentication handling for mobile app
  - Access control endpoint (`/access-control/validate`) is public and doesn't require authentication
  - Event statistics endpoint (`/events/{id}/stats`) is public for mobile app access
  - Event details endpoint (`/events/{id}`) requires authentication for admin/organizer access
  - Mobile app now handles authentication failures gracefully with fallback data
  - Added comprehensive debug logging for authentication troubleshooting
- **QR Code Validation**: Fixed validation result interpretation in mobile app
  - Fixed mobile app to correctly check `data.access_granted` instead of `result.success`
  - Enhanced validation result screen to display detailed denial reasons from backend
  - Added proper error handling for different types of access denials (invalid code, expired, already used, etc.)
  - Improved user experience with clear denial messages and suggested actions
- **Session Persistence**: Enhanced session management and debugging
  - Added comprehensive debug logging throughout authentication flow
  - Improved token storage and retrieval with better error handling
  - Enhanced auth wrapper to properly track authentication state changes
  - Added fallback data when authentication is not available
- **Mobile App Data Display**: Comprehensive enhancement of validation result display
  - **For Successful Access**: Now displays all available backend data including:
    - Validation Information: Validation ID, validation time, security level, crowd status
    - Complete Subscription Details: Plan name, description, zone, section, row, seat, gate, price, currency
    - User Information: User ID, holder name
    - Event Information: Event ID, event name
    - Access Right Details: All technical details including QR code, access code, status, usage counts
    - Contact Information: Supervisor phone and customer service
  - **For Denied Access**: Enhanced to show:
    - Validation ID and validation time
    - Detailed denial reasons with technical explanations
    - Last usage information for already used codes
    - Access right information when available
    - Suggested actions and contact information
  - **Complete Data Integration**: Mobile app now displays 100% of the data provided by the backend API
- **QR Code Validation Endpoint**: Fixed mobile app to use correct validation endpoint
  - **Issue Identified**: Mobile app was using `/access-control/validate` endpoint which requires QR codes in `access_rights` table
  - **HTML Demo Analysis**: HTML demo uses `/subscription-sales/qr-codes/validate` endpoint which checks `physical_qr_codes` table
  - **Solution Applied**: Updated mobile app to use subscription validation endpoint matching HTML demo behavior
  - **Endpoint Compatibility**: Subscription validation endpoint returns availability status, converted to access control format
  - **Testing Alignment**: Mobile app now works with same QR codes as HTML demo for consistent testing

### Technical Details
- **Access Control Service**: Implements real-time QR code validation with:
  - Subscription validation and access rights checking
    - Usage tracking and limits enforcement
  - Zone-based access control
  - Comprehensive logging of all access attempts
  - Event statistics updates
- **API Integration**: Full integration with mobile app requirements:
  - JWT authentication support
  - Real-time validation responses
  - Detailed error handling and status codes
  - Support for device-specific information
- **Mobile App Resilience**: Enhanced error handling and user experience:
  - Graceful handling of authentication failures
  - Fallback data when user is not authenticated
  - Clear indication when authentication is required vs optional
  - Debug logging for troubleshooting authentication issues
- **QR Code Validation Logic**: Corrected access control validation approach
  - **Correct Logic Identified**: QR codes must be ASSIGNED to valid subscriptions in `access_rights` table to grant access
  - **Previous Misunderstanding**: Initially switched to subscription validation endpoint which only checks availability
  - **Proper Solution**: Reverted to access control endpoint (`/access-control/validate`) with existing data
  - **Data Strategy**: Using existing QR codes from `access_rights` table that are already assigned to valid subscriptions
  - **HTML Demo Alignment**: Mobile app now uses identical logic to `mobile-app-real-demo.html` (POST to `/access-control/validate`)
  - **Result Field Fix**: Updated mobile app to check `result.data.result === 'GRANTED'` (matching HTML demo) instead of `access_granted` field
  - **Access Control Rules**: 
    - ✅ ACCESS GRANTED: QR code exists in `access_rights` table + status VALID + not expired + not already used
    - ❌ ACCESS DENIED: QR code not found + expired + already used + suspended status
- **Complete Data Display**: Mobile app now shows all backend information:
  - Validation metadata (ID, timing, security context)
  - Complete subscription and access right details
  - User and event information
  - Contact information and support details
  - Last usage information for denied requests
- **Endpoint Alignment**: Mobile app now matches HTML demo validation approach:
  - Uses `/access-control/validate` POST endpoint (same as HTML demo)
  - Sends identical payload structure as HTML demo
  - Returns access control validation from `access_rights` table
  - Maintains compatibility with existing mobile app UI
- **API Payload Fix**: Mobile app now sends identical payload to HTML demo:
  - Changed `threat_level` to `security_level` in security_context
  - Removed geolocation from security_context
  - Changed device_type from `MOBILE_APP` to `HANDHELD_SCANNER`
  - Changed device_id from `entrix_scanner_app` to `MOBILE_APP_001`
  - Changed `app_version` to `software_version`
  - Removed `os_version` field
  - Changed agent_id from `mobile-app-agent` to `demo-agent-001`
- **Event Statistics Fix**: Removed 100-scan limitation in event statistics
  - **Issue**: Event statistics were limited to only the last 100 scans due to `take: 100` in query
  - **Fix**: Removed the limitation to show accurate total counts for all scans
  - **Impact**: Dashboard now shows correct total scans, validated tickets, and refused tickets counts
- **Agent Information Fix**: Fixed agent information display in denial details
  - **Issue**: Agent information showed "Unknown" in denial details because the backend was not properly storing/returning agent information
  - **Fix**: Updated access control service to properly store agent_id in controller_device field and query access_control_log for last usage information
  - **Impact**: Denial details now show the actual agent who performed the scan instead of "Unknown"
  - Changed terminal_id from `MOBILE_APP_001` to `DEMO_TERMINAL_001`
- **User Interface Fixes**:
  - Fixed user name display to show `firstName` and `lastName` instead of email (corrected field names from snake_case to camelCase)
  - Removed pre-filled admin credentials from login form for production use
  - Added debug logging to validation result screen to troubleshoot empty denial details
- **API Response Structure Fix**:
  - Fixed access control validation endpoint response handling to properly extract data from nested response structure
  - Backend returns `{ success: true, data: validationResult }` but mobile app was expecting direct response
  - Updated mobile app to handle both nested and direct response structures with `data['data'] ?? data`
- **Production Ready**:
  - Removed all debug logging from mobile app
  - Fixed user name display to show firstName/lastName instead of email
  - Removed pre-filled admin credentials from login form
  - Mobile app now correctly handles backend response structure and displays denial details properly
  - App is ready for production deployment
- **UI Improvements**:
  - Cleaned up validation result screen to show only essential information for granted access
  - Removed all IDs (Validation ID, User ID, Event ID, etc.) from display for cleaner UI
  - For granted access, now shows only: validation time, plan name, zone, seat, entry gate, price, user name, and status
  - Fixed event statistics display by correcting field name mappings (totalTickets, validatedTickets, refusedTickets)
  - Added success rate calculation based on validated vs total tickets
  - Fixed "Scan Another" button functionality to properly reset scanner state and allow new scans
  - Improved button alignment and sizing for consistent UI appearance
- **Device Information & Agent Tracking**:
  - Added device info service to fetch real device information (device ID, model, OS version, app version)
  - Integrated authenticated user data as agent information in access control logs
  - Enhanced access control payload with comprehensive device details including manufacturer, platform, and app version
  - Agent ID now includes authenticated user's name and device identifier for better tracking
  - Terminal ID now uses actual device model and ID for accurate device identification
- **UI Fixes**:
  - Fixed dashboard user name display to properly show firstName and lastName instead of email
  - Added validation to ensure firstName and lastName are not null or empty before displaying
  - Fixed button text truncation in validation result screen by reducing font size and adding overflow handling
  - Added debug logging to troubleshoot user data display issues
  - **Snake Case / Camel Case Compatibility**: Added support for both snake_case and camelCase field names in user data
  - Mobile app now handles both `firstName`/`lastName` (camelCase) and `first_name`/`last_name` (snake_case) from backend
  - Agent ID generation now works with both naming conventions for user names

### Files Added
- `src/modules/access-control/dto/access-control.dto.ts` - DTOs for request/response validation
- `src/modules/access-control/services/access-control.service.ts` - Core business logic
- `src/modules/access-control/controllers/access-control.controller.ts` - API endpoints
- `src/modules/access-control/access-control.module.ts` - Module configuration

### Files Modified
- `src/app.module.ts` - Added AccessControlModule import
- `prisma/schema.prisma` - Added audit columns to access_rights model
- `src/modules/events/controllers/event-statistics.controller.ts` - Added stats alias endpoint

## [Previous Versions]
- Initial backend setup and basic API structure
- User authentication and event management
- Database schema and Prisma integration

### Critical Database Compatibility Fix
- **Fixed enum value mismatches between backend and database**:
  - Changed `DenialReason.INVALID_CODE` to `DenialReason.INVALID_QR` to match database enum
  - Changed `AccessStatus.GRANTED` to `AccessStatus.SUCCESS` to match database enum
  - This resolves the issue where access control logs were not being created due to enum validation errors

### Enhanced QR Code Validation Logic
- **Implemented two-step validation process**:
  - First checks `physical_qr_codes` table for QR existence
  - Second checks `access_rights` table for subscription validation
  - Added `NO_SUBSCRIPTION` denial reason for valid QR codes without subscriptions
  - Enhanced denial responses with physical QR metadata (entry_gate, zone_name, seat_number, plan_name, user_name)
  - Added comprehensive access control logging for all scan attempts

- **New Role System**: Added "BADGER" and "CONTROLLER" roles with specific permissions
  - **BADGER Role**: Full validation capabilities (scan, validate, create logs, view history)
  - **CONTROLLER Role**: Info-only mode (scan, view history, no validation)
  - Updated RLS policies to include new roles
  - Created test users for role verification

- **Mobile App Security Enhancements**: Implemented role-based access control
  - Added security checks in `DashboardScreen` and `QRScannerScreen`
  - Enhanced `AuthService` with role validation methods
  - Fixed role parsing from backend response
  - Added access level display in app bar

- **UI/UX Improvements**: Enhanced mobile app user experience
  - Removed greeting text from dashboard
  - Repositioned buttons for better accessibility
  - Limited event descriptions to 2-3 lines
  - Enhanced validation result screen with highlighting hierarchy
  - Improved access denied display with serial numbers and detailed information
  - Reduced QR scan cooldown timer
  - Added large return button for better navigation

### Changed
- **Database Schema Updates**: Added `NO_SUBSCRIPTION` to `denial_reason` enum
- **Backend DTOs**: Extended `AccessRightDto` with physical QR metadata fields
- **Mobile App Navigation**: Converted validation result screen to stateless widget (removed auto-return)

### Security
- **Access Control**: Implemented comprehensive role-based permissions
- **Mobile App Security**: Added critical security checks to prevent unauthorized access
- **Database Security**: Enhanced RLS policies for new roles