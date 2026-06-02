# 09. AI 활용 전략과 프롬프트 기록

## AI를 쓰는 목적

- 제품 요구사항 구조화
- 구현 경계 명확화
- 프론트/Worker 코드 초안 작성
- 테스트 케이스 초안 작성
- 배포/문서 정합성 점검

## 현재 프로젝트 기준 핵심 컨텍스트

- React, TypeScript, Vite
- Cloudflare Pages / Workers
- D1 / R2 / KV
- Kakao OAuth / Kakao relay
- 승인 기반 권한 모델

## 프롬프트 운영 원칙

- 가능한 구현만 제안해야 한다.
- 브라우저가 아닌 Worker 경계에서 처리할 일을 분리해야 한다.
- demo/mock과 live 구현을 혼동하지 않아야 한다.
- 완료 조건을 실제 readback 기준으로 설명해야 한다.

## 검토 질문

- 현재 구현이 Cloudflare 구조와 맞는가
- Kakao secret이 없는 상태를 숨기지 않는가
- 문서와 코드가 같은 아키텍처를 설명하는가
- 테스트가 실제 변경 범위를 덮는가

## 품질 기준

- 사실성: Kakao, Cloudflare, Pages/Workers 제약을 정확히 반영했는가
- 추적성: 문서/코드/테스트/배포 근거가 연결되는가
- 보수성: 없는 구현을 완료처럼 말하지 않는가
