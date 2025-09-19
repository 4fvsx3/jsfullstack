#!/bin/bash

# 로그 파일
LOG_FILE="/home/ubuntu/deploy.log"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') Build start ==="

# .cache 폴더 보장 및 public 초기화
mkdir -p ./coronaboard-web/.cache
rm -rf ./coronaboard-web/public

# 명령어 실행 함수
function run_or_log_error {
  echo "Running: $*"
  "$@" 2>> "$LOG_FILE"
  if [ $? -ne 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Command failed: $*" >> "$LOG_FILE"
    exit 1  # 실패하면 바로 스크립트 종료
  fi
}

# 1️⃣ 저장소 최신 코드 가져오기
run_or_log_error git pull

# 2️⃣ 의존성 설치/업데이트
run_or_log_error npm install

# 3️⃣ 구글 시트에서 최신 데이터 다운로드
run_or_log_error bash -c "(cd ../tools && node main.js)"

# 4️⃣ 크롤링
run_or_log_error bash -c "(cd ../crawler && node index.js)"

# 5️⃣ 데이터 존재 확인
DATA_FILE="../coronaboard-api/output/today.json"
if [ ! -f "$DATA_FILE" ]; then
  echo "Error: Data for today is missing at $DATA_FILE"
  exit 1
fi

# 6️⃣ Gatsby 빌드
run_or_log_error bash -c "NODE_OPTIONS='--max-old-space-size=1536' gatsby build"

# 7️⃣ S3 배포: HTML/JSON 캐시 무효화
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://davidshim.kr

# 8️⃣ S3 배포: JS/CSS 오래 캐시
run_or_log_error aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://davidshim.kr

echo "=== $(date '+%Y-%m-%d %H:%M:%S') Build finished ==="
