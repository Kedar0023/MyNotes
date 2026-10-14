---
title: "Docker Commands"
description: "Common Docker CLI commands for daily development, debugging, and interviews."
sidebar:
  order: 1
---

## Images

### List images
```bash
docker image ls
```
Lists locally available images and their tags.

### Build an image
```bash
# Build an image from the current Dockerfile
# -t catalog-api:1.0 : tag the image as catalog-api:1.0
# .                 : use the current directory as the build context
docker build -t catalog-api:1.0 .
```
Builds an image from the `Dockerfile` in the current directory and tags it `catalog-api:1.0`.

### Pull and remove images
```bash
# Download the postgres:16 image from Docker Hub
docker pull postgres:16

# Show detailed metadata about the pulled image
docker image inspect postgres:16

# Remove the local image from the machine
docker image rm postgres:16
```

| Flag | Purpose |
|---|---|
| `-t name:tag` | Set image name and tag |
| `-f Dockerfile.dev` | Select a Dockerfile |
| `--no-cache` | Build without reusing cached layers |
| `--pull` | Attempt to pull a newer base image |

## Containers

### Run a container
```bash
# Run nginx as "web" on port 8080
# --name web : name the container "web"
# -d         : run in background (detached)
# -p 8080:80 : map host port 8080 to container port 80
docker run --name web -d -p 8080:80 nginx:alpine
```
Runs Nginx in the background and publishes container port `80` on host port `8080`.

### List containers
```bash
# Show only running containers
docker ps

# Show all containers, including stopped ones
docker ps -a
```

### Logs and process status
```bash
# Show the container's logs
docker logs web

# Follow log output in real time and show the last 100 lines
docker logs -f --tail 100 web

# Show running processes inside the container
docker top web

# Display full low-level metadata for the container
docker inspect web
```

### Execute a command inside a container
```bash
# Opens a shell in a running container.
# -it : interactive terminal
# Some images provide `bash`; minimal images often provide only `sh`.
docker exec -it web sh
```

### Stop, start, restart, and remove
```bash
# Gracefully stop the container
docker stop web

# Start a stopped container again
docker start web

# Restart the container
docker restart web

# Force remove the container (does not remove the image)
# -f : force removal even if the container is still running
docker rm -f web
```


## Ports, environment, and storage

### Pass environment variables
```bash
# Run a one-off Node.js command with an environment variable set
# -e NODE_ENV=production : set the NODE_ENV environment variable
# --rm                  : remove the container automatically after it exits
# node -p ...           : print the value of process.env.NODE_ENV

docker run --rm -e NODE_ENV=production node:22-alpine
 node -p "process.env.NODE_ENV"
```

### Publish a port
```bash
# Run the API container and expose host port 3000 -> container port 3000
# -d             : run in the background
# --name api     : set container name to api
# -p 3000:3000   : publish port 3000 from host to container
docker run -d --name api -p 3000:3000 catalog-api:1.0
```
Syntax is `-p HOST_PORT:CONTAINER_PORT`.

### Mount a volume
```bash
# Start PostgreSQL with a named volume for persistent database storage
# -e POSTGRES_PASSWORD=fatcat123 : set the DB password
# -v < vol-name >:<path_inside_container > : mount named volume to DB data path

docker run -d --name db -e POSTGRES_PASSWORD=fatcat123 \
  -v pgdata:/var/lib/postgresql/data postgres:16

# A named volume persists data beyond the lifetime of the container. 
```
- the database data is stored in Docker-managed volume pgdata
- deleting the container does not automatically delete that volume
- the data stays available if you start a new container with the same volume


### List volumes
```bash
# List all Docker volumes
docker volume ls
```

### Docker networks

A Docker network connects containers so they can communicate. Containers on the same user-defined network can reach each other by container name. Networks handle communication; volumes handle persistent data.

```bash
# Create a user-defined bridge network named app-net
docker network create app-net

# Start Nginx attached to app-net and name the container web
# --network app-net : connect the container to app-net
docker run -d --name web --network app-net nginx:alpine

# Run a temporary BusyBox container on the same network and reach web by name
# --rm : remove the temporary container when the command finishes
docker run --rm --network app-net busybox ping -c 2 web

# List Docker networks
docker network ls

# Show details and attached containers for app-net
docker network inspect app-net

# Remove the network after its containers are stopped and disconnected
docker network rm app-net
```

`--network` connects a container to a network. This does not publish a port to your host; use `-p HOST_PORT:CONTAINER_PORT` when host access is needed. Docker Compose creates a project network by default, allowing services to communicate using their service names.

## Compose

### Start and inspect a multi-container app

You need a Compose file, such as `compose.yaml` or `docker-compose.yml`, for multi-container apps. The following commands assume a Compose file with a `server` service.

```bash
# Build and start the services in the background
# -d          : detached mode
# --build     : rebuild images before starting
# up          : create/start services defined in docker-compose.yml
docker compose up -d --build

# Show running services for the current Compose project
docker compose ps

# Follow logs for the server service
docker compose logs -f server

# Open a shell inside the running server container
docker compose exec server sh

# Stop and remove containers/networks for the project
docker compose down

# Also remove Compose-managed named volumes
docker compose down -v	

# Validate and render the resolved Compose configuration
docker compose config
```

## Cleanup

```bash
# Remove stopped containers no longer in use
docker container prune

# Remove unused images
docker image prune

# Remove builder cache
docker builder prune

# Show Docker disk usage summary
docker system df
```

:::danger
`docker system prune -a --volumes` can remove all unused containers, networks, images, build cache, and volumes. Volumes may contain database data. Inspect what will be removed before confirming.
:::

