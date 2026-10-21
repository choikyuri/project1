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
 * @param {Array<{role: "user"|"assistant", content: string, image?: string}>} messages 지금까지의 대화 전체
 * @param {{memberId: number, name: string} | null} member 로그인한 회원
 * @returns {Promise<string>} 챗봇 답변
 */
export async function sendChat(messages, member) {
  const res = await pyapi.post("/chat", {
    // [Chapter 11] 대화 기록에 사진 말풍선(image)이 섞여 있을 수 있다
    // 사진(data URL)은 수 MB 크기라서 서버로 다시 보내지 않는다 → role, content 만 골라서 전송
    messages: messages.map(({ role, content }) => ({ role, content })),
    memberId: member?.memberId ?? null,
    memberName: member?.name ?? null,
  });
  return res.data.reply;
}

/**
 * [Chapter 11] 귤봇 사진 만들기 (음식 / 옷차림)
 * POST /pyapi/chat/image
 *
 * @param {string} text 사용자가 입력한 문장 (예: "오늘 날씨에 맞는 옷 사진 만들어 줘")
 * @returns {Promise<{kind: "food"|"outfit"|null, image: string|null, message: string}>}
 *          음식도 옷도 아니면 kind, image 가 null 이고 message 에 안내 문구가 들어 있다
 */
export async function generateFoodImage(text) {
  const res = await pyapi.post(
    "/chat/image",
    { text }, // main.py 의 ImageRequest(text: str) 와 이름이 같아야 한다
    { timeout: 90000 }, // 사진은 오래 걸린다 → 이 요청만 90초까지 기다림
  );
  return res.data; // { kind, image, message } 를 통째로 돌려준다
}
