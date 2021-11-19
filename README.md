# Resolution

Self-hosted Photo Management.

## Development setup

1. Install MongoDB

   - Check [this guide](https://docs.mongodb.com/manual/installation/) on how to intall.

1. Clone repository

```
git clone https://github.com/paranerd/resolution.git
```

```
cd resolution/
```

1. Start server

```
npm run-script --prefix ./server start
```

1. Start client

```
npm run-script --prefix ./client start
```

## Production setup

1. [Install Docker](https://docs.docker.com/get-docker/)

1. [Install Docker Compose](https://docs.docker.com/compose/install/)

1. Run Resolution

```
docker-compose up -d
```
