/**
 * 묶음 하나(내 조회 기록)의 카테고리 비율 가로 막대
 * - 차트 라이브러리 없이 div 폭으로 막대를 그린다
 *
 * props
 * @param {object} stat 서버 GroupStat 하나
 */
function MyCategoryBars({ stat }) {
  // 비율이 큰 순서로 정렬 (원본 배열을 바꾸지 않도록 [...] 로 복사 후 정렬)
  // sort((a, b) => b.percent - a.percent) : 큰 값이 앞으로 (내림차순)
  const sorted = [...stat.categories].sort((a, b) => b.percent - a.percent);

  return (
    <ul className="m-0 list-none space-y-2 p-0">
      {sorted.map((c) => (
        // grid grid-cols-[88px_1fr_64px] : 이름 88px | 막대 나머지 | 숫자 64px
        <li
          key={c.category}
          className="grid grid-cols-[88px_1fr_64px] items-center gap-3 text-sm"
        >
          <span className="text-gray-700">{c.categoryLabel}</span>

          {/* 회색 바탕 막대 */}
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            {/* 실제 값 막대 : 폭은 계산된 값이라 Tailwind 클래스가 아닌 style 로 넣는다
                (Tailwind 는 코드에 "글자 그대로" 적힌 클래스만 만들어 주므로 w-[${값}%] 는 동작하지 않는다) */}
            <div
              className="h-full rounded-full"
              style={{ width: `${c.percent}%`, backgroundColor: "#2a78d6" }}
            />
          </div>

          <span className="text-right text-gray-700 tabular-nums">
            {c.percent}% <span className="text-gray-400">({c.count})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default MyCategoryBars;
