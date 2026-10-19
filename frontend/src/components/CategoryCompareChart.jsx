import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toChartRows } from "../utils/chartData";

/**
 * 묶음별 카테고리 비율 비교 차트 (Q1 날씨별, Q2 기온 구간별 공통)
 *
 * props
 * @param {string} title  차트 제목
 * @param {Array}  groups 서버 GroupStat 배열
 * @param {Array}  series 막대 묶음 정의 [{ key, label, color }] (constants/analysisSeries.js)
 */
function CategoryCompareChart({ title, groups, series }) {
  // 1) 차트 모양으로 바꾸기 (8-4)
  const rows = toChartRows(groups);

  // 2) 이번 응답에 실제로 있는 묶음만 막대로 그린다
  const keys = groups.map((g) => g.key);
  const visibleSeries = series.filter((s) => keys.includes(s.key));

  return (
    // Tailwind : 흰 상자, 둥근 모서리, 안쪽 여백, 아래 간격
    <section className="mb-6 rounded-xl border border-solid border-gray-200 bg-white p-5">
      <h2 className="mb-1 mt-0 text-lg font-bold text-gray-800">{title}</h2>
      <p className="mb-4 mt-0 text-sm text-gray-500">
        각 묶음 안에서 카테고리가 차지하는 비율(%) · 막대에 마우스를 올리면
        정확한 값이 보입니다
      </p>

      {/* 차트 높이 320px, 폭은 부모(상자)에 맞춤 */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {/* barGap : 같은 카테고리 안 막대 사이 간격 / barCategoryGap : 카테고리 사이 간격 */}
          <BarChart
            data={rows}
            barGap={2}
            barCategoryGap="20%"
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            {/* 가로 점선만 (세로줄은 뺀다 → 막대가 더 잘 보인다) */}
            <CartesianGrid vertical={false} stroke="#eef1f4" />
            <XAxis
              dataKey="categoryLabel"
              tick={{ fill: "#555", fontSize: 13 }}
              axisLine={{ stroke: "#d5dae0" }}
              tickLine={false}
            />
            <YAxis
              unit="%"
              tick={{ fill: "#888", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            {/* formatter : 말풍선 값 뒤에 % 붙이기 / cursor : 마우스 올린 카테고리 배경 */}
            <Tooltip
              formatter={(value) => `${value}%`}
              cursor={{ fill: "#f7f9fb" }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />

            {/* 묶음마다 <Bar> 하나 : dataKey = 각 줄에서 꺼낼 값의 이름 */}
            {visibleSeries.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label} /* 범례·말풍선에 보일 이름 */
                fill={s.color}
                radius={[
                  4, 4, 0, 0,
                ]} /* 막대 윗모서리만 둥글게 [왼위, 오른위, 오른아래, 왼아래] */
                maxBarSize={28} /* 막대가 너무 뚱뚱해지지 않게 */
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 표로 보기 : 색을 구분하기 어려운 사람, 정확한 숫자가 필요한 사람을 위해 */}
      {/* details/summary : 클릭하면 펼쳐지는 HTML 기본 태그 */}
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-gray-600">
          표로 보기
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm tabular-nums">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-3 py-2 text-left font-semibold">카테고리</th>
                {visibleSeries.map((s) => (
                  <th
                    key={s.key}
                    className="px-3 py-2 text-right font-semibold"
                  >
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.category}
                  className="border-t border-solid border-gray-100"
                >
                  <td className="px-3 py-2 text-gray-800">
                    {row.categoryLabel}
                  </td>
                  {visibleSeries.map((s) => (
                    <td
                      key={s.key}
                      className="px-3 py-2 text-right text-gray-700"
                    >
                      {row[s.key]}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export default CategoryCompareChart;
