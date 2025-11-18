import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/localization_service.dart';
import '../config/design.dart';
import '../utils/app_localizations.dart';

class LanguageSelector extends StatelessWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationService>(
      builder: (context, localizationService, child) {
        final isEnglish = localizationService.isEnglish;
        
        return Container(
          decoration: BoxDecoration(
            color: DesignSystem.surfaceColor,
            borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
            border: Border.all(
              color: DesignSystem.borderColor,
              width: 1,
            ),
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(DesignSystem.borderRadiusM),
              onTap: () => _showLanguageDialog(context, localizationService),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: DesignSystem.spacingM,
                  vertical: DesignSystem.spacingS,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Language flag icon
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: DesignSystem.borderColor,
                          width: 1,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          isEnglish ? '🇺🇸' : '🇫🇷',
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: DesignSystem.spacingS),
                    // Language name
                    Text(
                      isEnglish ? 'EN' : 'FR',
                      style: DesignSystem.body2.copyWith(
                        fontWeight: FontWeight.w600,
                        color: DesignSystem.textPrimary,
                      ),
                    ),
                    const SizedBox(width: DesignSystem.spacingXS),
                    // Dropdown arrow
                    Icon(
                      Icons.keyboard_arrow_down,
                      size: 16,
                      color: DesignSystem.textSecondary,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _showLanguageDialog(BuildContext context, LocalizationService localizationService) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(
          context.l10n('language'),
          style: DesignSystem.heading3,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildLanguageOption(
              context,
              localizationService,
              'en',
              context.l10n('english'),
              '🇺🇸',
              localizationService.isEnglish,
            ),
            const SizedBox(height: DesignSystem.spacingS),
            _buildLanguageOption(
              context,
              localizationService,
              'fr',
              context.l10n('french'),
              '🇫🇷',
              localizationService.isFrench,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              context.l10n('cancel'),
              style: DesignSystem.body2.copyWith(
                color: DesignSystem.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageOption(
    BuildContext context,
    LocalizationService localizationService,
    String languageCode,
    String languageName,
    String flag,
    bool isSelected,
  ) {
    return InkWell(
      onTap: () {
        localizationService.changeLanguage(languageCode);
        Navigator.of(context).pop();
      },
      borderRadius: BorderRadius.circular(DesignSystem.borderRadiusS),
      child: Container(
        padding: const EdgeInsets.all(DesignSystem.spacingM),
        decoration: BoxDecoration(
          color: isSelected 
            ? DesignSystem.primaryColor.withOpacity(0.1)
            : Colors.transparent,
          borderRadius: BorderRadius.circular(DesignSystem.borderRadiusS),
          border: Border.all(
            color: isSelected 
              ? DesignSystem.primaryColor
              : DesignSystem.borderColor,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Text(
              flag,
              style: const TextStyle(fontSize: 20),
            ),
            const SizedBox(width: DesignSystem.spacingM),
            Text(
              languageName,
              style: DesignSystem.body1.copyWith(
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected 
                  ? DesignSystem.primaryColor
                  : DesignSystem.textPrimary,
              ),
            ),
            const Spacer(),
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: DesignSystem.primaryColor,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
