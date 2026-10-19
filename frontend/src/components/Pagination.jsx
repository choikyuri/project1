const BLOCK_SIZE = 10;

/*
@param currentPage: 지금 쪽
@param totalPages: 전체 쪽 수
@param onChange: 이벤트 처리
*/


function Pagination({ currentPage, totalPages, onChange }) {
  // 쪽이 1개 이하면 번호를 보여줄 필요가 없다 (아무것도 그리지 않음)
  if (totalPages <= 1) {
    return null;
  }

  // 이 묶음의 시작 번호와 끝 번호 (위 표의 계산)
  // Math.floor : 소수점 버림 (몫 구하기)
  const start = Math.floor((currentPage - 1) / BLOCK_SIZE) * BLOCK_SIZE + 1;
  const end = Math.min(start + BLOCK_SIZE - 1, totalPages);

  // start ~ end 숫자 배열 만들기 : [11, 12, ..., 20]
  const pages = [];
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }

  return (
    <nav className="pagination" aria-label="페이지 이동">
      {/* 첫 묶음이면 이전 버튼 비활성화 */}
      <button type="button" disabled={start === 1} onClick={() => onChange(start - 1)}>
        ‹ 이전
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={p === currentPage ? 'active' : ''}   /* 지금 쪽은 색칠 */
          aria-current={p === currentPage ? 'page' : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}

      {/* 마지막 묶음이면 다음 버튼 비활성화 */}
      <button type="button" disabled={end === totalPages} onClick={() => onChange(end + 1)}>
        다음 ›
      </button>
    </nav>
  );
}

export default Pagination;