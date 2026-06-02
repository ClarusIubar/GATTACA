# Governance Index

Status: specification
Scope: core parent classification, work routing, and misroute prevention for the 추억열차 repository.

## Core Responsibility Index

| Core ID | Parent Issue | Responsibility Axis | Keywords | Misroute Examples |
| --- | --- | --- | --- | --- |
| `TSK-001-00` | https://github.com/ClarusIubar/GATTACA/issues/2 | 추억열차 초기 구조 개선과 테스트 고도화 | wiki, repository, DIP, TDD, unit, integration, mock, memory page, test | 다른 제품 기획이나 백엔드 MVP 재구축 작업을 `TSK-001`로 보내지 않음 |
| `TSK-002-00` | https://github.com/ClarusIubar/GATTACA/issues/11 | 추억열차 실사용 MVP 재구축 | cloudflare worker, d1, r2, kv, kakao oauth, session, upload, backend, live mvp, api | 단순 문서 손질이나 일반 UI 수정만으로 `TSK-002` 범위를 대체하지 않음 |

## Routing Rule

- `TSK-001`은 초기 구조, 테스트, 문서 기반 정리에 한정한다.
- `TSK-002`는 실사용 MVP를 위한 Cloudflare/Kakao/backend 경계 구현에 한정한다.
- 현재 활성 구현 목표는 `TSK-002-07`이며, 남은 외부 블로커는 Kakao Worker secret 주입과 live E2E readback이다.
