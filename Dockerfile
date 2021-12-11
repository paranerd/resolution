# Build Angular client
FROM node:16 AS ui-build
WORKDIR /app
COPY client/ ./
RUN npm ci
RUN npm run build

# Build server and move Angular to /dist
FROM node:16 AS server-build
WORKDIR /app
COPY --from=ui-build /app/dist ./dist
COPY server/ ./
RUN npm ci --production
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
