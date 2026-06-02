# Launch Checklist

이 문서는 추억열차를 실사용 가능한 배포로 넘기기 전 마지막 검증 항목을 모아 둔 체크리스트입니다.

## 1. 코드/배포 기본선

- [x] Worker foundation 구현
- [x] D1 CRUD 구현
- [x] Kakao OAuth callback 경계 구현
- [x] KV session 저장/복원 구현
- [x] R2 사진 업로드 구현
- [x] 서버 측 승인/운영자 권한 강제
- [x] Kakao event relay endpoint 구현
- [x] production에서 demo fallback 차단
- [x] production에서 Kakao 미구성 상태 명시

## 2. 검증 명령

- [x] `npm run lint`
- [x] `npm run test`
- [x] `npm run build`
- [x] `npm run worker:deploy:dry-run`

## 3. Live Infra Readback

- [x] Pages 배포 URL 확인
  - [https://61610380.gattaca-di0.pages.dev/](https://61610380.gattaca-di0.pages.dev/)
- [x] Worker health 확인
  - [https://gattaca-backend.yhh4433.workers.dev/api/health](https://gattaca-backend.yhh4433.workers.dev/api/health)
- [x] Worker runtime status 확인
  - [https://gattaca-backend.yhh4433.workers.dev/api/runtime-status](https://gattaca-backend.yhh4433.workers.dev/api/runtime-status)
- [x] `bindings.db=true`
- [x] `bindings.session=true`
- [x] `bindings.bucket=true`

## 4. 남은 외부 설정

- [ ] Kakao Developers > 내 애플리케이션 > 앱 선택 > 앱 설정 > 앱 키에서 `REST API 키` 확인
- [ ] `REST API 키` 값을 `KAKAO_REST_API_KEY`로 등록
- [ ] Kakao Developers > 앱 설정 > 앱 키 > REST API 키 선택/상세 설정에서 `Client secret 코드` 확인
- [ ] `Client secret 코드` 값을 `KAKAO_CLIENT_SECRET`로 등록
- [ ] GitHub Actions secret `KAKAO_REST_API_KEY` 등록
- [ ] GitHub Actions secret `KAKAO_CLIENT_SECRET` 등록
- [ ] Cloudflare Workers Secret `KAKAO_REST_API_KEY` 등록
- [ ] Cloudflare Workers Secret `KAKAO_CLIENT_SECRET` 등록

현재 남은 마지막 항목:

- [ ] `auth.kakaoOAuthConfigured=true` readback
- [ ] Kakao login redirect 검증
- [ ] Kakao callback 및 session restore 검증
- [ ] 승인 사용자 event create 검증
- [ ] memory upload 검증
- [ ] comment create 검증
- [ ] Kakao relay 수신 검증

## 5. 완료 조건

아래 세 가지가 모두 확인되면 기획 의도 기준 구현 완료로 봅니다.

1. Cloudflare live infra가 정상 응답
2. Kakao secrets 주입 후 OAuth/session이 실제로 동작
3. 이벤트 생성부터 사진/코멘트, Kakao relay까지 end-to-end readback이 확인
