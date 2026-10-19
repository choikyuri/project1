import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../constants/categories";

// 서버(BoardRequest)와 같은 글자 수 제한
const TITLE_MAX = 100;
const CONTENT_MAX = 1000;

// 화면에서 하는 입력값 유효성 검사
function validate(form) {
  const errors = {};
  if (form.category === "") {
    errors.category = "카테고리를 선택하세요.";
  }
  if (form.title.trim() === "") {
    errors.title = "제목을 입력하세요.";
  } else if (form.title.trim().length > TITLE_MAX) {
    errors.title = `제목은 ${TITLE_MAX}자 이하로 입력하세요.`;
  }
  if (form.content.trim() === "") {
    errors.content = "내용을 입력하세요.";
  } else if (form.content.length > CONTENT_MAX) {
    errors.content = `내용은 ${CONTENT_MAX}자 이하로 입력하세요.`;
  }
  return errors;
}

// props(부모가 넘겨준거)
/*
@param initialValues: 처음 입력값
@param submitLabel: 등록 / 수정완료
@param onSubmit: 버튼을 눌렀을 때 실행할 함수
*/
function BoardForm({ initialValues, submitLabel, onSubmit }) {
  const navigate = useNavigate();

  // initialValues 는 "처음 한 번만" 상태의 시작값으로 쓰인다
  const [form, setForm] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 입력할 때마다
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  // [등록] / [수정 완료]
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMessage("");

    // 1) 화면 검사
    const newErrors = validate(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 2) 부모가 넘겨준 onSubmit 실행 (글쓰기면 createBoard, 수정이면 updateBoard)
    setSubmitting(true);
    try {
      await onSubmit({
        category: form.category,
        title: form.title.trim(),
        content: form.content,
      });
      // 성공하면 부모(onSubmit 안)가 다른 페이지로 이동시킨다
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors); // 400 : 칸별 문구
      }
      // 401 (로그인 풀림), 403 (남의 글), 404 (삭제된 글) 등 서버 문구 표시
      setServerMessage(
        data?.message ||
          "저장 중 오류가 발생했습니다. 백엔드가 실행 중인지 확인하세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {serverMessage && <p className="alert-error">{serverMessage}</p>}

      <form className="form" onSubmit={handleSubmit} noValidate>
        {/* 카테고리 */}
        <div className="form-row">
          <label htmlFor="category">카테고리</label>
          {/* select : 목록에서 고르는 입력칸. input 과 같은 방식(value + onChange) */}
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className={errors.category ? "input-error" : ""}
          >
            {/* value="" : 아직 고르지 않은 상태 */}
            <option value="">카테고리를 선택하세요</option>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="field-error">{errors.category}</p>}
        </div>

        {/* ---------- 제목 ---------- */}
        <div className="form-row">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            maxLength={
              TITLE_MAX
            } /* 브라우저가 100자 넘게 입력하지 못하게 막는다 */
            placeholder="제목을 입력하세요"
            className={errors.title ? "input-error" : ""}
          />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        {/* ---------- 내용 ---------- */}
        <div className="form-row">
          <label htmlFor="content">내용</label>
          {/* textarea : 여러 줄 입력칸. input 과 같은 방식(value + onChange)으로 쓴다 */}
          <textarea
            id="content"
            name="content"
            rows={12}
            value={form.content}
            onChange={handleChange}
            maxLength={CONTENT_MAX}
            placeholder="내용을 입력하세요"
            className={errors.content ? "input-error" : ""}
          />
          {/* 글자 수 표시 */}
          <p className="char-count">
            {form.content.length} / {CONTENT_MAX}
          </p>
          {errors.content && <p className="field-error">{errors.content}</p>}
        </div>

        <div className="btn-group">
          {/* navigate(-1) : 브라우저 뒤로 가기와 같다 */}
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate(-1)}
          >
            취소
          </button>
          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "저장 중..." : submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}

export default BoardForm;
