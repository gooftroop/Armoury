#!/usr/bin/env bash
#
# Run all Maestro E2E flows.
#
# Usage:
#   ./run-all.sh
#   TEST_USER_EMAIL=x TEST_USER_PASSWORD=y ./run-all.sh
#
# Requires Maestro CLI and a running simulator/emulator with the dev app.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FLOWS_DIR="$SCRIPT_DIR/../flows"

if ! command -v maestro &> /dev/null; then
    echo "Error: Maestro CLI not found. Install via: brew install maestro" >&2
    exit 1
fi

echo "Running all Maestro flows in $FLOWS_DIR..."
maestro test "$FLOWS_DIR" \
    --env "TEST_USER_EMAIL=${TEST_USER_EMAIL:-test@armoury.dev}" \
    --env "TEST_USER_PASSWORD=${TEST_USER_PASSWORD:-secret}"
