# 15. Kakao credential setup

이 문서는 추억열차 live Kakao OAuth/relay를 켜기 위해 Kakao Developers, GitHub Secrets, Cloudflare Worker에 어떤 값을 넣어야 하는지 정의합니다.

## 현재 도메인 기준

- Pages 공개 도메인: `https://gattaca.jamissue.com`
- Worker API route: `https://gattaca.jamissue.com/api/*`
- Kakao Redirect URI: `https://gattaca.jamissue.com/api/auth/callback`

`/api/*`가 Worker로 라우팅되어야 위 Redirect URI가 유효합니다. `https://gattaca.jamissue.com/api/health`가 200을 반환하지 않으면 Kakao callback도 실패합니다.

## 필요한 Kakao 값

| 등록 위치 | 넣을 값 | Kakao Developers 위치 |
| --- | --- | --- |
| `KAKAO_REST_API_KEY` | REST API 키 | 내 애플리케이션 > 앱 선택 > 앱 설정 > 앱 키 |
| `KAKAO_CLIENT_SECRET` | Client secret 코드 | 내 애플리케이션 > 앱 선택 > 앱 설정 > 앱 키 > REST API 키 선택 또는 상세 설정 |

필요하지 않은 값:

- JavaScript 키
- 네이티브 앱 키
- Admin 키

추억열차 Worker는 서버 측 REST API 방식으로 Kakao OAuth와 relay를 처리합니다. 그래서 REST API 키와 Client secret만 사용합니다.

## Kakao Developers 설정 순서

1. [Kakao Developers](https://developers.kakao.com)에 접속합니다.
2. 내 애플리케이션에서 추억열차 앱을 선택합니다.
3. `앱 설정` > `앱 키`로 이동합니다.
4. `REST API 키` 값을 복사해 `KAKAO_REST_API_KEY`로 등록합니다.
5. `제품 설정` > `카카오 로그인`에서 카카오 로그인을 활성화합니다.
6. Redirect URI에 아래 값을 정확히 등록합니다.

```text
https://gattaca.jamissue.com/api/auth/callback
```

7. `앱 설정` > `앱 키`에서 REST API 키의 상세/보안 설정으로 들어갑니다.
8. `Client secret`을 생성하거나 확인하고 사용 상태로 둡니다.
9. `Client secret 코드` 값을 복사해 `KAKAO_CLIENT_SECRET`로 등록합니다.
10. 동의 항목에서 닉네임과 프로필 이미지를 확인합니다.

## 값 매핑 예시

Kakao Developers 화면에 아래처럼 보인다고 가정합니다.

```text
REST API 키: abcdef1234567890
Client secret 코드: zyx987654321
```

GitHub Secrets 또는 Worker Secrets에는 아래 이름으로 등록합니다.

```text
KAKAO_REST_API_KEY=abcdef1234567890
KAKAO_CLIENT_SECRET=zyx987654321
```

Kakao 화면의 `REST API 키`라는 라벨을 그대로 secret 이름으로 쓰는 것이 아닙니다. 저장소와 Worker에는 반드시 위 secret 이름을 사용합니다.

## GitHub Actions secret

GitHub Actions가 Worker secret까지 동기화하려면 repository secret에 아래 값이 있어야 합니다.

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
KAKAO_REST_API_KEY
KAKAO_CLIENT_SECRET
```

현재 workflow는 `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`가 GitHub Secrets에 있으면 `wrangler secret put`으로 Cloudflare Worker secret에 동기화합니다.

## Cloudflare Worker에 직접 등록

GitHub Actions를 거치지 않고 직접 넣을 수도 있습니다.

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

- `https://gattaca.jamissue.com/api/health`가 200인지 확인합니다.
- Kakao Redirect URI가 `https://gattaca.jamissue.com/api/auth/callback`와 정확히 같은지 확인합니다.
- GitHub secret 이름이 정확히 `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`인지 확인합니다.
- Worker secret에 같은 값이 실제로 주입되었는지 확인합니다.
- GitHub Actions가 최신 workflow로 실행되었는지 확인합니다.
