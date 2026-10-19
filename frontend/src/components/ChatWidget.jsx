import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { sendChat } from "../api/chatApi";

// 버튼 한 번으로 보낼 수 있는 추천 질문 (시연할 때 타이핑하지 않아도 된다)
const SUGGESTIONS = [
  "비 오는데 뭐 읽을까?",
  "오늘 날씨에 맞는 글 추천해 줘",
  "내 취향은 어때?",
];

// 입력 최대 글자 수 (서버의 max_length=500 과 같은 값)
const MAX_LENGTH = 500;

/**
 * [Chapter 10] 오른쪽 아래에 떠 있는 챗봇 "귤봇"
 * - App.jsx 에 한 번만 넣으면 모든 페이지에서 보인다
 * - 로그인한 회원만 대화할 수 있다 (OpenAI 비용 보호)
 */
function ChatWidget() {
  const { member } = useAuth();

  // ----------------------- 상태 -----------------------
  const [open, setOpen] = useState(false); // 대화창 열림 여부
  // 대화 기록 : [{ role: "user", content: "..." }, { role: "assistant", content: "..." }, ...]
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(""); // 입력 중인 글자
  const [sending, setSending] = useState(false); // 답변 기다리는 중
  const [error, setError] = useState(""); // 오류 문구

  // 대화 목록 상자를 가리키는 "손잡이" → 새 메시지가 오면 맨 아래로 스크롤
  const listRef = useRef(null);

  // 메시지가 늘어나거나 "입력 중" 표시가 바뀔 때마다 맨 아래로
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // 로그인한 회원이 바뀌면(로그아웃 포함) 이전 사람의 대화를 지운다
  useEffect(() => {
    setMessages([]);
    setError("");
  }, [member?.memberId]);

  /**
   * 질문 보내기
   * @param {string} text 보낼 질문
   */
  const send = async (text) => {
    const question = text.trim();
    if (question === "" || sending) return;

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
        err.response?.data?.detail &&
          typeof err.response.data.detail === "string"
          ? err.response.data.detail
          : "챗봇 서버에 연결하지 못했습니다. 8000번 Python 서버가 실행 중인지 확인하세요.",
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
                  </div>
                ))}

                {/* 답변 기다리는 중 */}
                {sending && (
                  <div className="chat-bubble bot chat-typing">
                    답변을 만드는 중…
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
                  placeholder="귤봇에게 물어보세요"
                  maxLength={MAX_LENGTH} /* 서버 규칙과 같은 500자 */
                  disabled={sending}
                  aria-label="질문 입력"
                  autoComplete="off"
                />
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
