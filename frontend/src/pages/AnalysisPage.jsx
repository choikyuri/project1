import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMyStats,
  fetchTemperatureStats,
  fetchWeatherStats,
} from "../api/analysisApi";
import { useAuth } from "../context/AuthContext";
import {
  TEMP_SERIES,
  WEATHER_ICONS,
  WEATHER_SERIES,
} from "../constants/analysisSeries";
import CategoryCompareChart from "../components/CategoryCompareChart";
import MyCategoryBars from "../components/MyCategoryBars";

/**
 * 날씨 그룹 목록을 WEATHER_SERIES 순서(비, 맑음, 눈, 흐림)로 정렬
 * → 요약 카드 순서와 차트 범례 순서를 같게 맞춘다
 */
function sortBySeries(groups, series) {
  const order = series.map((s) => s.key); // ['RAIN', 'CLEAR', 'SNOW', 'CLOUDY']
  return [...groups].sort(
    (a, b) => order.indexOf(a.key) - order.indexOf(b.key),
  );
}

/**
 * 분석 화면 (누구나) - "내 조회 기록" 부분만 로그인 필요
 */
function AnalysisPage() {
  const { member } = useAuth();

  const [weatherStats, setWeatherStats] = useState([]); // Q1
  const [tempStats, setTempStats] = useState([]); // Q2
  const [myStats, setMyStats] = useState(null); // Q3
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Q1, Q2 : 화면이 열릴 때 동시에 불러오기
  useEffect(() => {
    Promise.all([fetchWeatherStats(), fetchTemperatureStats()])
      .then(([weather, temp]) => {
        // 배열 구조 분해 : 결과 배열의 0번 → weather, 1번 → temp
        setWeatherStats(sortBySeries(weather, WEATHER_SERIES));
        setTempStats(temp);
      })
      .catch(() =>
        setError(
          "분석 결과를 불러오지 못했습니다. 백엔드가 실행 중인지 확인하세요.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  // Q3 : 로그인 상태가 바뀔 때마다 (로그인하면 불러오고, 로그아웃이면 그리지 않는다)
  useEffect(() => {
    if (!member) return; // 로그인 안 했으면 요청하지 않는다
    fetchMyStats()
      .then((data) => setMyStats(data))
      .catch(() => setMyStats(null));
  }, [member]);

  if (loading) return <p className="sub">분석 중...</p>;
  if (error) return <p className="alert-error">{error}</p>;

  // 전체 기록 수 (날씨 묶음 합계를 더한다) : reduce = 배열 값을 하나로 모으기
  const totalViews = weatherStats.reduce((sum, g) => sum + g.total, 0);

  return (
    <section>
      {/* ---------- 제목 ---------- */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h1 className="m-0">날씨 × 카테고리 분석</h1>
        <p className="m-0 text-sm text-gray-500 tabular-nums">
          조회 기록 {totalViews.toLocaleString()}건 기준
          {/* toLocaleString() : 3012 → "3,012" */}
        </p>
      </div>

      {/* ---------- 요약 카드 4개 (날씨별 1위) ----------
          grid-cols-2 : 기본 2칸 / sm:grid-cols-4 : 화면 폭 640px 이상이면 4칸 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {weatherStats.map((g) => {
          // 1위 카테고리의 비율 찾기
          const top = g.categories.find((c) => c.category === g.topCategory);
          return (
            <div
              key={g.key}
              className="rounded-xl border border-solid border-gray-200 bg-white p-4"
            >
              <p className="m-0 text-sm text-gray-500">
                <span aria-hidden="true">{WEATHER_ICONS[g.key]}</span> {g.label}
              </p>
              {top ? (
                <>
                  <p className="m-0 mt-1 text-xl font-bold text-gray-900">
                    1위 {g.topCategoryLabel}
                  </p>
                  <p className="m-0 mt-1 text-sm text-gray-600 tabular-nums">
                    {top.percent}% · {g.total.toLocaleString()}건 중{" "}
                    {top.count.toLocaleString()}건
                  </p>
                </>
              ) : (
                <p className="m-0 mt-1 text-sm text-gray-400">기록 없음</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------- Q1, Q2 차트 (같은 부품, 다른 데이터) ---------- */}
      <CategoryCompareChart
        title="Q1. 날씨별 카테고리 비율"
        groups={weatherStats}
        series={WEATHER_SERIES}
      />
      <CategoryCompareChart
        title="Q2. 기온 구간별 카테고리 비율"
        groups={tempStats}
        series={TEMP_SERIES}
      />

      {/* ---------- Q3 내 조회 기록 ---------- */}
      <section className="mb-6 rounded-xl border border-solid border-gray-200 bg-white p-5">
        <h2 className="mb-1 mt-0 text-lg font-bold text-gray-800">
          Q3. 내가 많이 본 카테고리
        </h2>

        {!member && (
          <p className="text-sm text-gray-500">
            <Link to="/login" state={{ from: "/analysis" }}>
              로그인
            </Link>
            하면 내 조회 기록을 분석해 보여 드려요.
          </p>
        )}

        {member && myStats && myStats.total === 0 && (
          <p className="text-sm text-gray-500">
            아직 조회 기록이 없습니다. 게시판에서 글을 읽어 보세요.
          </p>
        )}

        {member && myStats && myStats.total > 0 && (
          <>
            <p className="mb-4 mt-0 text-sm text-gray-500 tabular-nums">
              {member.name}님은 지금까지 {myStats.total.toLocaleString()}번 글을
              읽었고, 가장 많이 본 카테고리는{" "}
              <b className="text-gray-800">{myStats.topCategoryLabel}</b>입니다.
            </p>
            <MyCategoryBars stat={myStats} />
          </>
        )}
      </section>
    </section>
  );
}

export default AnalysisPage;
