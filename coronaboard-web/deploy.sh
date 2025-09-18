#!/bin/bash

# -------------------------------
# 로그 파일 경로 (절대경로 사용)
# -------------------------------
LOG_FILE="/home/ubuntu/deploy.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# -------------------------------
# 작업 디렉토리 이동
# -------------------------------
cd /home/ubuntu/jsfullstack/coronaboard-web || exit 1

# -------------------------------
# 1. 저장소에서 최신 코드 불러오기
# -------------------------------
GIT_OUTPUT=$(git pull 2>&1)
GIT_STATUS=$?

if [ $GIT_STATUS -ne 0 ]; then
  echo "$DATE: git pull failed" >> $LOG_FILE
  echo "$GIT_OUTPUT" >> $LOG_FILE
fi

# -------------------------------
# 2. 의존성 업데이트
# -------------------------------
NPM_OUTPUT=$(npm install 2>&1)
NPM_STATUS=$?

if [ $NPM_STATUS -ne 0 ]; then
  echo "$DATE: npm install failed" >> $LOG_FILE
  echo "$NPM_OUTPUT" >> $LOG_FILE
fi

# -------------------------------
# 3. 구글 시트에서 최신 데이터 다운로드
# -------------------------------
TOOLS_OUTPUT=$(cd ../tools && node main.js 2>&1)
TOOLS_STATUS=$?

if [ $TOOLS_STATUS -ne 0 ]; then
  echo "$DATE: Google Sheets download failed" >> $LOG_FILE
  echo "$TOOLS_OUTPUT" >> $LOG_FILE
fi

# -------------------------------
# 4. 개츠비 빌드 수행
# -------------------------------
BUILD_OUTPUT=$(NODE_OPTIONS='--max-old-space-size=1536' gatsby build 2>&1)
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
  echo "$DATE: Gatsby build failed" >> $LOG_FILE
  echo "$BUILD_OUTPUT" >> $LOG_FILE
fi

# -------------------------------
# 5. S3 업로드
# -------------------------------

# HTML, JSON 파일: 브라우저에서 매번 새 파일 확인
S3_HTML_OUTPUT=$(aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://coronaboard.kr 2>&1)
S3_HTML_STATUS=$?

if [ $S3_HTML_STATUS -ne 0 ]; then
  echo "$DATE: S3 sync HTML/JSON failed" >> $LOG_FILE
  echo "$S3_HTML_OUTPUT" >> $LOG_FILE
fi

# JS, CSS 등 나머지 파일: 1년간 캐시 가능
S3_ASSET_OUTPUT=$(aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://coronaboard.kr 2>&1)
S3_ASSET_STATUS=$?

if [ $S3_ASSET_STATUS -ne 0 ]; then
  echo "$DATE: S3 sync assets failed" >> $LOG_FILE
  echo "$S3_ASSET_OUTPUT" >> $LOG_FILE
fi

# -------------------------------
# 6. 성공 시 로그 없음
# -------------------------------
# - 각 단계에서 실패한 경우만 deploy.log에 기록됨
# - 성공하면 deploy.log는 변경되지 않음
