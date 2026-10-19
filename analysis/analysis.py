# 분석 함수 모음

import pandas as pd

# 화면에 보여줄 순서 (React 의 constants/categories.js 와 같은 순서)
CATEGORY_ORDER = ["FOOD", "CAFE", "SPORTS", "TRAVEL", "CULTURE", "DAILY"]
WEATHER_ORDER = ["CLEAR", "CLOUDY", "RAIN", "SNOW"]

# 표본이 이보다 적으면 결과가 들쭉날쭉하므로 조건을 넓힌다
MIN_SAMPLE = 30


def temp_band(temp: float) -> str:
    """기온 → 구간 이름 (07챕터 PL/SQL 의 '10도 미만' 기준과 같다)"""
    if temp < 10:
        return "COLD"  # 10도 미만
    if temp < 25:
        return "MILD"  # 10 ~ 25도 미만
    return "HOT"  # 25도 이상


def add_temp_band(logs: pd.DataFrame) -> pd.DataFrame:
    """TEMP_BAND 컬럼을 추가한 복사본을 돌려준다."""
    # pd.cut : 숫자를 구간으로 나눈다
    # right=False → [-100, 10) [10, 25) [25, 100) : 왼쪽 포함, 오른쪽 미포함
    result = logs.copy()
    result["TEMP_BAND"] = pd.cut(
        result["TEMP"],
        bins=[-100, 10, 25, 100],
        right=False,
        labels=["COLD", "MILD", "HOT"],
    ).astype(str)
    return result


def category_share(logs: pd.DataFrame) -> pd.Series:
    """카테고리별 비율(%) - 6개 카테고리가 항상 같은 순서로 나오게"""
    # value_counts(normalize=True) : 건수 대신 비율(0~1)
    # reindex(..., fill_value=0)   : 한 번도 안 나온 카테고리도 0 으로 채움
    share = logs["CATEGORY"].value_counts(normalize=True)
    return share.reindex(CATEGORY_ORDER, fill_value=0) * 100


# ---------------------------------------------------------
# 1) 오늘 날씨 추천 Top N
# ---------------------------------------------------------
def recommend(logs, boards, weather: str, temp: float, top_n: int = 3) -> dict:
    """오늘 날씨·기온과 비슷한 날 사람들이 많이 본 카테고리 Top N"""
    logs = add_temp_band(logs)
    band = temp_band(temp)

    # 조건을 좁은 것부터 넓은 것까지 차례로 시도 → 표본이 충분한 첫 조건 사용
    candidates = [
        ("WEATHER_TEMP", (logs["WEATHER"] == weather) & (logs["TEMP_BAND"] == band)),
        ("WEATHER", logs["WEATHER"] == weather),
        ("ALL", pd.Series(True, index=logs.index)),
    ]
    for basis, mask in candidates:
        subset = logs[mask]
        if len(subset) >= MIN_SAMPLE:
            break

    share = category_share(subset)  # 오늘 조건에서의 비율
    overall = category_share(logs)  # 전체 평균 비율

    # 글 번호 → 제목 사전 { 12: "오늘의 카페 12", ... }
    titles = dict(zip(boards["BOARD_ID"], boards["TITLE"]))

    items = []
    # nlargest(n) : 값이 큰 순서로 n 개
    for code, pct in share.nlargest(top_n).items():
        # 이 조건에서 이 카테고리 글 중 가장 많이 본 글 2개
        board_counts = (
            subset.loc[(subset["CATEGORY"] == code) & (subset["BOARD_ID"] > 0), "BOARD_ID"]
            .value_counts()
            .head(2)
        )
        posts = [
            {"boardId": int(board_id), "title": titles.get(board_id, f"{board_id}번 글"), "views": int(cnt)}
            for board_id, cnt in board_counts.items()
        ]
        base = overall[code]
        items.append(
            {
                "category": code,
                "share": round(float(pct), 1),  # 오늘 조건 비율 (%)
                "overallShare": round(float(base), 1),  # 평소 비율 (%)
                # lift : 평소보다 몇 배 더 보는가 (1.0 보다 크면 오늘 더 인기)
                "lift": round(float(pct / base), 2) if base > 0 else None,
                "posts": posts,
            }
        )

    return {
        "weather": weather,
        "temp": temp,
        "tempBand": band,
        "basis": basis,  # 어떤 조건으로 계산했는지 (화면 안내 문구용)
        "sampleSize": int(len(subset)),
        "items": items,
    }


# ---------------------------------------------------------
# 2) 날씨 × 카테고리 히트맵
# ---------------------------------------------------------
def weather_heatmap(logs: pd.DataFrame) -> dict:
    """날씨별 카테고리 비율(%) - 각 행(날씨)의 합이 100"""
    # crosstab : 두 컬럼으로 교차표(건수)를 만든다
    # normalize="index" : 행마다 합이 1 이 되도록 비율로 바꾼다
    table = (
        pd.crosstab(logs["WEATHER"], logs["CATEGORY"], normalize="index")
        .reindex(index=WEATHER_ORDER, columns=CATEGORY_ORDER, fill_value=0)
        .mul(100)
        .round(1)
    )
    counts = logs["WEATHER"].value_counts().reindex(WEATHER_ORDER, fill_value=0)

    return {
        "weathers": WEATHER_ORDER,
        "categories": CATEGORY_ORDER,
        # values.tolist() : DataFrame → 2차원 리스트 [[13.2, 11.8, ...], ...]
        "cells": table.values.tolist(),
        "counts": [int(c) for c in counts],
        "maxValue": float(table.values.max()),
    }


# ---------------------------------------------------------
# 3) 로그인 회원 취향 (나 vs 전체)
# ---------------------------------------------------------
def member_preference(logs: pd.DataFrame, member_id: int) -> dict:
    """내가 본 카테고리 비율과 전체 평균 비율을 나란히"""
    mine_logs = logs[logs["MEMBER_ID"] == member_id]
    if mine_logs.empty:
        return {"memberId": member_id, "total": 0, "items": [], "favorite": None}

    mine = category_share(mine_logs)
    overall = category_share(logs)
    diff = mine - overall  # + 이면 평균보다 많이 봄

    items = [
        {
            "category": code,
            "mine": round(float(mine[code]), 1),
            "overall": round(float(overall[code]), 1),
            "diff": round(float(diff[code]), 1),
        }
        for code in CATEGORY_ORDER
    ]
    return {
        "memberId": member_id,
        "total": int(len(mine_logs)),
        "items": items,
        # idxmax : 값이 가장 큰 항목의 이름 → 평균보다 "특히" 많이 본 카테고리
        "favorite": str(diff.idxmax()),
    }