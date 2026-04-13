# Character Engine

Interactive interview tool for MiroFish simulation characters. Built with Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
```

## Environment Variables

Required in `.env.local`:

```
LLM_API_KEY=       # API key for LLM provider
LLM_BASE_URL=      # OpenAI-compatible endpoint (e.g. LiteLLM proxy)
LLM_MODEL_NAME=    # Model identifier (e.g. claude-sonnet-4)
ZEP_API_KEY=       # Zep Cloud API key (optional — memory features degrade gracefully)
ZEP_GRAPH_ID=      # Zep graph identifier
```

## Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home — project selector
│   ├── [project]/
│   │   ├── page.tsx              # Gallery — character grid with selection
│   │   ├── chat/[characterId]/   # Solo interview
│   │   ├── confrontation/        # 1v1 moderated conversation
│   │   └── room/                 # Multi-character group chat
│   └── api/
│       ├── chat/                 # Streaming chat endpoint (SSE)
│       ├── room/                 # Group conversation endpoint
│       ├── characters/           # Character list
│       ├── memory/               # Zep memory CRUD
│       └── memory/save/          # Save exchange to Zep (background)
├── components/
│   ├── CharacterCard.tsx         # Cyberpunk agent card
│   ├── ChatInterface.tsx         # Chat UI with streaming + typing indicators
│   ├── MemoryPanel.tsx           # Memory viewer with selective forget
│   └── ui/                      # shadcn components
├── lib/
│   ├── characters.ts             # Load characters from JSON
│   ├── cyber-utils.ts            # Hex ID, role abbreviation, stance helpers
│   ├── llm.ts                    # OpenAI SDK wrapper (chat + stream)
│   ├── prompts.ts                # System prompt builder
│   ├── types.ts                  # Character, Message, Room types
│   └── zep.ts                    # Zep Cloud memory integration
├── data/
│   └── oro-verde/
│       ├── characters.json       # 14 enriched characters
│       └── meta.json             # Project metadata
scripts/
├── sync-from-mirofish.sh         # Pull exports from MiroFish Lemon
├── enrich-characters.ts          # Build enriched characters.json
├── build-key-characters.ts       # Hand-crafted key character profiles
└── process-export.ts             # Raw export → initial characters
```

## Design System — Cyberpunk Theme

The UI uses a custom cyberpunk design (exported from Banani). All pages share this visual language.

**Key CSS variables** (defined in `globals.css`):
- `--cyber-bg: #05050a` — page background
- `--cyber-accent: #00ffff` — primary cyan accent
- `--cyber-accent-dim: rgba(0, 255, 255, 0.4)` — subdued accent
- `--cyber-danger: #ff0055` — antagonist/warning red
- `--cyber-panel` / `--cyber-panel-dark` — card backgrounds
- `--cyber-border` — subtle cyan borders
- `--cyber-text` / `--cyber-text-bright` / `--cyber-muted` — text hierarchy

**Key CSS classes** (all prefixed `cyber-`):
- `.cyber-bg` — scanline grid background with radial glow
- `.cyber-card` / `.cyber-card-selected` — polygon clip-path cards with corner accents
- `.cyber-avatar` — 90x110px clipped avatar frame
- `.cyber-meta-grid` — 2-column monospace stat grid
- `.cyber-status-dot` / `.active` / `.danger` — pulsing status indicators
- `.cyber-connect-btn` — terminal-style button with `>_` prefix
- `.cyber-filter-active` — tab with glowing underline
- `.cyber-action-btn` — clip-path polygon action button
- `.cyber-glow-text` — cyan text glow

**Fonts**: Geist (body) + Geist Mono (all system/terminal text). Dark mode is forced via `dark` class on `<html>`.

**When adding new UI**: Use `var(--cyber-*)` variables. Monospace text uses `font-mono`. Clip polygon corners on interactive elements. Status dots use stance-based colors (cyan=protagonist, red=antagonist, gray=neutral).

## Conversation Modes

- **Solo**: 1-on-1 interview. Character responds in voice. Memory saved to Zep after each exchange.
- **Confrontation**: Two characters, alternating turns. User acts as moderator.
- **Room**: 2-6 characters respond sequentially to user prompts.

## Character Data Model

Each character has: `id`, `name`, `age`, `profession`, `mbti`, `faction`, `factionColor`, `stance`, `bio`, `persona`, `relationships[]`, `voiceSamples[]`, `secrets[]`, `simulationMemory`, `arc`, `stats`.

The `simulationMemory` field contains a narrative timeline of events from the MiroFish simulation that the character experienced or witnessed.

## System Prompt Structure

Built in `prompts.ts`, layered as:
1. Identity (name, age, profession, Enneagram, MBTI)
2. Psychology (persona from reality seed)
3. Relationships (with proper naming — "abuela" not "Carmen")
4. Simulation memory + report narrative
5. Secrets (what they know that others don't)
6. Voice samples (tone examples from simulation)
7. Voice rules (no asterisks, short answers, parenthetical stage directions)

## Data Pipeline

MiroFish Lemon exports live in `data/exports/oro-verde/`. To sync from the simulation engine:

```bash
./scripts/sync-from-mirofish.sh                    # default MiroFish path
./scripts/sync-from-mirofish.sh /path/to/mirofish   # custom path
```

## Oro Verde Project Context

Mexican avocado empire family drama. Carmen Serrano (matriarch) is dead. Three siblings — Benjamín (CEO), Karla (operations), Isabela (artist) — are the public face of a hidden narco operation controlled by Don Ezequiel. Ingrid Cervantes (journalist) and Emilio Vega (victim's son) are investigating. The Serranos themselves are the asset — there is NO algorithm McGuffin. Never reference an algorithm in character profiles or prompts.

## Important Rules

- **No algorithm**: The algorithm was removed from the Oro Verde pilot. The Serranos themselves are the asset. If any character profile references an algorithm, it's contaminated and must be fixed.
- **Relationship naming**: Characters use natural names — Benjamín calls his grandmother "abuela", not "Carmen". Check `relationships` for each character's naming conventions.
- **Voice rules**: No asterisks for actions. Use parenthetical stage directions. 1-3 paragraphs max. No purple prose.
- **Memory is optional**: Zep features degrade gracefully. If `ZEP_API_KEY` is missing, memory panels show "not connected" and chat works without memory.
