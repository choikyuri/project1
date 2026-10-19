import { useEffect, useState } from "react";

// 요일 이름 : Date 의 getDay() 는 일요일 0, 월요일 1, ... 토요일 6
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 한 자리 숫자 앞에 0 붙이기 : 7 → "07", 12 → "12"
 * padStart(2, '0') : 글자 길이가 2가 될 때까지 앞을 '0' 으로 채운다
 */
function pad(number) {
  return String(number).padStart(2, "0");
}

/**
 * Date → "2026.10.12 (월) 16:10:05"
 * getMonth() 는 0(1월) ~ 11(12월) 이라서 1을 더한다
 */
function formatClock(date) {
  const ymd = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
  const day = DAYS[date.getDay()];
  const hms = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${ymd} (${day}) ${hms}`;
}

/**
 * 실시간 시계 (서버 필요 없음, 내 PC 시각 기준)
 * - Tailwind 클래스로 꾸민다
 */
function Clock() {
  // 지금 시각 (new Date() = 이 줄이 실행되는 순간의 날짜·시각)
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // 1초마다 지금 시각으로 바꾼다 → 화면이 다시 그려진다
    const timerId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    // 정리 : 화면에서 사라지면 타이머 취소
    return () => clearInterval(timerId);
  }, []); // [] : 처음 한 번만 타이머를 만든다

  return (
    // inline-flex items-center gap-1.5 : 아이콘과 글자를 가로로, 세로 가운데, 6px 간격
    // text-sm text-gray-700            : 작은 글씨, 진한 회색
    // tabular-nums                     : 숫자 폭을 같게 → 초가 바뀔 때 글자가 흔들리지 않는다
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 tabular-nums">
      <span aria-hidden="true">🕒</span>
      {/* time 태그 : 날짜·시각임을 브라우저·검색엔진에 알려준다 */}
      <time dateTime={now.toISOString()}>{formatClock(now)}</time>
    </span>
  );
}

export default Clock;
