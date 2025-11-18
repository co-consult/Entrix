# 🔐 Token Expiry System - Entrix Frontend

## Overview

The Token Expiry System automatically monitors user sessions and handles token expiration to ensure security and user experience. It provides proactive warnings, automatic logout, and session extension capabilities.

## 🚀 Features

### ✅ **Automatic Token Monitoring**
- Real-time JWT token expiry tracking
- Proactive warnings 5 minutes before expiry
- Automatic logout when tokens expire
- Session extension capabilities

### ✅ **User Experience**
- Visual session status indicator
- Warning modals before expiry
- Success notifications for session extension
- Automatic redirect to login page

### ✅ **Security Features**
- Inactivity monitoring (30 minutes)
- Page unload warnings for expiring sessions
- Global token validation
- Secure session cleanup

## 🏗️ Architecture

### Components

1. **`TokenExpiryMonitor`** - Global background monitor
2. **`TokenExpiryNotifier`** - UI component for warnings/status
3. **`useTokenExpiry`** - React hook for token management
4. **Enhanced API Client** - Automatic token refresh and expiry handling

### File Structure

```
frontend/
├── components/
│   ├── layout/
│   │   ├── token-expiry-monitor.tsx    # Global monitor
│   │   └── sidebar.tsx                 # Sidebar with notifier
│   └── ui/
│       └── token-expiry-notifier.tsx   # UI component
├── hooks/
│   └── use-token-expiry.ts             # React hook
├── lib/
│   ├── api-client.ts                   # Enhanced with expiry handling
│   └── auth.ts                         # NextAuth configuration
└── app/
    └── layout.tsx                      # Main layout with monitor
```

## 🔧 Configuration

### Backend Token Settings
- **Access Token Expiry**: 15 minutes
- **Refresh Token Expiry**: 7 days
- **Warning Threshold**: 5 minutes before expiry
- **Inactivity Timeout**: 30 minutes

### Frontend Settings
- **Session Max Age**: 15 minutes (matches backend)
- **Warning Display**: 5 minutes before expiry
- **Auto-refresh**: 2 minutes before expiry
- **Status Updates**: Every 30 seconds

## 📱 Usage

### 1. **Automatic Integration**
The system works automatically once integrated. No additional code required.

### 2. **Manual Usage with Hook**
```typescript
import { useTokenExpiry } from '@/hooks/use-token-expiry';

function MyComponent() {
  const { session, logout, extendSession, isAuthenticated } = useTokenExpiry();
  
  return (
    <div>
      {isAuthenticated && (
        <button onClick={extendSession}>Extend Session</button>
      )}
    </div>
  );
}
```

### 3. **Custom Notifier Component**
```typescript
import { TokenExpiryNotifier } from '@/components/ui/token-expiry-notifier';

function MyLayout() {
  return (
    <div>
      <TokenExpiryNotifier 
        showWarning={true}    // Show expiry warnings
        showStatus={true}     // Show session status
      />
      {/* Your content */}
    </div>
  );
}
```

## 🎯 User Experience Flow

### **Normal Session (0-10 minutes remaining)**
```
🟢 Session: 8m 30s
[No warnings shown]
```

### **Warning Phase (5 minutes remaining)**
```
🟡 Session: 4m 45s
[Warning Alert] Votre session expirera dans 4m 45s
[Étendre] [Déconnexion]
```

### **Critical Phase (2 minutes remaining)**
```
🔴 Session: 1m 30s
[Critical Alert] Votre session expirera dans 1m 30s
[Étendre] [Déconnexion]
```

### **Session Expired**
```
🔒 Session expirée
[Modal] Votre session a expiré pour des raisons de sécurité
[Se reconnecter] (auto-redirect after 10s)
```

## ⚙️ Technical Implementation

### **Token Expiry Detection**
```typescript
// Decode JWT payload
const payload = JSON.parse(atob(token.split('.')[1]));
const expirationTime = payload.exp * 1000;
const timeUntilExpiry = expirationTime - Date.now();
```

### **Automatic Refresh**
```typescript
// Refresh 2 minutes before expiry
const refreshTime = Math.max(timeUntilExpiry - (2 * 60 * 1000), 0);
setTimeout(refreshToken, refreshTime);
```

### **Inactivity Monitoring**
```typescript
// Reset timer on user activity
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll'];
activityEvents.forEach(event => {
  document.addEventListener(event, resetInactivityTimer, true);
});
```

## 🔒 Security Features

### **Automatic Logout**
- Token expiry detection
- Inactivity timeout (30 minutes)
- Failed refresh attempts
- Manual logout option

### **Session Validation**
- JWT payload verification
- Expiry time validation
- Token blacklist checking
- Secure session cleanup

### **User Protection**
- Page unload warnings
- Activity monitoring
- Secure redirects
- Session state management

## 🐛 Troubleshooting

### **Common Issues**

1. **Token not refreshing**
   - Check browser console for errors
   - Verify backend refresh endpoint
   - Check network connectivity

2. **Warnings not showing**
   - Ensure component is mounted
   - Check session authentication status
   - Verify token expiry calculation

3. **Auto-logout not working**
   - Check token expiry time
   - Verify session cleanup
   - Check redirect configuration

### **Debug Mode**
Enable console logging by checking browser console:
```
🔍 TOKEN EXPIRY HOOK - Session authenticated, scheduling expiry monitoring
🔍 API CLIENT - Scheduling token refresh in 780 seconds
🔍 TOKEN MONITOR - User inactive for 30 minutes, checking session
```

## 🚀 Future Enhancements

### **Planned Features**
- [ ] Remember me functionality
- [ ] Custom expiry thresholds
- [ ] Multi-tab session sync
- [ ] Offline session handling
- [ ] Session analytics

### **Configuration Options**
- [ ] Configurable warning times
- [ ] Custom inactivity timeouts
- [ ] Session extension limits
- [ ] User preference settings

## 📋 API Reference

### **useTokenExpiry Hook**
```typescript
interface TokenExpiryHook {
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  logout: () => Promise<void>;
  extendSession: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### **TokenExpiryNotifier Props**
```typescript
interface TokenExpiryNotifierProps {
  showWarning?: boolean;  // Show expiry warnings
  showStatus?: boolean;   // Show session status
}
```

### **Exported Functions**
```typescript
// From api-client.ts
export { handleTokenExpiry, scheduleTokenExpiry };

// From token-expiry-monitor.tsx
export { TokenExpiryMonitor };

// From token-expiry-notifier.tsx
export { TokenExpiryNotifier };
```

## 🔗 Integration Points

### **NextAuth Integration**
- Automatic session management
- Token expiry detection
- Secure logout handling
- Session state synchronization

### **API Client Integration**
- Automatic token refresh
- 401 error handling
- Token expiry management
- Request/response interceptors

### **Layout Integration**
- Global monitoring
- Sidebar notifications
- Main layout integration
- Responsive design support

---

## 📞 Support

For questions or issues with the Token Expiry System:

1. Check browser console for error logs
2. Verify backend token configuration
3. Test with different session scenarios
4. Review this documentation

**Last Updated**: August 2025
**Version**: 1.0.0
**Compatibility**: Next.js 13+, React 18+

