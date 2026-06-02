/**
 * File: worker/index.ts
 * Purpose: Cloudflare Worker foundation의 최상위 fetch 엔트리를 노출합니다.
 * Primary Responsibility: Cloudflare 런타임 요청을 라우터로 위임하는 것입니다.
 * Design Intent:
 *   - 엔트리 파일은 조립만 담당하고 실제 정책은 라우터/핸들러가 소유하게 유지합니다.
 *   - 이후 scheduled/task queue가 추가돼도 fetch 경계를 독립적으로 유지할 수 있습니다.
 * Non-Goals:
 *   - 라우팅/비즈니스 로직을 직접 구현하지 않습니다.
 *   - 외부 서비스 초기화를 이 파일에 중첩하지 않습니다.
 * Dependencies: ./router, ./types
 */

import { routeRequest } from './router'
import type { WorkerEnv, WorkerExecutionContext } from './types'

export default {
  /**
   * 공개 API: Cloudflare Worker의 HTTP fetch 진입점입니다.
   * 왜 존재하는가: Wrangler와 Cloudflare runtime이 이 shape를 기준으로 요청을 위임하기 때문입니다.
   * 매개변수:
   * - `request`: 현재 HTTP 요청
   * - `env`: Worker runtime bindings
   * - `_ctx`: `waitUntil` 등을 제공하는 실행 컨텍스트
   * 반환값: 라우팅 결과 `Response`
   * 에러 동작: 하위 라우터가 모든 예외를 JSON 응답으로 수렴합니다.
   * 제약: foundation 이슈 범위에서는 HTTP fetch만 구현합니다.
   */
  async fetch(request: Request, env: WorkerEnv, ctx: WorkerExecutionContext): Promise<Response> {
    void ctx
    return routeRequest(request, env)
  },
}
