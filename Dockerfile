# Build client
FROM node:lts-alpine AS client-build
WORKDIR /app
COPY client/ ./
RUN npm ci
RUN npm run build

# Build server
FROM node:lts-alpine AS server-build
WORKDIR /app
COPY server/ ./
RUN npm ci
RUN npm run build

# Put everything together
FROM node:lts-alpine
WORKDIR /app
COPY --from=server-build /app/dist /app/package*.json ./
COPY --from=client-build /app/dist ./static
RUN npm ci

# Install dependencies
RUN apk --update add ffmpeg

# Set environment variables
ENV DOCKER=true
ENV PRODUCTION=true
ENV PORT=8080
ENV MEDIA_DIR=/app/media

# Listen on port 8080
EXPOSE 8080

# Start server
CMD ["node", "src/index.js"]
