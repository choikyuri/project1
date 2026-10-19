import api from "./axios";

/**
 * 카테고리 추천
 * GET /api/recommendations?weather=RAIN
 *
 * @param {string} [simulatedWeather] 시연용 날씨 코드 ('' 또는 undefined 면 실제 날씨)
 * @returns {Promise<{city, condition, conditionLabel, temp, simulated, headline,
 *                    recommendations: Array, notes: Array<string>}>}
 */
export async function fetchRecommendations(simulatedWeather) {
  const res = await api.get("/recommendations", {
    params: { weather: simulatedWeather || undefined }, // 빈 값이면 주소에서 뺀다
  });
  return res.data;
}
