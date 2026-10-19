import os

import oracledb
import pandas as pd

DB_USER = os.getenv("DB_USER", "project1")
DB_PASSWORD = os.getenv("DB_PASSWORD", "project1")
DB_DSN = os.getenv("DB_DSN", "localhost:1521/XE")

# Oracle 에서 데이터를 꺼내서 pandas DataFrame으로 구현


# SELECT 결과를 DataFrame으로 돌려줌
# with: 블록이 끝나면 연결이 자동으로 닫는다(close 없어도 됨)
def query_to_df(sql: str) -> pd.DataFrame:
    with oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_DSN) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            columns = [col[0] for col in cur.description]
            rows = cur.fetchall()
    return pd.DataFrame(rows, columns=columns)


def load_view_logs() -> pd.DataFrame:
    return query_to_df("""
        SELECT BOARD_ID, MEMBER_ID, CATEGORY, WEATHER, TEMP, VIEWED_AT
          FROM VIEW_LOG
         WHERE WEATHER IS NOT NULL
        """)


def load_boards() -> pd.DataFrame:
    """글 제목을 붙이기 위한 게시글 목록"""
    return query_to_df("SELECT BOARD_ID, TITLE, CATEGORY FROM BOARD")
