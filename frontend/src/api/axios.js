import axios from "axios";

// api.get('/health') -> /api/health
const api = axios.create({
  baseURL: "/api",
  withCredentials: true, // 로그인(세션)을 위해 미리 설정
});

export default api;
