---
title: Docker Compose File Reference
description: Service options, volumes, networks, env vars, healthchecks, profiles, overrides, secrets, and other Compose file features with examples.
sidebar:
  order: 4
---

## Top-level elements

| Key | Purpose |
|---|---|
| `name` | Project name (prefix for containers, networks, volumes) |
| `services` | Container definitions (required) |
| `volumes` | Named volumes |
| `networks` | Custom networks |
| `secrets` | Sensitive data mounted as files |
| `configs` | Non-sensitive config mounted as files |
| `include` | Pull in other compose files (Compose 2.20+) |

## Service options

| Option | Example | Purpose |
|---|---|---|
| `image` | `image: redis:7-alpine` | Image to pull/run |
| `build` | `build: ./app` | Build from Dockerfile |
| `command` | `command: ["npm", "start"]` | Override image `CMD` |
| `entrypoint` | `entrypoint: ["/entry.sh"]` | Override image `ENTRYPOINT` |
| `working_dir` | `working_dir: /app` | Working directory |
| `user` | `user: "1000:1000"` | Run as user |
| `ports` | `"8080:80"` | Publish to host |
| `expose` | `expose: ["3000"]` | Container-only port (no host publish) |
| `environment` | `KEY: value` | Env vars |
| `env_file` | `env_file: .env.prod` | Env vars from file |
| `volumes` | `db-data:/var/lib/data` | Mounts |
| `networks` | `networks: [backend]` | Attach to networks |
| `depends_on` | see below | Startup order |
| `restart` | `unless-stopped` | Restart policy |
| `healthcheck` | see below | Container health probe |
| `profiles` | `profiles: [debug]` | Start only when profile enabled |
| `pull_policy` | `pull_policy: always` | `always`, `missing`, `never`, `build` |
| `extra_hosts` | `"host.docker.internal:host-gateway"` | Add `/etc/hosts` entries |
| `labels` | `com.example.team: backend` | Metadata |

### Restart policies

| Value | Behavior |
|---|---|
| `no` | Never restart (default) |
| `always` | Always restart, even after daemon restart |
| `on-failure` | Restart only on non-zero exit |
| `unless-stopped` | Like `always`, except after a manual stop |

:::caution
Avoid `container_name`. It fixes the name, so `--scale` and parallel projects collide.
:::

## Ports

```yaml
ports:
  - "8080:80"             # host:container
  - "127.0.0.1:5432:5432" # bind to localhost only
  - "9000-9005:9000-9005" # range
  - "53:53/udp"           # protocol
```

:::caution
Always quote port mappings. YAML can parse unquoted `60:60`-style values as base-60 numbers.
:::

## Volumes

```yaml
services:
  app:
    volumes:
      - app-data:/data          # named volume (managed by Docker)
      - ./src:/app/src          # bind mount (host path)
      - ./conf/app.conf:/etc/app.conf:ro   # read-only
      - /tmp/cache              # anonymous volume

volumes:
  app-data:
```

Long syntax:

```yaml
    volumes:
      - type: bind
        source: ./src
        target: /app/src
        read_only: true
```

## Environment variables

Three different things share similar names:

| Mechanism | Affects | Example |
|---|---|---|
| `.env` file (project dir) | **Compose file** substitution (`${VAR}`) | `DB_PASSWORD=x` |
| `environment:` | **Container** env | `NODE_ENV: production` |
| `env_file:` | **Container** env, from file | `env_file: .env.prod` |

Substitution syntax:

| Syntax | Meaning |
|---|---|
| `${VAR}` | Value of `VAR` (empty + warning if unset) |
| `${VAR:-default}` | `default` if unset or empty |
| `${VAR-default}` | `default` only if unset |
| `${VAR:?message}` | Error with `message` if unset or empty |

```yaml
image: postgres:${PG_VERSION:-16}
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
```

Precedence for substitution: shell environment overrides `.env`. Use `--env-file other.env` to switch files.

## Networks

Default: all services join one network named `<project>_default` and resolve each other by service name.

Custom networks isolate groups of services:

```yaml
services:
  proxy:
    image: nginx
    networks: [frontend]
  api:
    image: myapi
    networks: [frontend, backend]
  db:
    image: postgres:16
    networks: [backend]     # unreachable from proxy

networks:
  frontend:
  backend:
```

Aliases:

```yaml
    networks:
      backend:
        aliases:
          - database
```

## depends_on and healthchecks

| Condition | Waits until |
|---|---|
| `service_started` | Container started (default) |
| `service_healthy` | Healthcheck passes |
| `service_completed_successfully` | Container exited with code 0 (migrations, init jobs) |

```yaml
services:
  migrate:
    image: myapp
    command: ["npm", "run", "migrate"]
    depends_on:
      db:
        condition: service_healthy

  web:
    image: myapp
    depends_on:
      migrate:
        condition: service_completed_successfully
```

Healthcheck options:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 10s       # time between checks
  timeout: 3s         # max time per check
  retries: 3          # failures before "unhealthy"
  start_period: 20s   # grace period on boot
```

## Profiles

Services with `profiles` only start when requested. Services without one always start.

```yaml
services:
  web:
    image: myapp
  adminer:
    image: adminer
    profiles: [debug]
```

```bash frame="terminal"
docker compose up -d                    # web only
docker compose --profile debug up -d    # web + adminer
```

## Secrets

Mounted read-only at `/run/secrets/<name>` inside the container.

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

:::note
The `*_FILE` convention is supported by many official images (Postgres, MySQL, MariaDB), not all. Check the image docs.
:::

## Develop: watch mode

Compose 2.22+. Sync or rebuild on file changes without bind mounts.

```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: package.json
```

Run with `docker compose watch` (or `docker compose up --watch`).

## Include other files

Compose 2.20+. Split big projects into pieces.

```yaml
include:
  - ./db/compose.yaml
  - path: ./monitoring/compose.yaml
    env_file: ./monitoring/.env
```

## Anchors and extension fields

Reuse config with YAML anchors and `x-` keys (ignored by Compose):

```yaml
x-common: &common
  restart: unless-stopped
  logging:
    driver: json-file
    options:
      max-size: "10m"
      max-file: "3"

services:
  web:
    <<: *common
    image: myapp
  worker:
    <<: *common
    image: myapp
    command: ["npm", "run", "worker"]
```
