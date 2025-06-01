# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Accept build argument for API key
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy frontend source
COPY . .

# Build frontend with environment variable
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies plus typescript for runtime
RUN npm ci --only=production --ignore-scripts && npm install typescript tsx && npm cache clean --force

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/dist ./dist

# Copy server source
COPY server ./server
COPY types.ts ./

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN chown -R appuser:appgroup /app
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the server with tsx (modern TypeScript runner)
CMD ["npx", "tsx", "server/index.ts"] 