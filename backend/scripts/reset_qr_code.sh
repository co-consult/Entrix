#!/bin/bash

# ============================================================================
# Script: Reset Physical QR Code State
# Description: Wrapper script to reset physical QR code state using SQL scripts
# Usage: ./reset_qr_code.sh <serial_number> [database_url]
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 <serial_number> [database_url]"
    echo ""
    echo "Arguments:"
    echo "  serial_number  4-character serial number of the QR code to reset"
    echo "  database_url   Optional database connection URL (defaults to DATABASE_URL env var)"
    echo ""
    echo "Examples:"
    echo "  $0 ABCD"
    echo "  $0 ABCD postgresql://user:pass@localhost:5432/dbname"
    echo ""
    echo "For batch reset, use:"
    echo "  $0 --batch ABCD,EFGH,IJKL"
    echo "  $0 --batch ABCD,EFGH,IJKL postgresql://user:pass@localhost:5432/dbname"
}

# Function to validate serial number format
validate_serial_number() {
    local serial=$1
    if [[ ! $serial =~ ^[A-Z0-9]{4}$ ]]; then
        print_error "Invalid serial number format: $serial"
        print_error "Serial number must be exactly 4 characters (A-Z, 0-9)"
        exit 1
    fi
}

# Function to check if database is accessible
check_database() {
    local db_url=$1
    print_info "Checking database connection..."
    
    if ! psql "$db_url" -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to database with URL: $db_url"
        print_error "Please check your database connection and try again"
        exit 1
    fi
    
    print_success "Database connection successful"
}

# Function to backup database (optional)
backup_database() {
    local db_url=$1
    local backup_file="qr_code_reset_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    print_warning "Creating database backup before reset..."
    print_info "Backup file: $backup_file"
    
    if pg_dump "$db_url" > "$backup_file" 2>/dev/null; then
        print_success "Database backup created: $backup_file"
    else
        print_warning "Failed to create database backup, continuing anyway..."
    fi
}

# Function to reset single QR code
reset_single_qr_code() {
    local serial_number=$1
    local db_url=$2
    local temp_sql_file="/tmp/reset_qr_code_${serial_number}_$(date +%s).sql"
    
    print_info "Creating temporary SQL script for serial number: $serial_number"
    
    # Create temporary SQL file with the actual serial number
    sed "s/ABCD/$serial_number/g" "$(dirname "$0")/reset_qr_code_state.sql" > "$temp_sql_file"
    
    print_info "Executing SQL reset script..."
    
    if psql "$db_url" -f "$temp_sql_file"; then
        print_success "QR code reset completed successfully for serial number: $serial_number"
    else
        print_error "Failed to reset QR code for serial number: $serial_number"
        rm -f "$temp_sql_file"
        exit 1
    fi
    
    # Clean up temporary file
    rm -f "$temp_sql_file"
}

# Function to reset multiple QR codes
reset_multiple_qr_codes() {
    local serial_numbers=$1
    local db_url=$2
    local temp_sql_file="/tmp/reset_multiple_qr_codes_$(date +%s).sql"
    
    # Convert comma-separated list to SQL array format
    local sql_array="ARRAY["
    local first=true
    IFS=',' read -ra SERIALS <<< "$serial_numbers"
    for serial in "${SERIALS[@]}"; do
        if [ "$first" = true ]; then
            sql_array="${sql_array}'${serial}'"
            first=false
        else
            sql_array="${sql_array}, '${serial}'"
        fi
    done
    sql_array="${sql_array}]"
    
    print_info "Creating temporary SQL script for multiple serial numbers"
    
    # Create temporary SQL file with the actual serial numbers
    sed "s/ARRAY\['ABCD', 'EFGH', 'IJKL'\]/$sql_array/g" "$(dirname "$0")/reset_multiple_qr_codes.sql" > "$temp_sql_file"
    
    print_info "Executing SQL batch reset script..."
    
    if psql "$db_url" -f "$temp_sql_file"; then
        print_success "Batch QR code reset completed successfully"
    else
        print_error "Failed to reset QR codes"
        rm -f "$temp_sql_file"
        exit 1
    fi
    
    # Clean up temporary file
    rm -f "$temp_sql_file"
}

# Main script logic
main() {
    # Check if help is requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # Check if batch mode is requested
    if [[ "$1" == "--batch" ]]; then
        if [[ -z "$2" ]]; then
            print_error "Serial numbers required for batch mode"
            show_usage
            exit 1
        fi
        
        # Validate all serial numbers in batch
        IFS=',' read -ra SERIALS <<< "$2"
        for serial in "${SERIALS[@]}"; do
            validate_serial_number "$serial"
        done
        
        # Get database URL
        local db_url=${3:-$DATABASE_URL}
        if [[ -z "$db_url" ]]; then
            print_error "Database URL not provided and DATABASE_URL environment variable not set"
            show_usage
            exit 1
        fi
        
        print_info "Starting batch QR code reset for: $2"
        check_database "$db_url"
        backup_database "$db_url"
        reset_multiple_qr_codes "$2" "$db_url"
        
    else
        # Single QR code reset
        if [[ -z "$1" ]]; then
            print_error "Serial number required"
            show_usage
            exit 1
        fi
        
        local serial_number=$1
        validate_serial_number "$serial_number"
        
        # Get database URL
        local db_url=${2:-$DATABASE_URL}
        if [[ -z "$db_url" ]]; then
            print_error "Database URL not provided and DATABASE_URL environment variable not set"
            show_usage
            exit 1
        fi
        
        print_info "Starting QR code reset for serial number: $serial_number"
        check_database "$db_url"
        backup_database "$db_url"
        reset_single_qr_code "$serial_number" "$db_url"
    fi
    
    print_success "Reset process completed successfully!"
    print_info "Remember to clear application cache for the affected QR codes"
}

# Run main function with all arguments
main "$@" 