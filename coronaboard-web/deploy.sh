#!/bin/bash

# -------------------------------
# 저장소에서 최신 코드 불러오기
# -------------------------------
git pull

# -------------------------------
# 의존성 업데이트
# -------------------------------
npm install

# -------------------------------
# 구글 시트에서 최신 데이터 다운로드 (크롤링 포함)
# -------------------------------
(cd ../tools && node main.js)

#크롤링 실행
(cd ../crawler && node index.js)

# -------------------------------
# 개츠비 배포용 빌드 수행
# -------------------------------
NODE_OPTIONS='--max-old-space-size=1536' gatsby build

# -------------------------------
# 캐시 지시자를 어떻게 설정하면 좋은지 개츠비 공식 가이드 참고
# https://www.gatsbyjs.com/docs/caching/
# -------------------------------

# public 폴더 안의 *.html, *.json 파일은 브라우저에서 매번 새 파일 확인
# cache-control: public, max-age=0, must-revalidate
aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=0,must-revalidate \
  --exclude "*" \
  --include "*.html" --include "*.json" \
  --delete \
  ./public s3://coronaboard.kr

# html, json을 제외한 나머지 파일(js, css 등)은 1년간 캐시
# 빌드 시 파일 이름에 해시(hash) 자동 추가 → 변경 시 파일 이름 변경됨
# cache-control: public, max-age=31536000, immutable
aws s3 sync \
  --acl public-read \
  --cache-control public,max-age=31536000,immutable \
  --exclude "*.html" --exclude "*.json" \
  --delete \
  ./public s3://coronaboard.kr
