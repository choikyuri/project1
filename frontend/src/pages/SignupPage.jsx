import { useState } from "react";
// useNavigate : 코드로 페이지를 이동시키는 기능 (가입 성공 후 홈으로 이동)
import { useNavigate } from "react-router-dom";
import { checkUsername, signup } from "../api/memberApi";

// ===================================================================
// [컴포넌트 밖] 입력값 규칙 - 서버(MemberSignupRequest)와 같은 규칙
// 정규식은 /규칙/ 모양으로 쓰고, .test(값) 으로 규칙에 맞는지 true/false 를 얻는다
// ===================================================================
const USERNAME_RULE = /^[a-z0-9]{4,20}$/; // 영문 소문자+숫자 4~20자
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)\S{8,20}$/; // 영문+숫자 포함, 공백 없이 8~20자
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 글자@글자.글자 모양

// 안내 문구 (서버와 같은 문장)
const USERNAME_MESSAGE = "아이디는 영문 소문자와 숫자 4~20자로 입력하세요.";

// 입력칸의 처음 값 (모두 빈 문자열)
const INITIAL_FORM = {
  username: "",
  password: "",
  passwordConfirm: "",
  name: "",
  email: "",
};

// 아이디 중복 확인 상태의 처음 값
// checked   : 중복 확인을 했는가
// available : 사용 가능한 아이디인가
// message   : 아이디 칸 아래에 보여줄 문구
const INITIAL_CHECK = { checked: false, available: false, message: "" };

/**
 * 화면에서 하는 입력값 검사
 * @param {object} form 입력값
 * @returns {object} 오류 목록 { 칸이름: 문구 } - 오류가 없으면 빈 객체 {}
 */
function validate(form) {
  const errors = {};

  if (!USERNAME_RULE.test(form.username)) {
    errors.username = USERNAME_MESSAGE;
  }
  if (!PASSWORD_RULE.test(form.password)) {
    errors.password =
      "비밀번호는 영문과 숫자를 포함해 공백 없이 8~20자로 입력하세요.";
  }
  if (form.password !== form.passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다.";
  }
  if (form.name.trim() === "") {
    errors.name = "이름을 입력하세요.";
  } else if (form.name.trim().length > 16) {
    errors.name = "이름은 16자 이하로 입력하세요.";
  }
  if (!EMAIL_RULE.test(form.email.trim())) {
    errors.email = "이메일 형식이 올바르지 않습니다.";
  }

  return errors;
}

/**
 * 회원가입 화면
 */
function SignupPage() {
  const navigate = useNavigate(); // navigate('/') → 홈으로 이동

  // ----------------------- 상태(state) -----------------------
  const [form, setForm] = useState(INITIAL_FORM); // 입력값 5개
  const [errors, setErrors] = useState({}); // 칸별 오류 문구
  const [usernameCheck, setUsernameCheck] = useState(INITIAL_CHECK); // 아이디 중복 확인 결과
  const [serverMessage, setServerMessage] = useState(""); // 폼 위쪽 전체 안내 문구
  const [submitting, setSubmitting] = useState(false); // 가입 요청 중 여부 (버튼 연타 방지)

  // ----------------------- 이벤트 함수 -----------------------

  /**
   * 입력칸 값이 바뀔 때마다 실행 (5개 칸이 이 함수 하나를 같이 쓴다)
   * e.target.name  : 바뀐 칸의 name 속성 ("username", "email" ...)
   * e.target.value : 바뀐 값
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // ...form : 기존 값을 그대로 복사하고, [name] 칸만 새 값으로 바꾼다
    setForm({ ...form, [name]: value });

    // 사용자가 다시 입력하기 시작하면 그 칸의 오류 문구는 지운다
    setErrors({ ...errors, [name]: "" });

    // 아이디를 바꾸면 이전 중복 확인 결과는 무효 → 다시 확인해야 한다
    if (name === "username") {
      setUsernameCheck(INITIAL_CHECK);
    }
  };

  /**
   * [중복 확인] 버튼
   */
  const handleCheckUsername = async () => {
    // 1) 형식부터 화면에서 검사 (틀리면 서버에 물어볼 필요 없음)
    if (!USERNAME_RULE.test(form.username)) {
      setErrors({ ...errors, username: USERNAME_MESSAGE });
      return; // 여기서 함수 종료
    }

    // 2) 서버에 사용 가능 여부 확인
    try {
      const result = await checkUsername(form.username);
      // result 예) { available: true, message: "사용할 수 있는 아이디입니다." }
      setUsernameCheck({
        checked: true,
        available: result.available,
        message: result.message,
      });
    } catch {
      // 서버가 꺼져 있는 등 요청 자체가 실패한 경우
      setUsernameCheck({
        checked: false,
        available: false,
        message:
          "중복 확인 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인하세요.",
      });
    }
  };

  /**
   * [가입하기] 버튼 (form 의 onSubmit)
   */
  const handleSubmit = async (e) => {
    // form 의 기본 동작(페이지 새로고침)을 막는다 → 없으면 화면이 새로고침되어 입력값이 사라진다
    e.preventDefault();
    setServerMessage("");

    // 1) 화면 검사
    const newErrors = validate(form);
    // Object.keys(객체).length : 객체 안의 항목 개수 → 0보다 크면 오류가 있다는 뜻
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 2) 아이디 중복 확인을 했는지, 사용 가능한 아이디인지 확인
    if (!usernameCheck.checked || !usernameCheck.available) {
      setErrors({ username: "아이디 중복 확인을 해 주세요." });
      return;
    }

    // 3) 서버로 전송
    setSubmitting(true); // 버튼 잠금
    try {
      const member = await signup(form);
      // 성공 (201) : member = { memberId, username, name, email, createdAt }
      alert(`${member.name}님, 회원가입이 완료되었습니다. 로그인해 주세요.`); // 백틱(`) 안의 ${변수} 는 값으로 바뀐다
      navigate("/login"); // 홈으로 이동 (03챕터에서는 로그인 화면으로 바꾼다)
    } catch (err) {
      // 실패 : 서버가 보낸 오류 JSON = err.response.data
      // ?. (옵셔널 체이닝) : 앞의 값이 없으면 오류를 내지 않고 undefined 를 돌려준다
      //                     (서버가 아예 꺼져 있으면 err.response 가 없기 때문)
      const data = err.response?.data;

      if (data?.errors) {
        setErrors(data.errors); // 칸별 문구를 각 칸 아래에 표시
        // 서버가 "아이디 중복"이라고 하면 중복 확인을 다시 하게 한다
        if (data.errors.username) {
          setUsernameCheck(INITIAL_CHECK);
        }
      }
      // || : 앞의 값이 없으면 뒤의 값을 쓴다
      setServerMessage(
        data?.message ||
          "회원가입 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인하세요.",
      );
    } finally {
      setSubmitting(false); // 성공이든 실패든 버튼 잠금 해제
    }
  };

  // 아이디 칸 아래에 보여줄 문구 : 오류 문구가 있으면 오류 문구, 없으면 중복 확인 결과
  const usernameMessage = errors.username || usernameCheck.message;
  // 문구 색 : 중복 확인 결과 "사용 가능"일 때만 초록색
  const usernameOk =
    !errors.username && usernameCheck.checked && usernameCheck.available;

  // ----------------------- 화면(JSX) -----------------------
  return (
    <section className="form-page">
      <h1>회원가입</h1>

      {/* 서버 전체 안내 문구 (있을 때만 표시) */}
      {serverMessage && <p className="alert-error">{serverMessage}</p>}

      {/* noValidate : 브라우저 기본 검사 말풍선을 끄고, 우리가 만든 검사만 사용 */}
      <form className="form" onSubmit={handleSubmit} noValidate>
        {/* ---------- 아이디 ---------- */}
        <div className="form-row">
          {/* htmlFor 와 input 의 id 가 같으면, 글자를 눌러도 입력칸에 커서가 간다 */}
          <label htmlFor="username">아이디</label>
          <div className="input-group">
            <input
              id="username"
              name="username" /* handleChange 에서 e.target.name 으로 쓰인다 */
              type="text"
              value={form.username} /* 화면 값 = 상태 값 (항상 같게 유지) */
              onChange={handleChange}
              placeholder="영문 소문자+숫자 4~20자"
              autoComplete="username"
              className={
                errors.username ? "input-error" : ""
              } /* 오류면 빨간 테두리 */
            />
            {/* type="button" : form 안의 버튼이지만 "제출"이 아니라 그냥 버튼 */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCheckUsername}
            >
              중복 확인
            </button>
          </div>
          {usernameMessage && (
            <p className={usernameOk ? "field-ok" : "field-error"}>
              {usernameMessage}
            </p>
          )}
        </div>

        {/* ---------- 비밀번호 ---------- */}
        <div className="form-row">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password" /* 입력값이 ●●● 로 보인다 */
            value={form.password}
            onChange={handleChange}
            placeholder="영문+숫자 포함 8~20자"
            autoComplete="new-password"
            className={errors.password ? "input-error" : ""}
          />
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        {/* ---------- 비밀번호 확인 ---------- */}
        <div className="form-row">
          <label htmlFor="passwordConfirm">비밀번호 확인</label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호를 한 번 더 입력"
            autoComplete="new-password"
            className={errors.passwordConfirm ? "input-error" : ""}
          />
          {errors.passwordConfirm && (
            <p className="field-error">{errors.passwordConfirm}</p>
          )}
        </div>

        {/* ---------- 이름 ---------- */}
        <div className="form-row">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="16자 이하"
            autoComplete="name"
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        {/* ---------- 이메일 ---------- */}
        <div className="form-row">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            autoComplete="email"
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        {/* type="submit" : 누르면 form 의 onSubmit(handleSubmit) 이 실행된다 */}
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? "가입 처리 중..." : "가입하기"}
        </button>
      </form>
    </section>
  );
}

export default SignupPage;
