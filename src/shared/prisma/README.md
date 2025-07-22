# PrismaModule - Base de Données

## 📋 Vue d'ensemble

Le PrismaModule fournit une couche d'accès aux données robuste et typée pour PostgreSQL avec des fonctionnalités avancées :

- **Retry automatique** avec backoff exponentiel
- **Métriques et monitoring** intégrés
- **Transactions avec gestion d'erreurs** 
- **Pagination optimisée** (offset et cursor)
- **Opérations batch** pour les gros volumes
- **Health checks** pour le monitoring
- **Détection des requêtes lentes**

## 🚀 Installation

```bash
npm install @prisma/client prisma
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/entrix"
PRISMA_LOG_LEVEL=info          # info, warn, error, query
PRISMA_POOL_MIN=2              # Connexions minimum
PRISMA_POOL_MAX=10             # Connexions maximum
```

### Schema Prisma

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  firstName String
  lastName  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("users")
}
```

## 🔧 Utilisation

### Injection de Base

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
}
```

### Opérations CRUD

```typescript
// CREATE
const user = await this.prisma.user.create({
  data: {
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});

// READ
const user = await this.prisma.user.findUnique({
  where: { id: 'user-id' },
  include: { orders: true }
});

const users = await this.prisma.user.findMany({
  where: { 
    firstName: { contains: 'John' },
    createdAt: { gte: new Date('2024-01-01') }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});

// UPDATE
const updatedUser = await this.prisma.user.update({
  where: { id: 'user-id' },
  data: { firstName: 'Jane' }
});

// DELETE
await this.prisma.user.delete({
  where: { id: 'user-id' }
});
```

## 🛠️ Fonctionnalités Avancées

### Retry Automatique

```typescript
// Opération avec retry automatique
const user = await this.prisma.executeWithRetry(
  () => this.prisma.user.create({ data: userData }),
  3,      // maxRetries
  1000,   // initialDelay (ms)
  2       // backoffMultiplier
);

// Exemple avec gestion d'erreur
try {
  const result = await this.prisma.executeWithRetry(
    () => this.prisma.user.update({
      where: { id: 'user-id' },
      data: { lastLogin: new Date() }
    }),
    3,
    1000
  );
} catch (error) {
  console.error('Échec après 3 tentatives:', error);
}
```

### Transactions Avancées

```typescript
// Transaction simple
const result = await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com' }
  });
  
  const profile = await tx.profile.create({
    data: { userId: user.id, bio: 'Hello' }
  });
  
  return { user, profile };
});

// Transaction avec retry
const result = await this.prisma.transactionWithRetry(
  async (tx) => {
    const order = await tx.order.create({
      data: { userId: 'user-id', total: 100 }
    });
    
    await tx.user.update({
      where: { id: 'user-id' },
      data: { lastOrderAt: new Date() }
    });
    
    return order;
  },
  3,    // maxRetries
  1000  // initialDelay
);
```

### Pagination

```typescript
// Pagination offset classique
const result = await this.prisma.paginate(
  this.prisma.user,
  {
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    include: { profile: true }
  },
  1,  // page
  20  // limit
);

console.log(result);
/*
{
  data: User[],
  total: 1500,
  page: 1,
  limit: 20,
  totalPages: 75,
  hasNext: true,
  hasPrev: false
}
*/

// Pagination avec curseur (plus efficace)
const result = await this.prisma.cursorPaginate(
  this.prisma.user,
  {
    where: { active: true },
    orderBy: { createdAt: 'desc' }
  },
  'cursor-id', // cursor (optionnel)
  20           // limit
);

console.log(result);
/*
{
  data: User[],
  nextCursor: 'next-cursor-id',
  hasNext: true
}
*/
```

### Opérations Batch

```typescript
// Traitement par lots pour éviter la surcharge
const userIds = ['id1', 'id2', 'id3', ..., 'id1000'];

const operations = userIds.map(id => 
  () => this.prisma.user.update({
    where: { id },
    data: { lastActivity: new Date() }
  })
);

const results = await this.prisma.batchOperation(
  operations,
  10 // batchSize - traite 10 opérations à la fois
);

console.log(`${results.length} utilisateurs mis à jour`);
```

### Requêtes Raw

```typescript
// Requête SQL raw avec métriques
const result = await this.prisma.queryRawWithMetrics<{total: number}[]>`
  SELECT COUNT(*) as total 
  FROM users 
  WHERE created_at >= ${startDate}
  AND active = true
`;

// Requête unsafe (pour les requêtes dynamiques)
const tableName = 'users';
const result = await this.prisma.queryRawUnsafeWithMetrics(
  `SELECT * FROM ${tableName} WHERE active = $1`,
  true
);
```

## 📊 Monitoring et Métriques

### Health Check

```typescript
// Vérifier la santé de la base
const health = await this.prisma.healthCheck();
console.log(health);
/*
{
  status: 'healthy',
  timestamp: '2025-01-15T10:30:00Z',
  metrics: {
    queryCount: 1250,
    errorCount: 12,
    avgQueryTime: 45.23
  },
  connectionTest: true
}
*/
```

### Métriques Détaillées

```typescript
// Récupérer les métriques
const metrics = this.prisma.getMetrics();
console.log(metrics);
/*
{
  queryCount: 1250,
  errorCount: 12,
  totalQueryTime: 56537,
  avgQueryTime: 45.23,
  successRate: 99.04,
  errorRate: 0.96,
  transactionCount: 89,
  connectionCount: 1,
  retryCount: 3
}
*/

// Reset des métriques
this.prisma.resetMetrics();
```

### Monitoring des Requêtes Lentes

```typescript
// Les requêtes > 1000ms sont automatiquement loggées
const users = await this.prisma.user.findMany({
  include: {
    orders: {
      include: {
        items: true
      }
    }
  }
});
// Si cette requête prend > 1000ms, elle sera loggée automatiquement
```

## 🎯 Exemples Pratiques

### Service Utilisateur Complet

```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    return this.prisma.executeWithRetry(
      () => this.prisma.user.create({
        data: userData,
        include: { profile: true }
      }),
      3
    );
  }

  async getUsersPaginated(page: number = 1, limit: number = 20) {
    return this.prisma.paginate(
      this.prisma.user,
      {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        include: { profile: true }
      },
      page,
      limit
    );
  }

  async updateUserWithProfile(userId: string, userData: UpdateUserDto) {
    return this.prisma.transactionWithRetry(
      async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName
          }
        });

        if (userData.bio) {
          await tx.profile.upsert({
            where: { userId },
            update: { bio: userData.bio },
            create: { userId, bio: userData.bio }
          });
        }

        return user;
      },
      3
    );
  }

  async bulkUpdateLastActivity(userIds: string[]) {
    const operations = userIds.map(id => 
      () => this.prisma.user.update({
        where: { id },
        data: { lastActivity: new Date() }
      })
    );

    return this.prisma.batchOperation(operations, 10);
  }
}
```

### Service de Statistiques

```typescript
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(startDate: Date, endDate: Date) {
    return this.prisma.queryRawWithMetrics<{
      total: number;
      active: number;
      newUsers: number;
    }[]>`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN active = true THEN 1 END) as active,
        COUNT(CASE WHEN created_at >= ${startDate} THEN 1 END) as "newUsers"
      FROM users
      WHERE created_at <= ${endDate}
    `;
  }

  async getMonthlyGrowth() {
    return this.prisma.queryRawWithMetrics`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month
    `;
  }
}
```

## 🔧 Bonnes Pratiques

### 1. Gestion des Erreurs

```typescript
// ✅ Bon
async createUser(userData: CreateUserDto) {
  try {
    return await this.prisma.executeWithRetry(
      () => this.prisma.user.create({ data: userData }),
      3
    );
  } catch (error) {
    if (error.code === 'P2002') {
      throw new ConflictException('Email déjà utilisé');
    }
    throw new InternalServerErrorException('Erreur de création');
  }
}

// ❌ Mauvais
async createUser(userData: CreateUserDto) {
  return this.prisma.user.create({ data: userData });
  // Pas de gestion d'erreur
}
```

### 2. Optimisation des Requêtes

```typescript
// ✅ Bon - Sélection des champs nécessaires
const users = await this.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true,
    profile: {
      select: {
        bio: true
      }
    }
  }
});

// ❌ Mauvais - Récupération de tous les champs
const users = await this.prisma.user.findMany({
  include: { profile: true }
});
```

### 3. Transactions

```typescript
// ✅ Bon - Transaction pour les opérations liées
await this.prisma.transactionWithRetry(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventory.update({
    where: { productId: orderData.productId },
    data: { quantity: { decrement: orderData.quantity } }
  });
});

// ❌ Mauvais - Opérations séparées
const order = await this.prisma.order.create({ data: orderData });
await this.prisma.inventory.update({
  where: { productId: orderData.productId },
  data: { quantity: { decrement: orderData.quantity } }
});
```

### 4. Pagination

```typescript
// ✅ Bon - Pagination avec curseur pour les gros volumes
const result = await this.prisma.cursorPaginate(
  this.prisma.user,
  { orderBy: { createdAt: 'desc' } },
  cursor,
  20
);

// ❌ Mauvais - Offset élevé
const users = await this.prisma.user.findMany({
  skip: 10000, // Très lent
  take: 20
});
```

## 🐛 Troubleshooting

### Problèmes Courants

#### 1. Erreur de Connexion

```bash
Error: Can't reach database server
```

**Solutions :**
```typescript
// Vérifier la configuration
const health = await this.prisma.healthCheck();
console.log('DB Health:', health);

// Vérifier la variable d'environnement
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Tester la connexion manuelle
await this.prisma.$queryRaw`SELECT 1`;
```

#### 2. Requêtes Lentes

```bash
Query took 3000ms to complete
```

**Solutions :**
```typescript
// Analyser les métriques
const metrics = this.prisma.getMetrics();
console.log('Avg Query Time:', metrics.avgQueryTime);

// Utiliser les index
// Dans votre schema.prisma
model User {
  email String @unique
  createdAt DateTime @default(now())
  
  @@index([createdAt])
}

// Optimiser la requête
const users = await this.prisma.user.findMany({
  where: { createdAt: { gte: startDate } },
  select: { id: true, email: true }, // Sélection spécifique
  take: 100
});
```

#### 3. Erreurs de Transaction

```bash
Transaction failed: write conflict
```

**Solutions :**
```typescript
// Utiliser transactionWithRetry
const result = await this.prisma.transactionWithRetry(
  async (tx) => {
    // Vos opérations
  },
  5,    // Plus de tentatives
  2000  // Délai plus long
);
```

#### 4. Pool de Connexions Saturé

```bash
Error: Too many connections
```

**Solutions :**
```bash
# Ajuster les variables d'environnement
PRISMA_POOL_MIN=2
PRISMA_POOL_MAX=5

# Ou dans l'URL
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=5"
```

### Debug et Monitoring

```typescript
// Activer les logs de debug
// Dans schema.prisma
generator client {
  provider = "prisma-client-js"
  log = ["query", "info", "warn", "error"]
}

// Ou via le service
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

## 📈 Performance

### Métriques Recommandées

```typescript
// Surveiller ces métriques
const metrics = this.prisma.getMetrics();

// Alertes recommandées
if (metrics.avgQueryTime > 1000) {
  console.warn('Requêtes lentes détectées');
}

if (metrics.errorRate > 5) {
  console.error('Taux d\'erreur élevé');
}

if (metrics.connectionCount > 8) {
  console.warn('Pool de connexions saturé');
}
```

### Optimisations

```typescript
// 1. Utiliser les index
@@index([email, createdAt])

// 2. Limiter les résultats
take: 100

// 3. Sélection spécifique
select: { id: true, email: true }

// 4. Pagination efficace
cursorPaginate() // au lieu de paginate()

// 5. Transactions courtes
await this.prisma.transactionWithRetry(async (tx) => {
  // Opérations rapides uniquement
});
```

## 🚀 Déploiement

### Configuration Production

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@prod-host:5432/entrix?sslmode=require"
PRISMA_LOG_LEVEL=warn
PRISMA_POOL_MIN=5
PRISMA_POOL_MAX=20
```

### Migrations

```bash
# Générer une migration
npx prisma migrate dev --name add-user-index

# Déployer en production
npx prisma migrate deploy

# Générer le client
npx prisma generate
```

### Monitoring Production

```typescript
// Endpoint de santé
@Get('health/database')
async databaseHealth() {
  const health = await this.prisma.healthCheck();
  return {
    status: health.status,
    metrics: health.metrics,
    timestamp: health.timestamp
  };
}
```

---

## 📚 Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [NestJS Prisma Recipe](https://docs.nestjs.com/recipes/prisma)

**Le PrismaModule est maintenant prêt pour une utilisation professionnelle ! 🚀**