import { CATEGORIES } from '../constants/categories';

/**
 * 묶음 목록(서버 모양) → 차트 줄 목록(Recharts 모양)
 *
 * @param {Array} groups 서버 GroupStat 배열 (날씨 4개 또는 기온 구간 3개)
 * @returns {Array} [{ category: 'FOOD', categoryLabel: '맛집', RAIN: 15.0, CLEAR: 17.3, ... }, ...]
 *                  카테고리 6줄, 각 줄에 묶음 key 이름으로 비율이 들어 있다
 */
export function toChartRows(groups) {
  // 카테고리 6개를 하나씩 돌며 한 줄씩 만든다
  return CATEGORIES.map((c) => {
    const row = { category: c.code, categoryLabel: c.label };

    // 묶음(날씨)마다 이 카테고리의 비율을 찾아 row[묶음key] 에 넣는다
    groups.forEach((group) => {
      const stat = group.categories.find((s) => s.category === c.code);
      row[group.key] = stat ? stat.percent : 0; // row['RAIN'] = 34.8
    });

    return row;
  });
}