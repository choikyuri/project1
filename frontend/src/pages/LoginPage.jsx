import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 입력칸 처음 값
const INITIAL_FORM = { username: "", password: "" };

// 로그인 화면
function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ProtectedRoute 에 막혀서 왔으면 원래 가려던 주소, 아니면 홈("/")
  const from = location.state?.from || "/";

  const [form, setForm] = useState(INITIAL_FORM); // 입력값
  const [errors, setErrors] = useState({}); // 칸별 오류 문구
  const [serverMessage, setServerMessage] = useState(""); // 위쪽 안내 문구
  const [submitting, setSubmitting] = useState(false); // 요청 중 (버튼 연타 방지)

  // 입력칸 값이 바뀔 때
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // 로그인 버튼
  const handleSubmit = async (e) => {
    e.preventDefault(); // 새로고침 막기
    setServerMessage(""); // 이전 안내 문구 지우기

    // 빈 칸 검사
    const newErrors = {};
    if (form.username.trim() === "")
      newErrors.username = "아이디를 입력하세요.";
    if (form.password === "") newErrors.password = "비밀번호를 입력하세요.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 로그인 요청
    setSubmitting(true);
    try {
      await login(form.username.trim(), form.password);
      // replace : 뒤로 가기로 로그인 화면에 돌아오지 않게
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      }
      setServerMessage(
        data?.message ||
          "로그인 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인하세요.",
      );
      // 비밀번호 칸만 비우기
      setForm({ ...form, password: "" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="form-page">
      <h1>로그인</h1>

      {/* ProtectedRoute 에 막혀서 온 경우에만 안내 */}
      {from !== "/" && (
        <p className="alert-info">
          로그인이 필요한 페이지입니다. 로그인 후 이동합니다.
        </p>
      )}

      {serverMessage && <p className="alert-error">{serverMessage}</p>}

      <form className="form" onSubmit={handleSubmit} noValidate>
        {/* ---------- 아이디 ---------- */}
        <div className="form-row">
          <label htmlFor="username">아이디</label>
          <input
            id="username"
            name="username"
            type="text"
            value={form.username}
            onChange={handleChange}
            autoComplete="username" /* 브라우저 아이디 자동완성 */
            className={errors.username ? "input-error" : ""}
          />
          {errors.username && <p className="field-error">{errors.username}</p>}
        </div>

        {/* ---------- 비밀번호 ---------- */}
        <div className="form-row">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password" /* 저장된 비밀번호 자동완성 */
            className={errors.password ? "input-error" : ""}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </form>

      <p className="form-footer">
        아직 회원이 아니신가요? <Link to="/signup">회원가입</Link>
      </p>
    </section>
  );
}

export default LoginPage;
