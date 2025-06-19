#!/bin/bash

# =============================================================================
# TORVAN MEDICAL CLEANSTATION - AUTOMATED DATABASE SETUP
# =============================================================================
# 
# This script automates the complete database setup process for your home
# PostgreSQL installation.
# 
# Prerequisites:
# - PostgreSQL installed and running
# - Database created
# - User with appropriate privileges
# 
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
# 
# =============================================================================

set -e  # Exit on any error

echo "🚀 Torvan Medical CleanStation - Database Setup"
echo "=============================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required files exist
check_files() {
    print_info "Checking required files..."
    
    if [ ! -f "01-consolidated-migration.sql" ]; then
        print_error "Migration file not found: 01-consolidated-migration.sql"
        exit 1
    fi
    
    if [ ! -f "02-comprehensive-seed.js" ]; then
        print_error "Seed script not found: 02-comprehensive-seed.js"
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_error "Package file not found: package.json"
        exit 1
    fi
    
    print_status "All required files found"
}

# Check if DATABASE_URL is set
check_database_url() {
    print_info "Checking database configuration..."
    
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set. Please provide database connection details:"
        echo ""
        read -p "Database host (default: localhost): " DB_HOST
        DB_HOST=${DB_HOST:-localhost}
        
        read -p "Database port (default: 5432): " DB_PORT
        DB_PORT=${DB_PORT:-5432}
        
        read -p "Database name: " DB_NAME
        if [ -z "$DB_NAME" ]; then
            print_error "Database name is required"
            exit 1
        fi
        
        read -p "Database username: " DB_USER
        if [ -z "$DB_USER" ]; then
            print_error "Database username is required"
            exit 1
        fi
        
        read -s -p "Database password: " DB_PASS
        echo ""
        
        if [ -z "$DB_PASS" ]; then
            print_error "Database password is required"
            exit 1
        fi
        
        export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"
    fi
    
    print_status "Database configuration ready"
}

# Test database connection
test_connection() {
    print_info "Testing database connection..."
    
    # Extract connection details from DATABASE_URL
    if command -v psql >/dev/null 2>&1; then
        # Test connection with psql if available
        if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
            print_status "Database connection successful"
        else
            print_error "Failed to connect to database. Please check your credentials."
            exit 1
        fi
    else
        print_warning "psql not found. Skipping connection test."
    fi
}

# Install Node.js dependencies
install_dependencies() {
    print_info "Installing Node.js dependencies..."
    
    if ! command -v npm >/dev/null 2>&1; then
        print_error "npm not found. Please install Node.js first."
        exit 1
    fi
    
    npm install
    print_status "Dependencies installed"
}

# Apply database schema
apply_schema() {
    print_info "Applying database schema..."
    
    if command -v psql >/dev/null 2>&1; then
        if psql "$DATABASE_URL" -f "01-consolidated-migration.sql" >/dev/null 2>&1; then
            print_status "Database schema applied successfully"
        else
            print_error "Failed to apply database schema"
            exit 1
        fi
    else
        print_warning "psql not found. Please apply 01-consolidated-migration.sql manually."
        read -p "Press Enter when schema has been applied..."
    fi
}

# Generate Prisma client
generate_client() {
    print_info "Generating Prisma client..."
    
    if npm run generate >/dev/null 2>&1; then
        print_status "Prisma client generated"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

# Run comprehensive seeding
run_seeding() {
    print_info "Running comprehensive database seeding..."
    
    if node 02-comprehensive-seed.js; then
        print_status "Database seeding completed successfully"
    else
        print_error "Database seeding failed"
        exit 1
    fi
}

# Apply sample data (optional)
apply_sample_data() {
    print_info "Would you like to apply sample data for testing? (y/n)"
    read -p "Apply sample data: " APPLY_SAMPLE
    
    if [ "$APPLY_SAMPLE" = "y" ] || [ "$APPLY_SAMPLE" = "Y" ]; then
        if [ -f "03-sample-data.sql" ]; then
            print_info "Applying sample data..."
            if command -v psql >/dev/null 2>&1; then
                if psql "$DATABASE_URL" -f "03-sample-data.sql" >/dev/null 2>&1; then
                    print_status "Sample data applied successfully"
                else
                    print_warning "Sample data application had some issues, but continuing..."
                fi
            else
                print_warning "psql not found. Please apply 03-sample-data.sql manually if needed."
            fi
        else
            print_warning "Sample data file not found. Skipping..."
        fi
    else
        print_info "Skipping sample data"
    fi
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."
    
    # Create a simple verification script
    cat > verify.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        const userCount = await prisma.user.count();
        const categoryCount = await prisma.category.count();
        const qcTemplateCount = await prisma.qcFormTemplate.count();
        
        console.log(`✅ Users: ${userCount}`);
        console.log(`✅ Categories: ${categoryCount}`);
        console.log(`✅ QC Templates: ${qcTemplateCount}`);
        
        if (userCount > 0 && categoryCount > 0 && qcTemplateCount > 0) {
            console.log('🎉 Installation verification successful!');
        } else {
            console.log('❌ Installation verification failed - missing data');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
EOF

    if node verify.js; then
        rm verify.js
        print_status "Installation verified successfully"
    else
        rm verify.js
        print_error "Installation verification failed"
        exit 1
    fi
}

# Main setup process
main() {
    echo "Starting automated setup process..."
    echo ""
    
    check_files
    check_database_url
    test_connection
    install_dependencies
    apply_schema
    generate_client
    run_seeding
    apply_sample_data
    verify_installation
    
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "📊 Your CleanStation database is ready with:"
    echo "   • Complete schema with all enhancements"
    echo "   • 6+ user accounts with different roles"
    echo "   • 280+ parts and 330+ assemblies"
    echo "   • Comprehensive QC templates"
    echo "   • Sample workflow data (if selected)"
    echo ""
    echo "🔐 Default login credentials:"
    echo "   Username: admin, Password: password123 (Admin)"
    echo "   Username: qc, Password: password123 (QC Person)"
    echo "   Username: coordinator, Password: password123 (Production Coordinator)"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Configure your application's DATABASE_URL"
    echo "   2. Test the complete workflow from order to QC"
    echo "   3. Customize data for your specific requirements"
    echo ""
    print_status "Setup complete! Your CleanStation database is ready for use."
}

# Run main function
main