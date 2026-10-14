---
title: ".dockerignore"
description: "Exclude local, sensitive, and unnecessary files from the Docker build context."
sidebar:
  order: 3
---

## Create `.dockerignore`

Place `.dockerignore` at the root of the build context, next to the Dockerfile in the usual setup. Patterns are evaluated relative to the build context.

### Node.js application example

```dockerignore
node_modules
npm-debug.log*
.DS_Store
.git
.gitignore
.env
.env.*
!.env.example
coverage
dist
build
*.log
```

This excludes installed host dependencies, local environment files, logs, and generated output while allowing a safe `.env.example` template.

## Why it matters

- Reduces the amount of data sent to the builder.
- Prevents local dependencies from overwriting container-installed dependencies.
- Avoids accidentally copying credentials into image layers.
- Improves build speed and cache behavior.

## Verify the effect

```bash
docker build --no-cache -t catalog-api:check .
```

To verify a file was not copied, inspect the resulting image or run a container with a shell:

```bash
docker run --rm --entrypoint sh catalog-api:check -c 'ls -la /app'
```

The file is excluded from the build context, so `COPY` cannot copy it from that context.

:::caution
`.dockerignore` is not a replacement for secret management. Do not commit real credentials, and do not pass secrets as build arguments or bake them into an image.
:::
