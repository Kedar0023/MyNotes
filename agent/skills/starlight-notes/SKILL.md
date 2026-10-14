---
name: starlight-notes
description: Generate tech study/reference notes as Astro Starlight-compatible Markdown files from given topics (tools, commands, languages, concepts, setups, comparisons). Use whenever the user gives one or more tech topics and wants notes, a cheat sheet, a command reference, a guide, or documentation pages for an Astro Starlight site, even if they only say "make notes on X" while working in a Starlight project (src/content/docs/).
---

# Starlight Tech Notes Generator

Turn each topic into one `.md` file that renders correctly in Astro Starlight. Output only the files. No site code, no config changes unless asked.

## Core principle: shape the note to the topic

Never use one fixed template. Pick the note type from the topic, then use only the sections that type needs. No filler sections (no generic "Summary", "Introduction", or "Key Takeaways" unless the content genuinely benefits).

| Topic looks like | Note type | Structure |
|---|---|---|
| "docker commands", "git cheat sheet", "linux file permissions" | **Command reference** | Grouped `##` sections by task. Each command: one-line purpose, syntax, 1 real example. Common flags in a table. End with a "Gotchas" aside only if real pitfalls exist. No intro essay, no summary. |
| "closures", "event loop", "CAP theorem", "how DNS works" | **Concept** | 1-2 sentence definition, minimal example, how it works, common pitfalls. Diagram as Mermaid or ASCII if it clarifies flow. |
| "set up Postgres on Ubuntu", "deploy Astro to Cloudflare" | **How-to / Setup** | Prerequisites, numbered steps with commands, verification step, troubleshooting. |
| "REST vs GraphQL", "Bun vs Node" | **Comparison** | One-paragraph verdict first, comparison table, when to pick each. |
| "Python decorators", "React hooks" | **Language/API feature** | What it is, syntax, 3-4 progressive examples (basic → realistic), edge cases. |
| "Docker networking errors", "git merge conflicts" | **Troubleshooting** | Symptom → cause → fix, as `###` per problem. |

If the topic fits several types, combine at most two (e.g. concept + command reference). If unsure, choose the type that lets the reader act fastest.

## File rules

1. One topic = one file. Filename: lowercase kebab-case, e.g. `docker-commands.md`.
2. Location: `src/content/docs/notes/<category>/<file>.md`. Group related topics into one category folder (`docker/`, `python/`, `networking/`). If the project uses a different base path, follow it.
3. Front matter requires `title` and `description` (one sentence, under 160 chars):
Quote `title` and `description` in double quotes if they contain `: `, `#`, or start with a special character (`[`, `{`, `*`, `&`, `!`, `|`, `>`, `'`, `"`, `%`, `@`, `` ` ``). Unquoted `: ` breaks the build with "Nested mappings are not allowed".

```md
---
title: "Docker Commands"
description: "Everyday Docker CLI commands grouped by task."
sidebar:
  order: 2   # optional, only when order matters
---
```


4. No `# H1` in the body. Starlight renders `title` as the H1.
5. Use `##` and `###` only (they feed the right-hand table of contents).
6. Internal links: absolute path, no extension, e.g. `[Volumes](/notes/docker/volumes/)`. Link only to notes that exist or are generated in the same batch.

## Content rules for tech notes

- **Example over description.** Every concept or command gets a runnable example. Show realistic values, not `foo`/`bar`, when possible.
- **Show output** when it aids understanding (`docker ps` columns, error messages).
- **Tag every code fence** with a language (`bash`, `python`, `yaml`, `dockerfile`, `json`). Use `title="..."` for files, `frame="terminal"` for shell sessions.
- **Tables** for flags, options, comparisons. Not for prose.
- **Version-sensitive facts**: state the version when behavior differs (e.g. "Docker Compose v2: `docker compose`, not `docker-compose`"). Prefer current syntax; mark deprecated syntax with `:::caution`.
- **Accuracy over coverage.** If unsure a flag or behavior exists, omit it or verify via search when available. Never invent flags.
- **Omit the obvious.** Skip "what is X" paragraphs for tools the reader already uses; start with the point.
- Dangerous commands (`rm -rf`, `docker system prune -a`, `git push --force`, `DROP TABLE`) get a `:::danger` aside stating what they destroy.
- Length: as short as completeness allows. Typically 40-150 lines. Split topics that exceed ~300 lines into multiple notes.

## Starlight syntax (plain `.md`, no imports)

Asides:

```md
:::note
Neutral info.
:::

:::tip[Custom title]
Shortcut.
:::

:::caution
Pitfall or deprecation.
:::

:::danger
Destructive or risky.
:::
```

Code: ` ```js {2-3} ` highlights lines; ` ```diff ` for changes; ` ```bash frame="terminal" `.

Diagrams: ` ```mermaid ` only if the project has a Mermaid plugin; otherwise use ASCII.

Use `.mdx` (with `import { Tabs, TabItem, Steps, Card } from '@astrojs/starlight/components'`) only when the user asks for tabs, steps, or cards, or when OS/language variants (macOS/Linux/Windows) make `Tabs` clearly better.

## Workflow

1. Parse topics. If a topic is too broad for one note (e.g. "Docker"), split into 2-5 focused notes (`docker-commands`, `dockerfile`, `docker-compose`, `docker-networking`) and say so in one line.
2. Ask one clarifying question only if audience level would materially change the content. Otherwise assume intermediate developer.
3. Choose note type per topic using the table above.
4. Write all files directly into the project when a filesystem is available; otherwise output each file in its own fenced block headed by its path.
5. End with a list of created paths. Mention sidebar config only if the project lacks it:

```js
sidebar: [{ label: 'Notes', autogenerate: { directory: 'notes' } }]
```

## Example: command reference (topic: "docker commands")

````md
---
title: Docker Commands
description: Everyday Docker CLI commands grouped by task.
---

## Containers

### Run
```bash
docker run -d --name web -p 8080:80 nginx
```
Starts `nginx` detached, maps host `8080` to container `80`.

| Flag | Purpose |
|---|---|
| `-d` | Run in background |
| `-p host:container` | Publish a port |
| `--rm` | Delete container on exit |
| `-v host:container` | Mount a volume |

### Inspect and manage
```bash
docker ps -a              # all containers, including stopped
docker logs -f web        # follow logs
docker exec -it web sh    # shell inside running container
docker stop web && docker rm web
```

## Cleanup

:::danger
`docker system prune -a` removes all unused images, containers, and networks.
:::
```bash
docker system prune
```
````

Note the absence of an intro essay and summary: the reader came for commands.