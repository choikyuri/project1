// 카테고리 목록 (서버 Category enum 과 같은 코드·이름·순서)
/*
code: 서버와 주고 받은 값
label: 화면에 보여줄 이름
*/


export const CATEGORIES = [
  { code: "FOOD", label: "맛집" },
  { code: "CAFE", label: "카페" },
  { code: "SPORTS", label: "운동" },
  { code: "TRAVEL", label: "여행" },
  { code: "CULTURE", label: "문화·공연" },
  { code: "DAILY", label: "일상" },
];

// 코드 -> 한글 이름
// getCategoryLabel('CAFE') -> 카페
// find 조건에 맞는 첫 번째 항목을 찾음
export function getCategoryLabel(code) {
  const found = CATEGORIES.find((category) => category.code === code);
  return found ? found.label : code; // 못 찾으면 코드 그대로
}
