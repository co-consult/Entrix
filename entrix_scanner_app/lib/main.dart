import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'config/design.dart';
import 'services/auth_service.dart';
import 'services/feedback_service.dart';
import 'services/localization_service.dart';
import 'services/event_service.dart';
import 'utils/app_localizations.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize localization service
  final localizationService = LocalizationService();
  await localizationService.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => localizationService),
        ChangeNotifierProvider(create: (_) => EventService.instance),
      ],
      child: const EntrixScannerApp(),
    ),
  );
}

class EntrixScannerApp extends StatelessWidget {
  const EntrixScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
        return MaterialApp(
          title: 'Entrix Scanner',
          debugShowCheckedModeBanner: false,
          locale: localizationService.currentLocale,
          supportedLocales: LocalizationService.supportedLocales,
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          theme: ThemeData(
            primaryColor: DesignSystem.primaryColor,
            scaffoldBackgroundColor: DesignSystem.backgroundColor,
            appBarTheme: const AppBarTheme(
              backgroundColor: DesignSystem.surfaceColor,
              foregroundColor: DesignSystem.textPrimary,
              elevation: 0,
              systemOverlayStyle: SystemUiOverlayStyle.dark,
            ),
            elevatedButtonTheme: ElevatedButtonThemeData(
              style: DesignSystem.primaryButtonStyle,
            ),
            inputDecorationTheme: InputDecorationTheme(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                borderSide: const BorderSide(color: DesignSystem.borderColor),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                borderSide: const BorderSide(color: DesignSystem.borderColor),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                borderSide: const BorderSide(color: DesignSystem.primaryColor, width: 2),
              ),
              filled: true,
              fillColor: DesignSystem.surfaceColor,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: DesignSystem.spacingM,
                vertical: DesignSystem.spacingM,
              ),
            ),
            cardTheme: CardThemeData(
              color: DesignSystem.surfaceColor,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(DesignSystem.borderRadiusL),
                side: const BorderSide(color: DesignSystem.borderColor),
              ),
            ),
            fontFamily: DesignSystem.fontFamily,
          ),
          home: const AuthWrapper(),
          routes: {
            '/login': (context) => const AuthWrapper(),
            '/dashboard': (context) => const DashboardScreen(),
          },
        );
      },
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _initializeServices();
    _checkAuthStatus();
  }
  
  Future<void> _initializeServices() async {
    await FeedbackService.initialize();
  }

  Future<void> _checkAuthStatus() async {
    try {
      final isLoggedIn = await AuthService.isLoggedIn();
      
      if (mounted) {
        setState(() {
          _isLoggedIn = isLoggedIn;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoggedIn = false;
          _isLoading = false;
        });
      }
    }
  }

  void _onLoginSuccess() {
    setState(() {
      _isLoggedIn = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: DesignSystem.backgroundColor,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Loading logo
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: DesignSystem.primaryColor,
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                ),
                child: Center(
                  child: Text(
                    'E',
                    style: DesignSystem.heading2.copyWith(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: DesignSystem.spacingL),
              const CircularProgressIndicator(),
              const SizedBox(height: DesignSystem.spacingM),
              Text(
                context.l10n('loading'),
                style: DesignSystem.body1,
              ),
            ],
          ),
        ),
      );
    }

    if (_isLoggedIn) {
      return const DashboardScreen();
    }

    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
        return LoginScreen(onLoginSuccess: _onLoginSuccess);
      },
    );
  }
}
