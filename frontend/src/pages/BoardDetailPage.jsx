import { useEffect, useState } from "react";
// useParams : 주소의 :boardId 자리 값을 꺼낸다 (/boards/3 → boardId = "3")
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteBoard, fetchBoard, increaseView } from "../api/boardApi";
import CategoryBadge from "../components/CategoryBadge";
import { useAuth } from "../context/AuthContext";
import { formatDateTime } from "../utils/format";

// 새로고침, 상세 반복 이동에서 조회수가 증가 되는것을 막음
const countedBoardIds = new Set();

/**
 * 글 상세 화면 (누구나)
 * - 작성자 본인에게만 [수정] [삭제] 버튼을 보여준다
 */
function BoardDetailPage() {
  const { boardId } = useParams(); // 주소에서 꺼낸 값은 항상 문자열 "3"
  const navigate = useNavigate();
  const { member } = useAuth();

  const [board, setBoard] = useState(null); // 글 상세 데이터
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 화면이 열릴 때 + boardId 가 바뀔 때 : 글 불러오기
  // [boardId] : 이 값이 바뀌면 다시 실행 (예: 다른 글 링크로 이동)
  useEffect(() => {
    let request;

    if (countedBoardIds.has(boardId)) {
      // 이미 센 글 → 글만 불러온다
      request = fetchBoard(boardId);
    } else {
      // 처음 보는 글 → 메모장에 적고, 조회수 올린 "다음에" 글을 불러온다
      // (순서를 지켜야 화면에 올라간 조회수가 보인다)
      countedBoardIds.add(boardId);
      request = increaseView(boardId).then(() => fetchBoard(boardId));
    }

    request
      .then((data) => setBoard(data))
      .catch((err) =>
        setError(err.response?.data?.message || "글을 불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
  }, [boardId]);

  // 내 글인가? : 로그인했고 + 글을 불러왔고 + 작성자 번호 = 내 회원 번호
  // (둘 다 숫자이므로 === 로 비교. 화면용 판단일 뿐, 진짜 검사는 서버가 한다)
  const isMine =
    member !== null && board !== null && board.writerId === member.memberId;

  // [삭제] 버튼
  const handleDelete = async () => {
    // confirm : 확인/취소 창. 취소를 누르면 false → 함수 종료
    if (
      !window.confirm("이 글을 삭제할까요? 삭제한 글은 되돌릴 수 없습니다.")
    ) {
      return;
    }
    try {
      await deleteBoard(boardId);
      navigate("/boards", { replace: true }); // 목록으로 (뒤로 가기로 삭제된 글에 돌아오지 않게)
    } catch (err) {
      alert(err.response?.data?.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  // ---------- 상황별 화면 ----------
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

  return (
    <section className="board-detail">
      <CategoryBadge code={board.category} />
      <h1 className="board-title">{board.title}</h1>

      {/* 작성자 · 날짜 줄 */}
      <p className="board-meta">
        <span>{board.writerName}</span>
        <span>작성 {formatDateTime(board.createdAt)}</span>
        {/* 수정한 적이 있으면(작성일 ≠ 수정일) 수정일도 표시 */}
        {board.updatedAt !== board.createdAt && (
          <span>수정 {formatDateTime(board.updatedAt)}</span>
        )}
        <span>조회 {board.viewCount}</span>
      </p>

      {/* 내용 : CSS white-space: pre-wrap 으로 줄바꿈을 그대로 보여준다 */}
      <div className="board-content">{board.content}</div>

      {/* 버튼 줄 */}
      <div className="btn-group">
        {/* navigate(-1) : 목록의 이전 쪽·검색 조건으로 돌아간다 (주소에 저장되어 있으므로) */}
        <button
          type="button"
          className="btn btn-light"
          onClick={() => navigate(-1)}
        >
          목록
        </button>

        {isMine && (
          <>
            <Link
              to={`/boards/${board.boardId}/edit`}
              className="btn btn-secondary"
            >
              수정
            </Link>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDelete}
            >
              삭제
            </button>
          </>
        )}
      </div>
    </section>
  );
}

export default BoardDetailPage;
