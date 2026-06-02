# Kakao Credential Setup

추억열차 live Kakao OAuth/relay에 필요한 Kakao 값은 두 개다.

## Redirect URI

Kakao Developers의 Redirect URI에 아래 값을 정확히 등록한다.

```text
https://gattaca.jamissue.com/api/auth/callback
```

## 필요한 Kakao 값

| Secret 이름 | 복사할 Kakao 값 | 위치 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | REST API key | Kakao Developers > 내 애플리케이션 > 앱 설정 > 앱 키 |
| `KAKAO_CLIENT_SECRET` | Client secret 코드 | Kakao Developers > 내 애플리케이션 > 제품 설정 > 카카오 로그인 > 보안 |

필요하지 않은 값:

- JavaScript key
- Native app key
- Admin key

## GitHub Secrets

GitHub Actions가 Worker secret까지 동기화하려면 repository secrets에 아래 값이 있어야 한다.

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
KAKAO_REST_API_KEY
KAKAO_CLIENT_SECRET
```

## 직접 Worker secret 등록

```bash
npx wrangler secret put KAKAO_REST_API_KEY
npx wrangler secret put KAKAO_CLIENT_SECRET
```

## 검증

```bash
npm run live:check:kakao -- --api-url https://gattaca.jamissue.com
```

성공 기준:

```text
Kakao REST key configured: true
Kakao client secret configured: true
Kakao OAuth configured: true
```
