#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <table-name> [region]"
  echo
  echo "Backfills the patient-table name search metadata used by the DynamoDB"
  echo "name-prefix-index by normalizing nameLower and setting nameSearchBucket."
  exit 1
fi

TABLE_NAME="$1"
REGION="${2:-us-east-2}"

command -v aws >/dev/null 2>&1 || { echo "aws CLI is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node is required"; exit 1; }

tmp_scan="$(mktemp)"
trap 'rm -f "$tmp_scan"' EXIT

echo "Scanning $TABLE_NAME in $REGION..."
aws dynamodb scan \
  --region "$REGION" \
  --table-name "$TABLE_NAME" \
  --projection-expression "patientId, #n" \
  --expression-attribute-names '{"#n":"name"}' \
  --output json > "$tmp_scan"

updated=0
skipped=0

while IFS=$'\t' read -r patient_id bucket normalized_name; do
  if [[ -z "$patient_id" ]]; then
    ((skipped+=1))
    continue
  fi

  aws dynamodb update-item \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --key "{\"patientId\":{\"S\":\"$patient_id\"}}" \
    --update-expression "SET nameSearchBucket = :bucket, nameLower = :nameLower" \
    --expression-attribute-values "{\":bucket\":{\"S\":\"$bucket\"},\":nameLower\":{\"S\":\"$normalized_name\"}}" \
    >/dev/null

  ((updated+=1))
done < <(
  node -e '
    const fs = require("fs");
    const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    for (const item of data.Items || []) {
      const patientId = item.patientId && item.patientId.S ? item.patientId.S : "";
      const rawName = item.name && item.name.S ? item.name.S : "";
      const normalized = rawName.trim().toLowerCase();
      const match = normalized.match(/[a-z0-9]/);
      const bucket = match ? match[0] : "#";
      process.stdout.write(`${patientId}\t${bucket}\t${normalized}\n`);
    }
  ' "$tmp_scan"
)

echo "Backfill complete."
echo "Updated rows: $updated"
echo "Skipped rows: $skipped"
