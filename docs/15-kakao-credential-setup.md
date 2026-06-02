# 15. Kakao credential setup

이 문서는 추억열차 live Kakao OAuth/relay를 켜기 위해 Kakao Developers, GitHub Secrets, Cloudflare Worker에 어떤 값을 넣어야 하는지 정의한다.

## 현재 도메인 기준

- Pages 공개 도메인: `https://gattaca.jamissue.com`
- Worker API route: `https://gattaca.jamissue.com/api/*`
- Kakao Redirect URI: `https://gattaca.jamissue.com/api/auth/callback`

`/api/*`가 Worker로 route되어야 Redirect URI가 유효하다. `https://gattaca.jamissue.com/api/health`가 200을 반환하지 않으면 Kakao callback도 실패한다.

## 필요한 Kakao 값

| 등록 이름 | 복사할 값 | Kakao Developers 위치 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | REST API key | 내 애플리케이션 > 대상 앱 > 앱 설정 > 앱 키 |
| `KAKAO_CLIENT_SECRET` | Client secret 코드 | 내 애플리케이션 > 대상 앱 > 제품 설정 > 카카오 로그인 > 보안 |

필요하지 않은 값:

- JavaScript key
- Native app key
- Admin key

추억열차 Worker는 서버 측 REST API 방식으로 Kakao OAuth와 relay를 처리한다. 그래서 REST API key와 Client secret만 사용한다.

## Kakao Developers 설정 순서

1. https://developers.kakao.com 에 접속한다.
2. 내 애플리케이션에서 추억열차 앱을 선택한다.
3. 앱 설정 > 앱 키로 이동한다.
4. REST API key 값을 복사해서 `KAKAO_REST_API_KEY`로 등록한다.
5. 제품 설정 > 카카오 로그인에서 카카오 로그인을 활성화한다.
6. Redirect URI에 아래 값을 정확히 등록한다.

```text
https://gattaca.jamissue.com/api/auth/callback
```

7. 제품 설정 > 카카오 로그인 > 보안에서 Client secret을 생성하거나 확인한다.
8. Client secret 코드를 복사해서 `KAKAO_CLIENT_SECRET`로 등록한다.
9. 동의 항목에서 닉네임과 프로필 이미지를 확인한다.

## GitHub Actions secrets

Repository secrets에 아래 값이 있어야 workflow가 Worker secret까지 동기화할 수 있다.

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
KAKAO_REST_API_KEY
KAKAO_CLIENT_SECRET
```

현재 workflow는 `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`이 GitHub Secrets에 있으면 `wrangler secret put`으로 Cloudflare Worker secret에 동기화한다.

## Cloudflare Worker에 직접 등록

GitHub Actions를 거치지 않고 직접 넣을 수도 있다.

```bash
npx wrangler secret put KAKAO_REST_API_KEY
npx wrangler secret put KAKAO_CLIENT_SECRET
```

## 검증 명령

기본 live 상태:

```bash
npm run live:check -- --api-url https://gattaca.jamissue.com
```

Kakao 준비 상태:

```bash
npm run live:check:kakao -- --api-url https://gattaca.jamissue.com
```

성공 기준:

```text
Kakao REST key configured: true
Kakao client secret configured: true
Kakao OAuth configured: true
```

## 실패 시 확인할 것

- `https://gattaca.jamissue.com/api/health`가 200인지 확인한다.
- Kakao Redirect URI가 `https://gattaca.jamissue.com/api/auth/callback`와 정확히 같은지 확인한다.
- GitHub secret 이름이 정확히 `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`인지 확인한다.
- Worker secret에도 같은 값이 실제 주입됐는지 확인한다.
- 최신 workflow가 `main` merge 후 production 기준으로 실행됐는지 확인한다.
