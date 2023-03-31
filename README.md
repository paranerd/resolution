# Resolution

[![build](https://github.com/paranerd/resolution/actions/workflows/main.yml/badge.svg)](https://github.com/paranerd/resolution/actions/workflows/main.yml)
[![GitHub tag (latest SemVer)](https://img.shields.io/github/v/tag/paranerd/resolution?label=Current%20Version&logo=github)](https://github.com/paranerd/resolution/tags)
[![Docker Image Size (latest semver)](https://shields.api-test.nl:/docker/image-size/paranerd/resolution?label=Image%20Size&logo=docker)](https://hub.docker.com/repository/docker/paranerd/resolution)

Media management under your control

## Running with Docker Compose

1. [Install Docker](https://docs.docker.com/get-docker/)

1. [Install Docker Compose](https://docs.docker.com/compose/install/)

1. Save as `docker-compose.yaml`:

```yaml
version: '3'

services:
  server:
    image: paranerd/resolution
    container_name: resolution
    restart: unless-stopped
    environment:
      CAST_APP_ID: abc12345
      MEDIA_DIR: ./media
      UPLOAD_DIR: ./media/uploads
      TMP_DIR: ./media/tmp
      THUMBNAIL_DIR: ./media/thumbnails
      SECRET: change-me
    ports:
      - '8080:8080'
    depends_on:
      - mongo
    volumes:
      - ./media:/app/media
  mongo:
    container_name: resolution-db
    restart: unless-stopped
    image: mongo:4.4.18
    volumes:
      - resolution-data:/data/db

volumes:
  resolution-data:
```

Execute:
```
docker-compose up -d
```

## Development setup

1. Install [MongoDB](https://docs.mongodb.com/manual/installation/)

1. Clone repository

```
git clone https://github.com/paranerd/resolution.git
```

```
cd resolution/
```

1. Start server

```
npm run-script --prefix ./server start:dev
```

1. Start client

```
npm run-script --prefix ./client serve
```
