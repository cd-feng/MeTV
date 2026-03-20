#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="metv"
APP_PORT="3000"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
SERVICE_USER="${SUDO_USER:-$(id -un)}"

usage() {
  cat <<'USAGE'
Usage: ./install.sh [options]

Options:
  --service-name <name>   systemd service name (default: metv)
  --service-user <user>   user to run service as (default: SUDO_USER/current user)
  --app-dir <path>        app directory (default: script directory)
  --port <port>           app port (default: 3000)
  -h, --help              show help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --service-user)
      SERVICE_USER="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --port)
      APP_PORT="$2"
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

if [[ "$APP_DIR" == *" "* ]]; then
  echo "Error: --app-dir contains spaces, which is not supported by this script." >&2
  exit 1
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "Error: package.json not found in app dir: $APP_DIR" >&2
  exit 1
fi

if ! id "$SERVICE_USER" >/dev/null 2>&1; then
  echo "Error: service user does not exist: $SERVICE_USER" >&2
  exit 1
fi

require_cmd npm
require_cmd systemctl

echo "==> App dir: $APP_DIR"
echo "==> Service name: $SERVICE_NAME"
echo "==> Service user: $SERVICE_USER"
echo "==> Port: $APP_PORT"

echo "==> Installing dependencies"
cd "$APP_DIR"
npm ci

echo "==> Building app"
npm run build

NPM_BIN="$(command -v npm)"
UNIT_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TMP_UNIT="$(mktemp)"

cat > "$TMP_UNIT" <<EOF
[Unit]
Description=MeTV Next.js Service
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
Environment=PORT=${APP_PORT}
ExecStart=${NPM_BIN} run start -- --hostname 0.0.0.0 --port ${APP_PORT}
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=30
SyslogIdentifier=${SERVICE_NAME}

[Install]
WantedBy=multi-user.target
EOF

echo "==> Writing service file: $UNIT_FILE"
run_root install -m 0644 "$TMP_UNIT" "$UNIT_FILE"
rm -f "$TMP_UNIT"

echo "==> Reloading systemd"
run_root systemctl daemon-reload

echo "==> Starting service"
if run_root systemctl is-active --quiet "$SERVICE_NAME"; then
  run_root systemctl restart "$SERVICE_NAME"
else
  run_root systemctl start "$SERVICE_NAME"
fi

echo
run_root systemctl --no-pager --full status "$SERVICE_NAME" || true

echo
echo "Deployment completed."
echo "Service was started, but NOT enabled at boot."
echo "Control commands:"
echo "  sudo systemctl start $SERVICE_NAME"
echo "  sudo systemctl restart $SERVICE_NAME"
echo "  sudo systemctl stop $SERVICE_NAME"
echo "  sudo systemctl status $SERVICE_NAME"