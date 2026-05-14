#!/bin/bash
# Tasmota Console-Logger — schreibt ungefiltert ins File.
# Nutzung:
#   ./tasmota_log_capture.sh                       # Default-Pfad + Default-IP
#   ./tasmota_log_capture.sh /path/to/out.log      # Eigener Pfad
#   ./tasmota_log_capture.sh out.log 192.168.1.42  # Eigener Pfad + IP

set -u

LOGFILE="${1:-/home/tim/ioBroker.nspanel-lovelace-ui/doc/tasmota_flash_$(date +%Y%m%d_%H%M%S).log}"
TASMOTA_IP="${2:-192.168.1.182}"
POLL_INTERVAL="${3:-2}"

echo "=== Logger started $(date) ==="
echo "Target: $LOGFILE"
echo "Tasmota: $TASMOTA_IP"
echo "Poll interval: ${POLL_INTERVAL}s"
echo
echo "Stop with Ctrl+C or 'kill <pid>'."

{
  echo "=== Logger started $(date) target=$LOGFILE tasmota=$TASMOTA_IP poll=${POLL_INTERVAL}s ==="
} > "$LOGFILE"

last_id=0
while true; do
  resp=$(curl -s --max-time 4 "http://${TASMOTA_IP}/cs?c2=${last_id}" 2>/dev/null)
  if [ -z "$resp" ]; then
    sleep "$POLL_INTERVAL"
    continue
  fi
  new_id=$(printf '%s' "$resp" | awk -F '}1' '{print $1; exit}')
  text=$(printf '%s' "$resp" | awk 'BEGIN{RS="}1"} NR==3{print; exit}')
  if [ -n "$new_id" ]; then
    last_id="$new_id"
  fi
  if [ -n "$text" ]; then
    printf '%s' "$text" | tr '\r' '\n' >> "$LOGFILE"
  fi
  sleep "$POLL_INTERVAL"
done
