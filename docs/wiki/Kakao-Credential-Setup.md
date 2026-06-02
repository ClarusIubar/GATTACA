# Kakao Credential Setup

추억열차 live Kakao OAuth/relay에 필요한 값은 두 개입니다.

## 현재 등록해야 하는 URL

```text
https://gattaca.jamissue.com/api/auth/callback
```

이 URL은 Kakao Developers의 Redirect URI에 그대로 넣습니다. 단, `https://gattaca.jamissue.com/api/*`가 Cloudflare Worker로 라우팅되어야 합니다. 검증 기준은 아래입니다.

```bash
npm run live:check -- --api-url https://gattaca.jamissue.com
```

## 필요한 Kakao 값

| Secret 이름 | 복사할 Kakao Developers 값 | 위치 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | REST API 키 | 내 애플리케이션 > 앱 선택 > 앱 설정 > 앱 키 |
| `KAKAO_CLIENT_SECRET` | Client secret 코드 | 내 애플리케이션 > 앱 선택 > 앱 설정 > 앱 키 > REST API 키 선택 또는 상세 설정 |

필요하지 않은 값:

- JavaScript 키
- 네이티브 앱 키
- Admin 키

## 설정 순서

1. [Kakao Developers](https://developers.kakao.com)에 접속합니다.
2. 내 애플리케이션에서 추억열차 앱을 선택합니다.
3. `앱 설정` > `앱 키`에서 `REST API 키`를 복사합니다.
4. 그 값을 GitHub/Worker secret `KAKAO_REST_API_KEY`로 등록합니다.
5. `제품 설정` > `카카오 로그인`을 활성화합니다.
6. Redirect URI에 `https://gattaca.jamissue.com/api/auth/callback`를 등록합니다.
7. REST API 키 상세/보안 설정에서 `Client secret`을 생성하거나 확인합니다.
8. `Client secret 코드` 값을 GitHub/Worker secret `KAKAO_CLIENT_SECRET`로 등록합니다.

## 값 매핑 예시

```text
Kakao Developers 화면:
REST API 키 = abcdef1234567890
Client secret 코드 = zyx987654321

GitHub/Worker secret:
KAKAO_REST_API_KEY=abcdef1234567890
KAKAO_CLIENT_SECRET=zyx987654321
```

## GitHub Secrets

GitHub Actions가 Worker secret까지 자동 동기화하려면 repository secret에 아래 값이 있어야 합니다.

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
KAKAO_REST_API_KEY
KAKAO_CLIENT_SECRET
```

현재 workflow는 Kakao secret이 GitHub Secrets에 있으면 `wrangler secret put`으로 Cloudflare Worker에 주입합니다.

## 직접 등록

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
