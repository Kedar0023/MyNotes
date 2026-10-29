---
title: "Docker Notes"
description: "Quick-reference Docker notes for images, containers, Dockerfiles, Compose, and production-ready workflows."
sidebar:
  order: 0
---

| # | Note | What you'll revise |
|---|---|---|
| 1 | [Docker Commands](./commands/) | Image lifecycle, containers, logs, exec, cleanup, and common CLI commands |
| 2 | [Dockerfile](./dockerfile/) | Base image, layers, caching, environment variables, ports, and best practices |
| 3 | [.dockerignore](./dockerignore/) | Exclude build context files, keep images smaller, and avoid leaking sensitive data |
| 4 | [Docker Compose Basics](./basics-of-compose/) | Compose file structure, services, networks, volumes, env vars, and common patterns |
| 5 | [Docker Compose Reference](./docker-compose-ref/) | Service options, volumes, networks, env vars, healthchecks, profiles, overrides, and secrets |

## Quick checklist

- Build reusable images with a small, pinned base image.
- Use `docker compose` for multi-service development.
- Keep the build context lean with `.dockerignore`.
- Prefer named volumes for persistent data and publish only required ports.
- Validate logs and inspect running containers before debugging deeper.
