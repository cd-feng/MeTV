#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="metv"

usage() {
  cat <<'USAGE'
Usage: ./uninstall.sh [options]

Options:
  --service-name <name>   systemd service name (default: metv)
  -h, --help              show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: command not found: $1" >&2
    exit 1
  fi
}

require_cmd systemctl

SUDO_CMD=()
if [[ $EUID -ne 0 ]]; then
  require_cmd sudo
  SUDO_CMD=(sudo)
fi

run_root() {
  if [[ ${#SUDO_CMD[@]} -gt 0 ]]; then
    "${SUDO_CMD[@]}" "$@"
  else
    "$@"
  fi
}

UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "==> Uninstalling service: $SERVICE_NAME"

run_root systemctl stop "$SERVICE_NAME" >/dev/null 2>&1 || true
run_root systemctl disable "$SERVICE_NAME" >/dev/null 2>&1 || true

if run_root test -f "$UNIT_FILE"; then
  echo "==> Removing unit file: $UNIT_FILE"
  run_root rm -f "$UNIT_FILE"
else
  echo "==> Unit file not found: $UNIT_FILE"
fi

echo "==> Reloading systemd"
run_root systemctl daemon-reload
run_root systemctl reset-failed "$SERVICE_NAME" >/dev/null 2>&1 || true

echo
echo "Uninstall completed."
echo "Project files were kept intact."