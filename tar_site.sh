#!/usr/bin/env bash
set -euo pipefail

PROJECT_NAME="brspr-site"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUTPUT_FILE="../${PROJECT_NAME}-${TIMESTAMP}.tar.gz"

tar \
  --exclude=".git" \
  --exclude="./.git" \
  --exclude="node_modules" \
  --exclude="./node_modules" \
  --exclude=".DS_Store" \
  --exclude="*.tar.gz" \
  -czf "$OUTPUT_FILE" \
  .

echo "Created archive: $OUTPUT_FILE"