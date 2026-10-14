---
title: Dockerfile
description: Write single-stage and multi-stage Dockerfiles for Node.js and FastAPI, avoid common pitfalls, and use an AI agent to generate them.
sidebar:
  order: 2
---

## Single-stage build

One `FROM`, one image. Simplest option; good for small apps and learning. The final image keeps everything used during the build.

### Node.js

```text
catalog-api/
├── Dockerfile
├── .dockerignore
├── package.json
├── package-lock.json
└── src/server.js
```

```dockerfile
# Base image: Node 22 on Alpine Linux (small, ~50 MB).
FROM node:22-alpine

# Create /app and make it the current directory for all following instructions.
WORKDIR /app

# Copy ONLY dependency manifests first. If they don't change, the next RUN is cached.
COPY package*.json ./

# Install exact versions from package-lock.json; --omit=dev skips devDependencies.
RUN npm ci --omit=dev

# Copy the app source AFTER installing deps, so code edits don't invalidate the npm cache.
COPY src ./src

# Tell Node/libraries to run in production mode.
ENV NODE_ENV=production

# Document that the app listens on 3000 (does NOT publish it to the host).
EXPOSE 3000

# Drop root: the "node" user already exists in the official image.
USER node

# Default start command, in exec form (JSON array) so signals reach Node directly.
CMD ["node", "src/server.js"]
```

```bash
# Build an image from the Dockerfile in the current dir (.) and tag it name:version.
docker build -t catalog-api:1.0 .

# Run it: --rm deletes the container on exit, --name names it,
# -p host_port:container_port publishes the port to your machine.
docker run --rm --name catalog-api -p 3000:3000 catalog-api:1.0
```

:::caution
The server must listen on `0.0.0.0`, not `127.0.0.1`, or `-p` won't reach it.
:::

### FastAPI

```text
fastapi-app/
├── Dockerfile
├── .dockerignore
├── requirements.txt
└── app/
    ├── __init__.py
    └── main.py
```

```dockerfile
# Base image: Python 3.12 "slim" Debian (small, but glibc so wheels install easily).
FROM python:3.12-slim

# Current directory for all following instructions.
WORKDIR /app

# Don't write .pyc files into the image (less clutter).
# Flush stdout/stderr immediately so `docker logs` shows output in real time.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy only the dependency list first, for layer caching.
COPY requirements.txt .

# Install dependencies; --no-cache-dir stops pip from keeping download caches in the layer.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code after deps, so code edits reuse the cached pip layer.
COPY app ./app

# Create an unprivileged user so the app doesn't run as root.
RUN useradd --create-home appuser

# Run every following instruction (and the container) as that user.
USER appuser

# Document the port uvicorn listens on.
EXPOSE 8000

# Start uvicorn: module "app.main", variable "app".
# --host 0.0.0.0 makes it reachable from outside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and tag.
docker build -t fastapi-app:1.0 .

# Run and publish 8000. Then open http://localhost:8000/docs
docker run --rm --name fastapi-app -p 8000:8000 fastapi-app:1.0
```

## Multi-stage build

Several `FROM` stages in one file. Build tools live in an early stage; only the result is copied into a small final stage. Use it when you compile, bundle, or need build-only packages. Trade-off: slightly more complex file, much smaller and safer image. Recommended for production.

### Node.js

Assumes `npm run build` outputs a runnable `dist/server.js` (TypeScript, bundler, etc.). Adjust to your framework.

```dockerfile
# ---------- Stage 1: build ----------
# Name this stage "build" so later stages can copy from it.
FROM node:22-alpine AS build

# Working directory inside the build stage.
WORKDIR /app

# Copy manifests first for caching.
COPY package*.json ./

# Install ALL dependencies (dev included): the compiler/bundler needs them.
RUN npm ci

# Copy the full source (filtered by .dockerignore).
COPY . .

# Compile/bundle into /app/dist.
RUN npm run build

# ---------- Stage 2: runtime ----------
# Fresh, clean image. Nothing from stage 1 exists here unless copied.
FROM node:22-alpine AS runtime

# Working directory for the final image.
WORKDIR /app

# Production mode.
ENV NODE_ENV=production

# Copy manifests again; this stage starts empty.
COPY package*.json ./

# Install runtime dependencies only, then clear npm's cache to shrink the layer.
RUN npm ci --omit=dev && npm cache clean --force

# Pull only the build output from stage 1. Compilers and sources are left behind.
COPY --from=build /app/dist ./dist

# Run as the unprivileged built-in user.
USER node

# Document the port.
EXPOSE 3000

# Start the compiled server.
CMD ["node", "dist/server.js"]
```

```bash
# Build the whole file (final stage is the default target).
docker build -t catalog-api:2.0 .

# Stop at the build stage only, e.g. to debug it.
docker build --target build -t catalog-api:build .

# Compare sizes: the runtime image should be much smaller than the build image.
docker images catalog-api
```

### FastAPI

Python has no compile step, but a builder stage keeps `pip`, compilers, and caches out of the final image. The trick: install into a virtualenv, then copy the whole venv.

```dockerfile
# ---------- Stage 1: builder ----------
# Name the stage "builder".
FROM python:3.12-slim AS builder

# Working directory.
WORKDIR /app

# Create an isolated virtualenv at /opt/venv. Easy to copy as one folder later.
RUN python -m venv /opt/venv

# Put the venv first on PATH so `pip` and `python` below use it.
ENV PATH="/opt/venv/bin:$PATH"

# Copy the dependency list first for caching.
COPY requirements.txt .

# Install packages into the venv.
RUN pip install --no-cache-dir -r requirements.txt

# ---------- Stage 2: runtime ----------
# Fresh slim image without pip caches or build leftovers.
FROM python:3.12-slim AS runtime

# Working directory.
WORKDIR /app

# Use the venv's executables (uvicorn lives in /opt/venv/bin).
# Unbuffered logs; no .pyc files.
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Copy the finished venv from stage 1.
COPY --from=builder /opt/venv /opt/venv

# Copy the app code.
COPY app ./app

# Unprivileged user.
RUN useradd --create-home appuser
USER appuser

# Document the port.
EXPOSE 8000

# Start the API.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run like any other image.
docker build -t fastapi-app:2.0 .
docker run --rm -p 8000:8000 fastapi-app:2.0
```

:::note
If a Python package needs compiling (e.g. `psycopg2`, `cryptography` from source), install `gcc` and headers in the **builder** stage only. The runtime stage never needs them.
:::

## Common pitfalls

Each block shows the mistake (`# BAD`) and the fix (`# GOOD`).

### Cache and context

```dockerfile
# BAD: copying everything first means ANY code change re-runs npm ci.
COPY . .
RUN npm ci

# GOOD: manifests first, install, then source. Deps stay cached.
COPY package*.json ./
RUN npm ci
COPY . .
```

```bash
# .dockerignore keeps junk and secrets out of the build context.
# Without it, node_modules, .git and .env get sent to the builder.
cat > .dockerignore <<'EOF'
node_modules
.git
.env
__pycache__
*.pyc
.venv
dist
EOF
```

### Networking

```dockerfile
# BAD: EXPOSE only documents the port. Nothing is published to the host.
EXPOSE 3000
```

```bash
# GOOD: publish at run time with -p host:container.
docker run -p 3000:3000 catalog-api:1.0
```

```bash
# BAD: binds to loopback inside the container, unreachable from the host.
uvicorn app.main:app --host 127.0.0.1

# GOOD: bind to all interfaces.
uvicorn app.main:app --host 0.0.0.0
```

### Startup and signals

```dockerfile
# BAD: shell form wraps the process in /bin/sh, which swallows SIGTERM.
# `docker stop` then waits 10 s and force-kills.
CMD node src/server.js

# GOOD: exec form (JSON array) runs the process directly as PID 1.
CMD ["node", "src/server.js"]
```

### Security

```dockerfile
# BAD: secret baked into a layer; visible to anyone via `docker history`.
ENV API_KEY=sk-12345
ARG NPM_TOKEN=abc123

# GOOD: inject secrets at run time instead.
# docker run -e API_KEY=... catalog-api:1.0   (or --env-file / orchestrator secrets)
```

```dockerfile
# BAD: no USER means the app runs as root.
CMD ["node", "src/server.js"]

# GOOD: switch to an unprivileged user first.
USER node
CMD ["node", "src/server.js"]
```

### Image size and reproducibility

```dockerfile
# BAD: floating tag; the base can change under you between builds.
FROM node:latest

# GOOD: pin a major (or exact) version.
FROM node:22-alpine
```

```dockerfile
# BAD: apt cache stays in the layer, and separate RUNs create extra layers.
RUN apt-get update
RUN apt-get install -y curl

# GOOD: one RUN, skip recommended extras, delete lists in the same layer.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

```dockerfile
# BAD: dev dependencies shipped to production.
RUN npm ci

# GOOD: production deps only (or use a multi-stage build).
RUN npm ci --omit=dev
```

## Build a Dockerfile with an AI agent

Good output needs good input. Give the agent the **purpose** (dev or prod), the **stack**, and **constraints**, then verify the result by building it.

### Step 1: collect facts the agent needs

```bash
# Let the agent see the real project layout instead of guessing.
ls -la
cat package.json          # Node: scripts, engines, entry file
cat requirements.txt      # FastAPI: dependencies
grep -rn "uvicorn\|listen(" .   # find the port and start command
```

### Step 2: use a structured prompt

```text
Write a Dockerfile for this project.

Purpose: PRODUCTION            # or DEVELOPMENT / CI / TEST
Stack: FastAPI (Python 3.12), served with uvicorn
Entry point: app/main.py, variable "app"
Port: 8000
Requirements:
- multi-stage build, slim base image, pinned versions
- non-root user
- dependency layer cached separately from source
- exec-form CMD
- no secrets in the image
- add a matching .dockerignore
Explain every line with a comment.
```

Purpose changes the output. Tell the agent which one you want:

```text
# DEV prompt: favors speed and live reload
Purpose: DEVELOPMENT
- single stage, include dev dependencies
- source mounted as a volume, auto-reload on change
- uvicorn --reload / node --watch
- no need for a non-root user or image-size tuning

# PROD prompt: favors size, security, reproducibility
Purpose: PRODUCTION
- multi-stage, runtime stage contains no build tools
- production dependencies only
- non-root user, pinned base image, HEALTHCHECK
- no reload flags, no bind mounts

# CI/TEST prompt: favors repeatability
Purpose: CI
- build a "test" stage that runs the test suite
- fail the build if tests fail
- final "runtime" stage reused for deploy
```

### Step 3: what a DEV Dockerfile looks like

```dockerfile
# Single stage; dev tools included.
FROM python:3.12-slim

# Working directory.
WORKDIR /app

# Unbuffered logs for instant output.
ENV PYTHONUNBUFFERED=1

# Cache the dependency layer.
COPY requirements.txt .

# Install deps (including dev ones, e.g. pytest).
RUN pip install --no-cache-dir -r requirements.txt

# Copy code; at run time a bind mount overrides this for live editing.
COPY . .

# Document the port.
EXPOSE 8000

# --reload restarts uvicorn when files change. Dev only: never use in prod.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

```bash
# Build the dev image.
docker build -t fastapi-app:dev .

# Mount the current folder over /app so edits on the host trigger a reload.
docker run --rm -p 8000:8000 -v "$(pwd)":/app fastapi-app:dev
```

Node equivalent: change the base to `node:22-alpine`, run `npm ci` (not `--omit=dev`), and use `CMD ["node", "--watch", "src/server.js"]`.

### Step 4: verify what the agent wrote

Never trust the first draft. Run these checks and paste any error back to the agent.

```bash
# 1. Does it build?
docker build -t myapp:test .

# 2. Does it start and respond?
docker run --rm -d --name myapp-test -p 8000:8000 myapp:test
curl -i http://localhost:8000/docs
docker logs myapp-test
docker stop myapp-test

# 3. Is it a sensible size?
docker images myapp:test

# 4. Which layers are big? Any secrets in the history?
docker history myapp:test

# 5. Does it run as non-root? (should NOT print "root")
docker run --rm myapp:test whoami

# 6. Lint the Dockerfile for known bad practices.
docker run --rm -i hadolint/hadolint < Dockerfile
```

### Step 5: iterate with a review prompt

```text
Here is my Dockerfile and the output of `docker history` and `hadolint`.
Review it for: layer caching, image size, security (root user, secrets),
and signal handling. Show a diff of the fixes and explain each change.
```

:::tip[Trade-off]
Ask the agent for one Dockerfile per purpose (`Dockerfile.dev`, `Dockerfile`) rather than one file full of conditionals. Simpler to read and review. Build with `docker build -f Dockerfile.dev -t myapp:dev .`
:::