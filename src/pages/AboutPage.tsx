export function AboutPage() {
  return (
    <section className="shell section">
      <div className="two-column">
        <article className="panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Concept</span>
            <h2>추억열차란?</h2>
            <p>
              단체방의 대화는 빠르게 흘러가지만, 함께 보낸 날의 의미는 오래 남습니다. 추억열차는 확정된
              일정과 그날의 장면을 하나의 선로 위에 올려두는 기록용 페이지입니다.
            </p>
          </div>

          <ul className="rail-list">
            <li>캘린더 서비스가 아니라 결정된 일정의 기록 보관소</li>
            <li>사진과 코멘트가 행사 단위로 연결되는 메모리얼 구조</li>
            <li>단체방 구성원만 참여하는 승인 기반 운영 모델</li>
          </ul>
        </article>

        <article className="panel">
          <div className="section-heading">
            <span className="section-heading__eyebrow">Operating policy</span>
            <h2>운영 원칙</h2>
          </div>
          <ul className="rail-list">
            <li>카카오톡 단체방에서 이미 합의된 일정만 등록</li>
            <li>추억열차에서는 결정과 기록에 집중하고, 투표 자동화는 다루지 않음</li>
            <li>승인 사용자만 작성 가능, 삭제는 운영자만 가능</li>
            <li>문서, 구현, 배포 기록은 모두 저장소 안에서 함께 관리</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
