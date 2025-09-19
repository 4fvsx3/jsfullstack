#!/bin/bash

LOG_FILE="/home/ubuntu/deploy.log"

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Build start ==="

mkdir -p ./coronaboard-web/.cache
rm -rf ./coronaboard-web/public

# 함수 정의
function run_or_log_error {
  "$@" 2>> "$LOG_FILE"
  if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Command failed: $*" >> "$LOG_FILE"
  fi
}

run_or_log_error git pull
run_or_log_error npm install
run_or_log_error bash -c "(cd ../tools && node main.js)"
run_or_log_error bash -c "(cd ../crawler && node index.js)"

# 데이터 존재 확인
DATA_FILE="../coronaboard-api/output/today.json"
if [ ! -f "$DATA_FILE" ]; then
  echo "Error: Data for today is missing at $DATA_FILE"
  exit 1
fi

run_or_log_error bash -c "NODE_OPTIONS='--max-old-space-size=1536' gatsby build"

# 배포
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://davidshim.kr

run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://davidshim.kr
