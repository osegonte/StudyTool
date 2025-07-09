#!/bin/bash

echo "🗄️ Running Stage 5 database migrations..."

# Get current user for database connection
CURRENT_USER=${USER:-${USERNAME:-postgres}}

# Database connection details
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-study_planner}
DB_USER=${DB_USER:-$CURRENT_USER}

echo "Connecting to database as user: $DB_USER"

# Run migration
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/migrations/006_note_taking_system.sql

if [ $? -eq 0 ]; then
    echo "✅ Stage 5 database migration completed successfully"
else
    echo "❌ Stage 5 database migration failed"
    exit 1
fi
