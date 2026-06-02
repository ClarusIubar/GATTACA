export function AboutPage() {
  return (
    <section className="shell section">
      <div className="two-column">
        <article className="panel panel--dark">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Concept</span>
            <h2>추억열차는 약속을 오래 남는 기록으로 바꾸는 정거장입니다.</h2>
            <p>
              단체방의 대화는 빠르게 지나가지만, 함께 보낸 하루는 오래 남습니다. 추억열차는 카카오톡
              단체방에서 확정된 일정과 그날의 사진, 메모, 코멘트를 하나의 사건으로 묶어 보관하는
              메모리얼 페이지입니다.
            </p>
          </div>

          <ul className="rail-list">
            <li>캘린더 서비스가 아니라 확정된 모임을 기록하는 보관소입니다.</li>
            <li>각 일정은 언제, 어디서, 무엇을, 어떻게 할지를 분명히 남깁니다.</li>
            <li>사진과 코멘트는 일정 하위의 메모리로 연결합니다.</li>
            <li>단체방 참여자만 작성하고, 삭제는 운영자만 수행합니다.</li>
          </ul>
        </article>

        <article className="panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Operating policy</span>
            <h2>v1 운영 원칙</h2>
          </div>
          <ul className="rail-list">
            <li>투표와 일정 조율은 기존 카카오톡 단체방 기능을 그대로 사용합니다.</li>
            <li>추억열차에는 단체방에서 결정된 최종 결과만 등록합니다.</li>
            <li>카카오 로그인 후 운영자 승인을 받은 사용자만 CRU 기능을 사용할 수 있습니다.</li>
            <li>이벤트, 메모리, 코멘트 삭제는 운영자만 수행합니다.</li>
            <li>문서, 구현, 배포 기록은 docs와 GitHub Wiki 원본에 함께 남깁니다.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
