#!/bin/bash

# Telegram Task Bot - Docker Runner
# This script runs the bot with proper user permissions to avoid file permission issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get current user ID and group ID
HOST_UID=$(id -u)
HOST_GID=$(id -g)

echo -e "${BLUE}🐳 Telegram Task Bot - Docker Runner${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Create .env file with your TG_BOT_TOKEN:${NC}"
    echo -e "${YELLOW}TG_BOT_TOKEN=your_bot_token_here${NC}"
    exit 1
fi

# Create users directory if it doesn't exist
mkdir -p users

echo -e "${GREEN}📋 Configuration:${NC}"
echo -e "   User ID: $HOST_UID"
echo -e "   Group ID: $HOST_GID"
echo -e "   Project Dir: $(pwd)"
echo -e "   Users Dir: $(pwd)/users"

# Function to build and run
run_bot() {
    echo -e "\n${BLUE}🔨 Building Docker image...${NC}"
    docker compose build

    echo -e "\n${BLUE}🚀 Starting bot with user permissions...${NC}"
    UID=$HOST_UID GID=$HOST_GID docker compose up -d

    echo -e "\n${GREEN}✅ Bot started successfully!${NC}"
    echo -e "${GREEN}📝 To view logs: ${NC}docker compose logs -f"
    echo -e "${GREEN}⏹️  To stop bot: ${NC}docker compose down"
}

# Function to show logs
show_logs() {
    echo -e "\n${BLUE}📋 Bot logs:${NC}"
    docker compose logs -f
}

# Function to stop bot
stop_bot() {
    echo -e "\n${YELLOW}⏹️  Stopping bot...${NC}"
    docker compose down
    echo -e "${GREEN}✅ Bot stopped${NC}"
}

# Function to restart bot
restart_bot() {
    echo -e "\n${YELLOW}🔄 Restarting bot...${NC}"
    docker compose down
    UID=$HOST_UID GID=$HOST_GID docker compose up -d
    echo -e "${GREEN}✅ Bot restarted${NC}"
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}📊 Bot status:${NC}"
    docker compose ps
    if docker compose ps | grep -q "Up"; then
        echo -e "${GREEN}✅ Bot is running${NC}"
    else
        echo -e "${RED}❌ Bot is not running${NC}"
    fi
}

# Function to clean up
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up Docker resources...${NC}"
    docker compose down -v
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Parse command line arguments
case "${1:-start}" in
    start)
        run_bot
        ;;
    logs)
        show_logs
        ;;
    stop)
        stop_bot
        ;;
    restart)
        restart_bot
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo -e "${BLUE}Usage: $0 {start|stop|restart|logs|status|cleanup}${NC}"
        echo ""
        echo -e "${YELLOW}Commands:${NC}"
        echo -e "  start    - Build and start the bot (default)"
        echo -e "  stop     - Stop the bot"
        echo -e "  restart  - Restart the bot"
        echo -e "  logs     - Show bot logs"
        echo -e "  status   - Show bot status"
        echo -e "  cleanup  - Clean up Docker resources"
        exit 1
        ;;
esac