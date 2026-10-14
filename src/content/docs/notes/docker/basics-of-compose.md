---
title: How to Make a Docker Compose File
description: Build a compose.yaml step by step for a web app with a database and cache, then run and verify it.
sidebar:
  order: 3
---

Compose describes a multi-container app in one YAML file, so `docker compose up` replaces a pile of `docker run` commands.

:::note
Compose v2 ships as a Docker plugin: use `docker compose` (space), not `docker-compose`. The `version:` key is obsolete; omit it.
:::

## Prerequisites

```bash frame="terminal"
docker compose version
# Docker Compose version v2.x.x
```

Project layout used below:

```text
myapp/
├── compose.yaml
├── Dockerfile
├── .env
└── src/
```

File name: `compose.yaml` is preferred. `compose.yml`, `docker-compose.yaml`, and `docker-compose.yml` are also found automatically.

## Steps

### 1. Define one service

Every file starts with `services:`. Each key under it is a service (one container definition).

```yaml title="compose.yaml"
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
```

Run it: `docker compose up -d`, then open `http://localhost:8080`.

### 2. Build your own image instead of pulling

Replace `image` with `build` to use your Dockerfile.

```yaml title="compose.yaml"
services:
  web:
    build: .            # context = current dir, uses ./Dockerfile
    ports:
      - "3000:3000"
```

Long form when you need more control:

```yaml
    build:
      context: ./app
      dockerfile: Dockerfile.dev
      args:
        NODE_ENV: development
```

### 3. Add environment variables

```yaml
    environment:
      NODE_ENV: production
      PORT: 3000
```

Or load from a file:

```yaml
    env_file:
      - .env
```

### 4. Add a database with persistent storage

Named volumes survive `docker compose down`. Declare them at the top level and mount them in the service.

```yaml
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data

volumes:
  db-data:
```

### 5. Connect services by name

Compose creates a default network. Services reach each other by **service name** as hostname.

```yaml
  web:
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app   # "db" = service name
```

:::caution
Inside the network use the container port (`5432`), not a published host port. `localhost` inside a container means that container itself.
:::

### 6. Wait for the database to be ready

`depends_on` alone only waits for the container to *start*. Add a healthcheck and use `condition: service_healthy`.

```yaml
  web:
    depends_on:
      db:
        condition: service_healthy

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 5
```

### 7. Add restart policy and a cache

```yaml
  web:
    restart: unless-stopped

  cache:
    image: redis:7-alpine
```

## Complete file

```yaml title="compose.yaml"
name: myapp

services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://app:${DB_PASSWORD}@db:5432/app
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: app
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d app"]
      interval: 5s
      timeout: 3s
      retries: 5

  cache:
    image: redis:7-alpine

volumes:
  db-data:
```

```ini title=".env"
DB_PASSWORD=change-me
```

Compose reads `.env` automatically and substitutes `${DB_PASSWORD}`.

:::danger
Add `.env` to `.gitignore`. Never commit real secrets.
:::

## Run and verify

```bash frame="terminal"
docker compose config        # validate and print resolved file
docker compose up -d --build # build and start in background
docker compose ps
```

```text
NAME             SERVICE   STATUS                   PORTS
myapp-cache-1    cache     running                  6379/tcp
myapp-db-1       db        running (healthy)        5432/tcp
myapp-web-1      web       running                  0.0.0.0:3000->3000/tcp
```

```bash frame="terminal"
docker compose logs -f web
docker compose down
```

## Troubleshooting

### `yaml: line N: mapping values are not allowed`
Indentation error. Use spaces only (2 per level), never tabs. Run `docker compose config` to locate it.

### Service can't reach `localhost:5432`
Use the service name (`db`) as host, not `localhost`.

### App starts before DB is ready
Add a `healthcheck` and `depends_on.condition: service_healthy` (step 6).

### Port already allocated
Another process uses the host port. Change the left side: `"3001:3000"`.

### Variable is blank
`WARN The "DB_PASSWORD" variable is not set`. Check `.env` is in the same directory you run the command from, or pass `--env-file`.

