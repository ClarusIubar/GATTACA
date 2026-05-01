# 설계 / 아키텍처

## 구조
- Frontend: React + Vite
- Hosting: GitHub Pages
- Auth/DB/Storage: Supabase
- Login: Kakao OAuth through Supabase

## 권한
- 게스트: 열람
- 승인대기: 열람 + 승인 대기 안내
- 승인회원: CRU
- 운영자: 승인/삭제

## 데이터 모델
- profiles
- events
- memories
- comments
