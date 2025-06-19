# Torvan Medical CleanStation - Home Database Setup

This directory contains everything needed to set up the complete CleanStation production workflow database on your home computer PostgreSQL instance.

## 📋 Contents

- `01-consolidated-migration.sql` - Complete database schema with all enhancements
- `02-comprehensive-seed.js` - Complete data seeding script
- `03-sample-data.sql` - Sample orders and workflow data (optional)
- `package.json` - Node.js dependencies for seeding
- `README.md` - This setup guide

## 🛠️ Prerequisites

### 1. PostgreSQL Installation
- PostgreSQL 12+ installed and running
- Database created (e.g., `torvan-cleanstation`)
- User with full database privileges

### 2. Node.js Setup
- Node.js 16+ installed
- npm or yarn package manager

### 3. Environment Configuration
Create a `.env` file in your project root:
```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/torvan-cleanstation?schema=public"

# JWT and Auth Configuration
JWT_SECRET="your-secure-jwt-secret-key-here"
NEXTAUTH_SECRET="your-secure-nextauth-secret-key-here"
NEXTAUTH_URL="http://localhost:3005"

# Application Configuration
NODE_ENV="development"
PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3005"

# Development Flags
SKIP_AUTH_IN_DEV=false
AUTO_LOGIN_DEV_USER=admin
DEBUG_AUTH=true
```

## 🚀 Installation Steps

### Step 1: Install Dependencies
```bash
# Install the seeding dependencies
npm init -y
npm install @prisma/client bcryptjs prisma
```

### Step 2: Apply Database Schema
Connect to your PostgreSQL database and run the consolidated migration:

```bash
# Using psql command line
psql -U username -d torvan-cleanstation -f 01-consolidated-migration.sql

# Or using your preferred PostgreSQL client
# Import and execute 01-consolidated-migration.sql
```

### Step 3: Generate Prisma Client
```bash
# Copy your prisma schema file to the setup directory if needed
npx prisma generate
```

### Step 4: Run Comprehensive Seeding
```bash
# Set your database URL and run the seeder
export DATABASE_URL="postgresql://username:password@localhost:5432/torvan-cleanstation"
node 02-comprehensive-seed.js
```

### Step 5: Verify Installation
The seeding script will output a summary showing:
- ✅ Users created (8 users with different roles including 3 assemblers)
- ✅ Categories and subcategories (6 categories, 46+ subcategories)
- ✅ QC Templates (4 templates with 150+ checklist items)
- ✅ Work instructions and tools
- ✅ Sample data for testing

## 👥 Default User Accounts

After seeding, you'll have these test accounts:

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| `admin` | `password123` | ADMIN | System administrator |
| `coordinator` | `password123` | PRODUCTION_COORDINATOR | Manages production workflow |
| `qc` | `password123` | QC_PERSON | Quality control inspector |
| `assembler` | `password123` | ASSEMBLER | Main assembly technician |
| `assembler1` | `password123` | ASSEMBLER | Production Assembler 1 |
| `assembler2` | `password123` | ASSEMBLER | Production Assembler 2 |
| `procurement` | `password123` | PROCUREMENT_SPECIALIST | Parts and sourcing |
| `service` | `password123` | SERVICE_DEPARTMENT | Service parts management |

## 📊 Database Features Included

### ✅ Complete Schema
- **35+ data models** with comprehensive relationships
- **Enhanced Part/Assembly models** with revision tracking and custom attributes
- **QC system** with multi-media attachments
- **Task management** with templates and workflows
- **Order management** with configuration tracking
- **Inventory tracking** with transactions
- **User management** with role-based access
- **Audit logging** and notifications

### ✅ Production Data
- **284 Parts** with specifications and metadata
- **334 Assemblies** with full BOM hierarchies
- **6 Categories** with 46 subcategories
- **Comprehensive QC templates** including Pre-Production Check with 29 inspection points
- **Work instructions** and tool definitions
- **Sample workflow data** for testing

### ✅ Enhanced Features
- **Multi-media QC attachments** (photos, videos, audio, documents)
- **Basin-specific checklist repetition** for multi-basin sinks
- **Conditional QC items** based on configuration (E-Sink vs E-Drain)
- **Document reference system** for drawings and PO access during QC
- **Fixed unique constraint issues** - multiple faucets per build number supported
- **Navigation enhancements** with breadcrumbs and status validation

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify database exists
psql -U username -l | grep torvan
```

**2. Permission Denied**
```bash
# Grant privileges to your user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE \"torvan-cleanstation\" TO username;"
```

**3. Prisma Client Not Found**
```bash
# Regenerate Prisma client
npx prisma generate
```

**4. Seeding Fails**
```bash
# Check database URL format
echo $DATABASE_URL

# Verify schema was applied
psql -U username -d torvan-cleanstation -c "\\dt"
```

## 📁 Project Structure After Setup

```
your-project/
├── prisma/
│   ├── schema.prisma         # Generated from migration
│   └── migrations/           # Migration history
├── node_modules/             # Dependencies
├── .env                      # Environment configuration
├── package.json              # Project dependencies
└── setup-home-database/      # This setup directory
    ├── 01-consolidated-migration.sql
    ├── 02-comprehensive-seed.js
    └── README.md
```

## 🧪 Testing Your Setup

### 1. Verify Database Structure
```sql
-- Check table count (should be 40+ tables)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check user accounts
SELECT username, role, "fullName" FROM "User";

-- Check QC templates
SELECT name, description FROM "QcFormTemplate";
```

### 2. Test Application Workflow
1. **Order Creation**: Create a test order with multiple build numbers
2. **QC Process**: Access Pre-QC checklist and test media attachments
3. **Document Access**: Verify drawings and PO viewing during QC
4. **Role Access**: Test different user roles and permissions

### 3. Performance Verification
```sql
-- Check indexing (should show multiple indexes)
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verify foreign key constraints
SELECT COUNT(*) FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';
```

## 🔄 Next Steps

After successful setup:

1. **Configure Application**: Update your Next.js app to use the new database
2. **Test Workflows**: Run through complete order-to-QC workflows
3. **Customize Data**: Add your specific parts, assemblies, and QC requirements
4. **Production Setup**: When ready, migrate to production with proper security
5. **Backup Strategy**: Implement regular database backups

## 🆘 Support

If you encounter issues:

1. **Check Logs**: Review PostgreSQL logs for detailed error messages
2. **Verify Prerequisites**: Ensure all requirements are met
3. **Test Connectivity**: Verify database connection and permissions
4. **Schema Validation**: Confirm all tables and relationships exist

## 📝 Notes

- This setup includes **all enhancements** from the working system
- **Unique constraint issues** have been resolved
- **Revision tracking** is fully implemented
- **Media attachments** for QC are configured
- **Navigation and workflow** improvements are included

Your CleanStation database is now ready for development and testing! 🎉