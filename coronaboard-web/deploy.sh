#!/bin/bash

LOG_FILE="/home/ubuntu/deploy.log"

# 빌드 시작 메시지 (성공 시에는 로그에 남지 않음)
echo "=== $(date '+%Y-%m-%d %H:%M:%S') Build start ==="

# 각 명령어를 실행하고, 실패 시에만 로그에 기록
function run_or_log_error {
  "$@" 2>> "$LOG_FILE"
  if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Command failed: $*" >> "$LOG_FILE"
  fi
}

# 저장소에서 최신 코드 불러오기
run_or_log_error git pull

# 의존성 업데이트
run_or_log_error npm install

# 구글 시트에서 최신 데이터 다운로드
run_or_log_error bash -c "(cd ../tools && node main.js)"

# 크롤링
run_or_log_error bash -c "(cd ../crawler && node index.js)"

# Gatsby 빌드 수행
run_or_log_error bash -c "NODE_OPTIONS='--max-old-space-size=1536' gatsby build"

# public 폴더 안의 *.html, *.json 파일은 매번 새로 받아야 하므로 캐시 무효화
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://davidshim.kr

# 나머지 js/css 파일은 1년간 캐시 가능
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://davidshim.kr
