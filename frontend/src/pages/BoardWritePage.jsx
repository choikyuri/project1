import { useNavigate } from "react-router-dom";
import BoardForm from "../components/BoardForm";
import { createBoard } from "../api/boardApi";

// 글쓰기는 빈 칸으로 시작 (컴포넌트 밖에 두면 화면이 다시 그려져도 새로 만들지 않는다)
const EMPTY_FORM = { category: "", title: "", content: "" };

/**
 * 글쓰기 화면 (ProtectedRoute 로 보호 : 로그인한 사람만)
 */
function BoardWritePage() {
  const navigate = useNavigate();

  /**
   * BoardForm 에 넘겨줄 "등록" 동작
   * - 실패하면 createBoard 가 오류를 던지고, BoardForm 의 catch 가 받아서 문구를 보여준다
   */
  const handleCreate = async (form) => {
    const saved = await createBoard(form); // 서버 저장 → 새 글 정보
    navigate(`/boards/${saved.boardId}`, { replace: true }); // 방금 쓴 글 상세로 이동
  };

  return (
    <section className="form-page wide">
      <h1>글쓰기</h1>
      <BoardForm
        initialValues={EMPTY_FORM}
        submitLabel="등록"
        onSubmit={handleCreate}
      />
    </section>
  );
}

export default BoardWritePage;
