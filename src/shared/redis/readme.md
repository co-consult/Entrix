# RedisModule - Cache et Sessions

## 📋 Vue d'ensemble

Le RedisModule fournit un service de cache distribué et de gestion de sessions avec des fonctionnalités avancées :

- **Cache typé** avec sérialisation JSON automatique
- **Verrous distribués** pour la synchronisation
- **Gestion de sessions** utilisateur
- **Métriques et monitoring** intégrés
- **Opérations batch** et nettoyage automatique
- **Prêt pour le clustering** Redis

## 🚀 Installation

```bash
npm install ioredis @types/ioredis
```

## ⚙️ Configuration

### Variables d'environnement

```bash
# .env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                # Optionnel
REDIS_DB=0                     # Base de données (0-15)
REDIS_TLS=false               # Connexion TLS
```

### Configuration Redis

```bash
# Configuration Redis recommandée (redis.conf)
maxmemory 1gb
maxmemory-policy allkeys-lru
timeout 0
tcp-keepalive 300
```

## 🔧 Utilisation

### Injection de Base

```typescript
import { Injectable } from '@nestjs/common';
import { RedisService } from '@shared/redis';

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}
}
```

### Opérations de Base

```typescript
// SET/GET simple
await this.redis.set('key', 'value', 3600); // TTL 1 heure
const value = await this.redis.get('key');

// Supprimer
await this.redis.del('key');

// Vérifier existence
const exists = await this.redis.exists('key');

// Définir TTL sur clé existante
await this.redis.expire('key', 3600);
```

## 🛠️ Fonctionnalités Avancées

### Cache Typé avec JSON

```typescript
// Interface pour typage
interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

// Sauvegarder un objet
await this.redis.setCache<User>('user:123', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'dark',
    notifications: true
  }
}, 3600);

// Récupérer un objet
const user = await this.redis.getCache<User>('user:123');
console.log(user?.preferences.theme); // 'dark'

// Supprimer du cache
await this.redis.delCache('user:123');
```

### Verrous Distribués

```typescript
// Verrou simple
const lockAcquired = await this.redis.acquireLock('process:payment:order123', 30);

if (lockAcquired) {
  try {
    // Traitement critique
    await this.processPayment(orderData);
  } finally {
    await this.redis.releaseLock('process:payment:order123');
  }
} else {
  throw new Error('Traitement en cours, veuillez patienter');
}

// Verrou avec callback automatique
try {
  const result = await this.redis.withLock(
    'user:update:123',
    async () => {
      // Mise à jour critique
      const user = await this.getUser('123');
      user.credits += 100;
      await this.updateUser(user);
      return user;
    },
    30 // TTL 30 secondes
  );
  
  console.log('Utilisateur mis à jour:', result);
} catch (error) {
  console.error('Impossible d\'acquérir le verrou:', error);
}
```

### Gestion de Sessions

```typescript
// Créer une session
await this.redis.setSession('session:abc123', {
  userId: '123',
  email: 'user@example.com',
  role: 'user',
  permissions: ['read', 'write'],
  lastActivity: new Date(),
  loginAt: new Date()
}, 86400); // 24 heures

// Récupérer une session
const session = await this.redis.getSession<SessionData>('session:abc123');
if (session) {
  console.log('Utilisateur connecté:', session.email);
}

// Mettre à jour la session
if (session) {
  session.lastActivity = new Date();
  await this.redis.setSession('session:abc123', session, 86400);
}

// Supprimer la session (logout)
await this.redis.delSession('session:abc123');
```

### Compteurs et Incréments

```typescript
// Compteur simple
const pageViews = await this.redis.increment('page:views:home');
console.log(`Page vue ${pageViews} fois`);

// Compteur avec TTL automatique
const dailyViews = await this.redis.increment('daily:views:2025-01-15', 86400);
console.log(`Vues aujourd'hui: ${dailyViews}`);

// Compteur par utilisateur
const userActions = await this.redis.increment(`user:${userId}:actions:${today}`, 86400);
if (userActions > 100) {
  throw new Error('Limite d\'actions quotidiennes atteinte');
}
```

## 🔍 Recherche et Gestion

### Recherche par Pattern

```typescript
// Trouver toutes les sessions
const sessionKeys = await this.redis.keys('session:*');
console.log(`${sessionKeys.length} sessions actives`);

// Trouver les caches utilisateur
const userCaches = await this.redis.keys('user:*');

// Attention: keys() peut être lent sur de gros volumes
// Préférez SCAN en production
```

### Nettoyage

```typescript
// Nettoyer les clés expirées
const deletedCount = await this.redis.cleanup('temp:*');
console.log(`${deletedCount} clés temporaires supprimées`);

// Nettoyer les sessions expirées
await this.redis.cleanup('session:*');

// Nettoyer le cache d'un utilisateur
await this.redis.cleanup(`user:${userId}:*`);
```

## 📊 Monitoring et Métriques

### Métriques Détaillées

```typescript
// Récupérer les métriques
const metrics = this.redis.getMetrics();
console.log(metrics);
/*
{
  hits: 1250,
  misses: 89,
  errors: 2,
  totalOperations: 1341,
  hitRate: 93.36,
  errorRate: 0.15
}
*/

// Analyser les performances
if (metrics.hitRate < 80) {
  console.warn('Taux de hit cache faible, optimisation recommandée');
}

if (metrics.errorRate > 5) {
  console.error('Taux d\'erreur Redis élevé');
}
```

### Tests de Connexion

```typescript
// Ping Redis
const pong = await this.redis.ping();
console.log(pong); // 'PONG'

// Informations serveur
const info = await this.redis.info();
console.log(info); // Informations détaillées Redis
```

### Reset des Métriques

```typescript
// Reset pour nouveaux calculs
this.redis.resetMetrics();
```

## 🎯 Exemples Pratiques

### Service de Cache Utilisateur

```typescript
@Injectable()
export class UserCacheService {
  constructor(private readonly redis: RedisService) {}

  async cacheUser(user: User): Promise<void> {
    await this.redis.setCache(`user:${user.id}`, user, 3600);
    await this.redis.setCache(`user:email:${user.email}`, user.id, 3600);
  }

  async getUserById(id: string): Promise<User | null> {
    return this.redis.getCache<User>(`user:${id}`);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = await this.redis.getCache<string>(`user:email:${email}`);
    if (userId) {
      return this.getUserById(userId);
    }
    return null;
  }

  async invalidateUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    if (user) {
      await this.redis.delCache(`user:${id}`);
      await this.redis.delCache(`user:email:${user.email}`);
    }
  }
}
```

### Service de Session

```typescript
interface SessionData {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  lastActivity: Date;
  loginAt: Date;
}

@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  async createSession(userId: string, userData: Partial<SessionData>): Promise<string> {
    const sessionId = `session:${generateUniqueId()}`;
    const sessionData: SessionData = {
      userId,
      email: userData.email,
      role: userData.role || 'user',
      permissions: userData.permissions || [],
      lastActivity: new Date(),
      loginAt: new Date()
    };

    await this.redis.setSession(sessionId, sessionData, 86400);
    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    return this.redis.getSession<SessionData>(sessionId);
  }

  async updateActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.lastActivity = new Date();
      await this.redis.setSession(sessionId, session, 86400);
    }
  }

  async destroySession(sessionId: string): Promise<void> {
    await this.redis.delSession(sessionId);
  }

  async getUserSessions(userId: string): Promise<string[]> {
    const sessionKeys = await this.redis.keys('session:*');
    const userSessions = [];

    for (const key of sessionKeys) {
      const session = await this.redis.getSession<SessionData>(key);
      if (session?.userId === userId) {
        userSessions.push(key);
      }
    }

    return userSessions;
  }
}
```

### Service de Rate Limiting

```typescript
@Injectable()
export class RateLimitService {
  constructor(private readonly redis: RedisService) {}

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Utiliser verrou pour éviter les race conditions
    return this.redis.withLock(`lock:${key}`, async () => {
      // Nettoyer les entrées expirées
      await this.redis.getClient().zremrangebyscore(key, 0, windowStart);

      // Compter les requêtes actuelles
      const currentCount = await this.redis.getClient().zcard(key);

      if (currentCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + windowMs
        };
      }

      // Ajouter la requête actuelle
      await this.redis.getClient().zadd(key, now, `${now}-${Math.random()}`);
      await this.redis.expire(key, Math.ceil(windowMs / 1000));

      return {
        allowed: true,
        remaining: limit - currentCount - 1,
        resetTime: now + windowMs
      };
    }, 5);
  }
}
```

### Service de Cache Multi-Niveaux

```typescript
@Injectable()
export class MultiLevelCacheService {
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    // Niveau 1: Cache mémoire
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      return memoryCached.data;
    }

    // Niveau 2: Redis
    const redisCached = await this.redis.getCache<T>(key);
    if (redisCached) {
      // Remettre en cache mémoire
      this.memoryCache.set(key, {
        data: redisCached,
        expiry: Date.now() + 60000 // 1 minute en mémoire
      });
      return redisCached;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    // Sauvegarder dans les deux niveaux
    await this.redis.setCache(key, value, ttl);
    
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + Math.min(ttl * 1000, 300000) // Max 5 min en mémoire
    });
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redis.delCache(key);
  }
}
```

## 🔧 Bonnes Pratiques

### 1. Gestion des Clés

```typescript
// ✅ Bon - Clés structurées avec préfixes
const USER_PREFIX = 'user:';
const SESSION_PREFIX = 'session:';
const CACHE_PREFIX = 'cache:';

await this.redis.setCache(`${USER_PREFIX}${userId}`, user);
await this.redis.setSession(`${SESSION_PREFIX}${sessionId}`, session);

// ❌ Mauvais - Clés sans structure
await this.redis.set('user123', JSON.stringify(user));
await this.redis.set('session_abc', JSON.stringify(session));
```

### 2. TTL Approprié

```typescript
// ✅ Bon - TTL selon le type de données
await this.redis.setCache('user:123', user, 3600);        // 1h pour les données utilisateur
await this.redis.setCache('config:app', config, 86400);   // 24h pour la config
await this.redis.setCache('temp:token', token, 300);      // 5min pour les tokens

// ❌ Mauvais - Pas de TTL
await this.redis.setCache('user:123', user); // Restera en cache indéfiniment
```

### 3. Gestion des Erreurs

```typescript
// ✅ Bon - Fallback en cas d'erreur
async getUserWithFallback(id: string): Promise<User> {
  try {
    const cached = await this.redis.getCache<User>(`user:${id}`);
    if (cached) return cached;
  } catch (error) {
    console.warn('Redis error, fallback to database:', error);
  }

  const user = await this.database.findUser(id);
  
  // Essayer de mettre en cache
  try {
    await this.redis.setCache(`user:${id}`, user, 3600);
  } catch (error) {
    console.warn('Failed to cache user:', error);
  }

  return user;
}
```

### 4. Verrous Distribués

```typescript
// ✅ Bon - Verrous avec timeout
await this.redis.withLock('critical:operation', async () => {
  await this.criticalOperation();
}, 30); // Timeout 30s

// ❌ Mauvais - Verrous sans timeout
const lock = await this.redis.acquireLock('operation');
// Si le processus plante, le verrou reste indéfiniment
```

## 🐛 Troubleshooting

### Problèmes Courants

#### 1. Connexion Redis Échouée

```bash
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions :**
```bash
# Vérifier si Redis est démarré
redis-cli ping

# Démarrer Redis
redis-server

# Vérifier la configuration
echo $REDIS_HOST
echo $REDIS_PORT
```

#### 2. Mémoire Redis Saturée

```bash
OOM command not allowed when used memory > 'maxmemory'
```

**Solutions :**
```bash
# Configurer maxmemory-policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Augmenter la mémoire
redis-cli CONFIG SET maxmemory 2gb

# Nettoyer les clés expirées
redis-cli FLUSHDB
```

#### 3. Performances Dégradées

```bash
Slow query detected
```

**Solutions :**
```typescript
// Éviter les opérations coûteuses
// ❌ Mauvais
const keys = await this.redis.keys('*'); // Très lent

// ✅ Bon
const keys = await this.redis.keys('user:*'); // Plus spécifique

// Ou utiliser SCAN
const client = this.redis.getClient();
const stream = client.scanStream({ match: 'user:*' });
```

#### 4. Verrous Bloqués

```bash
Lock timeout exceeded
```

**Solutions :**
```typescript
// Nettoyer les verrous manuellement
await this.redis.delCache('lock:operation');

// Ou utiliser des TTL plus courts
await this.redis.acquireLock('operation', 10); // 10s au lieu de 30s
```

### Debug et Monitoring

```typescript
// Activer les logs Redis
const client = this.redis.getClient();
client.on('error', (err) => console.error('Redis error:', err));
client.on('connect', () => console.log('Redis connected'));
client.on('ready', () => console.log('Redis ready'));

// Surveiller les métriques
setInterval(() => {
  const metrics = this.redis.getMetrics();
  console.log('Redis metrics:', metrics);
}, 60000); // Toutes les minutes
```

## 📈 Performance

### Optimisations Recommandées

```typescript
// 1. Pipeline pour les opérations multiples
const pipeline = this.redis.getClient().pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
pipeline.set('key3', 'value3');
await pipeline.exec();

// 2. Utiliser MGET pour récupérer plusieurs clés
const values = await this.redis.getClient().mget('key1', 'key2', 'key3');

// 3. Éviter les grandes valeurs
// ❌ Mauvais
await this.redis.setCache('huge:object', hugeObject); // >1MB

// ✅ Bon
await this.redis.setCache('object:id', object.id);
await this.redis.setCache('object:name', object.name);
```

### Monitoring Production

```typescript
// Métriques à surveiller
const metrics = this.redis.getMetrics();

// Alertes recommandées
if (metrics.hitRate < 70) {
  console.warn('Cache hit rate faible');
}

if (metrics.errorRate > 1) {
  console.error('Erreurs Redis fréquentes');
}

// Monitoring mémoire
const info = await this.redis.info();
const memoryUsage = info.match(/used_memory_human:(.+)/)?.[1];
console.log('Mémoire utilisée:', memoryUsage);
```

## 🚀 Déploiement

### Configuration Production

```bash
# .env.production
REDIS_HOST=redis.production.com
REDIS_PORT=6380
REDIS_PASSWORD=secure_password
REDIS_DB=0
REDIS_TLS=true
```

### Clustering Redis

```typescript
// Configuration pour Redis Cluster
const Redis = require('ioredis');
const cluster = new Redis.Cluster([
  { host: '127.0.0.1', port: 7000 },
  { host: '127.0.0.1', port: 7001 },
  { host: '127.0.0.1', port: 7002 }
]);
```

### Monitoring et Alertes

```typescript
// Endpoint de santé
@Get('health/redis')
async redisHealth() {
  try {
    const pong = await this.redis.ping();
    const metrics = this.redis.getMetrics();
    
    return {
      status: pong === 'PONG' ? 'healthy' : 'unhealthy',
      metrics,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    };
  }
}
```

---

## 📚 Ressources

- [Redis Documentation](https://redis.io/documentation)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Redis Best Practices](https://redis.io/topics/memory-optimization)

**Le RedisModule est maintenant prêt pour une utilisation professionnelle ! 🚀**