import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { fetchBoards } from "../api/boardApi";
import { useAuth } from "../context/AuthContext";
import { CATEGORIES } from "../constants/categories";
import CategoryBadge from "../components/CategoryBadge";
import Pagination from "../components/Pagination";
import { formatDate } from "../utils/format";

const PAGE_SIZE = 10;

function BoardListPage() {
  const { member } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  //주소에서 조건 읽기
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const category = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";

  const [result, setResult] = useState(null);
  //const [boards, setBoards] = useState([]); // 글 목록(처음엔 빈 배열)
  const [loading, setLoading] = useState(true); // 불러오는 중
  const [error, setError] = useState(""); //오류 문구
  const [keywordInput, setKeywordInput] = useState(keyword); // 검색창에 입력중인 글자

  // 조건이 바뀔때마다 목록 다시 불러오기
  useEffect(() => {
    fetchBoards({ page: page - 1, size: PAGE_SIZE, category, keyword })
      .then((data) => setResult(data))
      .catch((err) => {
        console.error("목록 조회 실패:", err);
        setError(
          err.response?.data?.message ||
            "글 목록을 불러오지 못했습니다. 백앤드가 실행 중인지 확인하세요",
        );
      })
      .finally(() => setLoading(false));
  }, [page, category, keyword]);

  // 주소 조건 바꾸기 예:updateQuery ({category:'CAFE', page:1})
  const updateQuery = (changes) => {
    const next = new URLSearchParams(searchParams); // 지금 주소 조건 복사
    Object.entries(changes).forEach(([name, value]) => {
      // Object.entries({ a: 1 }) → [['a', 1]] : 객체를 [이름, 값] 목록으로
      if (value === "" || value === null || value === undefined) {
        next.delete(name);
      } else {
        next.set(name, String(value));
      }
    });
    setSearchParams(next); // 주소 변경 → 화면 다시 그림 → useEffect 실행
  };

  // 카테고리 탭 클릭: 카테고리 바꾸고 1쪽으로 이동
  const handleCategory = (code) => {
    updateQuery({ category: code, page: "" }); // page 를 지우면 1쪽
  };

  // 검색: 검색 바꾸고 1쪽으로 이동
  const handleSearch = (e) => {
    e.preventDefault();
    updateQuery({ keyword: keywordInput.trim(), page: "" });
  };

  // 초기화: 모든 조건 지우기
  const handleReset = () => {
    setKeywordInput("");
    setSearchParams({});
  };

  // 페이지 번호 클릭: 페이지 이동 단. 페이지가 1쫃이면 주소에서 page 빼도 됨
  const handlePage = (nextPage) => {
    updateQuery({ page: nextPage === 1 ? "" : nextPage });
    window.scrollTo(0, 0); // 화면 맨 위로
  };

  const boards = result ? result.boards : [];

  return (
    <section>
      <div className="page-head">
        <h1>게시판</h1>
        {member && (
          <Link to="/boards/new" className="btn">
            글쓰기
          </Link>
        )}
      </div>

      {/* ---------- 카테고리 탭 ---------- */}
      <div className="category-tabs">
        <button
          type="button"
          className={category === "" ? "tab active" : "tab"}
          onClick={() => handleCategory("")}
        >
          전체
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.code}
            type="button"
            className={category === c.code ? "tab active" : "tab"}
            onClick={() => handleCategory(c.code)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ---------- 검색 ---------- */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="search"
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="제목 또는 내용 검색"
          aria-label="검색어"
        />
        <button type="submit" className="btn btn-secondary">
          검색
        </button>
        {/* 조건이 하나라도 있으면 초기화 버튼 표시 */}
        {(category || keyword) && (
          <button type="button" className="btn btn-light" onClick={handleReset}>
            초기화
          </button>
        )}
      </form>

      {loading && <p className="sub">불러오는 중...</p>}
      {error && <p className="alert-error">{error}</p>}

      {result && !error && (
        <>
          {/* 결과 개수 */}
          <p className="result-info">
            {keyword ? `"${keyword}" 검색 결과 ` : "전체 "}
            <b>{result.totalElements}</b>건
          </p>

          <table className="board-table">
            <thead>
              <tr>
                <th className="col-no">번호</th>
                <th className="col-category">카테고리</th>
                <th>제목</th>
                <th className="col-writer">작성자</th>
                <th className="col-views">조회</th>
                <th className="col-date">작성일</th>
              </tr>
            </thead>
            <tbody>
              {boards.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    {keyword || category
                      ? "조건에 맞는 글이 없습니다."
                      : "아직 글이 없습니다. 첫 글을 작성해 보세요."}
                  </td>
                </tr>
              )}
              {boards.map((board) => (
                <tr key={board.boardId}>
                  <td className="col-no">{board.boardId}</td>
                  <td className="col-category">
                    <CategoryBadge code={board.category} />
                  </td>
                  <td className="col-title">
                    <Link to={`/boards/${board.boardId}`}>{board.title}</Link>
                  </td>
                  <td className="col-writer">{board.writerName}</td>
                  <td className="col-views">{board.viewCount}</td>
                  <td className="col-date">{formatDate(board.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ---------- 페이지 번호 ---------- */}
          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            onChange={handlePage}
          />
        </>
      )}
    </section>
  );
}

export default BoardListPage;
