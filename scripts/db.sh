#!/bin/bash
# Database management script for local MongoDB Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SEED_DIR="$SCRIPT_DIR/seed-data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 {start|stop|seed|reset|logs|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start MongoDB container"
    echo "  stop    - Stop MongoDB container"
    echo "  seed    - Import seed data into database"
    echo "  reset   - Stop, remove data, restart, and re-seed"
    echo "  logs    - Show MongoDB container logs"
    echo "  status  - Show container status"
}

db_start() {
    echo -e "${GREEN}Starting MongoDB...${NC}"
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d
    echo -e "${GREEN}MongoDB is running on localhost:27017${NC}"
}

db_stop() {
    echo -e "${YELLOW}Stopping MongoDB...${NC}"
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" down
    echo -e "${GREEN}MongoDB stopped${NC}"
}

db_seed() {
    echo -e "${GREEN}Seeding database...${NC}"
    
    # Wait for MongoDB to be ready
    echo "Waiting for MongoDB to be ready..."
    sleep 2
    
    for collection in categories orders products users; do
        if [ -f "$SEED_DIR/$collection.json" ]; then
            echo "  Importing $collection..."
            docker exec -i mongodb mongoimport \
                --authenticationDatabase admin \
                -u root -p password \
                --db test \
                --collection "$collection" \
                --jsonArray \
                --drop \
                --file /dev/stdin < "$SEED_DIR/$collection.json"
        fi
    done
    
    echo -e "${GREEN}Database seeded successfully!${NC}"
}

db_reset() {
    echo -e "${YELLOW}Resetting database...${NC}"
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" down -v
    db_start
    sleep 3
    db_seed
    echo -e "${GREEN}Database reset complete!${NC}"
}

db_logs() {
    docker-compose -f "$PROJECT_DIR/docker-compose.yml" logs -f mongo
}

db_status() {
    docker ps --filter "name=mongodb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# Main
case "${1:-}" in
    start)  db_start ;;
    stop)   db_stop ;;
    seed)   db_seed ;;
    reset)  db_reset ;;
    logs)   db_logs ;;
    status) db_status ;;
    *)      print_usage; exit 1 ;;
esac
