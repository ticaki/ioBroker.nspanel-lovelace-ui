#!/usr/bin/env bash
# Start the NSPanel simulator on port 80 with auto-wake enabled.
# Usage:    ./simulator/start-sim.sh <SIM_IP> [extra-args...]
# Example:  ./simulator/start-sim.sh 192.168.178.65
#
# Prerequisites (one-time):
#   sudo setcap 'cap_net_bind_service=+ep' "$(readlink -f "$(which node)")"
#
# Notes:
#   - Run from the repository root (so the relative path works).
#   - The simulator dir is auto-resolved from the script location, so it works
#     regardless of which user owns the repo or where it's checked out.

set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <SIM_IP> [extra args passed to npm start --]" >&2
    echo "  <SIM_IP>   IP the simulator advertises as Tasmota's StatusNET.IPAddress" >&2
    echo "Example: $0 192.168.178.65" >&2
    exit 1
fi

SIM_IP="$1"
shift

# Resolve simulator dir from this script's location (user-independent)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$SCRIPT_DIR/package.json" ]] || ! grep -q '"nspanel-lovelace-ui-simulator"' "$SCRIPT_DIR/package.json"; then
    echo "Error: $SCRIPT_DIR doesn't look like the simulator package." >&2
    exit 1
fi

cd "$SCRIPT_DIR"

# Install deps on first run
if [[ ! -d node_modules ]]; then
    echo "First run — installing dependencies..."
    npm install
fi

LOG_FILE="${NSPSIM_LOG_FILE:-/tmp/nspsim.log}"

echo "Simulator starting:"
echo "  http://$SIM_IP:80   (Tasmota /cm endpoint, listens on 0.0.0.0)"
echo "  log: $LOG_FILE"
echo "  state: $SCRIPT_DIR/state.json"
echo

# stdbuf keeps tee output flowing in real time even when piped
npm start -- \
    --http-ip 0.0.0.0 \
    --http-port 80 \
    --sim-ip "$SIM_IP" \
    --model eu \
    --log-level debug \
    --auto-wake \
    --auto-wake-min-sec 5 \
    --auto-wake-max-sec 10 \
    "$@" 2>&1 | tee "$LOG_FILE"
