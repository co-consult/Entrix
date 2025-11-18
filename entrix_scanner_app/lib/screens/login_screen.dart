import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/design.dart';
import '../services/auth_service.dart';
import '../services/localization_service.dart';
import '../utils/app_localizations.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  // Animation controllers
  late AnimationController _logoController;
  late AnimationController _pulseController;
  late Animation<double> _logoScaleAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    
    // Initialize animation controllers
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );
    
    // Create animations
    _logoScaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoController,
      curve: Curves.elasticOut,
    ));
    
    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _logoController,
      curve: Curves.easeIn,
    ));
    
    // Start animations
    _logoController.forward();
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _logoController.dispose();
    _pulseController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
        // Define the login handler inside the Consumer context
        Future<void> handleLogin() async {
          if (!_formKey.currentState!.validate()) {
            return;
          }

          setState(() {
            _isLoading = true;
          });

          try {
            final result = await AuthService.login(
              _emailController.text.trim(),
              _passwordController.text,
            );

            if (result['success'] == true) {
              widget.onLoginSuccess();
            } else {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(result['error'] ?? AppLocalizations.of(context, 'loginFailed')),
                    backgroundColor: DesignSystem.errorColor,
                  ),
                );
              }
            }
          } catch (e) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(AppLocalizations.of(context, 'errorOccurredWithDetails').replaceAll('{0}', e.toString())),
                  backgroundColor: DesignSystem.errorColor,
                ),
              );
            }
          } finally {
            if (mounted) {
              setState(() {
                _isLoading = false;
              });
            }
          }
        }

        return Scaffold(
          backgroundColor: DesignSystem.backgroundColor,
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(DesignSystem.spacingXL),
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Logo Section with Animation
                      AnimatedBuilder(
                        animation: Listenable.merge([_logoController, _pulseController]),
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _logoScaleAnimation.value * _pulseAnimation.value,
                            child: Opacity(
                              opacity: _fadeAnimation.value,
                              child: Column(
                                children: [
                                  Container(
                                    width: 120,
                                    height: 120,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                        colors: [
                                          DesignSystem.primaryColor,
                                          DesignSystem.primaryColor.withValues(alpha: 0.8),
                                        ],
                                      ),
                                      borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
                                      boxShadow: [
                                        BoxShadow(
                                          color: DesignSystem.primaryColor.withValues(alpha: 0.3),
                                          blurRadius: 20,
                                          spreadRadius: 5,
                                          offset: const Offset(0, 10),
                                        ),
                                      ],
                                    ),
                                    child: Center(
                                      child: Icon(
                                        Icons.qr_code_scanner,
                                        size: 48,
                                        color: Colors.white,
                                        shadows: [
                                          Shadow(
                                            color: Colors.black.withValues(alpha: 0.3),
                                            offset: const Offset(0, 2),
                                            blurRadius: 4,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: DesignSystem.spacingM),
                                  Text(
                                    AppLocalizations.of(context, 'entrixScanner'),
                                    style: DesignSystem.heading2,
                                    textAlign: TextAlign.center,
                                  ),
                                  const SizedBox(height: DesignSystem.spacingS),
                                  Text(
                                    AppLocalizations.of(context, 'accessControlSystem'),
                                    style: DesignSystem.body2,
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),

                      // Add extra spacing to prevent overlap
                      const SizedBox(height: DesignSystem.spacingXL),

                      // Login Form
                      Container(
                        decoration: DesignSystem.cardDecoration,
                        padding: const EdgeInsets.all(DesignSystem.spacingXL),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              AppLocalizations.of(context, 'signIn'),
                              style: DesignSystem.heading3,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: DesignSystem.spacingXL),

                            // Email Field
                            TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.emailAddress,
                              decoration: DesignSystem.inputDecoration(
                                labelText: AppLocalizations.of(context, 'email'),
                                hintText: AppLocalizations.of(context, 'enterYourEmail'),
                                prefixIcon: const Icon(Icons.email_outlined),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return AppLocalizations.of(context, 'emailRequired');
                                }
                                // More permissive email regex that accepts .local domains
                                if (!RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$').hasMatch(value)) {
                                  return AppLocalizations.of(context, 'invalidEmail');
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: DesignSystem.spacingL),

                            // Password Field
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: DesignSystem.inputDecoration(
                                labelText: AppLocalizations.of(context, 'password'),
                                hintText: AppLocalizations.of(context, 'enterYourPassword'),
                                prefixIcon: const Icon(Icons.lock_outlined),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility : Icons.visibility_off,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return AppLocalizations.of(context, 'passwordRequired');
                                }
                                if (value.length < 6) {
                                  return AppLocalizations.of(context, 'passwordTooShort');
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: DesignSystem.spacingXL),

                            // Login Button
                            SizedBox(
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _isLoading ? null : handleLogin,
                                style: DesignSystem.primaryButtonStyle,
                                child: _isLoading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor: AlwaysStoppedAnimation<Color>(
                                            DesignSystem.secondaryColor,
                                          ),
                                        ),
                                      )
                                    : Text(
                                        AppLocalizations.of(context, 'signIn'),
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Footer
                      const SizedBox(height: DesignSystem.spacingXL),
                      Text(
                        '© 2024 Entrix. All rights reserved.',
                        style: DesignSystem.caption,
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
