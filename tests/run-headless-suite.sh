#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4173}"
URL="http://${HOST}:${PORT}/tests/tests.html"
SERVER_LOG="$(mktemp)"
DOM_FILE="$(mktemp)"
CHROME_LOG="$(mktemp)"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
  rm -f "${SERVER_LOG}" "${DOM_FILE}" "${CHROME_LOG}"
}
trap cleanup EXIT

find_chrome() {
  if [[ -n "${CHROME_BIN:-}" ]] && [[ -x "${CHROME_BIN}" ]]; then
    printf '%s\n' "${CHROME_BIN}"
    return 0
  fi

  local candidate
  for candidate in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "$(command -v google-chrome-stable 2>/dev/null || true)" \
    "$(command -v google-chrome 2>/dev/null || true)" \
    "$(command -v chromium-browser 2>/dev/null || true)" \
    "$(command -v chromium 2>/dev/null || true)"; do
    if [[ -n "${candidate}" ]] && [[ -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

CHROME="$(find_chrome || true)"
if [[ -z "${CHROME}" ]]; then
  echo "Could not find a Chrome/Chromium binary. Set CHROME_BIN to run the headless suite." >&2
  exit 1
fi

python3 -m http.server "${PORT}" --bind "${HOST}" --directory "${REPO_ROOT}" >"${SERVER_LOG}" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 20); do
  if curl -sL "${URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -sL "${URL}" >/dev/null 2>&1; then
  echo "Local test server did not become ready at ${URL}" >&2
  cat "${SERVER_LOG}" >&2 || true
  exit 1
fi

run_suite() {
  local path="$1"
  local label="$2"
  local budget="$3"
  local url="http://${HOST}:${PORT}/${path}"

  if ! "${CHROME}" \
    --headless \
    --disable-gpu \
    --no-sandbox \
    --virtual-time-budget="${budget}" \
    --dump-dom \
    "${url}" > "${DOM_FILE}" 2>"${CHROME_LOG}"; then
    echo "Chrome failed while running ${label}." >&2
    cat "${CHROME_LOG}" >&2 || true
    exit 1
  fi

  local summary
  summary="$(grep -Eo '<strong>[0-9]+ passed</strong>, <strong>[0-9]+ failed</strong>' "${DOM_FILE}" | head -n 1 || true)"

  if [[ -z "${summary}" ]]; then
    echo "Could not find test summary in ${label}." >&2
    cat "${DOM_FILE}" >&2
    exit 1
  fi

  if ! grep -Eq '<strong>[0-9]+ passed</strong>, <strong>0 failed</strong>' <<< "${summary}"; then
    echo "${label} failed: ${summary}" >&2
    grep -n 'class="fail"' "${DOM_FILE}" >&2 || true
    exit 1
  fi

  sed -E 's#<strong>([0-9]+) passed</strong>, <strong>0 failed</strong>#\1#' <<< "${summary}"
}

TOTAL_PASSED=0

CORE_PASSED="$(run_suite "tests/tests.html" "core regression suite" 5000)"
TOTAL_PASSED=$((TOTAL_PASSED + CORE_PASSED))

WORKFLOW_PASSED="$(run_suite "tests/workflow-smoke.html" "workflow smoke suite" 15000)"
TOTAL_PASSED=$((TOTAL_PASSED + WORKFLOW_PASSED))

echo "Headless suite passed: ${TOTAL_PASSED} assertions"
