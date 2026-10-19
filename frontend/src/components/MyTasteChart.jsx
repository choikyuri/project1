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
import { getCategoryLabel } from "../constants/categories";

/**
 * 내 취향 (나 vs 전체 평균) 막대 차트
 * @param {object} data 분석 서버 /pyapi/members/{id}/preference 응답
 * @param {string} name 로그인한 회원 이름
 */
function MyTasteChart({ data, name }) {
  if (data.total === 0) {
    return (
      <div className="dash-panel">
        <h2>{name}님의 취향</h2>
        <p className="sub">
          아직 조회 기록이 없습니다. 글을 읽으면 취향이 쌓입니다.
        </p>
      </div>
    );
  }

  // Recharts 는 [{ 이름, 값1, 값2 }, ...] 모양의 배열을 받는다
  const chartData = data.items.map((item) => ({
    label: getCategoryLabel(item.category),
    나: item.mine,
    전체: item.overall,
  }));

  return (
    <div className="dash-panel">
      <div className="dash-head">
        <h2>{name}님의 취향</h2>
        <p className="sub">
          내 조회 {data.total.toLocaleString()}건 · 평균보다 특히{" "}
          <b>{getCategoryLabel(data.favorite)}</b> 글을 많이 봐요
        </p>
      </div>

      {/* ResponsiveContainer : 부모 너비에 맞춰 차트 크기 자동 조절 (높이는 지정) */}
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis unit="%" tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          {/* isAnimationActive={false} : 막대가 자라는 애니메이션을 끈다
              (환경에 따라 애니메이션이 멈춰 막대가 안 보이는 경우가 있어 끄는 쪽이 안전) */}
          <Bar
            dataKey="나"
            fill="#e87a00"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="전체"
            fill="#c9ced6"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MyTasteChart;
