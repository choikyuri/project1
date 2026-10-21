# =========================================================
# Chapter 11. 귤봇 사진 만들기 (음식 / 옷)
#
# 흐름
#   1) 사용자 문장을 텍스트 LLM(mini)에게 보내
#      "무엇을(kind: food / outfit) 그릴지, 구체적으로 무엇(subject)인지" 를 고르게 한다
#      → 음식도 옷도 아니면 None → 사진을 만들지 않는다
#   2) 종류에 맞는 프롬프트로 이미지 모델을 호출한다
#   3) 브라우저가 바로 그릴 수 있는 data URL 문자열로 돌려준다
# =========================================================
import json
import os

import chat  # 10챕터의 get_client(), MODEL, fetch_today_weather() 를 그대로 재사용

# .env 에서 이미지 모델 이름을 읽는다 (없으면 가장 저렴한 mini 모델)
IMAGE_MODEL = os.getenv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini")

# 같은 요청은 새로 만들지 않고 재사용 (키 예: "food:쌀떡볶이", "outfit:레인코트와 레인부츠")
_image_cache: dict[str, str] = {}

# 화면에 보여 줄 종류 이름
KIND_LABELS = {"food": "음식", "outfit": "옷차림"}


def build_picker_prompt() -> str:
    """1단계용 시스템 프롬프트 : '무엇을 그릴지' 만 정하게 한다"""
    lines = [
        "너는 사용자의 요청을 읽고 '사진으로 그릴 것'을 정하는 도우미다.",
        "규칙:",
        "- 음식을 원하면 kind 는 food, subject 는 음식 이름 하나.",
        "  (예: '쌀떡볶이 이미지 만들어줘' → 쌀떡볶이 / '비 오는 날 먹기 좋은 음식 사진' → 김치전)",
        "- 옷차림을 원하면 kind 는 outfit, subject 는 상의·하의·신발·소품을 담은 짧은 코디 설명 (40자 이내).",
        "  (예: '비 오는 날 어떤 옷?' → 방수 트렌치코트, 청바지, 레인부츠, 투명 우산)",
        "- 음식도 옷도 아니면(사람, 동물, 풍경, 물건 등) kind 와 subject 모두 null.",
        '- 반드시 JSON 으로만 답한다. 형식: {"kind": "food", "subject": "..."} 또는 {"kind": null, "subject": null}',
    ]

    # 오늘 날씨를 알면 함께 알려 준다 → "오늘 날씨에 맞는 옷" 같은 요청에 사용
    today = chat.fetch_today_weather()
    if today:
        lines.append(
            f"참고 - 오늘 서울 날씨 : {chat.WEATHER_LABELS[today['weather']]}, {today['temp']}°C "
            "(사용자가 '오늘'처럼 날씨 기준을 말하면 이 날씨에 맞춘다)"
        )
    return "\n".join(lines)


def pick_subject(text: str):
    """
    사용자 문장에서 그릴 대상을 고른다.
    돌려주는 값 : ("food" 또는 "outfit", 대상 설명)  /  둘 다 아니면 (None, None)
    """
    client = chat.get_client()  # 키가 없으면 ValueError (main.py 가 503 으로 바꿔 줌)

    response = client.chat.completions.create(
        model=chat.MODEL,  # 텍스트 챗봇과 같은 저렴한 mini 모델
        messages=[
            {"role": "system", "content": build_picker_prompt()},
            {"role": "user", "content": text},
        ],
        response_format={"type": "json_object"},  # 답을 반드시 JSON 모양으로 받는다
        max_completion_tokens=80,
    )

    try:
        data = json.loads(response.choices[0].message.content or "{}")
    except json.JSONDecodeError:
        return None, None

    kind, subject = data.get("kind"), data.get("subject")
    # kind 는 정해진 두 값 중 하나, subject 는 1~60자 문자열일 때만 인정
    if (
        kind in KIND_LABELS
        and isinstance(subject, str)
        and 0 < len(subject.strip()) <= 60
    ):
        return kind, subject.strip()
    return None, None


def build_image_prompt(kind: str, subject: str) -> str:
    """종류에 맞게 이미지 프롬프트를 만든다."""
    if kind == "food":
        return (
            f"{subject}, 막 완성되어 나온 먹음직스러운 음식 사진, "
            "위에서 45도 각도, 따뜻한 자연광, 나무 테이블, "
            "사람 없음, 글자나 로고 없음"
        )
    # outfit : 사람 없이 옷을 펼쳐 놓은 "플랫레이" 사진 → 결과가 깔끔하고 일정하다
    return (
        f"{subject}, 옷과 신발과 소품을 밝은 바닥에 가지런히 펼쳐 놓은 플랫레이 패션 사진, "
        "위에서 내려다본 구도, 부드러운 자연광, "
        "사람 없음, 글자나 로고나 상표 없음"
    )


def generate(text: str):
    """
    사용자 문장으로 사진을 만든다.
    돌려주는 값 : (kind, subject, data URL)  /  음식도 옷도 아니면 (None, None, None)
    """
    # 1) 무엇을 그릴지 텍스트 LLM 에게 먼저 물어본다
    kind, subject = pick_subject(text)
    if kind is None:
        return None, None, None

    # 2) 같은 것을 만든 적 있으면 저장해 둔 것을 바로 돌려준다
    cache_key = f"{kind}:{subject}"
    if cache_key in _image_cache:
        return kind, subject, _image_cache[cache_key]

    # 3) 이미지 생성 (size : 정사각형 / quality : low → 빠르고 저렴)
    client = chat.get_client()
    result = client.images.generate(
        model=IMAGE_MODEL,
        prompt=build_image_prompt(kind, subject),
        size="1024x1024",
        quality="low",
    )

    # 4) base64 문자열 → <img src="..."> 에 바로 넣을 수 있는 data URL
    data_url = f"data:image/png;base64,{result.data[0].b64_json}"
    _image_cache[cache_key] = data_url
    return kind, subject, data_url
