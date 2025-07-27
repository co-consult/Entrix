"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const lucide_react_1 = require("lucide-react");
const AuthTestPage = () => {
    const [baseUrl, setBaseUrl] = (0, react_1.useState)('http://localhost:3000');
    const [apiVersion, setApiVersion] = (0, react_1.useState)('api/v1');
    const [tokens, setTokens] = (0, react_1.useState)({
        accessToken: '',
        refreshToken: '',
        sessionId: '',
        userId: '',
        challengeToken: '',
        resetToken: '',
        verificationToken: ''
    });
    const [testLogs, setTestLogs] = (0, react_1.useState)([]);
    const [activeSection, setActiveSection] = (0, react_1.useState)('auth');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [testData, setTestData] = (0, react_1.useState)({
        email: 'souheilsbs@gmail.com',
        password: 'TestPassword123!',
        firstName: 'Jean',
        lastName: 'Dupont',
        phone: '+21650560560'
    });
    const [authForms, setAuthForms] = (0, react_1.useState)({
        login: { email: '', password: '', rememberMe: false, deviceFingerprint: 'test-device-fingerprint-123' },
        register: { email: '', password: '', firstName: '', lastName: '', phone: '', dateOfBirth: '1990-01-01', marketingConsent: false, termsAccepted: true }
    });
    const [passwordForms, setPasswordForms] = (0, react_1.useState)({
        forgotPassword: { email: '' },
        resetPassword: { token: '', newPassword: '', confirmPassword: '' },
        changePassword: { currentPassword: '', newPassword: '', confirmPassword: '' }
    });
    const [mfaForms, setMfaForms] = (0, react_1.useState)({
        setup: { provider: 'SMS_OTP', phoneNumber: '' },
        verify: { challengeToken: '', method: 'SMS_OTP', code: '', trustDevice: false }
    });
    const [securityForms, setSecurityForms] = (0, react_1.useState)({
        trustDevice: { deviceName: 'MacBook Pro - Chrome', trustDuration: 2592000 }
    });
    const [emailForms, setEmailForms] = (0, react_1.useState)({
        verify: { token: '' },
        resend: { email: '' }
    });
    const [showPasswords, setShowPasswords] = (0, react_1.useState)({});
    const makeApiRequest = async (endpoint, method = 'GET', body = null, useAuth = false) => {
        setIsLoading(true);
        const url = `${baseUrl}/${apiVersion}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
        };
        if (useAuth && tokens.accessToken) {
            headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        const config = {
            method,
            headers,
        };
        if (body && method !== 'GET') {
            config.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            const log = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                method,
                endpoint,
                status: response.status,
                success: response.ok,
                request: body,
                response: data,
                url
            };
            setTestLogs(prev => [log, ...prev]);
            if (response.ok && data.data) {
                if (data.data.tokens) {
                    setTokens(prev => ({
                        ...prev,
                        accessToken: data.data.tokens.accessToken || prev.accessToken,
                        refreshToken: data.data.tokens.refreshToken || prev.refreshToken
                    }));
                }
                if (data.data.session) {
                    setTokens(prev => ({
                        ...prev,
                        sessionId: data.data.session.sessionId || prev.sessionId
                    }));
                }
                if (data.data.user) {
                    setTokens(prev => ({
                        ...prev,
                        userId: data.data.user.id || prev.userId
                    }));
                }
                if (data.data.challengeToken) {
                    setTokens(prev => ({
                        ...prev,
                        challengeToken: data.data.challengeToken || prev.challengeToken
                    }));
                }
            }
            setIsLoading(false);
            return { response, data };
        }
        catch (error) {
            const log = {
                id: Date.now(),
                timestamp: new Date().toLocaleTimeString(),
                method,
                endpoint,
                status: 0,
                success: false,
                request: body,
                response: { error: error.message },
                url
            };
            setTestLogs(prev => [log, ...prev]);
            setIsLoading(false);
            return { response: null, data: { error: error.message } };
        }
    };
    const testLogin = async () => {
        await makeApiRequest('auth/login', 'POST', authForms.login);
    };
    const testRegister = async () => {
        await makeApiRequest('auth/register', 'POST', authForms.register);
    };
    const testLogout = async () => {
        await makeApiRequest('auth/logout', 'POST', { allDevices: false }, true);
    };
    const testLogoutAllDevices = async () => {
        await makeApiRequest('auth/logout', 'POST', { allDevices: true }, true);
    };
    const testGetSession = async () => {
        await makeApiRequest('auth/session', 'GET', null, true);
    };
    const testRefreshToken = async () => {
        await makeApiRequest('auth/refresh', 'POST', { refreshToken: tokens.refreshToken });
    };
    const testGetAllSessions = async () => {
        await makeApiRequest('auth/sessions', 'GET', null, true);
    };
    const testRevokeSession = async () => {
        if (tokens.sessionId) {
            await makeApiRequest(`auth/sessions/${tokens.sessionId}`, 'DELETE', null, true);
        }
    };
    const testForgotPassword = async () => {
        await makeApiRequest('auth/forgot-password', 'POST', passwordForms.forgotPassword);
    };
    const testResetPassword = async () => {
        await makeApiRequest('auth/reset-password', 'POST', passwordForms.resetPassword);
    };
    const testChangePassword = async () => {
        await makeApiRequest('auth/change-password', 'PUT', passwordForms.changePassword, true);
    };
    const testMfaProviders = async () => {
        await makeApiRequest('auth/mfa/providers', 'GET', null, true);
    };
    const testMfaSetup = async () => {
        await makeApiRequest('auth/mfa/setup', 'POST', mfaForms.setup, true);
    };
    const testMfaVerify = async () => {
        await makeApiRequest('auth/mfa/verify', 'POST', mfaForms.verify, true);
    };
    const testMfaDisable = async () => {
        await makeApiRequest(`auth/mfa/${mfaForms.setup.provider}`, 'DELETE', { confirmationCode: '123456' }, true);
    };
    const testSecurityEvents = async () => {
        await makeApiRequest('auth/security-events?limit=20&eventType=LOGIN', 'GET', null, true);
    };
    const testRiskAssessment = async () => {
        await makeApiRequest('auth/risk-assessment', 'GET', null, true);
    };
    const testTrustedDevices = async () => {
        await makeApiRequest('auth/trusted-devices', 'GET', null, true);
    };
    const testAddTrustedDevice = async () => {
        await makeApiRequest('auth/trusted-devices', 'POST', securityForms.trustDevice, true);
    };
    const testVerifyEmail = async () => {
        await makeApiRequest('auth/verify-email', 'POST', emailForms.verify);
    };
    const testResendVerification = async () => {
        await makeApiRequest('auth/resend-verification', 'POST', emailForms.resend);
    };
    const FormField = ({ label, name, type = 'text', value, onChange, placeholder, required = false, options = null, helper = null }) => {
        const isPassword = type === 'password';
        const fieldId = `${name}-${Date.now()}`;
        return (<div className="space-y-2">
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {type === 'select' ? (<select id={fieldId} value={value} onChange={(e) => onChange(name, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            {options?.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
          </select>) : type === 'checkbox' ? (<div className="flex items-center space-x-2">
            <input id={fieldId} type="checkbox" checked={value} onChange={(e) => onChange(name, e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"/>
            <label htmlFor={fieldId} className="text-sm text-gray-600">{placeholder}</label>
          </div>) : (<div className="relative">
            <input id={fieldId} type={isPassword && !showPasswords[name] ? 'password' : 'text'} value={value} onChange={(e) => onChange(name, e.target.value)} placeholder={placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {isPassword && (<button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, [name]: !prev[name] }))} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                {showPasswords[name] ? <lucide_react_1.EyeOff size={20}/> : <lucide_react_1.Eye size={20}/>}
              </button>)}
          </div>)}
        
        {helper && (<p className="text-xs text-gray-500">{helper}</p>)}
      </div>);
    };
    const TestButton = ({ onClick, title, description, variant = 'primary' }) => {
        const baseClasses = "w-full px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2";
        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
            secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
            danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
            success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
        };
        return (<button onClick={onClick} disabled={isLoading} className={`${baseClasses} ${variants[variant]} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <div className="text-left">
          <div className="font-semibold">{title}</div>
          <div className="text-sm opacity-90">{description}</div>
        </div>
      </button>);
    };
    (0, react_1.useEffect)(() => {
        setAuthForms(prev => ({
            ...prev,
            login: { ...prev.login, email: testData.email, password: testData.password },
            register: {
                ...prev.register,
                email: testData.email,
                password: testData.password,
                firstName: testData.firstName,
                lastName: testData.lastName,
                phone: testData.phone
            }
        }));
    }, [testData]);
    const sections = [
        { id: 'auth', name: 'Authentification', icon: lucide_react_1.User },
        { id: 'sessions', name: 'Sessions', icon: lucide_react_1.Shield },
        { id: 'passwords', name: 'Mots de passe', icon: lucide_react_1.Lock },
        { id: 'mfa', name: 'MFA', icon: lucide_react_1.Smartphone },
        { id: 'security', name: 'Sécurité', icon: lucide_react_1.Shield },
        { id: 'email', name: 'Email', icon: lucide_react_1.Mail },
        { id: 'logout', name: 'Déconnexion', icon: lucide_react_1.LogOut }
    ];
    return (<div className="min-h-screen bg-gray-50">
      
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Test Module Auth - Entrix V3.0</h1>
            <p className="text-gray-600">Interface de test pour toutes les fonctionnalités d'authentification</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
                <div className="space-y-4">
                  <FormField label="URL de base" name="baseUrl" value={baseUrl} onChange={(name, value) => setBaseUrl(value)} placeholder="http://localhost:3000"/>
                  <FormField label="Version API" name="apiVersion" value={apiVersion} onChange={(name, value) => setApiVersion(value)} placeholder="api/v1"/>
                </div>
              </div>

              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tokens</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Access Token:</span>
                    <span className={`px-2 py-1 rounded text-xs ${tokens.accessToken ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {tokens.accessToken ? 'Défini' : 'Non défini'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Refresh Token:</span>
                    <span className={`px-2 py-1 rounded text-xs ${tokens.refreshToken ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {tokens.refreshToken ? 'Défini' : 'Non défini'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Session ID:</span>
                    <span className={`px-2 py-1 rounded text-xs ${tokens.sessionId ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {tokens.sessionId ? 'Défini' : 'Non défini'}
                    </span>
                  </div>
                </div>
                
                <button onClick={() => setTokens({ accessToken: '', refreshToken: '', sessionId: '', userId: '', challengeToken: '', resetToken: '', verificationToken: '' })} className="mt-3 w-full px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">
                  <lucide_react_1.Trash2 size={16} className="inline mr-2"/>
                  Effacer les tokens
                </button>
              </div>

              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections</h3>
                <nav className="space-y-2">
                  {sections.map(section => {
            const Icon = section.icon;
            return (<button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-colors ${activeSection === section.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Icon size={18} className="mr-3"/>
                        {section.name}
                      </button>);
        })}
                </nav>
              </div>
            </div>
          </div>

          
          <div className="lg:col-span-2 space-y-6">
            
            
            {activeSection === 'auth' && (<div className="space-y-6">
                
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inscription</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Email" name="email" type="email" value={authForms.register.email} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="nouveau@entrix.tn" required/>
                    <FormField label="Mot de passe" name="password" type="password" value={authForms.register.password} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="Mot de passe sécurisé" required/>
                    <FormField label="Prénom" name="firstName" value={authForms.register.firstName} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="Jean" required/>
                    <FormField label="Nom" name="lastName" value={authForms.register.lastName} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="Dupont" required/>
                    <FormField label="Téléphone" name="phone" value={authForms.register.phone} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="+21650560560"/>
                    <FormField label="Date de naissance" name="dateOfBirth" type="date" value={authForms.register.dateOfBirth} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))}/>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-6">
                    <FormField name="marketingConsent" type="checkbox" value={authForms.register.marketingConsent} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="Accepter les communications marketing"/>
                    <FormField name="termsAccepted" type="checkbox" value={authForms.register.termsAccepted} onChange={(name, value) => setAuthForms(prev => ({ ...prev, register: { ...prev.register, [name]: value } }))} placeholder="Accepter les conditions d'utilisation (requis)"/>
                  </div>

                  <TestButton onClick={testRegister} title="Tester l'inscription" description="POST /auth/register" variant="success"/>
                </div>

                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Connexion</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Email" name="email" type="email" value={authForms.login.email} onChange={(name, value) => setAuthForms(prev => ({ ...prev, login: { ...prev.login, [name]: value } }))} placeholder="user@entrix.tn" required/>
                    <FormField label="Mot de passe" name="password" type="password" value={authForms.login.password} onChange={(name, value) => setAuthForms(prev => ({ ...prev, login: { ...prev.login, [name]: value } }))} placeholder="Votre mot de passe" required/>
                    <FormField label="Device Fingerprint" name="deviceFingerprint" value={authForms.login.deviceFingerprint} onChange={(name, value) => setAuthForms(prev => ({ ...prev, login: { ...prev.login, [name]: value } }))} placeholder="test-device-fingerprint-123"/>
                    <FormField name="rememberMe" type="checkbox" value={authForms.login.rememberMe} onChange={(name, value) => setAuthForms(prev => ({ ...prev, login: { ...prev.login, [name]: value } }))} placeholder="Se souvenir de moi (30 jours)"/>
                  </div>

                  <TestButton onClick={testLogin} title="Tester la connexion" description="POST /auth/login"/>
                </div>
              </div>)}

            
            {activeSection === 'sessions' && (<div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion des Sessions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TestButton onClick={testGetSession} title="Session Courante" description="GET /auth/session"/>
                    <TestButton onClick={testRefreshToken} title="Rafraîchir Token" description="POST /auth/refresh" variant="secondary"/>
                    <TestButton onClick={testGetAllSessions} title="Toutes les Sessions" description="GET /auth/sessions"/>
                    <TestButton onClick={testRevokeSession} title="Révoquer Session" description="DELETE /auth/sessions/{id}" variant="danger"/>
                  </div>
                </div>
              </div>)}

            
            {activeSection === 'passwords' && (<div className="space-y-6">
                
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Mot de passe oublié</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Email" name="email" type="email" value={passwordForms.forgotPassword.email} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, forgotPassword: { ...prev.forgotPassword, [name]: value } }))} placeholder="user@entrix.tn" required/>
                  </div>
                  <TestButton onClick={testForgotPassword} title="Demander Reset" description="POST /auth/forgot-password"/>
                </div>

                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset mot de passe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Token Reset" name="token" value={passwordForms.resetPassword.token} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, resetPassword: { ...prev.resetPassword, [name]: value } }))} placeholder="Token reçu par email" required/>
                    <FormField label="Nouveau mot de passe" name="newPassword" type="password" value={passwordForms.resetPassword.newPassword} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, resetPassword: { ...prev.resetPassword, [name]: value } }))} placeholder="Nouveau mot de passe" required/>
                    <FormField label="Confirmer mot de passe" name="confirmPassword" type="password" value={passwordForms.resetPassword.confirmPassword} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, resetPassword: { ...prev.resetPassword, [name]: value } }))} placeholder="Confirmer le mot de passe" required/>
                  </div>
                  <TestButton onClick={testResetPassword} title="Reset Password" description="POST /auth/reset-password"/>
                </div>

                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Changer mot de passe</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Mot de passe actuel" name="currentPassword" type="password" value={passwordForms.changePassword.currentPassword} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, changePassword: { ...prev.changePassword, [name]: value } }))} placeholder="Mot de passe actuel" required/>
                    <FormField label="Nouveau mot de passe" name="newPassword" type="password" value={passwordForms.changePassword.newPassword} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, changePassword: { ...prev.changePassword, [name]: value } }))} placeholder="Nouveau mot de passe" required/>
                    <FormField label="Confirmer nouveau mot de passe" name="confirmPassword" type="password" value={passwordForms.changePassword.confirmPassword} onChange={(name, value) => setPasswordForms(prev => ({ ...prev, changePassword: { ...prev.changePassword, [name]: value } }))} placeholder="Confirmer le nouveau mot de passe" required/>
                  </div>
                  <TestButton onClick={testChangePassword} title="Changer Password" description="PUT /auth/change-password"/>
                </div>
              </div>)}

            
            {activeSection === 'mfa' && (<div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Factor Authentication</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <TestButton onClick={testMfaProviders} title="Providers MFA" description="GET /auth/mfa/providers"/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Provider" name="provider" type="select" value={mfaForms.setup.provider} onChange={(name, value) => setMfaForms(prev => ({ ...prev, setup: { ...prev.setup, [name]: value } }))} options={[
                { value: 'SMS_OTP', label: 'SMS OTP' },
                { value: 'EMAIL_OTP', label: 'Email OTP' },
                { value: 'TOTP_APP', label: 'App Authenticator' }
            ]}/>
                    <FormField label="Numéro de téléphone" name="phoneNumber" value={mfaForms.setup.phoneNumber} onChange={(name, value) => setMfaForms(prev => ({ ...prev, setup: { ...prev.setup, [name]: value } }))} placeholder="+21650560560"/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <TestButton onClick={testMfaSetup} title="Setup MFA" description="POST /auth/mfa/setup" variant="success"/>
                    <TestButton onClick={testMfaDisable} title="Désactiver MFA" description="DELETE /auth/mfa/{provider}" variant="danger"/>
                  </div>

                  
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Vérification MFA</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <FormField label="Challenge Token" name="challengeToken" value={mfaForms.verify.challengeToken} onChange={(name, value) => setMfaForms(prev => ({ ...prev, verify: { ...prev.verify, [name]: value } }))} placeholder={tokens.challengeToken || "Token du challenge MFA"}/>
                      <FormField label="Code MFA" name="code" value={mfaForms.verify.code} onChange={(name, value) => setMfaForms(prev => ({ ...prev, verify: { ...prev.verify, [name]: value } }))} placeholder="123456"/>
                      <FormField label="Méthode" name="method" type="select" value={mfaForms.verify.method} onChange={(name, value) => setMfaForms(prev => ({ ...prev, verify: { ...prev.verify, [name]: value } }))} options={[
                { value: 'SMS_OTP', label: 'SMS OTP' },
                { value: 'EMAIL_OTP', label: 'Email OTP' },
                { value: 'TOTP_APP', label: 'App Authenticator' }
            ]}/>
                      <FormField name="trustDevice" type="checkbox" value={mfaForms.verify.trustDevice} onChange={(name, value) => setMfaForms(prev => ({ ...prev, verify: { ...prev.verify, [name]: value } }))} placeholder="Faire confiance à cet appareil"/>
                    </div>
                    <TestButton onClick={testMfaVerify} title="Vérifier Code MFA" description="POST /auth/mfa/verify"/>
                  </div>
                </div>
              </div>)}

            
            {activeSection === 'security' && (<div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sécurité et Audit</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <TestButton onClick={testSecurityEvents} title="Événements Sécurité" description="GET /auth/security-events"/>
                    <TestButton onClick={testRiskAssessment} title="Évaluation Risque" description="GET /auth/risk-assessment" variant="secondary"/>
                    <TestButton onClick={testTrustedDevices} title="Appareils de Confiance" description="GET /auth/trusted-devices"/>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Gestion des Appareils</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <FormField label="Nom de l'appareil" name="deviceName" value={securityForms.trustDevice.deviceName} onChange={(name, value) => setSecurityForms(prev => ({ ...prev, trustDevice: { ...prev.trustDevice, [name]: value } }))} placeholder="MacBook Pro - Chrome"/>
                      <FormField label="Durée de confiance (secondes)" name="trustDuration" type="number" value={securityForms.trustDevice.trustDuration} onChange={(name, value) => setSecurityForms(prev => ({ ...prev, trustDevice: { ...prev.trustDevice, [name]: parseInt(value) } }))} placeholder="2592000"/>
                    </div>
                    <TestButton onClick={testAddTrustedDevice} title="Ajouter Appareil de Confiance" description="POST /auth/trusted-devices" variant="success"/>
                  </div>
                </div>
              </div>)}

            
            {activeSection === 'email' && (<div className="space-y-6">
                
                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Vérification Email</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Token de vérification" name="token" value={emailForms.verify.token} onChange={(name, value) => setEmailForms(prev => ({ ...prev, verify: { ...prev.verify, [name]: value } }))} placeholder={tokens.verificationToken || "Token reçu par email"}/>
                  </div>
                  <TestButton onClick={testVerifyEmail} title="Vérifier Email" description="POST /auth/verify-email" variant="success"/>
                </div>

                
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Renvoyer Vérification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <FormField label="Email" name="email" type="email" value={emailForms.resend.email} onChange={(name, value) => setEmailForms(prev => ({ ...prev, resend: { ...prev.resend, [name]: value } }))} placeholder="user@entrix.tn"/>
                  </div>
                  <TestButton onClick={testResendVerification} title="Renvoyer Vérification" description="POST /auth/resend-verification"/>
                </div>
              </div>)}

            
            {activeSection === 'logout' && (<div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Déconnexion</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TestButton onClick={testLogout} title="Déconnexion Simple" description="POST /auth/logout (session courante)" variant="secondary"/>
                    <TestButton onClick={testLogoutAllDevices} title="Déconnexion Globale" description="POST /auth/logout (tous appareils)" variant="danger"/>
                  </div>
                </div>
              </div>)}

            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Logs des Tests</h3>
                <button onClick={() => setTestLogs([])} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors text-sm">
                  Effacer les logs
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testLogs.length === 0 ? (<p className="text-gray-500 text-sm">Aucun test effectué</p>) : (testLogs.map(log => (<div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {log.method} {log.status}
                          </span>
                          <span className="text-sm text-gray-500">{log.timestamp}</span>
                          {log.success ? (<lucide_react_1.CheckCircle size={16} className="text-green-500"/>) : (<lucide_react_1.XCircle size={16} className="text-red-500"/>)}
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(log, null, 2))} className="p-1 text-gray-400 hover:text-gray-600">
                          <lucide_react_1.Copy size={16}/>
                        </button>
                      </div>
                      
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{log.method} {log.endpoint}</p>
                        <p className="text-gray-600 break-all">{log.url}</p>
                      </div>
                      
                      {log.request && (<details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">Requête</summary>
                          <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.request, null, 2)}
                          </pre>
                        </details>)}
                      
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer">Réponse</summary>
                        <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.response, null, 2)}
                        </pre>
                      </details>
                    </div>)))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
};
exports.default = AuthTestPage;
//# sourceMappingURL=auth-test.js.map