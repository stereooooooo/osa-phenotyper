#!/bin/bash
#
# OSA Phenotyper – AWS Deployment Script
# Usage: ./deploy.sh <admin-email> [region] [clinic-name] <allowed-origins> [artifact-bucket]
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - BAA signed in AWS Artifact
#   - MFA enabled on root account
#   - For CloudFront WAF resources, permission to manage WAF in us-east-1
#
set -euo pipefail

USAGE="Usage: ./deploy.sh <admin-email> [region] [clinic-name] <allowed-origins> [artifact-bucket]"

ADMIN_EMAIL="${1:?${USAGE}}"
REGION="${2:-us-east-1}"
CLINIC="${3:-capital-ent}"
ALLOWED_ORIGINS="${4:?${USAGE}}"
STACK_NAME="osa-phenotyper-${CLINIC}"
ARTIFACT_BUCKET="${5:-}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE_FILE="${SCRIPT_DIR}/template.yaml"
PACKAGED_TEMPLATE="/tmp/osa-phenotyper-${CLINIC}-packaged.yaml"
WAF_RULES_FILE="/tmp/osa-phenotyper-${CLINIC}-cloudfront-waf-rules.json"
WEB_ROOT="${SCRIPT_DIR}/.."
WAF_REGION="us-east-1"
WAF_NAME="osa-edge-waf-${CLINIC}"
WAF_METRIC_PREFIX="osa-edge-${CLINIC}"

infer_deployment_environment() {
  local raw
  raw="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
  if [[ "${raw}" =~ (^|[^a-z])(prod|production)([^a-z]|$) ]]; then
    printf 'production\n'
  elif [[ "${raw}" =~ (^|[^a-z])(pilot)([^a-z]|$) ]]; then
    printf 'pilot\n'
  elif [[ "${raw}" =~ (^|[^a-z])(stg|stage|staging|qa|test)([^a-z]|$) ]]; then
    printf 'staging\n'
  else
    printf 'configured\n'
  fi
}

deployment_label_for() {
  case "$1" in
    production) printf 'PRODUCTION\n' ;;
    pilot) printf 'CLINICAL PILOT\n' ;;
    staging) printf 'STAGING\n' ;;
    *) printf 'CONFIGURED\n' ;;
  esac
}

DEPLOYMENT_ENVIRONMENT="${OSA_DEPLOYMENT_ENVIRONMENT:-$(infer_deployment_environment "${CLINIC} ${STACK_NAME} ${ALLOWED_ORIGINS}")}"
DEPLOYMENT_LABEL="${OSA_DEPLOYMENT_LABEL:-$(deployment_label_for "${DEPLOYMENT_ENVIRONMENT}")}"
BUILD_ID="${OSA_BUILD_ID:-$(git -C "${WEB_ROOT}" rev-parse --short HEAD 2>/dev/null || printf 'unknown')}"
DEPLOYED_AT="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

ensure_artifact_bucket_name() {
  if [ -n "${ARTIFACT_BUCKET}" ]; then
    return
  fi
  local account_id
  local clinic_slug
  local max_slug_len
  account_id=$(aws sts get-caller-identity --query Account --output text --region "${REGION}")
  clinic_slug=$(printf '%s' "${CLINIC}" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9-')
  max_slug_len=$((63 - ${#account_id} - ${#REGION} - 27))
  if [ ${#clinic_slug} -gt ${max_slug_len} ]; then
    clinic_slug="${clinic_slug:0:${max_slug_len}}"
  fi
  ARTIFACT_BUCKET="osa-artifacts-${clinic_slug}-${account_id}-${REGION}"
}

create_artifact_bucket_if_needed() {
  if aws s3api head-bucket --bucket "${ARTIFACT_BUCKET}" >/dev/null 2>&1; then
    echo "  Artifact bucket: ${ARTIFACT_BUCKET}"
    return
  fi

  echo "  Creating artifact bucket: ${ARTIFACT_BUCKET}"
  if [ "${REGION}" = "us-east-1" ]; then
    aws s3api create-bucket \
      --bucket "${ARTIFACT_BUCKET}" \
      --region "${REGION}" > /dev/null
  else
    aws s3api create-bucket \
      --bucket "${ARTIFACT_BUCKET}" \
      --region "${REGION}" \
      --create-bucket-configuration "LocationConstraint=${REGION}" > /dev/null
  fi

  aws s3api put-public-access-block \
    --bucket "${ARTIFACT_BUCKET}" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true > /dev/null

  aws s3api put-bucket-encryption \
    --bucket "${ARTIFACT_BUCKET}" \
    --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}' > /dev/null
}

write_cloudfront_waf_rules() {
  cat > "${WAF_RULES_FILE}" <<EOF
[
  {
    "Name": "RateLimitApiPaths",
    "Priority": 1,
    "Action": { "Block": {} },
    "Statement": {
      "RateBasedStatement": {
        "Limit": 100,
        "AggregateKeyType": "IP",
        "ScopeDownStatement": {
          "OrStatement": {
            "Statements": [
              {
                "ByteMatchStatement": {
                  "SearchString": "/patients",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              },
              {
                "ByteMatchStatement": {
                  "SearchString": "/intake-tokens",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              },
              {
                "ByteMatchStatement": {
                  "SearchString": "/intake/",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              }
            ]
          }
        }
      }
    },
    "VisibilityConfig": {
      "SampledRequestsEnabled": true,
      "CloudWatchMetricsEnabled": true,
      "MetricName": "ApiRateLimit"
    }
  },
  {
    "Name": "AWSCommonRulesApiPaths",
    "Priority": 2,
    "OverrideAction": { "None": {} },
    "Statement": {
      "ManagedRuleGroupStatement": {
        "VendorName": "AWS",
        "Name": "AWSManagedRulesCommonRuleSet",
        "RuleActionOverrides": [
          {
            "Name": "SizeRestrictions_BODY",
            "ActionToUse": { "Count": {} }
          },
          {
            "Name": "CrossSiteScripting_BODY",
            "ActionToUse": { "Count": {} }
          }
        ],
        "ScopeDownStatement": {
          "OrStatement": {
            "Statements": [
              {
                "ByteMatchStatement": {
                  "SearchString": "/patients",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              },
              {
                "ByteMatchStatement": {
                  "SearchString": "/intake-tokens",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              },
              {
                "ByteMatchStatement": {
                  "SearchString": "/intake/",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              }
            ]
          }
        }
      }
    },
    "VisibilityConfig": {
      "SampledRequestsEnabled": true,
      "CloudWatchMetricsEnabled": true,
      "MetricName": "AWSCommonRulesApi"
    }
  },
  {
    "Name": "AWSSQLiRulesApiPaths",
    "Priority": 3,
    "OverrideAction": { "None": {} },
    "Statement": {
      "ManagedRuleGroupStatement": {
        "VendorName": "AWS",
        "Name": "AWSManagedRulesSQLiRuleSet",
        "ScopeDownStatement": {
          "OrStatement": {
            "Statements": [
              {
                "ByteMatchStatement": {
                  "SearchString": "/patients",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              },
              {
                "ByteMatchStatement": {
                  "SearchString": "/intake-tokens",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              },
              {
                "ByteMatchStatement": {
                  "SearchString": "/intake/",
                  "FieldToMatch": { "UriPath": {} },
                  "TextTransformations": [{ "Priority": 0, "Type": "NONE" }],
                  "PositionalConstraint": "STARTS_WITH"
                }
              }
            ]
          }
        }
      }
    },
    "VisibilityConfig": {
      "SampledRequestsEnabled": true,
      "CloudWatchMetricsEnabled": true,
      "MetricName": "AWSSQLiRulesApi"
    }
  }
]
EOF
}

ensure_cloudfront_waf() {
  write_cloudfront_waf_rules

  local existing_id
  existing_id=$(aws wafv2 list-web-acls \
    --scope CLOUDFRONT \
    --region "${WAF_REGION}" \
    --query "WebACLs[?Name=='${WAF_NAME}']|[0].Id" \
    --output text)

  if [[ -z "${existing_id}" || "${existing_id}" == "None" ]]; then
    echo "  Creating CloudFront WAF: ${WAF_NAME} (${WAF_REGION})"
    aws wafv2 create-web-acl \
      --cli-binary-format raw-in-base64-out \
      --scope CLOUDFRONT \
      --region "${WAF_REGION}" \
      --name "${WAF_NAME}" \
      --description "OSA Phenotyper CloudFront edge WAF for ${CLINIC}" \
      --default-action '{"Allow":{}}' \
      --visibility-config "SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=${WAF_METRIC_PREFIX}" \
      --rules "file://${WAF_RULES_FILE}" \
      >/dev/null
  else
    echo "  Updating CloudFront WAF: ${WAF_NAME} (${WAF_REGION})"
    local lock_token
    lock_token=$(aws wafv2 get-web-acl \
      --scope CLOUDFRONT \
      --region "${WAF_REGION}" \
      --id "${existing_id}" \
      --name "${WAF_NAME}" \
      --query 'LockToken' \
      --output text)

    aws wafv2 update-web-acl \
      --cli-binary-format raw-in-base64-out \
      --scope CLOUDFRONT \
      --region "${WAF_REGION}" \
      --id "${existing_id}" \
      --name "${WAF_NAME}" \
      --lock-token "${lock_token}" \
      --default-action '{"Allow":{}}' \
      --visibility-config "SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=${WAF_METRIC_PREFIX}" \
      --rules "file://${WAF_RULES_FILE}" \
      >/dev/null
  fi

  CLOUDFRONT_WAF_ARN=$(aws wafv2 list-web-acls \
    --scope CLOUDFRONT \
    --region "${WAF_REGION}" \
    --query "WebACLs[?Name=='${WAF_NAME}']|[0].ARN" \
    --output text)
}

sync_static_site() {
  echo "  Syncing static app to s3://${WEB_APP_BUCKET}..."
  aws s3 sync "${WEB_ROOT}" "s3://${WEB_APP_BUCKET}" \
    --delete \
    --exclude "*" \
    --include "index.html" \
    --include "intake.html" \
    --include "css/*" \
    --include "js/*" \
    --include "img/*" \
    --include "capentlogo.svg" \
    >/dev/null
}

echo "═══════════════════════════════════════════════════"
echo "  OSA Phenotyper – Deploying to AWS"
echo "═══════════════════════════════════════════════════"
echo "  Admin email : ${ADMIN_EMAIL}"
echo "  Region      : ${REGION}"
echo "  Clinic      : ${CLINIC}"
echo "  Origins     : ${ALLOWED_ORIGINS}"
echo "  Stack       : ${STACK_NAME}"
ensure_artifact_bucket_name
echo "  Artifacts   : ${ARTIFACT_BUCKET}"
echo "  Edge WAF    : ${WAF_NAME} (${WAF_REGION})"
echo "═══════════════════════════════════════════════════"
echo ""

# Step 1: Create/reuse artifact bucket
echo "[1/7] Preparing artifact bucket..."
create_artifact_bucket_if_needed

echo ""
echo "[2/7] Ensuring CloudFront WAF..."
ensure_cloudfront_waf

echo ""
echo "[3/7] Packaging CloudFormation template..."
aws cloudformation package \
  --template-file "${TEMPLATE_FILE}" \
  --s3-bucket "${ARTIFACT_BUCKET}" \
  --output-template-file "${PACKAGED_TEMPLATE}" \
  --region "${REGION}" > /dev/null

echo ""
echo "[4/7] Deploying packaged CloudFormation stack..."
aws cloudformation deploy \
  --template-file "${PACKAGED_TEMPLATE}" \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    ClinicName="${CLINIC}" \
    AdminEmail="${ADMIN_EMAIL}" \
    AllowedOrigins="${ALLOWED_ORIGINS}" \
    CloudFrontWebAclArn="${CLOUDFRONT_WAF_ARN}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${REGION}" \
  --no-fail-on-empty-changeset

echo ""
echo "[5/7] Retrieving configuration..."

# Get outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

APP_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='WebAppUrl'].OutputValue" \
  --output text)

WEB_APP_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='WebAppBucketName'].OutputValue" \
  --output text)

WEB_APP_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='WebAppDistributionId'].OutputValue" \
  --output text)

POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" \
  --output text)

CLIENT_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" \
  --output text)

ADMIN_GROUP=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='AdminGroup'].OutputValue" \
  --output text)

CLINICIAN_GROUP=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='ClinicianGroup'].OutputValue" \
  --output text)

PATIENT_TABLE=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='TableName'].OutputValue" \
  --output text)

echo ""
echo "[6/7] Writing runtime configuration..."

# Update aws-config.js
CONFIG_FILE="${SCRIPT_DIR}/../js/aws-config.js"
cat > "${CONFIG_FILE}" << EOF
/**
 * OSA Phenotyper – AWS Configuration
 * Auto-generated by deploy.sh on ${DEPLOYED_AT}
 * These values are PUBLIC client-side keys — not secrets.
 */
const AWS_CONFIG = {
  region: '${REGION}',
  userPoolId: '${POOL_ID}',
  userPoolClientId: '${CLIENT_ID}',
  apiUrl: '${APP_URL}',
  appUrl: '${APP_URL}',
  adminGroupName: '${ADMIN_GROUP}',
  clinicianGroupName: '${CLINICIAN_GROUP}',
  deploymentEnvironment: '${DEPLOYMENT_ENVIRONMENT}',
  deploymentLabel: '${DEPLOYMENT_LABEL}',
  buildId: '${BUILD_ID}',
  deployedAt: '${DEPLOYED_AT}',
  stackName: '${STACK_NAME}',
};
EOF

# Update intake page runtime URL + CSP connect-src origin
INTAKE_FILE="${SCRIPT_DIR}/../intake.html"
perl -0pi -e "s#(<meta http-equiv=\"Content-Security-Policy\" content=\"[^\"]*connect-src )[^;]+#\${1}'self' ${APP_URL} ${API_URL}#g" "${INTAKE_FILE}"
perl -0pi -e "s#data-api-url=\"[^\"]*\"#data-api-url=\"${APP_URL}\"#g" "${INTAKE_FILE}"
perl -0pi -e "s#data-app-env=\"[^\"]*\"#data-app-env=\"${DEPLOYMENT_ENVIRONMENT}\"#g" "${INTAKE_FILE}"
perl -0pi -e "s#data-app-env-label=\"[^\"]*\"#data-app-env-label=\"${DEPLOYMENT_LABEL}\"#g" "${INTAKE_FILE}"
perl -0pi -e "s#data-build-id=\"[^\"]*\"#data-build-id=\"${BUILD_ID}\"#g" "${INTAKE_FILE}"
perl -0pi -e "s#data-deployed-at=\"[^\"]*\"#data-deployed-at=\"${DEPLOYED_AT}\"#g" "${INTAKE_FILE}"

echo ""
echo "[7/7] Publishing static app to CloudFront..."
sync_static_site
aws cloudfront create-invalidation \
  --distribution-id "${WEB_APP_DISTRIBUTION_ID}" \
  --paths "/*" >/dev/null

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Deployment complete!"
echo "═══════════════════════════════════════════════════"
echo ""
echo "  App URL      : ${APP_URL}"
echo "  API Origin   : ${API_URL}"
echo "  User Pool    : ${POOL_ID}"
echo "  Client ID    : ${CLIENT_ID}"
echo "  Allowed CORS : ${ALLOWED_ORIGINS}"
echo "  Artifacts    : ${ARTIFACT_BUCKET}"
echo "  Site bucket  : ${WEB_APP_BUCKET}"
echo "  Distribution : ${WEB_APP_DISTRIBUTION_ID}"
echo "  Patient table: ${PATIENT_TABLE}"
echo ""
echo "  Config written to: js/aws-config.js"
echo ""
echo "  A temporary password has been sent to: ${ADMIN_EMAIL}"
echo "  Use it to sign in — you'll be prompted to set a new password and configure MFA."
echo "  If this is an upgrade of an existing environment, run:"
echo "    ./infrastructure/backfill-name-search-bucket.sh ${PATIENT_TABLE} ${REGION}"
echo ""
echo "  Next steps:"
echo "  1. Open the app in your browser"
echo "  2. Sign in with your email and the temporary password"
echo "  3. Set your new password"
echo "  4. Backfill search metadata if needed"
echo "  5. Start adding patients!"
echo ""

# Cleanup
rm -f "${PACKAGED_TEMPLATE}"
rm -f "${WAF_RULES_FILE}"
