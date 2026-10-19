import axios from "axios";

// [Chapter 09] Python(pandas) 분석 서버 전용 axios
// - analysisApi.js (Spring /api/analysis/...) 와는 다른 파일이다. 그 파일은 그대로 둔다
// - 기존 api(axios.js) 는 주소 앞에 /api 를 붙이므로, Python 서버용을 따로 만든다
// baseURL "/pyapi" → Vite 프록시가 http://localhost:8000/pyapi 로 전달
const pyapi = axios.create({ baseURL: "/pyapi" });

// 오늘 날씨 추천 Top 3
// GET /pyapi/recommend?weather=RAIN&temp=8.3
export async function fetchRecommend(weather, temp) {
  const res = await pyapi.get("/recommend", { params: { weather, temp } });
  return res.data;
}

// 날씨 × 카테고리 비율표
export async function fetchHeatmap() {
  const res = await pyapi.get("/heatmap");
  return res.data;
}

// 로그인 회원 취향 (나 vs 전체)
export async function fetchPreference(memberId) {
  const res = await pyapi.get(`/members/${memberId}/preference`);
  return res.data;
}
