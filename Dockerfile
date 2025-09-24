# Telegram Task Bot - Docker Container
FROM oven/bun:1-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY src ./src
COPY tsconfig.json ./
COPY eslint.config.js ./
COPY prettier.config.js ./

# Create users directory for task storage
RUN mkdir -p users

# Build the application
RUN bun run build

# Set proper permissions for the app directory
# Using numeric UID/GID for compatibility
RUN chmod -R 755 /app && \
    chmod -R 777 /app/users

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the bot
CMD ["bun", "run", "dist/index.js"]