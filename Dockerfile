# Build client
FROM node:lts-alpine AS client-build
WORKDIR /app
COPY client/ ./
RUN npm ci
RUN npm run build

# Build server and move client to /dist
FROM node:lts-alpine AS server-build
WORKDIR /app
COPY --from=client-build /app/dist ./dist
COPY server/ ./
RUN npm ci --production

# Install dependencies
RUN apt-get update -y
RUN apt-get install -y ffmpeg

# Set environment variables
ENV DOCKER=true
ENV PRODUCTION=true
ENV PORT=8080
ENV MEDIA_DIR=/app/media

# Listen on port 8080
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
