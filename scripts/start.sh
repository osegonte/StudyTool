#!/bin/bash

# 🚀 Local Study Planner - Start Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

kill_port() {
    if check_port $1; then
        print_status "Killing process on port $1..."
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

check_postgres() {
    pg_isready -q 2>/dev/null
}

start_backend() {
    print_status "Starting backend server..."
    
    if [ ! -d "backend/node_modules" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    kill_port 3001
    
    cd backend
    npm start &
    BACKEND_PID=$!
    cd ..
    
    sleep 5
    
    if check_port 3001; then
        print_success "Backend started on http://localhost:3001"
    else
        print_error "Backend failed to start!"
        exit 1
    fi
}

start_frontend() {
    print_status "Starting frontend server..."
    
    if [ ! -d "frontend/node_modules" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    kill_port 3000
    
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    sleep 10
    
    if check_port 3000; then
        print_success "Frontend started on http://localhost:3000"
    else
        print_error "Frontend failed to start!"
        exit 1
    fi
}

cleanup() {
    print_status "Stopping services..."
    
    [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    
    kill_port 3000
    kill_port 3001
    
    print_success "Services stopped."
    exit 0
}

main() {
    if ! check_postgres; then
        print_error "PostgreSQL is not running!"
        exit 1
    fi
    
    case "${1:-}" in
        "backend")
            start_backend
            print_status "Press Ctrl+C to stop..."
            trap 'kill_port 3001; exit 0' INT
            wait
            ;;
        "frontend")
            start_frontend
            print_status "Press Ctrl+C to stop..."
            trap 'kill_port 3000; exit 0' INT
            wait
            ;;
        *)
            start_backend
            start_frontend
            
            print_success "Both services are running!"
            print_status "Frontend: http://localhost:3000"
            print_status "Backend:  http://localhost:3001/api/health"
            print_status ""
            print_status "Press Ctrl+C to stop both services..."
            
            trap 'cleanup' INT
            while true; do sleep 1; done
            ;;
    esac
}

main "$@"
