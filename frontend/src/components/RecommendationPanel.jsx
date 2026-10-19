import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRecommendations } from "../api/recommendationApi";
import { useAuth } from "../context/AuthContext";
import CategoryBadge from "./CategoryBadge";

// 06챕터 WeatherWidget 과 같은 아이콘
const WEATHER_ICONS = { CLEAR: "☀️", CLOUDY: "☁️", RAIN: "🌧️", SNOW: "❄️" };

// 시연용 날씨 선택칸 목록 (value '' = 실제 날씨)
const DEMO_OPTIONS = [
  { value: "", label: "실제 날씨" },
  { value: "CLEAR", label: "☀️ 맑음" },
  { value: "CLOUDY", label: "☁️ 흐림" },
  { value: "RAIN", label: "🌧️ 비" },
  { value: "SNOW", label: "❄️ 눈" },
];

// 점수 재료 3개 (서버 가중치와 같게)
const PARTS = [
  { key: "weatherPercent", label: "날씨", weight: 0.5 },
  { key: "myPercent", label: "내 기록", weight: 0.3 },
  { key: "recentPercent", label: "최근 7일", weight: 0.2 },
];

/**
 * 홈 화면 추천 영역
 * - 로그인 상태 / 시연용 날씨가 바뀌면 다시 추천을 받는다
 */
function RecommendationPanel() {
  const { member, checking } = useAuth();
  const memberId = member ? member.memberId : null; // 로그인·로그아웃할 때만 바뀌는 값

  const [demoWeather, setDemoWeather] = useState(""); // 시연용 날씨 ('' = 실제)
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // 로그인 상태 확인이 끝나기 전에는 요청하지 않는다 (비회원 추천이 잠깐 보였다 바뀌는 것 방지)
    if (checking) return;

    let ignore = false; // 8-2 : 늦게 온 옛날 응답 무시하기

    fetchRecommendations(demoWeather)
      .then((result) => {
        if (!ignore) {
          setData(result);
          setError("");
        }
      })
      .catch(() => {
        if (!ignore)
          setError(
            "추천을 불러오지 못했습니다. 백엔드가 실행 중인지 확인하세요.",
          );
      });

    return () => {
      ignore = true;
    };
  }, [checking, memberId, demoWeather]); // 셋 중 하나라도 바뀌면 다시 추천

  if (error) {
    return <p className="alert-error">{error}</p>;
  }
  if (!data) {
    return <p className="sub">추천을 준비하는 중...</p>;
  }

  return (
    // 연한 주황 배경의 큰 상자
    <section className="mb-6 rounded-2xl border border-solid border-orange-100 bg-orange-50 p-5">
      {/* ---------- 한 줄 요약 + 시연용 날씨 ---------- */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="m-0 flex-1 text-xl font-bold leading-snug text-gray-900">
          <span aria-hidden="true" className="mr-1">
            {data.condition ? WEATHER_ICONS[data.condition] : "✨"}
          </span>
          {data.headline}
        </h2>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          시연용 날씨
          <select
            value={demoWeather}
            onChange={(e) => setDemoWeather(e.target.value)}
            className="rounded-md border border-solid border-gray-300 bg-white px-2 py-1 text-sm"
          >
            {DEMO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ---------- 추천 카드 3개 ----------
          sm:grid-cols-3 : 640px 이상이면 3칸, 좁으면 1칸 */}
      <div className="grid gap-3 sm:grid-cols-3">
        {data.recommendations.map((rec) => (
          <article
            key={rec.category}
            className="flex flex-col rounded-xl bg-white p-4 shadow-sm"
          >
            {/* 순위 · 배지 · 점수 */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-orange-600">
                  {rec.rank}위
                </span>
                <CategoryBadge code={rec.category} />
              </span>
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                {rec.score}점
              </span>
            </div>

            {/* 점수 막대 (0 ~ 100) : 폭은 계산값이라 style 로 (07챕터) */}
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-orange-400"
                style={{ width: `${Math.min(rec.score, 100)}%` }}
              />
            </div>

            {/* 점수 근거 : 비율 × 가중치 */}
            <dl className="m-0 mb-3 space-y-1 text-xs text-gray-600 tabular-nums">
              {PARTS.map((p) => (
                <div key={p.key} className="flex justify-between">
                  <dt>{p.label}</dt>
                  <dd className="m-0">
                    {rec[p.key]}% × {p.weight}
                  </dd>
                </div>
              ))}
            </dl>

            {/* 이 카테고리 인기 글 */}
            <ul className="m-0 mt-auto list-none space-y-1 border-t border-solid border-gray-100 p-0 pt-2 text-sm">
              {rec.boards.length === 0 && (
                <li className="text-gray-400">아직 글이 없어요</li>
              )}
              {rec.boards.map((b) => (
                <li key={b.boardId} className="flex justify-between gap-2">
                  {/* truncate : 제목이 길면 한 줄로 자르고 … 표시 */}
                  <Link
                    to={`/boards/${b.boardId}`}
                    className="truncate text-gray-800 hover:text-orange-600"
                  >
                    {b.title}
                  </Link>
                  <span className="shrink-0 text-gray-400 tabular-nums">
                    조회 {b.viewCount}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              to={`/boards?category=${rec.category}`}
              className="mt-3 text-right text-xs text-orange-600 hover:underline"
            >
              {rec.categoryLabel} 글 더 보기 →
            </Link>
          </article>
        ))}
      </div>

      {/* ---------- 추천 근거 ---------- */}
      <ul className="m-0 mt-4 list-none space-y-0.5 p-0 text-xs text-gray-500">
        {data.notes.map((note) => (
          <li key={note}>· {note}</li>
        ))}
      </ul>
    </section>
  );
}

export default RecommendationPanel;
