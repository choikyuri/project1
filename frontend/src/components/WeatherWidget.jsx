import { useEffect, useState } from "react";
import { fetchWeather } from "../api/weatherApi";

// 10분마다 다시 불러오기 (서버 캐시 시간과 같게)
const REFRESH_MS = 10 * 60 * 1000;

// 날씨 코드 → 아이콘
const ICONS = {
  CLEAR: "☀️",
  CLOUDY: "☁️",
  RAIN: "🌧️",
  SNOW: "❄️",
};

/**
 * 날씨 위젯 : "☀️ 서울 · 맑음 18.4°C"
 * - 처음 한 번 + 10분마다 새로 불러온다
 * - 날씨를 못 받아도 사이트는 정상 → 회색 "날씨 정보 없음" 표시
 */
function WeatherWidget() {
  const [weather, setWeather] = useState(null); // 서버 응답
  const [failed, setFailed] = useState(false); // 우리 서버 자체에 연결 실패 (백엔드 꺼짐 등)

  useEffect(() => {
    // 불러오기 함수 (결과가 도착한 뒤에만 상태를 바꾼다)
    const load = () => {
      fetchWeather()
        .then((data) => {
          setWeather(data);
          setFailed(false);
        })
        .catch(() => setFailed(true));
    };

    load(); // 1) 처음 한 번
    const timerId = setInterval(load, REFRESH_MS); // 2) 10분마다
    return () => clearInterval(timerId); // 3) 정리
  }, []);

  // ---------- 1) 아직 응답 전 ----------
  if (weather === null && !failed) {
    return <span className="text-sm text-gray-400">날씨 불러오는 중...</span>;
  }

  // ---------- 2) 날씨 없음 (백엔드 꺼짐 / 키 없음 / 외부 오류) ----------
  if (failed || !weather.available) {
    return (
      // title : 마우스를 올리면 이유가 말풍선으로 보인다
      <span
        className="text-sm text-gray-400"
        title={weather?.message || "서버에 연결할 수 없습니다."}
      >
        날씨 정보 없음
      </span>
    );
  }

  // ---------- 3) 정상 ----------
  return (
    // rounded-full bg-white px-3 py-0.5 : 흰색 알약 모양 상자
    // shadow-sm                         : 아주 옅은 그림자
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-0.5 text-sm text-gray-700 shadow-sm"
      title={weather.description} // 마우스를 올리면 "실 비" 같은 자세한 설명
    >
      <span aria-hidden="true">{ICONS[weather.condition]}</span>
      <span>{weather.city}</span>
      <span className="text-gray-300">·</span>
      <span>{weather.conditionLabel}</span>
      {/* toFixed(1) : 소수 첫째 자리까지 글자로 → 18.4 */}
      <span className="font-semibold text-orange-600 tabular-nums">
        {weather.temp.toFixed(1)}°C
      </span>
    </span>
  );
}

export default WeatherWidget;
