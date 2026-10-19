# =========================================================
# Chapter 09~10. 분석 + 챗봇 API 서버 (FastAPI)
# 실행 : uvicorn main:app --reload --port 8000
# 확인 : <http://localhost:8000/docs>  (API 문서가 자동으로 만들어진다)
# =========================================================
import time
from typing import Literal, Optional

# [Chapter 10] .env 파일의 값을 환경 변수로 읽어 들인다
# chat.py 가 os.getenv("OPENAI_API_KEY") 로 읽기 전에 실행되어야 하므로 import 보다 먼저 둔다
from dotenv import load_dotenv

load_dotenv()

import openai  # noqa: E402  (load_dotenv 뒤에 import 해야 하므로 순서 경고 무시)
from fastapi import FastAPI, HTTPException, Query  # noqa: E402
from fastapi.responses import RedirectResponse  # noqa: E402
from pydantic import BaseModel, Field  # noqa: E402

import analysis  # noqa: E402
import chat  # noqa: E402
import db  # noqa: E402

app = FastAPI(title="1차 프로젝트 분석 서버")

# ---------------------------------------------------------
# 데이터 캐시 : 요청마다 DB 를 읽지 않고 60초 동안 재사용
# (홈 화면을 열 때마다 3,000건을 다시 읽으면 낭비이기 때문)
# ---------------------------------------------------------
CACHE_SECONDS = 60
_cache = {"loaded_at": 0.0, "logs": None, "boards": None}


def get_data():
    """(조회 기록, 게시글) DataFrame 2개를 돌려준다."""
    if time.time() - _cache["loaded_at"] > CACHE_SECONDS:
        try:
            _cache["logs"] = db.load_view_logs()
            _cache["boards"] = db.load_boards()
            _cache["loaded_at"] = time.time()
        except Exception as e:
            # DB 가 꺼져 있거나 접속 정보가 틀린 경우 → 503 (서비스 사용 불가)
            raise HTTPException(status_code=503, detail=f"DB 연결 실패: {e}")
    return _cache["logs"], _cache["boards"]


# ---------------------------------------------------------
# API 목록 (모두 /pyapi 로 시작 → Vite 프록시가 이 주소를 8000번으로 보낸다)
# ※ /analysis 는 07챕터 React 분석 페이지 주소라서 겹치지 않게 /pyapi 를 쓴다
# ---------------------------------------------------------
@app.get("/", include_in_schema=False)
def root():
    """<http://localhost:8000/> 로 들어오면 API 문서(/docs)로 보낸다"""
    return RedirectResponse("/docs")


@app.get("/pyapi/health")
def health():
    """서버가 켜져 있는지 확인용"""
    return {"status": "ok"}


@app.get("/pyapi/recommend")
def recommend(
    # Literal : 이 4개 값만 허용 → 다른 값이 오면 FastAPI 가 자동으로 422 오류
    weather: Literal["CLEAR", "CLOUDY", "RAIN", "SNOW"],
    temp: float = Query(..., ge=-50, le=50),  # ... = 필수, ge/le = 범위 검사
    top: int = Query(3, ge=1, le=6),  # 기본값 3
):
    """예) /pyapi/recommend?weather=RAIN&temp=8.3"""
    logs, boards = get_data()
    return analysis.recommend(logs, boards, weather, temp, top)


@app.get("/pyapi/heatmap")
def heatmap():
    """날씨 × 카테고리 비율표"""
    logs, _ = get_data()
    return analysis.weather_heatmap(logs)


@app.get("/pyapi/members/{member_id}/preference")
def preference(member_id: int):
    """예) /pyapi/members/1/preference"""
    logs, _ = get_data()
    return analysis.member_preference(logs, member_id)


# =========================================================
# [Chapter 10] 챗봇
# =========================================================
# 요청 JSON 의 모양을 클래스로 정한다 (Spring 의 요청 DTO + @Valid 와 같은 역할)
# 모양이 다르거나 규칙을 어기면 FastAPI 가 자동으로 422 오류를 돌려준다


class ChatMessage(BaseModel):
    """대화 한 줄"""

    # user : 사람이 한 말 / assistant : 챗봇이 한 말 (system 은 서버만 만든다)
    role: Literal["user", "assistant"]
    # 한 줄 최대 500자 (긴 글을 붙여 넣어 비용이 커지는 것을 막는다)
    content: str = Field(min_length=1, max_length=500)


class ChatRequest(BaseModel):
    """POST /pyapi/chat 요청 본문"""

    # 대화 기록 : 최소 1개, 최대 20개
    messages: list[ChatMessage] = Field(min_length=1, max_length=20)
    # 로그인한 회원 정보 (로그인 안 했으면 null)
    memberId: Optional[int] = None
    memberName: Optional[str] = Field(default=None, max_length=30)


# 최근 몇 개의 대화만 OpenAI 에 보낼지 (오래된 대화는 버려서 비용을 줄인다)
HISTORY_LIMIT = 10


@app.post("/pyapi/chat")
def chat_endpoint(req: ChatRequest):
    """
    요청 예)
    { "messages": [ { "role": "user", "content": "비 오는데 뭐 읽을까?" } ],
      "memberId": 1, "memberName": "귤쌤" }
    응답 예)
    { "reply": "오늘처럼 비 오는 날엔 카페 글이 ..." }
    """
    # 마지막 말은 반드시 사람(user)이 한 질문이어야 한다
    if req.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="마지막 메시지는 질문이어야 합니다.")

    logs, boards = get_data()
    system_prompt = chat.build_system_prompt(logs, boards, req.memberId, req.memberName)

    # 최근 10개만, dict 모양으로 바꿔서 전달  [-10:] = 뒤에서 10개
    history = [m.model_dump() for m in req.messages[-HISTORY_LIMIT:]]

    try:
        reply = chat.ask(system_prompt, history)
    except ValueError as e:
        # API 키가 없음
        raise HTTPException(status_code=503, detail=str(e))
    except openai.AuthenticationError:
        raise HTTPException(status_code=503, detail="OpenAI API 키가 올바르지 않습니다. .env 의 키를 확인하세요.")
    except openai.RateLimitError:
        # 너무 자주 호출했거나, 결제 잔액(크레딧)이 없음
        raise HTTPException(status_code=429, detail="사용량 한도를 넘었습니다. 잠시 후 다시 시도하거나 결제 잔액을 확인하세요.")
    except openai.NotFoundError:
        raise HTTPException(status_code=503, detail=f"모델 '{chat.MODEL}' 을 찾을 수 없습니다. .env 의 OPENAI_MODEL 을 확인하세요.")
    except openai.APIError as e:
        # 인터넷 끊김, OpenAI 서버 오류 등 그 밖의 모든 OpenAI 오류
        raise HTTPException(status_code=502, detail=f"OpenAI 호출 실패: {e.__class__.__name__}")

    return {"reply": reply}