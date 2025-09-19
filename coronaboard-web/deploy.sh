#!/bin/bash

LOG_FILE="/home/ubuntu/deploy.log"

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Build start ==="

function run_or_log_error {
  "$@" 2>> "$LOG_FILE"
  if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Command failed: $*" >> "$LOG_FILE"
    echo "Error occurred during: $*"
  fi
}

# 프로젝트 루트
PROJECT_DIR="/home/ubuntu/jsfullstack/coronaboard-web"
cd "$PROJECT_DIR" || exit 1

# 캐시/빌드 폴더 정리
run_or_log_error rm -rf .cache public node_modules

# npm 설치 (정확한 버전 재설치)
run_or_log_error npm ci

# .cache 폴더 생성 및 권한 설정
run_or_log_error mkdir -p .cache
run_or_log_error chown -R ubuntu:ubuntu .cache

# 최신 코드 가져오기
run_or_log_error git pull

# 구글 시트 데이터 다운로드
run_or_log_error bash -c "(cd ../tools && node main.js)"

# 크롤링
run_or_log_error bash -c "(cd ../crawler && node index.js)"

# Gatsby 빌드 수행 (메모리 옵션 포함)
run_or_log_error bash -c "NODE_OPTIONS='--max-old-space-size=1536' gatsby build"

# AWS S3 동기화
# HTML / JSON 캐시 무효화
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://davidshim.kr

# JS/CSS 파일 장기 캐시
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://davidshim.kr
