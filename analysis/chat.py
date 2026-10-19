# =========================================================
# Chapter 10. 챗봇 - 우리 사이트 데이터를 아는 OpenAI 챗봇
#
# 흐름
#   1) 오늘 날씨를 Spring(06챕터 /api/weather)에서 받아 온다
#   2) 09챕터 pandas 분석 함수로 추천 · 내 취향을 계산한다
#   3) 그 결과를 "시스템 프롬프트" 에 글로 적어 넣는다
#   4) 시스템 프롬프트 + 대화 기록을 OpenAI 에 보내고 답변을 받는다
#
# RAG 를 쓰지 않는 대신, 미리 계산한 분석 결과를 프롬프트에 직접 넣는다
# =========================================================
import json
import os
import urllib.request

from openai import OpenAI

import analysis

# ---------------------------------------------------------
# 설정값 : .env 파일에서 읽는다 (main.py 맨 위의 load_dotenv() 가 먼저 실행됨)
# ---------------------------------------------------------
# 모델 이름 : 가장 저렴한 mini 계열. 바꾸고 싶으면 .env 의 OPENAI_MODEL 만 고친다
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
# 답변 최대 길이 (토큰). 1토큰 ≈ 한글 1글자 정도 → 비용과 답변 길이를 함께 제한
MAX_ANSWER_TOKENS = 400
# 오늘 날씨를 받아 올 Spring 주소 (06챕터 /api/weather)
SPRING_URL = os.getenv("SPRING_URL", "http://localhost:8080")

# 화면에 보여줄 한글 이름 (React constants 와 같은 값)
CATEGORY_LABELS = {
    "FOOD": "맛집",
    "CAFE": "카페",
    "SPORTS": "운동",
    "TRAVEL": "여행",
    "CULTURE": "문화·공연",
    "DAILY": "일상",
}
WEATHER_LABELS = {"CLEAR": "맑음", "CLOUDY": "흐림", "RAIN": "비", "SNOW": "눈"}


def get_client() -> OpenAI:
    """OpenAI 클라이언트 만들기 (키가 없으면 ValueError)"""
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError(
            "OPENAI_API_KEY 가 설정되지 않았습니다. analysis/.env 를 확인하세요."
        )
    return OpenAI(api_key=api_key)


def fetch_today_weather():
    """
    Spring 의 /api/weather 를 불러 오늘 날씨를 가져온다.
    실패하거나 정보가 없으면 None (날씨 없이도 챗봇은 동작한다)
    """
    try:
        # urllib : 파이썬에 기본으로 들어 있는 요청 도구 (따로 설치할 필요 없음)
        with urllib.request.urlopen(f"{SPRING_URL}/api/weather", timeout=3) as res:
            data = json.loads(res.read().decode("utf-8"))
        if data.get("available"):
            return {"weather": data["condition"], "temp": data["temp"]}
    except Exception:
        pass  # Spring 이 꺼져 있거나 날씨 키가 없으면 그냥 넘어간다
    return None


def build_system_prompt(logs, boards, member_id=None, member_name=None) -> str:
    """
    챗봇에게 줄 "역할 지시 + 우리 사이트 데이터" 를 한 덩어리 글로 만든다.
    LLM 은 우리 DB 를 볼 수 없으므로, 필요한 정보를 이렇게 글로 적어서 넘겨준다.
    """
    lines = [
        "너는 '1차 프로젝트' 게시판 사이트의 안내 도우미 '귤봇'이다.",
        "규칙:",
        "- 아래 [사이트 정보]만 근거로 답한다. 정보에 없는 내용은 모른다고 말한다.",
        "- 글 제목은 [사이트 정보]에 있는 것만 말한다. 없는 글을 지어내지 않는다.",
        "- 사이트와 관계없는 질문(숙제, 코딩, 시사 등)은 정중히 거절하고 사이트 이용을 안내한다.",
        "- 한국어 존댓말로 3문장 이내로 짧게 답한다.",
        "",
        "[사이트 정보]",
        "카테고리 : " + ", ".join(CATEGORY_LABELS.values()),
    ]

    # 1) 오늘 날씨 → 09챕터 recommend() 로 추천 계산
    today = fetch_today_weather()
    if today:
        rec = analysis.recommend(logs, boards, today["weather"], today["temp"])
        lines.append(
            f"오늘 서울 날씨 : {WEATHER_LABELS[today['weather']]}, {today['temp']}°C"
        )
        lines.append(
            f"오늘과 비슷한 날 많이 본 카테고리 (조회 {rec['sampleSize']}건 기준) :"
        )
        for item in rec["items"]:
            label = CATEGORY_LABELS[item["category"]]
            titles = ", ".join(f"'{p['title']}'" for p in item["posts"]) or "없음"
            lines.append(
                f"- {label} {item['share']}% (평소 {item['overallShare']}%, {item['lift']}배) / 인기 글 : {titles}"
            )
    else:
        lines.append("오늘 날씨 : 정보 없음 (날씨 기반 추천은 할 수 없다고 안내한다)")

    # 2) 날씨별 경향 (히트맵에서 날씨마다 1위 카테고리만)
    heat = analysis.weather_heatmap(logs)
    tops = []
    for weather, row in zip(heat["weathers"], heat["cells"]):
        best = heat["categories"][row.index(max(row))]
        tops.append(f"{WEATHER_LABELS[weather]}→{CATEGORY_LABELS[best]}")
    lines.append("날씨별로 가장 많이 본 카테고리 : " + ", ".join(tops))

    # 3) 로그인한 회원이면 취향 추가
    if member_id:
        pref = analysis.member_preference(logs, member_id)
        if pref["total"] > 0:
            lines.append(
                f"지금 대화 중인 회원 : {member_name or '회원'}님, 조회 {pref['total']}건, "
                f"평균보다 특히 {CATEGORY_LABELS[pref['favorite']]} 글을 많이 봄"
            )
    else:
        lines.append("지금 대화 중인 사람 : 로그인하지 않은 방문자")

    # 줄 목록 → 줄바꿈으로 이어 붙인 하나의 글
    return "\n".join(lines)


def ask(system_prompt: str, history: list) -> str:
    """
    OpenAI 에 질문하고 답변 글자만 돌려준다.
    history : [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ...]
    """
    client = get_client()

    # messages = [시스템 프롬프트] + [지금까지의 대화]
    # LLM 은 이전 대화를 기억하지 못한다 → 매번 대화 기록 전체를 함께 보낸다
    messages = [{"role": "system", "content": system_prompt}] + history

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        max_completion_tokens=MAX_ANSWER_TOKENS,
    )
    # 답변은 choices 목록의 첫 번째 → message → content 에 들어 있다
    answer = response.choices[0].message.content
    return (answer or "").strip() or "답변을 만들지 못했어요. 다시 질문해 주세요."
