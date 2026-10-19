import api from "./axios";


/**
 * Q1. 날씨별 분석
 * @returns {Promise<Array<GroupStat>>} 날씨 4개 묶음
 *
 * GroupStat = { key, label, total, topCategory, topCategoryLabel,
 *               categories: [{ category, categoryLabel, count, percent }] }
 */
export async function fetchWeatherStats() {
  const res = await api.get("/analysis/weather");
  return res.data;
}

/**
 * Q2. 기온 구간별 분석
 * @returns {Promise<Array<GroupStat>>} 구간 3개 묶음
 */
export async function fetchTemperatureStats() {
  const res = await api.get("/analysis/temperature");
  return res.data;
}

/**
 * Q3. 내 조회 기록 분석 (로그인 필요, 아니면 401)
 * @returns {Promise<GroupStat>}
 */
export async function fetchMyStats() {
  const res = await api.get("/analysis/me");
  return res.data;
}