import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendChat, generateFoodImage } from "../api/chatApi";

// 버튼 한 번으로 보낼 수 있는 추천 질문 (시연할 때 타이핑하지 않아도 된다)
// [Chapter 11] 마지막 버튼은 사진 만들기 시연용
const SUGGESTIONS = [
  "비 오는데 뭐 읽을까?",
  "오늘 날씨에 맞는 글 추천해 줘",
  "내 취향은 어때?",
  "오늘 날씨에 맞는 옷 사진 만들어 줘",
];

// 입력 최대 글자 수 (서버의 max_length=500 과 같은 값)
const MAX_LENGTH = 500;

/**
 * [Chapter 11] 사진을 만들어 달라는 문장인지 확인한다
 * 무엇을 그릴지(음식? 옷?)는 정하지 않는다 → 서버의 LLM 이 문장을 읽고 판단한다
 *   "쌀떡볶이 이미지 만들어줘"          → true
 *   "비 오는 날 옷 사진 만들어 줘"      → true
 *   "짜장면 그려 줘"                    → true
 *   "비 오는데 뭐 읽을까?"              → false (평소처럼 챗봇에게)
 */
const IMAGE_REQUEST =
  /(?:이미지|사진|그림)\s*(?:을|를|좀|하나)?\s*(?:만들|그려|보여|생성)|그려\s*줘/;

function isImageRequest(text) {
  return IMAGE_REQUEST.test(text);
}

/**
 * [Chapter 10] 오른쪽 아래에 떠 있는 챗봇 "귤봇"
 * - App.jsx 에 한 번만 넣으면 모든 페이지에서 보인다
 * - 로그인한 회원만 대화할 수 있다 (OpenAI 비용 보호)
 * [Chapter 11] 음식 · 옷차림 사진 만들기 기능 추가
 */
function ChatWidget() {
  const { member } = useAuth();

  // ----------------------- 상태 -----------------------
  const [open, setOpen] = useState(false); // 대화창 열림 여부
  // 대화 기록 : [{ role: "user", content: "..." }, { role: "assistant", content: "...", image?: "data:..." }, ...]
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(""); // 입력 중인 글자
  const [sending, setSending] = useState(false); // 답변 기다리는 중
  const [drawing, setDrawing] = useState(false); // [Chapter 11] 사진 만드는 중 (기다림 문구를 다르게 보여 주기 위함)
  const [error, setError] = useState(""); // 오류 문구

  // 대화 목록 상자를 가리키는 "손잡이" → 새 메시지가 오면 맨 아래로 스크롤
  const listRef = useRef(null);

  // 대화 목록을 맨 아래로 내리기
  const scrollToBottom = () => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  // 메시지가 늘어나거나 "입력 중" 표시가 바뀔 때마다 맨 아래로
  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  // 로그인한 회원이 바뀌면(로그아웃 포함) 이전 사람의 대화를 지운다
  useEffect(() => {
    setMessages([]);
    setError("");
  }, [member?.memberId]);

  // 서버 오류 응답에서 화면에 보여 줄 문구 꺼내기
  const errorText = (err, fallback) =>
    typeof err.response?.data?.detail === "string"
      ? err.response.data.detail
      : fallback;

  /**
   * [Chapter 11] 사진 만들기 (음식 / 옷차림)
   * @param {string} request 사용자 문장 (예: "비 오는 날 어떤 옷을 입을까? 사진 만들어 줘")
   */
  const makeImage = async (request) => {
    const text = request.trim();
    if (text === "" || sending) return;

    // 1) 내 말풍선을 먼저 추가 (입력한 문장 그대로)
    const next = [...messages, { role: "user", content: `🍊 ${text}` }];
    setMessages(next);
    setInput("");
    setError("");
    setSending(true);
    setDrawing(true);

    try {
      // 2) 문장을 통째로 서버에 보낸다 → 서버의 LLM 이 음식인지 옷인지, 무엇을 그릴지 정한다
      //    data = { kind: "food" | "outfit" | null, image: "data:..." | null, message: "..." }
      const data = await generateFoodImage(text);

      // 3) 사진이 있으면 글 + 사진, 사진이 없으면(음식도 옷도 아님) 안내 글만
      //    content 는 대화 기록용 글, image 는 화면에만 쓰는 사진 (chatApi.js 가 서버로 다시 보내지 않음)
      setMessages([
        ...next,
        data.image
          ? { role: "assistant", content: data.message, image: data.image }
          : { role: "assistant", content: data.message },
      ]);
    } catch (err) {
      // 실패하면 방금 요청을 기록에서 빼고, 입력창에 되돌려 놓는다
      setMessages(messages);
      setInput(text);
      setError(
        errorText(
          err,
          "사진을 만들지 못했습니다. 8000번 Python 서버가 실행 중인지 확인하세요.",
        ),
      );
    } finally {
      setSending(false);
      setDrawing(false);
    }
  };

  /**
   * 질문 보내기
   * @param {string} text 보낼 질문
   */
  const send = async (text) => {
    const question = text.trim();
    if (question === "" || sending) return;

    // [Chapter 11] "○○ 사진 만들어 줘" 같은 문장이면 챗봇 대신 사진 만들기로 보낸다
    if (isImageRequest(question)) return makeImage(question);

    // 1) 내 질문을 대화 기록에 추가한 "새 배열" 을 만든다
    //    (setMessages 는 다음 화면에서 반영되므로, 서버에는 이 새 배열을 보낸다)
    const next = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setError("");
    setSending(true);

    try {
      // 2) 대화 기록 전체를 서버에 보낸다 (LLM 은 이전 대화를 기억하지 못하므로)
      const reply = await sendChat(next, member);
      // 3) 답변을 대화 기록에 추가
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (err) {
      // 실패하면 방금 보낸 질문을 기록에서 빼고, 입력창에 되돌려 놓는다 → 다시 보내기 쉬움
      setMessages(messages);
      setInput(question);
      setError(
        errorText(
          err,
          "챗봇 서버에 연결하지 못했습니다. 8000번 Python 서버가 실행 중인지 확인하세요.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  // 입력창에서 [보내기] 또는 Enter
  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  // 대화 새로 시작
  const handleReset = () => {
    setMessages([]);
    setError("");
  };

  // ----------------------- 화면 -----------------------
  return (
    <>
      {/* 대화창 (open 일 때만) */}
      {open && (
        <section className="chat-panel" aria-label="귤봇 대화창">
          <header className="chat-head">
            <div>
              <b>귤봇</b>
              <span className="chat-sub">게시판 도우미</span>
            </div>
            <div className="chat-head-btns">
              {messages.length > 0 && (
                <button
                  type="button"
                  className="chat-icon-btn"
                  onClick={handleReset}
                >
                  새 대화
                </button>
              )}
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => setOpen(false)}
                aria-label="대화창 닫기"
              >
                ✕
              </button>
            </div>
          </header>

          {!member ? (
            // 로그인 안 한 경우 : 안내만
            <div className="chat-body chat-guest">
              <p>귤봇은 로그인한 회원만 사용할 수 있어요.</p>
              <Link
                to="/login"
                className="btn btn-primary"
                onClick={() => setOpen(false)}
              >
                로그인하러 가기
              </Link>
            </div>
          ) : (
            <>
              {/* 대화 목록 */}
              <div className="chat-body" ref={listRef}>
                {/* 첫 인사 + 추천 질문 (대화가 없을 때만) */}
                {messages.length === 0 && (
                  <div className="chat-welcome">
                    <div className="chat-bubble bot">
                      {member.name}님, 안녕하세요! 오늘 날씨와 조회 기록을 보고
                      읽을 글을 골라 드릴게요.
                      {"\n"}"○○ 사진 만들어 줘"라고 하면 음식이나 옷차림 사진도
                      그려 드려요.
                    </div>
                    <div className="chat-suggest">
                      {SUGGESTIONS.map((s) => (
                        <button key={s} type="button" onClick={() => send(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 대화 기록 : role 이 user 면 오른쪽, assistant 면 왼쪽 */}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.role === "user" ? "chat-bubble me" : "chat-bubble bot"
                    }
                  >
                    {m.content}
                    {/* [Chapter 11] 사진이 있는 말풍선이면 사진도 표시
                        사진은 글보다 늦게 그려지므로, 다 그려진 뒤(onLoad) 한 번 더 맨 아래로 내린다 */}
                    {m.image && (
                      <img
                        src={m.image}
                        alt="귤봇이 만든 사진"
                        className="chat-img"
                        onLoad={scrollToBottom}
                      />
                    )}
                  </div>
                ))}

                {/* 답변 기다리는 중 (사진은 오래 걸리므로 문구를 다르게) */}
                {sending && (
                  <div className="chat-bubble bot chat-typing">
                    {drawing
                      ? "사진을 그리는 중… (최대 1분 정도 걸려요)"
                      : "답변을 만드는 중…"}
                  </div>
                )}
              </div>

              {error && <p className="chat-error">{error}</p>}

              {/* 입력창 */}
              <form className="chat-form" onSubmit={handleSubmit}>
                <input
                  id="chat-input"
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="질문 또는 음식·옷 이름"
                  maxLength={MAX_LENGTH} /* 서버 규칙과 같은 500자 */
                  disabled={sending}
                  aria-label="질문 입력"
                  autoComplete="off"
                />
                {/* [Chapter 11] 입력한 이름으로 사진 만들기 (예: "김밥" → "김밥 사진 만들어 줘")
                    type="button" → Enter 로는 실행되지 않고, 누를 때만 실행 */}
                <button
                  type="button"
                  className="chat-img-btn"
                  onClick={() => makeImage(`${input.trim()} 사진 만들어 줘`)}
                  disabled={sending || input.trim() === ""}
                  title="입력한 음식·옷 이름으로 사진 만들기"
                >
                  🍊 사진
                </button>
                <button type="submit" disabled={sending || input.trim() === ""}>
                  보내기
                </button>
              </form>
            </>
          )}
        </section>
      )}

      {/* 오른쪽 아래 동그란 버튼 : 누를 때마다 열기 ↔ 닫기 */}
      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen(!open)}
        aria-label={open ? "귤봇 닫기" : "귤봇 열기"}
      >
        {open ? "✕" : "귤봇"}
      </button>
    </>
  );
}

export default ChatWidget;
