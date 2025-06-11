# Use Node.js LTS version
FROM node:18-alpine

# Install curl for health checks and set system timeouts
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Set Node.js timeout environment variables
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV TIMEOUT_REQUEST=60000
ENV TIMEOUT_SOCKET=70000

# Copy package files
COPY package*.json ./

# Install dependencies with extended timeout
RUN npm config set fetch-timeout 600000 && npm install --omit=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check with increased timeout
HEALTHCHECK --interval=30s --timeout=15s --start-period=10s --retries=3 \
  CMD curl -f --max-time 10 http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"] 