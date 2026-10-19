import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import BoardForm from "../components/BoardForm";
import { fetchBoard, updateBoard } from "../api/boardApi";
import { useAuth } from "../context/AuthContext";

/**
 * 글 수정 화면 (ProtectedRoute 로 보호 : 로그인한 사람만 → member 는 항상 있다)
 */
function BoardEditPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { member } = useAuth();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 기존 글 불러오기 (상세 화면과 같은 방식)
  useEffect(() => {
    fetchBoard(boardId)
      .then((data) => setBoard(data))
      .catch((err) =>
        setError(err.response?.data?.message || "글을 불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
  }, [boardId]);

  // BoardForm 에 넘겨줄 "수정 완료" 동작
  const handleUpdate = async (form) => {
    await updateBoard(boardId, form);
    navigate(`/boards/${boardId}`, { replace: true }); // 수정한 글 상세로
  };

  // ---------- 상황별 화면 ----------
  // (주의) Hook(useState, useEffect 등)은 모두 이 위에 있어야 한다. if 로 중간에 return 하기 전에!
  if (loading) {
    return <p className="sub">불러오는 중...</p>;
  }

  if (error) {
    return (
      <section>
        <p className="alert-error">{error}</p>
        <Link to="/boards" className="btn btn-light">
          목록으로
        </Link>
      </section>
    );
  }

  if (board.writerId !== member.memberId) {
    return (
      <section>
        <p className="alert-error">작성자만 수정할 수 있습니다.</p>
        <Link to={`/boards/${boardId}`} className="btn btn-light">
          글로 돌아가기
        </Link>
      </section>
    );
  }

  return (
    <section className="form-page wide">
      <h1>글 수정</h1>
      {/* 불러온 기존 값을 처음 값으로 넘긴다
          → BoardForm 은 board 를 다 불러온 뒤에 그려지므로 기존 값이 정상적으로 채워진다 */}
      <BoardForm
        initialValues={{
          category: board.category,
          title: board.title,
          content: board.content,
        }}
        submitLabel="수정 완료"
        onSubmit={handleUpdate}
      />
    </section>
  );
}

export default BoardEditPage;
