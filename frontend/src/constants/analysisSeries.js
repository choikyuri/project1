/**
 * 분석 차트의 막대 묶음(series) 목록 : 순서 = 차트·범례에 나오는 순서
 * - key   : 서버 GroupStat.key 와 같은 값
 * - label : 범례에 보일 이름
 * - color : 막대 색
 */

/**
 * 날씨 (종류가 다른 4가지) → 색약 검증된 순서의 서로 다른 색 4개
 * 이번 분석의 주인공인 "비" 를 첫 번째에 둔다
 */
export const WEATHER_SERIES = [
  { key: "RAIN", label: "🌧️ 비", color: "#2a78d6" }, // 파랑
  { key: "CLEAR", label: "☀️ 맑음", color: "#eb6834" }, // 주황
  { key: "SNOW", label: "❄️ 눈", color: "#1baf7a" }, // 청록
  { key: "CLOUDY", label: "☁️ 흐림", color: "#eda100" }, // 노랑
];

/**
 * 기온 구간 (순서가 있는 3단계) → 한 가지 색(파랑)의 연함 → 진함
 */
export const TEMP_SERIES = [
  { key: "COLD", label: "10°C 미만", color: "#86b6ef" }, // 연한 파랑
  { key: "MILD", label: "10~25°C", color: "#2a78d6" }, // 중간 파랑
  { key: "HOT", label: "25°C 이상", color: "#104281" }, // 진한 파랑
];

/** 날씨 코드 → 아이콘 (요약 카드용, 06챕터 WeatherWidget 과 같은 아이콘) */
export const WEATHER_ICONS = {
  CLEAR: "☀️",
  CLOUDY: "☁️",
  RAIN: "🌧️",
  SNOW: "❄️",
};
