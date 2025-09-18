#!/bin/bash

echo "$(date '+%Y-%m-%d %H:%M:%S')" >> ~/deploy.log

# 1. 저장소에서 최신 코드 불러오기
git pull

# 2. 의존성 업데이트
npm install

# 3. 구글 시트에서 최신 데이터 다운로드
(cd ../tools && node main.js)

# 4. 크롤링
(cd ../crawler && node index.js)

# 5. 개츠비 배포용 빌드 수행
NODE_OPTIONS='--max-old-space-size=1536' gatsby build


# 6. S3 업로드

# HTML, JSON 파일: 브라우저에서 매번 새 파일 확인
aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://davidshim.kr

# JS, CSS 등 나머지 파일: 1년간 캐시 가능
aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://davidshim.kr
