// /api
import api from "./axios";

// 글목록
// GET /api/boards
export async function fetchBoards({ page, size, category, keyword }) {
  const res = await api.get("/boards", {
    params: { page, size, category, keyword },
  });
  return res.data;
}

//글상세
// GET /api/boards/{boardId}
export async function fetchBoard(boardId) {
  const res = await api.get(`/boards/${boardId}`);
  return res.data;
}

// 조회 수 올리기
// POST //api/boards/3/views
export async function increaseView(boardId) {
  await api.post(`/boards/${boardId}/views`);
}

//글작성
// POST /api/boards
export async function createBoard(form) {
  const res = await api.post("/boards", {
    category: form.category,
    title: form.title,
    content: form.content,
  });
  return res.data;
}

//글수정
//PUT /api/boards/{boardId}
export async function updateBoard(boardId, form) {
  const res = await api.put(`/boards/${boardId}`, {
    category: form.category,
    title: form.title,
    content: form.content,
  });
  return res.data;
}

//글삭제
// DELETE /api/boards/{boardId}  -> 본문에 없음(204)
export async function deleteBoard(boardId) {
  await api.delete(`/boards/${boardId}`);
}
