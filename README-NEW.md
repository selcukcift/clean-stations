# Torvan Medical CleanStation Workflow Application

A comprehensive workflow application for managing CleanStation sink configuration, BOM generation, and production processes using Next.js, Node.js, Prisma ORM, and PostgreSQL.

## 🏗️ Architecture

- **Frontend**: Next.js with App Router (planned)
- **Backend**: Plain Node.js (no Express.js)
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: ShadCN UI (planned)
- **Styling**: Tailwind CSS (planned)
- **State Management**: Zustand with Immer (planned)
- **Animations**: Framer Motion (planned)

## 📁 Project Structure

```
d:\Clean-stations\
├── src/
│   ├── api/               # API route handlers
│   │   ├── assembliesHandlers.js
│   │   ├── bomHandlers.js
│   │   ├── categoriesHandlers.js
│   │   └── partsHandlers.js
│   ├── lib/               # Utilities and helpers
│   │   ├── requestUtils.js
│   │   └── router.js
│   ├── services/          # Business logic
│   │   └── bomService.js
│   ├── config/            # Configuration management
│   │   ├── database.js
│   │   ├── environment.js
│   │   └── index.js
│   └── server.js          # Main server file
├── scripts/
│   └── seed.js            # Database seeding script
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── resources/             # Data files and documentation
│   ├── parts.json
│   ├── assemblies.json
│   ├── categories.json
│   └── ...
├── app.js                 # Legacy frontend configurator
├── sink-config.js         # Legacy sink configuration logic
├── accessories.js         # Legacy accessories logic
├── bom-generator.js       # Legacy BOM generation logic
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clean-stations
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and configuration.

4. **Set up the database**
   ```bash
   # Create the database (if not exists)
   createdb torvan-db
   
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database with initial data
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:3001`

## 📊 Database Schema

The application uses the following main models:

- **Part**: Individual components and materials
- **Assembly**: Complex assemblies containing multiple parts
- **AssemblyComponent**: Junction table for assembly-part relationships
- **Category/Subcategory**: Hierarchical organization of assemblies
- **User**: System users with role-based access (planned)
- **Order**: Customer orders and configurations (planned)
- **BOM**: Bill of Materials structures (planned)

## 🔧 API Endpoints

### Parts
- `GET /api/parts` - List all parts with filtering and pagination
- `GET /api/parts/:partId` - Get specific part details

### Assemblies
- `GET /api/assemblies` - List all assemblies with components
- `GET /api/assemblies/:assemblyId` - Get specific assembly details

### Categories
- `GET /api/categories` - List all categories with subcategories and assemblies

### BOM Generation
- `POST /api/bom/generate` - Generate BOM for order configuration

## 🛠️ Configuration

The application uses a centralized configuration system located in `src/config/`:

- **database.js**: Database connection and Prisma client management
- **environment.js**: Environment-specific settings and validation
- **index.js**: Main configuration export

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3001 |
| `HOST` | Server host | localhost |
| `NODE_ENV` | Environment (development/production/test) | development |
| `JWT_SECRET` | JWT signing secret | Required for auth |
| `CORS_ORIGINS` | Allowed CORS origins | localhost:3000,localhost:3001 |

## 🏃‍♂️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with initial data |

## 🔐 Security Features

- Environment variable validation
- CORS configuration
- Request body parsing with size limits
- Graceful shutdown handling
- Input validation (planned)
- JWT authentication (planned)
- Role-based authorization (planned)

## 📋 Development Status

### ✅ Completed (Chain 1)
- [x] Plain Node.js backend setup
- [x] Prisma ORM integration
- [x] PostgreSQL database schema
- [x] Data migration and seeding
- [x] Product data APIs (Parts, Assemblies, Categories)
- [x] BOM generation service
- [x] Centralized configuration management
- [x] Error handling and logging
- [x] CORS support

### 🚧 In Progress
- [ ] User authentication and authorization (Chain 2)
- [ ] Order creation workflow (Chain 3)
- [ ] Next.js frontend development
- [ ] Advanced BOM management
- [ ] Production workflow features

### 📅 Planned
- [ ] ShadCN UI integration
- [ ] Zustand state management
- [ ] Framer Motion animations
- [ ] Unit and integration tests
- [ ] API documentation
- [ ] Production deployment

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📚 Documentation

- **PRD**: `resources/Torvan Medical CleanStation Production Workflow Digitalization.md`
- **Configuration Guide**: `resources/sink configuration and bom.txt`
- **Production Checklist**: `resources/CLP.T2.001.V01 - T2SinkProduction.docx`
- **Prompt Chains**: `resources/Coding Prompt Chains for Torvan Medical Workflow App Expansion (v4 - Next.js, Node.js, Prisma, PostgreSQL)`

## 🔧 Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Ensure database exists: `createdb torvan-db`

### Server Start Issues
1. Check port availability
2. Verify environment variables
3. Check Node.js version compatibility

### Seeding Issues
1. Run migrations first: `npm run prisma:migrate`
2. Check data file paths in `scripts/seed.js`
3. Verify database permissions

## 📄 License

[Add license information]
