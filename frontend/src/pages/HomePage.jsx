import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchWeather } from "../api/weatherApi"; // 06챕터에서 만든 날씨 API
import { fetchHeatmap, fetchPreference, fetchRecommend } from "../api/pandasApi"; // [Chapter 09] Python 분석 서버
import { WEATHERS, getWeatherLabel } from "../constants/weathers";
import RecommendCard from "../components/RecommendCard";
import WeatherHeatmap from "../components/WeatherHeatmap";
import MyTasteChart from "../components/MyTasteChart";

// 날씨 정보를 못 받았을 때 쓰는 기본 조건 (API 키가 없는 경우 등)
const DEFAULT_CONDITION = { weather: "CLEAR", temp: 18 };

// 분석 서버가 꺼져 있을 때 보여줄 문구
const ANALYSIS_ERROR = "분석 서버에 연결하지 못했습니다. 8000번 포트의 FastAPI 가 실행 중인지 확인하세요.";

/**
 * 06챕터 날씨 응답 → 분석 서버에 보낼 { weather, temp } 로 바꾼다
 * 06챕터 응답 : { available: true, condition: "RAIN", temp: 8.3, ... }
 *              실패하면 available: false (API 키 없음 등)
 */
function toCondition(data) {
  if (!data?.available) {
    return null; // 날씨 정보 없음
  }
  return { weather: data.condition, temp: data.temp };
}

function HomePage() {
  const { member } = useAuth();

  // ----------------------- 상태 -----------------------
  const [today, setToday] = useState(null); // 실제 오늘 날씨 (없으면 null)
  const [condition, setCondition] = useState(null); // 추천에 쓰는 조건 (오늘 or 미리보기)
  const [recommend, setRecommend] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [preference, setPreference] = useState(null);
  const [error, setError] = useState("");

  // 1) 처음 한 번 : 오늘 날씨 가져오기 → 추천 조건으로 사용
  useEffect(() => {
    fetchWeather()
      .then((data) => {
        const cond = toCondition(data);
        setToday(cond);
        setCondition(cond || DEFAULT_CONDITION);
      })
      .catch(() => setCondition(DEFAULT_CONDITION)); // 날씨 실패해도 화면은 보여준다
  }, []);

  // 2) 조건이 바뀔 때마다 : 추천 다시 계산
  useEffect(() => {
    if (!condition) return; // 날씨를 아직 못 받았으면 기다림

    // ignore : 응답이 오기 전에 조건이 또 바뀌면, 늦게 온 이전 응답은 버린다
    let ignore = false;
    fetchRecommend(condition.weather, condition.temp)
      .then((data) => !ignore && setRecommend(data))
      .catch(() => !ignore && setError(ANALYSIS_ERROR));
    return () => {
      ignore = true; // 다음 실행 직전에 React 가 이 함수를 호출한다
    };
  }, [condition]);

  // 3) 처음 한 번 : 히트맵
  useEffect(() => {
    fetchHeatmap()
      .then(setHeatmap) // .then((data) => setHeatmap(data)) 와 같다
      .catch(() => setError(ANALYSIS_ERROR));
  }, []);

  // 4) 로그인 회원이 바뀔 때마다 : 내 취향 (로그아웃하면 지운다)
  useEffect(() => {
    if (!member) {
      setPreference(null);
      return;
    }
    fetchPreference(member.memberId)
      .then(setPreference)
      .catch(() => setError(ANALYSIS_ERROR));
  }, [member]);

  // 날씨 버튼 : 다른 날씨로 미리보기 (기온은 그대로)
  const handlePreview = (code) => {
    setCondition({ weather: code, temp: condition?.temp ?? DEFAULT_CONDITION.temp });
  };

  // 오늘 날씨로 되돌리기
  const handleToday = () => setCondition(today || DEFAULT_CONDITION);

  const isPreview = today && condition && condition.weather !== today.weather;

  // 큰 날씨 카드 위의 작은 글씨 : 지금 보고 있는 조건이 무엇인지 알려 준다
  const conditionLabel = isPreview ? "미리보기 중" : today ? "오늘 서울" : "기본 조건";

  // ----------------------- 화면 -----------------------
  return (
    <section className="home">
      {/* ① 첫 화면 : 인사말 + 지금 날씨 (크게) + 날씨 버튼 */}
      <header className="home-hero">
        <div className="hero-text">
          <p className="hero-eyebrow">{member ? `${member.name}님을 위한 오늘의 추천` : "오늘의 추천"}</p>
          <h1>오늘은 이런 글 어때요?</h1>
          <p className="hero-desc">
            지난 60일 조회 기록을 pandas 로 분석해서 날씨에 맞는 글을 골랐습니다.
          </p>
        </div>

        <div className="hero-weather">
          {condition && (
            <div className="wx-now">
              <span className="wx-label">{conditionLabel}</span>
              <span className="wx-main">
                <strong>{getWeatherLabel(condition.weather)}</strong>
                <span className="wx-temp">{condition.temp}°C</span>
              </span>
            </div>
          )}

          {/* 날씨 미리보기 버튼 (누르면 그 날씨 기준으로 추천이 바뀐다) */}
          <div className="wx-switch" role="group" aria-label="날씨 미리보기">
            {WEATHERS.map((w) => (
              <button
                key={w.code}
                type="button"
                className={condition?.weather === w.code ? "wx-btn is-active" : "wx-btn"}
                aria-pressed={condition?.weather === w.code}
                onClick={() => handlePreview(w.code)}
              >
                {w.label}
                {today?.weather === w.code && <small>오늘</small>}
              </button>
            ))}
          </div>

          {isPreview && (
            <button type="button" className="wx-reset" onClick={handleToday}>
              ← 오늘 날씨로 돌아가기
            </button>
          )}
        </div>
      </header>

      {!today && condition && (
        <p className="alert-info">
          오늘 날씨를 불러오지 못해 맑음 18°C 기준으로 보여줍니다. 위 버튼으로 날씨를 바꿔 보세요.
        </p>
      )}
      {error && <p className="alert-error">{error}</p>}

      {/* ② 오늘 추천 Top 3 : 화면 너비 전체를 쓰는 큰 카드 3장 */}
      <div className="home-section">
        {recommend ? (
          <RecommendCard data={recommend} />
        ) : (
          !error && <div className="dash-panel home-loading">추천을 계산하고 있어요…</div>
        )}
      </div>

      {/* ③ 분석 두 개 : 넓은 화면에서는 나란히, 좁으면 위아래로 */}
      <div className="home-grid">
        {heatmap && <WeatherHeatmap data={heatmap} selected={condition?.weather} />}

        {member ? (
          preference && <MyTasteChart data={preference} name={member.name} />
        ) : (
          <div className="dash-panel home-login">
            <h2>내 취향 분석</h2>
            <p className="sub">로그인하면 내가 많이 본 카테고리를 전체 평균과 비교해 볼 수 있어요.</p>
            <Link to="/login" className="home-login-btn">
              로그인하고 내 취향 보기
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default HomePage;
