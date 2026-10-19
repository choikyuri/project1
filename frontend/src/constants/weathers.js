export const WEATHERS = [
  { code: "CLEAR", label: "맑음" },
  { code: "CLOUDY", label: "흐림" },
  { code: "RAIN", label: "비" },
  { code: "SNOW", label: "눈" },
];

// "RAIN" → "비"
export function getWeatherLabel(code) {
  const found = WEATHERS.find((w) => w.code === code);
  return found ? found.label : code;
}