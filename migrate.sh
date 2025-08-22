#!/bin/bash

# Migration script for Hasura GraphQL Postgres database
# This script runs Hasura migrations against the Postgres database running in Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color


# Configuration
HASURA_GRAPHQL_ADMIN_SECRET="myadminsecretkey"
HASURA_ENDPOINT="http://localhost:8081"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HASURA_DIR="$PROJECT_ROOT/hasura"

echo -e "${GREEN}🚀 Hasura Migration Script${NC}"
echo "Project root: $PROJECT_ROOT"
echo "Hasura directory: $HASURA_DIR"
echo "Endpoint: $HASURA_ENDPOINT"
echo ""

# Check if Docker Compose services are running
echo -e "${YELLOW}📋 Checking Docker Compose services...${NC}"
if ! docker compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Docker Compose services are not running${NC}"
    echo -e "${YELLOW}💡 Starting Docker Compose services...${NC}"
    docker compose up -d
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 10
else
    echo -e "${GREEN}✅ Docker Compose services are running${NC}"
fi

# Wait for Hasura to be ready
echo -e "${YELLOW}⏳ Waiting for Hasura GraphQL Engine to be ready...${NC}"
timeout=30
count=0
while ! curl -s "$HASURA_ENDPOINT/healthz" > /dev/null; do
    if [ $count -ge $timeout ]; then
        echo -e "${RED}❌ Hasura GraphQL Engine failed to start within $timeout seconds${NC}"
        exit 1
    fi
    echo "Waiting for Hasura... ($count/$timeout)"
    sleep 1
    ((count++))
done
echo -e "${GREEN}✅ Hasura GraphQL Engine is ready${NC}"

# Check if Hasura CLI is available
if ! command -v hasura &> /dev/null; then
    echo -e "${RED}❌ Hasura CLI is not installed${NC}"
    echo -e "${YELLOW}💡 Please install Hasura CLI:${NC}"
    echo "curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash"
    echo "Or visit: https://hasura.io/docs/latest/graphql/core/hasura-cli/install-hasura-cli.html"
    exit 1
fi

# Change to hasura directory
cd "$HASURA_DIR"

echo -e "${YELLOW}🔄 Running Hasura migrations...${NC}"
HASURA_GRAPHQL_ADMIN_SECRET="$HASURA_GRAPHQL_ADMIN_SECRET" \
    hasura migrate apply \
    --endpoint "$HASURA_ENDPOINT" \
    --admin-secret "$HASURA_GRAPHQL_ADMIN_SECRET"

echo -e "${YELLOW}📋 Applying metadata...${NC}"
HASURA_GRAPHQL_ADMIN_SECRET="$HASURA_GRAPHQL_ADMIN_SECRET" \
    hasura metadata apply \
    --endpoint "$HASURA_ENDPOINT" \
    --admin-secret "$HASURA_GRAPHQL_ADMIN_SECRET"

echo -e "${GREEN}✅ Migration completed successfully!${NC}"
echo -e "${YELLOW}🌐 Hasura Console: http://localhost:8081${NC}"
echo -e "${YELLOW}🗄️  GraphQL Endpoint: http://localhost:8081/v1/graphql${NC}"
