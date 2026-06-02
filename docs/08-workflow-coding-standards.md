# 08. 워크플로우와 코딩 표준

## 작업 흐름

1. 요구사항과 active child issue 확인
2. 관련 문서와 구현 경계 확인
3. 코드 수정
4. 테스트와 빌드 검증
5. README / docs / wiki 동시 갱신
6. live readback 또는 배포 상태 증거 확인

## 코딩 기준

- 브라우저는 Kakao API를 직접 호출하지 않는다.
- 권한은 프론트에서만 처리하지 않고 Worker가 최종 강제한다.
- request body의 작성자 필드를 신뢰하지 않는다.
- 업로드는 Worker/R2 경계로 통일한다.
- demo mode는 local/test seam으로만 사용한다.

## 문서 기준

- 구현 경계가 바뀌면 README, docs, wiki를 함께 수정한다.
- 권한 변경이 있으면 서버 권한 문서와 UI 흐름을 같이 검토한다.
- live URL과 runtime-status 근거는 최신 상태를 유지한다.

## 리뷰 기준

- 현재 child issue 범위를 벗어난 확장은 하지 않는다.
- 테스트가 없는 동작 변경은 완료로 보지 않는다.
- 문서가 현재 구현을 잘못 설명하면 수정 없이 넘기지 않는다.
