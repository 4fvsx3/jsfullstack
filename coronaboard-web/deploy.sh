#!/bin/bash

# -------------------------------
# 로그 파일 경로 (절대경로 권장)
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
git pull
if [ $? -ne 0 ]; then
  echo "$DATE: git pull failed" >> $LOG_FILE
fi

# -------------------------------
# 2. 의존성 업데이트
# -------------------------------
npm install
if [ $? -ne 0 ]; then
  echo "$DATE: npm install failed" >> $LOG_FILE
fi

# -------------------------------
# 3. 구글 시트에서 최신 데이터 다운로드
# -------------------------------
(cd ../tools && node main.js)
if [ $? -ne 0 ]; then
  echo "$DATE: Google Sheets download failed" >> $LOG_FILE
fi

# -------------------------------
# 4. 크롤링
# -------------------------------
(cd ../crawler && node index.js)
if [ $? -ne 0 ]; then
  echo "$DATE: Crawler failed" >> $LOG_FILE
fi

# -------------------------------
# 5. 개츠비 빌드 수행
# -------------------------------
NODE_OPTIONS='--max-old-space-size=1536' gatsby build
if [ $? -ne 0 ]; then
  echo "$DATE: Gatsby build failed" >> $LOG_FILE
fi

# -------------------------------
# 6. S3 업로드
# -------------------------------

# HTML, JSON: 매번 새 파일 확인
aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://davidshim.kr

if [ $? -ne 0 ]; then
  echo "$DATE: S3 sync HTML/JSON failed" >> $LOG_FILE
fi

# JS, CSS 등 나머지 파일: 1년 캐시 가능
aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://davidshim.kr

if [ $? -ne 0 ]; then
  echo "$DATE: S3 sync assets failed" >> $LOG_FILE
fi

# -------------------------------
# 성공 시 deploy.log에는 아무 것도 남지 않음
# -------------------------------
