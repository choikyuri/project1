import { getCategoryLabel } from "../constants/categories";
import { getWeatherLabel } from "../constants/weathers";

/**
 * 날씨 × 카테고리 히트맵 (라이브러리 없이 표 + 배경색으로 그린다)
 * @param {object} data     분석 서버 /pyapi/heatmap 응답
 * @param {string} selected 지금 선택된 날씨 (그 행을 강조)
 */
function WeatherHeatmap({ data, selected }) {
  return (
    <div className="dash-panel">
      <div className="dash-head">
        <h2>날씨별로 많이 본 카테고리</h2>
        <p className="sub">각 행의 합이 100% · 색이 진할수록 많이 봄</p>
      </div>

      {/* 표가 화면보다 넓으면 이 상자 안에서만 가로 스크롤 */}
      <div className="table-scroll">
        <table className="heatmap">
          <thead>
            <tr>
              <th>날씨</th>
              {data.categories.map((code) => (
                <th key={code}>{getCategoryLabel(code)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.weathers.map((weather, row) => {
              const values = data.cells[row]; // 이 날씨의 비율 6개
              const rowMax = Math.max(...values); // 이 행에서 가장 큰 값
              return (
                <tr key={weather} className={weather === selected ? "is-selected" : ""}>
                  <th>
                    {getWeatherLabel(weather)}
                    <span className="sub"> {data.counts[row]}건</span>
                  </th>
                  {values.map((value, col) => (
                    <td
                      key={data.categories[col]}
                      className={value === rowMax ? "is-max" : ""}
                      // 진하기 = 값 / 전체 최댓값 → 0 ~ 1 사이 숫자를 CSS 변수로 전달
                      style={{ "--heat": value / data.maxValue }}
                    >
                      {/* toFixed(1) : 7 → "7.0" 처럼 소수 첫째 자리까지 맞춰 표시 */}
                      {value.toFixed(1)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WeatherHeatmap;
