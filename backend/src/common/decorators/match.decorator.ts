// src/common/decorators/match.decorator.ts
/**
 * Décorateur de validation pour vérifier que deux champs correspondent
 * 
 * Utilisation principale :
 * - Confirmation de mot de passe
 * - Validation d'email de confirmation
 * - Vérification de champs dupliqués
 * 
 * @author Entrix Development Team
 * @version 1.0.0
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Décorateur de validation pour vérifier qu'un champ correspond à un autre
 * 
 * @param property - Nom du champ à comparer
 * @param validationOptions - Options de validation
 * @returns Décorateur de propriété
 * 
 * @example
 * ```typescript
 * class RegisterDto {
 *   @IsString()
 *   password: string;
 * 
 *   @Match('password', { message: 'Les mots de passe ne correspondent pas' })
 *   passwordConfirm: string;
 * }
 * ```
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'match',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}