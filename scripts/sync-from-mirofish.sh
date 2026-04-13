#!/bin/bash
# sync-from-mirofish.sh — Pull simulation exports from MiroFish Lemon into Character Engine
#
# Usage:
#   ./scripts/sync-from-mirofish.sh                          # uses default paths
#   ./scripts/sync-from-mirofish.sh /path/to/mirofish        # custom MiroFish path
#   MIROFISH_DIR=/path/to/mirofish ./scripts/sync-from-mirofish.sh

set -euo pipefail

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_ROOT="$(dirname "$SCRIPT_DIR")"
MIROFISH_DIR="${1:-${MIROFISH_DIR:-/Users/quantumcode/CODE/MIROFISH LEMON}}"
PROJECT="oro-verde"

EXPORT_SRC="$MIROFISH_DIR/oro-verde-sim-export"
EXPORT_DST="$ENGINE_ROOT/data/exports/$PROJECT"

echo "=== MIROFISH → CHARACTER ENGINE SYNC ==="
echo "  Source:  $EXPORT_SRC"
echo "  Target:  $EXPORT_DST"
echo ""

# Verify source exists
if [ ! -d "$EXPORT_SRC" ]; then
  echo "ERROR: MiroFish export not found at $EXPORT_SRC"
  echo "  Expected: oro-verde-sim-export/ in your MiroFish directory"
  exit 1
fi

# Create target if needed
mkdir -p "$EXPORT_DST"

# Sync action logs
for f in twitter_actions.jsonl reddit_actions.jsonl; do
  if [ -f "$EXPORT_SRC/$f" ]; then
    cp "$EXPORT_SRC/$f" "$EXPORT_DST/$f"
    LINES=$(wc -l < "$EXPORT_DST/$f" | tr -d ' ')
    echo "  [OK] $f ($LINES actions)"
  fi
done

# Sync simulation data
if [ -d "$EXPORT_SRC/simulation_data" ]; then
  mkdir -p "$EXPORT_DST/simulation_data"
  rsync -a --quiet "$EXPORT_SRC/simulation_data/" "$EXPORT_DST/simulation_data/"
  echo "  [OK] simulation_data/"
fi

# Sync report
if [ -d "$EXPORT_SRC/report" ]; then
  mkdir -p "$EXPORT_DST/report"
  rsync -a --quiet "$EXPORT_SRC/report/" "$EXPORT_DST/report/"
  SECTIONS=$(ls "$EXPORT_DST/report/"section_*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "  [OK] report/ ($SECTIONS sections)"
fi

echo ""
echo "=== SYNC COMPLETE ==="
echo ""

# Offer to rebuild characters
read -p "Rebuild characters.json now? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Running enrichment pipeline..."
  cd "$ENGINE_ROOT"
  npx tsx scripts/enrich-characters.ts
  echo ""
  CHAR_COUNT=$(cat "$ENGINE_ROOT/src/data/$PROJECT/characters.json" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
  echo "=== REBUILD COMPLETE: $CHAR_COUNT characters ==="
fi
