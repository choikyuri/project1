export function formatDateTime(value) {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16); // T 를 공백으로 바꾸고 앞에서 16글자만
}

export function formatDate(value) {
  if (!value) return "";
  return value.slice(0, 10); // 날짜만 "2026-10-13"
}
