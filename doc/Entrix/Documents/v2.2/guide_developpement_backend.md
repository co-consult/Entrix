# Guide Développement Backend - Entrix V3.0
## NestJS + TypeScript + Prisma + Redis

---

## 📋 Vue d'ensemble

Ce guide définit les **standards de développement**, **patterns architecturaux** et **pratiques de qualité** pour le backend Entrix V3.0. Il assure la **cohérence**, **maintenabilité** et **scalabilité** du code avec une approche **enterprise-grade**.

### **Stack technique**
- **Runtime** : Node.js 20+ LTS
- **Framework** : NestJS 10+ (Express)
- **Langage** : TypeScript 5+
- **ORM** : Prisma 5+
- **Base de données** : PostgreSQL 15+
- **Cache** : Redis 7+
- **Testing** : Jest + Supertest
- **Documentation** : Swagger/OpenAPI

---

## 🏗️ Architecture & Structure

### **Structure projet NestJS**

```
src/
├── modules/                    # Modules métier
│   ├── auth/                  # Authentification
│   │   ├── controllers/       # Controllers REST
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Data access layer
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── entities/         # Entity types
│   │   ├── guards/           # Auth guards
│   │   ├── decorators/       # Custom decorators
│   │   ├── interfaces/       # TypeScript interfaces
│   │   ├── tests/            # Tests unitaires
│   │   └── auth.module.ts    # Module definition
│   │
│   ├── users/                # Gestion utilisateurs
│   ├── permissions/          # Droits et permissions
│   ├── events/               # Gestion événements
│   ├── tickets/              # Billetterie
│   ├── orders/               # Commandes
│   ├── venues/               # Gestion lieux
│   ├── subscriptions/        # Abonnements
│   └── notifications/        # Notifications
│
├── shared/                    # Services partagés (grade A+)
│   ├── prisma/               # PrismaService avec retry et métriques
│   ├── redis/                # RedisService avec cache et verrous
│   ├── bullmq/               # BullmqService pour queues
│   ├── email/                # EmailService avec templates
│   ├── logger/               # LoggerService structuré
│   ├── rate-limiting/        # RateLimitingService et guards
│   ├── swagger/              # SwaggerService documentation
│   ├── config/               # Configuration services
│   ├── constants/            # Constantes globales
│   ├── decorators/           # Decorators réutilisables
│   ├── dto/                  # DTOs communs
│   ├── enums/                # Enums TypeScript
│   ├── exceptions/           # Exceptions personnalisées
│   ├── filters/              # Exception filters
│   ├── guards/               # Guards réutilisables
│   ├── interceptors/         # Request/Response interceptors
│   ├── interfaces/           # Interfaces communes
│   ├── middleware/           # Express middleware
│   ├── pipes/                # Validation pipes
│   ├── types/                # Types TypeScript
│   ├── utils/                # Utilitaires
│   ├── validators/           # Custom validators
│   └── shared.module.ts      # Module shared principal
│
├── database/                  # Database related
│   ├── migrations/           # Prisma migrations
│   ├── seeds/                # Data seeding
│   └── schema.prisma         # Prisma schema
│
├── tests/                     # Tests integration
│   ├── e2e/                  # Tests end-to-end
│   ├── fixtures/             # Test data
│   ├── helpers/              # Test utilities
│   └── setup/                # Test configuration
│
├── docs/                      # Documentation
├── scripts/                   # Build/deploy scripts
├── app.module.ts             # Root module
├── main.ts                   # Application entry point
└── bootstrap.ts              # App initialization
```

### **Architecture en couches**

```mermaid
graph TD
    A[Controllers] --> B[Services]
    B --> C[Repositories]
    C --> D[Prisma ORM]
    D --> E[PostgreSQL]
    
    B --> F[External APIs]
    B --> G[Redis Cache]
    B --> H[Message Queue]
    
    I[Guards] --> A
    J[Interceptors] --> A
    K[Pipes] --> A
    L[Filters] --> A
```

---

## 📝 Coding Standards

### **TypeScript Standards**

#### **Naming Conventions**
```typescript
// ✅ CORRECT
class UserService {}                    // PascalCase classes
interface CreateUserRequest {}         // PascalCase interfaces
type UserRole = 'ADMIN' | 'USER';      // PascalCase types
enum OrderStatus {}                    // PascalCase enums

const USER_ROLES = {...};              // UPPER_SNAKE_CASE constants
const maxRetryAttempts = 3;            // camelCase variables
function calculateTotal() {}           // camelCase functions
private readonly dbConnection;         // camelCase properties

// ❌ INCORRECT
class userService {}                   // Wrong case
interface createUserRequest {}        // Wrong case
const UserRoles = {...};              // Should be constant
function CalculateTotal() {}          // Wrong case
```

#### **File Naming**
```bash
# Controllers
user.controller.ts
auth.controller.ts

# Services  
user.service.ts
email.service.ts

# DTOs
create-user.dto.ts
update-profile.dto.ts

# Entities/Interfaces
user.entity.ts
order.interface.ts

# Tests
user.service.spec.ts
auth.controller.e2e-spec.ts

# Modules
user.module.ts
auth.module.ts
```

#### **Import Organization**
```typescript
// 1. Node modules
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

// 2. Shared services (chemins relatifs depuis src)
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { EmailService } from '../../shared/email/email.service';

// 3. Autres modules métier (chemins relatifs)
import { UserRepository } from '../users/repositories/user.repository';
import { PermissionService } from '../permissions/services/permission.service';

// 4. Module courant (relatif)
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';

// 5. Types (groupées à la fin)
import type { PaginationOptions } from '../../shared/types/pagination.types';
import type { ServiceResponse } from '../../shared/interfaces/service-response.interface';
```

### **Code Formatting (Prettier + ESLint)**

`.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

`.eslintrc.js`
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@nestjs/eslint-config',
    '@nestjs/eslint-config-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
  },
};
```

---

## 🏛️ Patterns & Architecture

### **Module Pattern**

#### **Standard Module Structure**
```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule], // Importe tous les services partagés (Prisma, Redis, etc.)
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService], // Expose pour autres modules
})
export class UserModule {}
```

### **Repository Pattern**

#### **Base Repository**
```typescript
// shared/repositories/base.repository.ts
import { Injectable } from '@nestjs/common';
import { 
  ConflictException, 
  NotFoundException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from '../logger/logger.service';

export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected logger: LoggerService;

  constructor(
    protected readonly prisma: PrismaService,
    loggerService: LoggerService,
    contextName: string
  ) {
    this.logger = loggerService.createChildLogger(contextName);
  }

  abstract create(data: CreateDto): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: UpdateDto): Promise<T>;
  abstract delete(id: string): Promise<void>;
  
  protected handlePrismaError(error: any): never {
    this.logger.logErrorEvent(error, 'BaseRepository');
    
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException('Duplicate entry');
        case 'P2025':
          throw new NotFoundException('Record not found');
        default:
          throw new InternalServerErrorException(`Database error: ${error.code}`);
      }
    }
    throw new InternalServerErrorException('Database operation failed');
  }
}
```

#### **Specific Repository**
```typescript
// modules/users/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { BaseRepository } from '../../../shared/repositories/base.repository';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RedisService } from '../../../shared/redis/redis.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepository extends BaseRepository<User, CreateUserDto, UpdateUserDto> {
  
  constructor(
    prisma: PrismaService,
    private readonly redisService: RedisService,
    loggerService: LoggerService
  ) {
    super(prisma, loggerService, 'UserRepository');
  }

  async create(data: CreateUserDto): Promise<User> {
    try {
      const user = await this.prisma.executeWithRetry(
        () => this.prisma.user.create({
          data: {
            ...data,
            password: await this.hashPassword(data.password),
          },
          include: {
            profile: true,
            roles: true,
          },
        }),
        3, // 3 tentatives
        1000 // 1 seconde de délai
      );
      
      this.logger.logBusinessEvent('USER_CREATED', {
        userId: user.id,
        email: user.email
      });
      
      return user;
    } catch (error) {
      this.logger.logErrorEvent(error, 'UserRepository.create');
      this.handlePrismaError(error);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email}`;
    
    // Vérifier cache Redis
    const cached = await this.redisService.getCache<User>(cacheKey);
    if (cached) {
      this.logger.logCacheEvent('hit', cacheKey);
      return cached;
    }

    this.logger.logCacheEvent('miss', cacheKey);

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        roles: true,
      },
    });

    // Mettre en cache pour 5 minutes
    if (user) {
      await this.redisService.setCache(cacheKey, user, 300);
      this.logger.logCacheEvent('set', cacheKey, 300);
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
}
```

### **Service Pattern**

#### **Business Logic Service**
```typescript
// modules/users/services/user.service.ts
import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from '../../../shared/email/email.service';
import { LoggerService } from '../../../shared/logger/logger.service';
import { BullmqService } from '../../../shared/bullmq/bullmq.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { ServiceResponse } from '../../../shared/interfaces/service-response.interface';

@Injectable()
export class UserService {
  private readonly logger: LoggerService;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly bullmqService: BullmqService,
    loggerService: LoggerService
  ) {
    this.logger = loggerService.createChildLogger('UserService');
  }

  async createUser(createUserDto: CreateUserDto): Promise<ServiceResponse<User>> {
    const operationId = this.logger.startOperation('create_user', { 
      email: createUserDto.email 
    });
    
    try {
      // Validation business rules
      await this.validateUserCreation(createUserDto);

      // Création utilisateur avec transaction
      const user = await this.userRepository.create(createUserDto);

      // Post-processing asynchrone
      await this.handleUserCreated(user);

      this.logger.endOperation('create_user', operationId, true);
      
      return {
        success: true,
        data: user,
        message: 'User created successfully',
      };
    } catch (error) {
      this.logger.logErrorEvent(error, 'UserService.createUser');
      this.logger.endOperation('create_user', operationId, false);
      
      if (error instanceof ConflictException) {
        return {
          success: false,
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Email already registered',
          },
        };
      }

      throw error;
    }
  }

  private async validateUserCreation(dto: CreateUserDto): Promise<void> {
    // Vérifier email unique
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validation mot de passe
    if (!this.isPasswordStrong(dto.password)) {
      throw new BadRequestException('Password too weak');
    }
  }

  private async handleUserCreated(user: User): Promise<void> {
    // Email de bienvenue via queue
    await this.bullmqService.sendWelcomeEmail(
      user.id,
      user.email,
      user.firstName
    );

    // Log événement business
    this.logger.logBusinessEvent('USER_REGISTERED', {
      userId: user.id,
      email: user.email,
      source: 'direct_registration',
      hasProfile: !!user.profile
    }, user.id);
  }

  private isPasswordStrong(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }
}
```

### **Controller Pattern**

#### **RESTful Controller**
```typescript
// modules/users/controllers/user.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  ParseUUIDPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UserService } from '../services/user.service';
import { RateLimitingGuard, RateLimit } from '../../../shared/rate-limiting/rate-limiting.guard';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { GetCurrentUser } from '../../../shared/decorators/get-current-user.decorator';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { StandardResponse } from '../../../shared/dto/standard-response.dto';

@Controller('users')
@ApiTags('Users')
@UseGuards(JwtAuthGuard, RateLimitingGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @RateLimit({
    limit: 5,
    windowMs: 300000, // 5 minutes
    algorithm: 'sliding_window'
  })
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<StandardResponse<User>> {
    const result = await this.userService.createUser(createUserDto);
    
    if (!result.success) {
      throw new ConflictException(result.error.message);
    }

    return {
      success: true,
      data: result.data,
      message: result.message,
      meta: {
        timestamp: new Date().toISOString(),
        version: '3.0',
      }
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'User ID' })
  @RateLimit({
    limit: 100,
    windowMs: 60000, // 1 minute
    algorithm: 'token_bucket'
  })
  async getUserById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StandardResponse<User>> {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'User ID' })
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetCurrentUser() currentUser: User,
  ): Promise<StandardResponse<User>> {
    const result = await this.userService.updateUser(id, updateUserDto, currentUser);
    
    return {
      success: true,
      data: result.data,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }
}
```

### **DTO Pattern & Validation**

#### **Request DTOs**
```typescript
// modules/users/dto/create-user.dto.ts
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    minLength: 8,
    example: 'StrongPass123!',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Ahmed',
  })
  @IsString()
  @MinLength(2, { message: 'First name too short' })
  @MaxLength(50, { message: 'First name too long' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Invalid characters in first name' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Ben Salah',
  })
  @IsString()
  @MinLength(2, { message: 'Last name too short' })
  @MaxLength(50, { message: 'Last name too long' })
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, { message: 'Invalid characters in last name' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+21697123456',
  })
  @IsOptional()
  @IsPhoneNumber('TN', { message: 'Invalid Tunisian phone number' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format' })
  @IsDateBefore(new Date(), { message: 'Birth date must be in the past' })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'Accept marketing communications',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  marketingConsent?: boolean = false;
}
```

#### **Response DTOs**
```typescript
// shared/dto/standard-response.dto.ts
export class StandardResponse<T> {
  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };

  @ApiPropertyOptional()
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### **Custom Validators**
```typescript
// shared/validators/is-date-before.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsDateBefore(
  date: Date,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateBefore',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [date],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedDate] = args.constraints;
          return new Date(value) < relatedDate;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be before ${args.constraints[0]}`;
        },
      },
    });
  };
}
```

---

## 🧪 Testing Standards

### **Testing Structure**
```
tests/
├── unit/                     # Tests unitaires
│   ├── services/
│   ├── repositories/
│   └── utils/
├── integration/              # Tests d'intégration
│   ├── modules/
│   └── api/
├── e2e/                      # Tests end-to-end
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   └── orders.e2e-spec.ts
├── fixtures/                 # Test data
└── helpers/                  # Test utilities
```

### **Unit Tests**

#### **Service Unit Test**
```typescript
// modules/users/tests/user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;
  let emailService: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<UserRepository>(UserRepository);
    emailService = module.get<EmailService>(EmailService);
  });

  describe('createUser', () => {
    const mockCreateUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    const mockUser: User = {
      id: 'uuid',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
    } as User;

    it('should create user successfully', async () => {
      // Arrange
      jest.spyOn(repository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(repository, 'create').mockResolvedValue(mockUser);
      jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);

      // Act
      const result = await service.createUser(mockCreateUserDto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalledWith(mockCreateUserDto);
      expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(mockUser);
    });

    it('should throw ConflictException when email exists', async () => {
      // Arrange
      jest.spyOn(repository, 'findByEmail').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.createUser(mockCreateUserDto))
        .rejects.toThrow(ConflictException);
      
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle weak password', async () => {
      // Arrange
      const weakPasswordDto = { ...mockCreateUserDto, password: '123' };
      jest.spyOn(repository, 'findByEmail').mockResolvedValue(null);

      // Act & Assert
      await expect(service.createUser(weakPasswordDto))
        .rejects.toThrow(BadRequestException);
    });
  });
});
```

### **Integration Tests**

#### **Controller Integration Test**
```typescript
// modules/users/tests/user.controller.integration.spec.ts
describe('UserController (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        UserModule,
        PrismaModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    // Apply global configurations
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    
    await app.init();
  });

  afterEach(async () => {
    // Cleanup database
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /users', () => {
    const validUserDto = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should create user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(validUserDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUserDto.email);
      expect(response.body.data.password).toBeUndefined(); // Password not returned

      // Verify in database
      const dbUser = await prisma.user.findUnique({
        where: { email: validUserDto.email },
      });
      expect(dbUser).toBeTruthy();
    });

    it('should return validation errors for invalid data', async () => {
      const invalidDto = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(invalidDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
      expect(response.body.error.details).toHaveLength(3);
    });
  });
});
```

### **E2E Tests**

#### **Complete Workflow Test**
```typescript
// tests/e2e/user-registration-flow.e2e-spec.ts
describe('User Registration Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  it('should complete full user registration and login flow', async () => {
    const userDto = {
      email: 'integration@test.com',
      password: 'SecurePass123!',
      firstName: 'Integration',
      lastName: 'Test',
    };

    // 1. Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userDto)
      .expect(201);

    expect(registerResponse.body.success).toBe(true);
    const userId = registerResponse.body.data.user.id;

    // 2. Verify email (simulate)
    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });

    // 3. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userDto.email,
        password: userDto.password,
      })
      .expect(200);

    expect(loginResponse.body.data.tokens.accessToken).toBeTruthy();
    const accessToken = loginResponse.body.data.tokens.accessToken;

    // 4. Access protected route
    const profileResponse = await request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(profileResponse.body.data.user.email).toBe(userDto.email);

    // 5. Update profile
    const updateResponse = await request(app.getHttpServer())
      .put('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        firstName: 'Updated',
        bio: 'Test biography',
      })
      .expect(200);

    expect(updateResponse.body.data.user.firstName).toBe('Updated');
  });
});
```

### **Test Configuration**

#### **Jest Configuration (basé sur package.json réel)**
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts

---

## 🚀 Services Partagés Entrix (Grade A+)

### **PrismaService - ORM avec retry et métriques**

#### **Utilisation de base**
```typescript
// Service utilisant PrismaService
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Pagination automatique
  async getOrders(page: number = 1, limit: number = 20) {
    return this.prisma.paginate(
      this.prisma.order,
      {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { tickets: true }
      },
      page,
      limit
    );
  }

  // Transaction avec retry automatique
  async createOrderWithTickets(orderData: any, ticketsData: any[]) {
    return this.prisma.transactionWithRetry(async (tx) => {
      const order = await tx.order.create({
        data: orderData
      });
      
      const tickets = await Promise.all(
        ticketsData.map(ticketData => 
          tx.ticket.create({
            data: { ...ticketData, orderId: order.id }
          })
        )
      );
      
      return { order, tickets };
    });
  }

  // Opération avec retry
  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.executeWithRetry(
      () => this.prisma.order.update({
        where: { id: orderId },
        data: { status }
      }),
      3, // 3 tentatives
      1000 // 1 seconde de délai
    );
  }

  // Health check
  async checkDatabaseHealth() {
    return this.prisma.healthCheck();
  }
}
```

### **RedisService - Cache distribué avec verrous**

#### **Cache et sessions**
```typescript
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  // Cache avec objets
  async cacheUserProfile(userId: string, profile: any) {
    await this.redis.setCache(`user:profile:${userId}`, profile, 3600);
  }

  async getUserProfile(userId: string) {
    return this.redis.getCache<any>(`user:profile:${userId}`);
  }

  // Verrous distribués
  async processPaymentWithLock(orderId: string) {
    return this.redis.withLock(`payment:${orderId}`, async () => {
      // Traitement critique du paiement
      return await this.processPayment(orderId);
    }, 30); // 30 secondes timeout
  }

  // Sessions utilisateur
  async createUserSession(sessionId: string, userData: any) {
    await this.redis.setSession(sessionId, userData, 86400); // 24h
  }

  // Compteurs avec TTL
  async incrementDownloadCounter(userId: string) {
    const key = `downloads:${userId}:${new Date().getDate()}`;
    return this.redis.increment(key, 86400); // Reset chaque jour
  }
}
```

### **BullmqService - Files d'attente avec priorités**

#### **Jobs et notifications**
```typescript
import { BullmqService, JOB_TYPES, JOB_PRIORITIES } from '../../shared/bullmq/bullmq.service';

@Injectable()
export class NotificationService {
  constructor(private readonly bullmq: BullmqService) {}

  // Emails de bienvenue
  async sendWelcomeEmail(userId: string, email: string, firstName: string) {
    await this.bullmq.sendWelcomeEmail(userId, email, firstName);
  }

  // Emails transactionnels
  async sendOrderConfirmation(orderId: string, userEmail: string, orderData: any) {
    await this.bullmq.addEmailJob(
      JOB_TYPES.EMAIL.ORDER_CONFIRMATION,
      {
        to: userEmail,
        orderId,
        orderData
      },
      {
        priority: JOB_PRIORITIES.HIGH,
        delay: 0
      }
    );
  }

  // Notifications push
  async sendEventReminder(userId: string, eventId: string, reminderTime: Date) {
    await this.bullmq.addNotificationJob(
      JOB_TYPES.NOTIFICATION.EVENT_REMINDER,
      {
        userId,
        eventId,
        type: 'push'
      },
      {
        priority: JOB_PRIORITIES.MEDIUM,
        delay: reminderTime.getTime() - Date.now()
      }
    );
  }

  // Traitement en batch
  async processTicketGeneration(eventId: string, ticketCount: number) {
    await this.bullmq.addProcessingJob(
      JOB_TYPES.PROCESSING.GENERATE_TICKETS,
      {
        eventId,
        ticketCount
      },
      {
        priority: JOB_PRIORITIES.LOW,
        attempts: 3
      }
    );
  }

  // Monitoring des queues
  async getQueueStats() {
    return {
      email: await this.bullmq.getQueueStats('email'),
      notification: await this.bullmq.getQueueStats('notification'),
      processing: await this.bullmq.getQueueStats('processing')
    };
  }
}
```

### **LoggerService - Logging structuré business**

#### **Logging business et technique**
```typescript
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class OrderService {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createChildLogger('OrderService');
  }

  async processOrder(orderData: any) {
    const operationId = this.logger.startOperation('process_order', {
      orderId: orderData.id,
      amount: orderData.total
    });

    try {
      // Traitement commande
      const result = await this.handleOrderProcessing(orderData);

      // Log événement business
      this.logger.logBusinessEvent('ORDER_PROCESSED', {
        orderId: result.id,
        amount: result.total,
        currency: result.currency,
        paymentMethod: result.paymentMethod,
        itemsCount: result.items.length
      }, result.userId, result.organizerId);

      this.logger.endOperation('process_order', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OrderService.processOrder', orderData.userId);
      this.logger.endOperation('process_order', operationId, false);
      throw error;
    }
  }

  async logSecurityEvent(userId: string, action: string, ip: string) {
    this.logger.logSecurityEvent(
      'SUSPICIOUS_ORDER_ACTIVITY',
      userId,
      ip,
      'Mozilla/5.0...',
      {
        action,
        attemptCount: 5,
        blocked: true
      }
    );
  }
}
```

### **EmailService - Templates et envois**

#### **Emails avec templates**
```typescript
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class UserEmailService {
  constructor(private readonly email: EmailService) {}

  async sendWelcomeEmail(user: any) {
    await this.email.sendTemplateEmail(
      user.email,
      'welcome',
      {
        firstName: user.firstName,
        loginUrl: 'https://app.entrix.tn/login'
      }
    );
  }

  async sendOrderConfirmation(order: any) {
    await this.email.sendTemplateEmail(
      order.userEmail,
      'order_confirmation',
      {
        orderNumber: order.number,
        eventTitle: order.event.title,
        qrCodeUrl: order.tickets[0].qrCodeUrl,
        total: order.total
      }
    );
  }

  // Test connexion
  async testEmailConnection() {
    return this.email.testConnection();
  }

  // Métriques
  async getEmailMetrics() {
    return this.email.getMetrics();
  }
}
```

### **RateLimitingService - Protection API**

#### **Rate limiting avancé**
```typescript
import { RateLimitingGuard, RateLimit } from '../../shared/rate-limiting/rate-limiting.guard';

@Controller('orders')
@UseGuards(RateLimitingGuard)
export class OrderController {
  
  @Post()
  @RateLimit({
    limit: 10,
    windowMs: 300000, // 5 minutes
    algorithm: 'sliding_window',
    skipSuccessfulRequests: false
  })
  async createOrder(@Body() orderData: any) {
    return this.orderService.createOrder(orderData);
  }

  @Get()
  @RateLimit({
    limit: 100,
    windowMs: 60000, // 1 minute
    algorithm: 'token_bucket'
  })
  async getOrders() {
    return this.orderService.getOrders();
  }
}
```

---

## 🔧 Utilities & Helpers

### **Database Utilities (utilisant PrismaService)**
```typescript
// shared/utils/database.utils.ts
import { PrismaService } from '../prisma/prisma.service';

export class DatabaseUtils {
  static buildPaginationQuery(options: PaginationOptions) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    return {
      skip,
      take: limit,
    };
  }

  static buildSortQuery(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'ASC') {
    if (!sortBy) return {};
    
    return {
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
    };
  }

  // Utilise la méthode transactionWithRetry du PrismaService
  static async withTransaction<T>(
    prisma: PrismaService,
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return prisma.transactionWithRetry(fn);
  }
}
```

### **Response Utilities**
```typescript
// shared/utils/response.utils.ts
export class ResponseUtils {
  static success<T>(
    data: T,
    message?: string,
    meta?: any,
  ): StandardResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
  ): StandardResponse<null> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): StandardResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

---

## 📋 Best Practices

### **Sécurité**
1. **Validation stricte** : Toujours valider inputs côté serveur
2. **Sanitization** : Nettoyer données utilisateur
3. **Rate limiting** : Implémenter throttling sur APIs
4. **Headers sécurité** : Helmet, CORS, CSP
5. **Secrets management** : Variables environnement sécurisées

### **Performance**
1. **Database indexes** : Optimiser requêtes fréquentes
2. **Caching strategy** : Redis pour données fréquentes
3. **Lazy loading** : Relations Prisma selon besoin
4. **Connection pooling** : Pool connexions DB
5. **Pagination** : Toujours paginer grandes collections

### **Monitoring**
1. **Logging structuré** : Winston avec formats JSON
2. **Métriques business** : Prometheus/Grafana
3. **Health checks** : Endpoints santé système
4. **Error tracking** : Sentry pour erreurs production
5. **APM** : Monitoring performance applications

### **Documentation**
1. **Swagger/OpenAPI** : Documentation API automatique
2. **README détaillé** : Setup et configuration
3. **Architecture Decision Records** : Justifications techniques
4. **Code comments** : Logique complexe expliquée
5. **Changelog** : Historique modifications

---

## ⚙️ Configuration Environnement

### **Variables d'environnement (basées sur shared-usage-guide.md)**

#### **.env Configuration**
```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/entrix_db"
PRISMA_LOG_LEVEL=info

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false

# Email
EMAIL_FROM=noreply@entrix.tn
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
EMAIL_PROVIDER=smtp
EMAIL_TEMPLATES_PATH=./templates/emails

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_ENABLE_CONSOLE=true
LOG_ENABLE_FILE=true
LOG_FILE_PATH=./logs/entrix-%DATE%.log

# BullMQ
BULLMQ_PREFIX=bullmq
BULLMQ_CONCURRENCY=5

# JWT & Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=Entrix API
SWAGGER_VERSION=3.0
SWAGGER_PATH=api/docs

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v3
```

### **Configuration des services partagés**

#### **Intégration SharedModule**
```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule, // Fournit tous les services grade A+ 
    UserModule,
    AuthModule,
    // ... autres modules métier
  ],
})
export class AppModule {}
```

#### **Bootstrap avec services partagés**
```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SwaggerService } from './shared/swagger/swagger.service';
import { LoggerService } from './shared/logger/logger.service';
import * as compression from 'compression';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const swaggerService = app.get(SwaggerService);
  
  // Configuration globale
  app.useLogger(loggerService);
  app.use(helmet());
  app.use(compression());
  
  // API Prefix
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v3'));
  
  // Validation globale
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger documentation
  if (configService.get('SWAGGER_ENABLED', true)) {
    swaggerService.setup(app);
  }

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  
  loggerService.log(`🚀 Entrix API running on port ${port}`);
}

bootstrap();
```

### **Monitoring et Health Checks**

#### **Controller de monitoring**
```typescript
// shared/controllers/monitoring.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { BullmqService } from '../bullmq/bullmq.service';
import { EmailService } from '../email/email.service';

@Controller('monitoring')
@ApiTags('Monitoring')
export class MonitoringController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly bullmq: BullmqService,
    private readonly email: EmailService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check all services' })
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: await this.prisma.healthCheck(),
        redis: await this.redis.ping() === 'PONG',
        email: await this.email.testConnection(),
        queues: await this.bullmq.getQueueStats('email'),
      },
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get service metrics' })
  async getMetrics() {
    return {
      timestamp: new Date().toISOString(),
      prisma: this.prisma.getMetrics(),
      redis: this.redis.getMetrics(),
      bullmq: this.bullmq.getMetrics(),
      email: this.email.getMetrics(),
    };
  }
}
```,
  transform: {
    '^.+\\.(t|j)s

---

## 🚀 Services Partagés Entrix (Grade A+)

### **PrismaService - ORM avec retry et métriques**

#### **Utilisation de base**
```typescript
// Service utilisant PrismaService
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Pagination automatique
  async getOrders(page: number = 1, limit: number = 20) {
    return this.prisma.paginate(
      this.prisma.order,
      {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { tickets: true }
      },
      page,
      limit
    );
  }

  // Transaction avec retry automatique
  async createOrderWithTickets(orderData: any, ticketsData: any[]) {
    return this.prisma.transactionWithRetry(async (tx) => {
      const order = await tx.order.create({
        data: orderData
      });
      
      const tickets = await Promise.all(
        ticketsData.map(ticketData => 
          tx.ticket.create({
            data: { ...ticketData, orderId: order.id }
          })
        )
      );
      
      return { order, tickets };
    });
  }

  // Opération avec retry
  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.executeWithRetry(
      () => this.prisma.order.update({
        where: { id: orderId },
        data: { status }
      }),
      3, // 3 tentatives
      1000 // 1 seconde de délai
    );
  }

  // Health check
  async checkDatabaseHealth() {
    return this.prisma.healthCheck();
  }
}
```

### **RedisService - Cache distribué avec verrous**

#### **Cache et sessions**
```typescript
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  // Cache avec objets
  async cacheUserProfile(userId: string, profile: any) {
    await this.redis.setCache(`user:profile:${userId}`, profile, 3600);
  }

  async getUserProfile(userId: string) {
    return this.redis.getCache<any>(`user:profile:${userId}`);
  }

  // Verrous distribués
  async processPaymentWithLock(orderId: string) {
    return this.redis.withLock(`payment:${orderId}`, async () => {
      // Traitement critique du paiement
      return await this.processPayment(orderId);
    }, 30); // 30 secondes timeout
  }

  // Sessions utilisateur
  async createUserSession(sessionId: string, userData: any) {
    await this.redis.setSession(sessionId, userData, 86400); // 24h
  }

  // Compteurs avec TTL
  async incrementDownloadCounter(userId: string) {
    const key = `downloads:${userId}:${new Date().getDate()}`;
    return this.redis.increment(key, 86400); // Reset chaque jour
  }
}
```

### **BullmqService - Files d'attente avec priorités**

#### **Jobs et notifications**
```typescript
import { BullmqService, JOB_TYPES, JOB_PRIORITIES } from '../../shared/bullmq/bullmq.service';

@Injectable()
export class NotificationService {
  constructor(private readonly bullmq: BullmqService) {}

  // Emails de bienvenue
  async sendWelcomeEmail(userId: string, email: string, firstName: string) {
    await this.bullmq.sendWelcomeEmail(userId, email, firstName);
  }

  // Emails transactionnels
  async sendOrderConfirmation(orderId: string, userEmail: string, orderData: any) {
    await this.bullmq.addEmailJob(
      JOB_TYPES.EMAIL.ORDER_CONFIRMATION,
      {
        to: userEmail,
        orderId,
        orderData
      },
      {
        priority: JOB_PRIORITIES.HIGH,
        delay: 0
      }
    );
  }

  // Notifications push
  async sendEventReminder(userId: string, eventId: string, reminderTime: Date) {
    await this.bullmq.addNotificationJob(
      JOB_TYPES.NOTIFICATION.EVENT_REMINDER,
      {
        userId,
        eventId,
        type: 'push'
      },
      {
        priority: JOB_PRIORITIES.MEDIUM,
        delay: reminderTime.getTime() - Date.now()
      }
    );
  }

  // Traitement en batch
  async processTicketGeneration(eventId: string, ticketCount: number) {
    await this.bullmq.addProcessingJob(
      JOB_TYPES.PROCESSING.GENERATE_TICKETS,
      {
        eventId,
        ticketCount
      },
      {
        priority: JOB_PRIORITIES.LOW,
        attempts: 3
      }
    );
  }

  // Monitoring des queues
  async getQueueStats() {
    return {
      email: await this.bullmq.getQueueStats('email'),
      notification: await this.bullmq.getQueueStats('notification'),
      processing: await this.bullmq.getQueueStats('processing')
    };
  }
}
```

### **LoggerService - Logging structuré business**

#### **Logging business et technique**
```typescript
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class OrderService {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createChildLogger('OrderService');
  }

  async processOrder(orderData: any) {
    const operationId = this.logger.startOperation('process_order', {
      orderId: orderData.id,
      amount: orderData.total
    });

    try {
      // Traitement commande
      const result = await this.handleOrderProcessing(orderData);

      // Log événement business
      this.logger.logBusinessEvent('ORDER_PROCESSED', {
        orderId: result.id,
        amount: result.total,
        currency: result.currency,
        paymentMethod: result.paymentMethod,
        itemsCount: result.items.length
      }, result.userId, result.organizerId);

      this.logger.endOperation('process_order', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OrderService.processOrder', orderData.userId);
      this.logger.endOperation('process_order', operationId, false);
      throw error;
    }
  }

  async logSecurityEvent(userId: string, action: string, ip: string) {
    this.logger.logSecurityEvent(
      'SUSPICIOUS_ORDER_ACTIVITY',
      userId,
      ip,
      'Mozilla/5.0...',
      {
        action,
        attemptCount: 5,
        blocked: true
      }
    );
  }
}
```

### **EmailService - Templates et envois**

#### **Emails avec templates**
```typescript
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class UserEmailService {
  constructor(private readonly email: EmailService) {}

  async sendWelcomeEmail(user: any) {
    await this.email.sendTemplateEmail(
      user.email,
      'welcome',
      {
        firstName: user.firstName,
        loginUrl: 'https://app.entrix.tn/login'
      }
    );
  }

  async sendOrderConfirmation(order: any) {
    await this.email.sendTemplateEmail(
      order.userEmail,
      'order_confirmation',
      {
        orderNumber: order.number,
        eventTitle: order.event.title,
        qrCodeUrl: order.tickets[0].qrCodeUrl,
        total: order.total
      }
    );
  }

  // Test connexion
  async testEmailConnection() {
    return this.email.testConnection();
  }

  // Métriques
  async getEmailMetrics() {
    return this.email.getMetrics();
  }
}
```

### **RateLimitingService - Protection API**

#### **Rate limiting avancé**
```typescript
import { RateLimitingGuard, RateLimit } from '../../shared/rate-limiting/rate-limiting.guard';

@Controller('orders')
@UseGuards(RateLimitingGuard)
export class OrderController {
  
  @Post()
  @RateLimit({
    limit: 10,
    windowMs: 300000, // 5 minutes
    algorithm: 'sliding_window',
    skipSuccessfulRequests: false
  })
  async createOrder(@Body() orderData: any) {
    return this.orderService.createOrder(orderData);
  }

  @Get()
  @RateLimit({
    limit: 100,
    windowMs: 60000, // 1 minute
    algorithm: 'token_bucket'
  })
  async getOrders() {
    return this.orderService.getOrders();
  }
}
```

---

## 🔧 Utilities & Helpers

### **Database Utilities (utilisant PrismaService)**
```typescript
// shared/utils/database.utils.ts
import { PrismaService } from '../prisma/prisma.service';

export class DatabaseUtils {
  static buildPaginationQuery(options: PaginationOptions) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    return {
      skip,
      take: limit,
    };
  }

  static buildSortQuery(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'ASC') {
    if (!sortBy) return {};
    
    return {
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
    };
  }

  // Utilise la méthode transactionWithRetry du PrismaService
  static async withTransaction<T>(
    prisma: PrismaService,
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return prisma.transactionWithRetry(fn);
  }
}
```

### **Response Utilities**
```typescript
// shared/utils/response.utils.ts
export class ResponseUtils {
  static success<T>(
    data: T,
    message?: string,
    meta?: any,
  ): StandardResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
  ): StandardResponse<null> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): StandardResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

---

## 📋 Best Practices

### **Sécurité**
1. **Validation stricte** : Toujours valider inputs côté serveur
2. **Sanitization** : Nettoyer données utilisateur
3. **Rate limiting** : Implémenter throttling sur APIs
4. **Headers sécurité** : Helmet, CORS, CSP
5. **Secrets management** : Variables environnement sécurisées

### **Performance**
1. **Database indexes** : Optimiser requêtes fréquentes
2. **Caching strategy** : Redis pour données fréquentes
3. **Lazy loading** : Relations Prisma selon besoin
4. **Connection pooling** : Pool connexions DB
5. **Pagination** : Toujours paginer grandes collections

### **Monitoring**
1. **Logging structuré** : Winston avec formats JSON
2. **Métriques business** : Prometheus/Grafana
3. **Health checks** : Endpoints santé système
4. **Error tracking** : Sentry pour erreurs production
5. **APM** : Monitoring performance applications

---

## 📋 Best Practices Entrix

### **Sécurité**
1. **Validation stricte** : class-validator sur tous les DTOs
2. **Rate limiting** : RateLimitingService sur endpoints critiques
3. **Logging sécurité** : LoggerService pour événements suspects
4. **Headers sécurité** : Helmet middleware activé
5. **Secrets management** : Variables environnement sécurisées

### **Performance**
1. **Database optimization** : Utiliser PrismaService avec retry
2. **Caching strategy** : RedisService pour données fréquentes  
3. **Queue processing** : BullmqService pour tâches lourdes
4. **Connection pooling** : Configuration Prisma optimisée
5. **Pagination** : Utiliser méthodes paginate() du PrismaService

### **Monitoring**
1. **Logging structuré** : LoggerService avec événements business
2. **Métriques services** : Endpoints /monitoring/metrics
3. **Health checks** : /monitoring/health complet
4. **Error tracking** : LoggerService.logErrorEvent()
5. **Performance** : Opérations avec startOperation/endOperation

### **Qualité Code**
1. **Types stricts** : TypeScript strict mode
2. **ESLint + Prettier** : Formatage automatique
3. **Tests unitaires** : >80% couverture code
4. **Tests e2e** : Workflows complets
5. **Documentation** : Swagger automatique

---

## 🎯 Conclusion

Ce guide de développement backend Entrix V3.0 vous fournit :

- **Architecture robuste** avec services partagés grade A+
- **Standards professionnels** enterprise-grade
- **Services optimisés** : Prisma, Redis, BullMQ, Email, Logger
- **Patterns éprouvés** : Repository, Service, Controller
- **Tests complets** : Unit, Integration, E2E
- **Monitoring avancé** : Métriques et health checks
- **Sécurité renforcée** : Rate limiting et audit

### **Prochaines étapes**
1. Cloner la structure de projet
2. Configurer les variables d'environnement  
3. Installer les dépendances (package.json fourni)
4. Intégrer SharedModule dans AppModule
5. Développer modules métier selon patterns
6. Implémenter tests selon stratégies
7. Déployer avec monitoring complet

**Happy coding! 🚀**: 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../tests/setup/jest.setup.ts'],
  moduleNameMapping: {
    // Pas d'alias, utilisation chemins relatifs
    '^src/(.*)

---

## 🚀 Services Partagés Entrix (Grade A+)

### **PrismaService - ORM avec retry et métriques**

#### **Utilisation de base**
```typescript
// Service utilisant PrismaService
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Pagination automatique
  async getOrders(page: number = 1, limit: number = 20) {
    return this.prisma.paginate(
      this.prisma.order,
      {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { tickets: true }
      },
      page,
      limit
    );
  }

  // Transaction avec retry automatique
  async createOrderWithTickets(orderData: any, ticketsData: any[]) {
    return this.prisma.transactionWithRetry(async (tx) => {
      const order = await tx.order.create({
        data: orderData
      });
      
      const tickets = await Promise.all(
        ticketsData.map(ticketData => 
          tx.ticket.create({
            data: { ...ticketData, orderId: order.id }
          })
        )
      );
      
      return { order, tickets };
    });
  }

  // Opération avec retry
  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.executeWithRetry(
      () => this.prisma.order.update({
        where: { id: orderId },
        data: { status }
      }),
      3, // 3 tentatives
      1000 // 1 seconde de délai
    );
  }

  // Health check
  async checkDatabaseHealth() {
    return this.prisma.healthCheck();
  }
}
```

### **RedisService - Cache distribué avec verrous**

#### **Cache et sessions**
```typescript
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  // Cache avec objets
  async cacheUserProfile(userId: string, profile: any) {
    await this.redis.setCache(`user:profile:${userId}`, profile, 3600);
  }

  async getUserProfile(userId: string) {
    return this.redis.getCache<any>(`user:profile:${userId}`);
  }

  // Verrous distribués
  async processPaymentWithLock(orderId: string) {
    return this.redis.withLock(`payment:${orderId}`, async () => {
      // Traitement critique du paiement
      return await this.processPayment(orderId);
    }, 30); // 30 secondes timeout
  }

  // Sessions utilisateur
  async createUserSession(sessionId: string, userData: any) {
    await this.redis.setSession(sessionId, userData, 86400); // 24h
  }

  // Compteurs avec TTL
  async incrementDownloadCounter(userId: string) {
    const key = `downloads:${userId}:${new Date().getDate()}`;
    return this.redis.increment(key, 86400); // Reset chaque jour
  }
}
```

### **BullmqService - Files d'attente avec priorités**

#### **Jobs et notifications**
```typescript
import { BullmqService, JOB_TYPES, JOB_PRIORITIES } from '../../shared/bullmq/bullmq.service';

@Injectable()
export class NotificationService {
  constructor(private readonly bullmq: BullmqService) {}

  // Emails de bienvenue
  async sendWelcomeEmail(userId: string, email: string, firstName: string) {
    await this.bullmq.sendWelcomeEmail(userId, email, firstName);
  }

  // Emails transactionnels
  async sendOrderConfirmation(orderId: string, userEmail: string, orderData: any) {
    await this.bullmq.addEmailJob(
      JOB_TYPES.EMAIL.ORDER_CONFIRMATION,
      {
        to: userEmail,
        orderId,
        orderData
      },
      {
        priority: JOB_PRIORITIES.HIGH,
        delay: 0
      }
    );
  }

  // Notifications push
  async sendEventReminder(userId: string, eventId: string, reminderTime: Date) {
    await this.bullmq.addNotificationJob(
      JOB_TYPES.NOTIFICATION.EVENT_REMINDER,
      {
        userId,
        eventId,
        type: 'push'
      },
      {
        priority: JOB_PRIORITIES.MEDIUM,
        delay: reminderTime.getTime() - Date.now()
      }
    );
  }

  // Traitement en batch
  async processTicketGeneration(eventId: string, ticketCount: number) {
    await this.bullmq.addProcessingJob(
      JOB_TYPES.PROCESSING.GENERATE_TICKETS,
      {
        eventId,
        ticketCount
      },
      {
        priority: JOB_PRIORITIES.LOW,
        attempts: 3
      }
    );
  }

  // Monitoring des queues
  async getQueueStats() {
    return {
      email: await this.bullmq.getQueueStats('email'),
      notification: await this.bullmq.getQueueStats('notification'),
      processing: await this.bullmq.getQueueStats('processing')
    };
  }
}
```

### **LoggerService - Logging structuré business**

#### **Logging business et technique**
```typescript
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class OrderService {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createChildLogger('OrderService');
  }

  async processOrder(orderData: any) {
    const operationId = this.logger.startOperation('process_order', {
      orderId: orderData.id,
      amount: orderData.total
    });

    try {
      // Traitement commande
      const result = await this.handleOrderProcessing(orderData);

      // Log événement business
      this.logger.logBusinessEvent('ORDER_PROCESSED', {
        orderId: result.id,
        amount: result.total,
        currency: result.currency,
        paymentMethod: result.paymentMethod,
        itemsCount: result.items.length
      }, result.userId, result.organizerId);

      this.logger.endOperation('process_order', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OrderService.processOrder', orderData.userId);
      this.logger.endOperation('process_order', operationId, false);
      throw error;
    }
  }

  async logSecurityEvent(userId: string, action: string, ip: string) {
    this.logger.logSecurityEvent(
      'SUSPICIOUS_ORDER_ACTIVITY',
      userId,
      ip,
      'Mozilla/5.0...',
      {
        action,
        attemptCount: 5,
        blocked: true
      }
    );
  }
}
```

### **EmailService - Templates et envois**

#### **Emails avec templates**
```typescript
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class UserEmailService {
  constructor(private readonly email: EmailService) {}

  async sendWelcomeEmail(user: any) {
    await this.email.sendTemplateEmail(
      user.email,
      'welcome',
      {
        firstName: user.firstName,
        loginUrl: 'https://app.entrix.tn/login'
      }
    );
  }

  async sendOrderConfirmation(order: any) {
    await this.email.sendTemplateEmail(
      order.userEmail,
      'order_confirmation',
      {
        orderNumber: order.number,
        eventTitle: order.event.title,
        qrCodeUrl: order.tickets[0].qrCodeUrl,
        total: order.total
      }
    );
  }

  // Test connexion
  async testEmailConnection() {
    return this.email.testConnection();
  }

  // Métriques
  async getEmailMetrics() {
    return this.email.getMetrics();
  }
}
```

### **RateLimitingService - Protection API**

#### **Rate limiting avancé**
```typescript
import { RateLimitingGuard, RateLimit } from '../../shared/rate-limiting/rate-limiting.guard';

@Controller('orders')
@UseGuards(RateLimitingGuard)
export class OrderController {
  
  @Post()
  @RateLimit({
    limit: 10,
    windowMs: 300000, // 5 minutes
    algorithm: 'sliding_window',
    skipSuccessfulRequests: false
  })
  async createOrder(@Body() orderData: any) {
    return this.orderService.createOrder(orderData);
  }

  @Get()
  @RateLimit({
    limit: 100,
    windowMs: 60000, // 1 minute
    algorithm: 'token_bucket'
  })
  async getOrders() {
    return this.orderService.getOrders();
  }
}
```

---

## 🔧 Utilities & Helpers

### **Database Utilities (utilisant PrismaService)**
```typescript
// shared/utils/database.utils.ts
import { PrismaService } from '../prisma/prisma.service';

export class DatabaseUtils {
  static buildPaginationQuery(options: PaginationOptions) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    return {
      skip,
      take: limit,
    };
  }

  static buildSortQuery(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'ASC') {
    if (!sortBy) return {};
    
    return {
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
    };
  }

  // Utilise la méthode transactionWithRetry du PrismaService
  static async withTransaction<T>(
    prisma: PrismaService,
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return prisma.transactionWithRetry(fn);
  }
}
```

### **Response Utilities**
```typescript
// shared/utils/response.utils.ts
export class ResponseUtils {
  static success<T>(
    data: T,
    message?: string,
    meta?: any,
  ): StandardResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
  ): StandardResponse<null> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): StandardResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

---

## 📋 Best Practices

### **Sécurité**
1. **Validation stricte** : Toujours valider inputs côté serveur
2. **Sanitization** : Nettoyer données utilisateur
3. **Rate limiting** : Implémenter throttling sur APIs
4. **Headers sécurité** : Helmet, CORS, CSP
5. **Secrets management** : Variables environnement sécurisées

### **Performance**
1. **Database indexes** : Optimiser requêtes fréquentes
2. **Caching strategy** : Redis pour données fréquentes
3. **Lazy loading** : Relations Prisma selon besoin
4. **Connection pooling** : Pool connexions DB
5. **Pagination** : Toujours paginer grandes collections

### **Monitoring**
1. **Logging structuré** : Winston avec formats JSON
2. **Métriques business** : Prometheus/Grafana
3. **Health checks** : Endpoints santé système
4. **Error tracking** : Sentry pour erreurs production
5. **APM** : Monitoring performance applications

### **Documentation**
1. **Swagger/OpenAPI** : Documentation API automatique
2. **README détaillé** : Setup et configuration
3. **Architecture Decision Records** : Justifications techniques
4. **Code comments** : Logique complexe expliquée
5. **Changelog** : Historique modifications

Ce guide assure la qualité, maintenabilité et scalabilité du backend Entrix V3.0 avec des standards professionnels enterprise-grade.: '<rootDir>/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  // Ignorer les modules shared complexes en développement
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/shared/prisma/', // Tests spécialisés séparés
    '/shared/bullmq/',  // Tests spécialisés séparés
  ],
};
```

#### **Scripts disponibles (depuis package.json)**
```json
{
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch", 
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    
    // Scripts additionnels recommandés
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./tests/e2e/jest-e2e.json",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node database/seeds/index.ts"
  }
}
```

---

## 🚀 Services Partagés Entrix (Grade A+)

### **PrismaService - ORM avec retry et métriques**

#### **Utilisation de base**
```typescript
// Service utilisant PrismaService
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  // Pagination automatique
  async getOrders(page: number = 1, limit: number = 20) {
    return this.prisma.paginate(
      this.prisma.order,
      {
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: { tickets: true }
      },
      page,
      limit
    );
  }

  // Transaction avec retry automatique
  async createOrderWithTickets(orderData: any, ticketsData: any[]) {
    return this.prisma.transactionWithRetry(async (tx) => {
      const order = await tx.order.create({
        data: orderData
      });
      
      const tickets = await Promise.all(
        ticketsData.map(ticketData => 
          tx.ticket.create({
            data: { ...ticketData, orderId: order.id }
          })
        )
      );
      
      return { order, tickets };
    });
  }

  // Opération avec retry
  async updateOrderStatus(orderId: string, status: string) {
    return this.prisma.executeWithRetry(
      () => this.prisma.order.update({
        where: { id: orderId },
        data: { status }
      }),
      3, // 3 tentatives
      1000 // 1 seconde de délai
    );
  }

  // Health check
  async checkDatabaseHealth() {
    return this.prisma.healthCheck();
  }
}
```

### **RedisService - Cache distribué avec verrous**

#### **Cache et sessions**
```typescript
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  // Cache avec objets
  async cacheUserProfile(userId: string, profile: any) {
    await this.redis.setCache(`user:profile:${userId}`, profile, 3600);
  }

  async getUserProfile(userId: string) {
    return this.redis.getCache<any>(`user:profile:${userId}`);
  }

  // Verrous distribués
  async processPaymentWithLock(orderId: string) {
    return this.redis.withLock(`payment:${orderId}`, async () => {
      // Traitement critique du paiement
      return await this.processPayment(orderId);
    }, 30); // 30 secondes timeout
  }

  // Sessions utilisateur
  async createUserSession(sessionId: string, userData: any) {
    await this.redis.setSession(sessionId, userData, 86400); // 24h
  }

  // Compteurs avec TTL
  async incrementDownloadCounter(userId: string) {
    const key = `downloads:${userId}:${new Date().getDate()}`;
    return this.redis.increment(key, 86400); // Reset chaque jour
  }
}
```

### **BullmqService - Files d'attente avec priorités**

#### **Jobs et notifications**
```typescript
import { BullmqService, JOB_TYPES, JOB_PRIORITIES } from '../../shared/bullmq/bullmq.service';

@Injectable()
export class NotificationService {
  constructor(private readonly bullmq: BullmqService) {}

  // Emails de bienvenue
  async sendWelcomeEmail(userId: string, email: string, firstName: string) {
    await this.bullmq.sendWelcomeEmail(userId, email, firstName);
  }

  // Emails transactionnels
  async sendOrderConfirmation(orderId: string, userEmail: string, orderData: any) {
    await this.bullmq.addEmailJob(
      JOB_TYPES.EMAIL.ORDER_CONFIRMATION,
      {
        to: userEmail,
        orderId,
        orderData
      },
      {
        priority: JOB_PRIORITIES.HIGH,
        delay: 0
      }
    );
  }

  // Notifications push
  async sendEventReminder(userId: string, eventId: string, reminderTime: Date) {
    await this.bullmq.addNotificationJob(
      JOB_TYPES.NOTIFICATION.EVENT_REMINDER,
      {
        userId,
        eventId,
        type: 'push'
      },
      {
        priority: JOB_PRIORITIES.MEDIUM,
        delay: reminderTime.getTime() - Date.now()
      }
    );
  }

  // Traitement en batch
  async processTicketGeneration(eventId: string, ticketCount: number) {
    await this.bullmq.addProcessingJob(
      JOB_TYPES.PROCESSING.GENERATE_TICKETS,
      {
        eventId,
        ticketCount
      },
      {
        priority: JOB_PRIORITIES.LOW,
        attempts: 3
      }
    );
  }

  // Monitoring des queues
  async getQueueStats() {
    return {
      email: await this.bullmq.getQueueStats('email'),
      notification: await this.bullmq.getQueueStats('notification'),
      processing: await this.bullmq.getQueueStats('processing')
    };
  }
}
```

### **LoggerService - Logging structuré business**

#### **Logging business et technique**
```typescript
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class OrderService {
  private readonly logger: LoggerService;

  constructor(loggerService: LoggerService) {
    this.logger = loggerService.createChildLogger('OrderService');
  }

  async processOrder(orderData: any) {
    const operationId = this.logger.startOperation('process_order', {
      orderId: orderData.id,
      amount: orderData.total
    });

    try {
      // Traitement commande
      const result = await this.handleOrderProcessing(orderData);

      // Log événement business
      this.logger.logBusinessEvent('ORDER_PROCESSED', {
        orderId: result.id,
        amount: result.total,
        currency: result.currency,
        paymentMethod: result.paymentMethod,
        itemsCount: result.items.length
      }, result.userId, result.organizerId);

      this.logger.endOperation('process_order', operationId, true);
      return result;

    } catch (error) {
      this.logger.logErrorEvent(error, 'OrderService.processOrder', orderData.userId);
      this.logger.endOperation('process_order', operationId, false);
      throw error;
    }
  }

  async logSecurityEvent(userId: string, action: string, ip: string) {
    this.logger.logSecurityEvent(
      'SUSPICIOUS_ORDER_ACTIVITY',
      userId,
      ip,
      'Mozilla/5.0...',
      {
        action,
        attemptCount: 5,
        blocked: true
      }
    );
  }
}
```

### **EmailService - Templates et envois**

#### **Emails avec templates**
```typescript
import { EmailService } from '../../shared/email/email.service';

@Injectable()
export class UserEmailService {
  constructor(private readonly email: EmailService) {}

  async sendWelcomeEmail(user: any) {
    await this.email.sendTemplateEmail(
      user.email,
      'welcome',
      {
        firstName: user.firstName,
        loginUrl: 'https://app.entrix.tn/login'
      }
    );
  }

  async sendOrderConfirmation(order: any) {
    await this.email.sendTemplateEmail(
      order.userEmail,
      'order_confirmation',
      {
        orderNumber: order.number,
        eventTitle: order.event.title,
        qrCodeUrl: order.tickets[0].qrCodeUrl,
        total: order.total
      }
    );
  }

  // Test connexion
  async testEmailConnection() {
    return this.email.testConnection();
  }

  // Métriques
  async getEmailMetrics() {
    return this.email.getMetrics();
  }
}
```

### **RateLimitingService - Protection API**

#### **Rate limiting avancé**
```typescript
import { RateLimitingGuard, RateLimit } from '../../shared/rate-limiting/rate-limiting.guard';

@Controller('orders')
@UseGuards(RateLimitingGuard)
export class OrderController {
  
  @Post()
  @RateLimit({
    limit: 10,
    windowMs: 300000, // 5 minutes
    algorithm: 'sliding_window',
    skipSuccessfulRequests: false
  })
  async createOrder(@Body() orderData: any) {
    return this.orderService.createOrder(orderData);
  }

  @Get()
  @RateLimit({
    limit: 100,
    windowMs: 60000, // 1 minute
    algorithm: 'token_bucket'
  })
  async getOrders() {
    return this.orderService.getOrders();
  }
}
```

---

## 🔧 Utilities & Helpers

### **Database Utilities (utilisant PrismaService)**
```typescript
// shared/utils/database.utils.ts
import { PrismaService } from '../prisma/prisma.service';

export class DatabaseUtils {
  static buildPaginationQuery(options: PaginationOptions) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    
    return {
      skip,
      take: limit,
    };
  }

  static buildSortQuery(sortBy?: string, sortOrder: 'ASC' | 'DESC' = 'ASC') {
    if (!sortBy) return {};
    
    return {
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
    };
  }

  // Utilise la méthode transactionWithRetry du PrismaService
  static async withTransaction<T>(
    prisma: PrismaService,
    fn: (tx: any) => Promise<T>,
  ): Promise<T> {
    return prisma.transactionWithRetry(fn);
  }
}
```

### **Response Utilities**
```typescript
// shared/utils/response.utils.ts
export class ResponseUtils {
  static success<T>(
    data: T,
    message?: string,
    meta?: any,
  ): StandardResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(
    code: string,
    message: string,
    details?: any,
  ): StandardResponse<null> {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): StandardResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      data,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

---

## 📋 Best Practices

### **Sécurité**
1. **Validation stricte** : Toujours valider inputs côté serveur
2. **Sanitization** : Nettoyer données utilisateur
3. **Rate limiting** : Implémenter throttling sur APIs
4. **Headers sécurité** : Helmet, CORS, CSP
5. **Secrets management** : Variables environnement sécurisées

### **Performance**
1. **Database indexes** : Optimiser requêtes fréquentes
2. **Caching strategy** : Redis pour données fréquentes
3. **Lazy loading** : Relations Prisma selon besoin
4. **Connection pooling** : Pool connexions DB
5. **Pagination** : Toujours paginer grandes collections

### **Monitoring**
1. **Logging structuré** : Winston avec formats JSON
2. **Métriques business** : Prometheus/Grafana
3. **Health checks** : Endpoints santé système
4. **Error tracking** : Sentry pour erreurs production
5. **APM** : Monitoring performance applications

### **Documentation**
1. **Swagger/OpenAPI** : Documentation API automatique
2. **README détaillé** : Setup et configuration
3. **Architecture Decision Records** : Justifications techniques
4. **Code comments** : Logique complexe expliquée
5. **Changelog** : Historique modifications

Ce guide assure la qualité, maintenabilité et scalabilité du backend Entrix V3.0 avec des standards professionnels enterprise-grade.