# 🎫 Entrix - Event Management & Ticketing Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-20+-blue.svg)](https://www.docker.com/)

A modern, full-stack event management and ticketing platform built with Next.js, NestJS, and PostgreSQL. Entrix provides comprehensive tools for event organizers, venue management, subscription sales, and user management.

## ✨ Features

### 🎯 Core Features
- **Event Management**: Create, manage, and track events with detailed analytics
- **Ticketing System**: Generate and manage tickets with QR codes
- **Venue Management**: Organize and manage multiple venues
- **Subscription Sales**: Handle subscription-based access with multiple payment methods
- **User Management**: Comprehensive user profiles with role-based access control
- **Admin Dashboard**: Powerful admin interface for system management
- **Real-time Notifications**: Email and in-app notifications
- **Multi-factor Authentication**: Enhanced security with MFA support

### 🏢 Business Features
- **Payment Processing**: Support for multiple payment methods (FLOUCI, BANK_TRANSFER, CHEQUE, SOCIOS)
- **Commission Tracking**: Track and manage commission structures
- **Audit Logs**: Comprehensive audit trail for all system activities
- **Contact Management**: Handle customer contact requests and inquiries
- **Reporting & Analytics**: Detailed reports and statistics
- **Group Management**: Organize users into groups for better management

### 🔧 Technical Features
- **RESTful API**: Well-documented API with Swagger/OpenAPI
- **Rate Limiting**: Built-in rate limiting and security measures
- **Caching**: Redis-based caching for improved performance
- **Queue Management**: Background job processing with BullMQ
- **Email Templates**: Customizable email templates with Handlebars
- **File Upload**: Secure file upload and management
- **Docker Support**: Complete containerization for easy deployment

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│   Port: 3001    │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│     Redis      │◄─────────────┘
                        │   Port: 6379   │
                        └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) with TypeScript
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: React Hooks + Context API
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) with TypeScript
- **Database**: [PostgreSQL 15](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Caching**: [Redis 7](https://redis.io/)
- **Queue**: [BullMQ](https://docs.bullmq.io/) for background jobs
- **Authentication**: JWT with Passport.js
- **Email**: [Nodemailer](https://nodemailer.com/) with Handlebars templates
- **Documentation**: [Swagger/OpenAPI](https://swagger.io/)
- **Validation**: [class-validator](https://github.com/typestack/class-validator)

### DevOps & Infrastructure
- **Containerization**: [Docker](https://www.docker.com/) + [Docker Compose](https://docs.docker.com/compose/)
- **Reverse Proxy**: [Nginx Proxy Manager](https://nginxproxymanager.com/)
- **SSL**: Let's Encrypt certificates
- **Monitoring**: Redis Insights for Redis monitoring

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+ 
- [Docker](https://www.docker.com/) 20+ and Docker Compose
- [PostgreSQL](https://www.postgresql.org/) 15+ (or use Docker)
- [Redis](https://redis.io/) 7+ (or use Docker)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Entrix-mahdi
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   
   # Frontend
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Set up database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run start:dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api

### Docker Setup

1. **Start services with Docker Compose**
   ```bash
   # Development
   docker-compose -f backend/docker-compose.yml up -d
   
   # Production
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Access services**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Redis Insights: http://localhost:5540 (development)

## 🌐 Production Deployment

### Using Nginx Proxy Manager

1. **Prepare environment**
   ```bash
   cp env.production .env
   # Edit .env with your domain and credentials
   ```

2. **Deploy with script**
   ```bash
   ./deploy-production.sh
   ```

3. **Configure Nginx Proxy Manager**
   - Access: `http://your-server-ip:81`
   - Create proxy hosts for frontend and backend
   - Enable SSL with Let's Encrypt

### Manual Deployment

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

For detailed deployment instructions, see [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md).

## 📁 Project Structure

```
Entrix-mahdi/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   │   ├── auth/       # Authentication & authorization
│   │   │   ├── users/      # User management
│   │   │   ├── events/     # Event management
│   │   │   ├── venues/     # Venue management
│   │   │   └── subscription-sales/ # Subscription handling
│   │   ├── shared/         # Shared utilities and modules
│   │   └── common/         # Common decorators, filters, etc.
│   ├── prisma/             # Database schema and migrations
│   ├── templates/          # Email templates
│   └── migrations/         # Database migration scripts
├── frontend/               # Next.js frontend application
│   ├── app/               # Next.js 13+ app directory
│   ├── components/        # Reusable UI components
│   ├── lib/              # Utility functions and API clients
│   └── public/           # Static assets
├── docker-compose.prod.yml # Production Docker configuration
├── deploy-production.sh   # Production deployment script
└── docs/                 # Documentation
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/entrix_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# App
PORT=3000
NODE_ENV="development"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3001"
```

## 📚 API Documentation

The API documentation is automatically generated using Swagger/OpenAPI and is available at:

- **Development**: http://localhost:3000/api
- **Production**: https://your-domain.com/api/v1

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📊 Monitoring & Logs

### Redis Monitoring
- **Development**: http://localhost:5540 (Redis Insights)
- **Production**: Access through Nginx Proxy Manager

### Application Logs
```bash
# View container logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# View specific service logs
docker logs entrix_backend
docker logs entrix_frontend
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Multi-factor Authentication**: Enhanced security with MFA
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Configurable CORS policies
- **Helmet.js**: Security headers for Express.js
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- **Documentation**: Check the [docs](./docs/) directory
- **Issues**: Create an issue on GitHub
- **Email**: Contact the development team

## 🔄 Changelog

See [CHANGELOG.md](./backend/CHANGELOG.md) for a detailed history of changes and updates.

---

**Built with ❤️ by the Entrix Team** 