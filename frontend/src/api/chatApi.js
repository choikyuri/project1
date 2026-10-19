import axios from "axios";

// [Chapter 10] 챗봇 API (09챕터와 같은 Python 서버, 같은 /pyapi 프록시)
const pyapi = axios.create({
  baseURL: "/pyapi",
  timeout: 30000, // LLM 답변은 몇 초 걸릴 수 있다 → 최대 30초까지 기다림
});

/**
 * 챗봇에게 질문하기
 * POST /pyapi/chat
 *
 * @param {Array<{role: "user"|"assistant", content: string}>} messages 지금까지의 대화 전체
 * @param {{memberId: number, name: string} | null} member 로그인한 회원
 * @returns {Promise<string>} 챗봇 답변
 */
export async function sendChat(messages, member) {
  const res = await pyapi.post("/chat", {
    messages,
    memberId: member?.memberId ?? null,
    memberName: member?.name ?? null,
  });
  return res.data.reply;
}