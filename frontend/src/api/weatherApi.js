import api from "./axios";

// 지금 날씨
//GET /api/weather

export async function fetchWeather() {
  const res = await api.get("/weather");
  return res.data;
}
