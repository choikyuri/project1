import { Link } from "react-router-dom";
import CategoryBadge from "./CategoryBadge";
import { getCategoryLabel } from "../constants/categories";
import { getWeatherLabel } from "../constants/weathers";

// 분석 서버가 어떤 조건으로 계산했는지 → 화면 안내 문구
const BASIS_TEXT = {
  WEATHER_TEMP: "같은 날씨·비슷한 기온",
  WEATHER: "같은 날씨",
  ALL: "전체 기록",
};

/**
 * 오늘 날씨 추천 Top 3
 * @param {object} data 분석 서버 /pyapi/recommend 응답
 */
function RecommendCard({ data }) {
  return (
    <div className="dash-panel">
      <div className="dash-head">
        <h2>
          {getWeatherLabel(data.weather)}, {data.temp}°C 에 많이 본 글
        </h2>
        <p className="sub">
          {BASIS_TEXT[data.basis]} 조회 {data.sampleSize.toLocaleString()}건 기준
        </p>
      </div>

      <ol className="rec-list">
        {data.items.map((item, index) => (
          <li key={item.category} className="rec-item">
            <div className="rec-top">
              <span className="rec-rank">{index + 1}</span>
              <CategoryBadge code={item.category} />
              <b className="rec-share">{item.share.toFixed(1)}%</b>
              {/* lift 1.1 이상 : 평소보다 눈에 띄게 많이 보는 카테고리만 표시 */}
              {item.lift >= 1.1 && (
                <span className="rec-lift">평소보다 {item.lift.toFixed(1)}배</span>
              )}
            </div>

            {/* 막대 길이 = 비율 (style 의 width 에 % 를 그대로 넣는다) */}
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${item.share}%` }} />
              {/* 평소 비율 위치에 세로 눈금 */}
              <div className="bar-mark" style={{ left: `${item.overallShare}%` }} />
            </div>
            <p className="rec-caption">
              평소 {getCategoryLabel(item.category)} 비율 {item.overallShare.toFixed(1)}%
            </p>

            {item.posts.length > 0 && (
              <ul className="rec-posts">
                {item.posts.map((post) => (
                  <li key={post.boardId}>
                    <Link to={`/boards/${post.boardId}`}>{post.title}</Link>
                    <span className="sub"> · 조회 {post.views}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

export default RecommendCard;
