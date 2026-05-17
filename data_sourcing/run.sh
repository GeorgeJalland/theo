#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/var/www/html/theo"
VENV_PYTHON="$PROJECT_DIR/data_sourcing/venv/bin/python"
LOG_FILE="/var/log/theo-data-sourcing.log"

cd "$PROJECT_DIR"

{
  echo "===== $(date) ====="

  "$VENV_PYTHON" -m data_sourcing.main \
    --sourcing \
    --backfill-youtube-video-ids \
    --process \
    --classify

} >> "$LOG_FILE" 2>&1