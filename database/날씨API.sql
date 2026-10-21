SET SERVEROUTPUT ON;   -- DBMS_OUTPUT 메시지를 화면에 보이게

DECLARE
    v_gyul01    MEMBER.MEMBER_ID%TYPE;   -- %TYPE : MEMBER.MEMBER_ID 컬럼과 같은 타입
    v_gyul02    MEMBER.MEMBER_ID%TYPE;
    v_member    MEMBER.MEMBER_ID%TYPE;
    v_weather   VARCHAR2(20);
    v_category  VARCHAR2(20);
    v_temp      NUMBER(4,1);
    v_board     NUMBER;
    v_r         NUMBER;                  -- 0 ~ 100 사이 주사위 값
BEGIN
    -- 회원 번호 찾기 (MAX : 회원이 없으면 오류 대신 NULL)
    SELECT MAX(MEMBER_ID) INTO v_gyul01 FROM MEMBER WHERE USERNAME = 'gyul01';
    SELECT MAX(MEMBER_ID) INTO v_gyul02 FROM MEMBER WHERE USERNAME = 'gyul02';

    FOR i IN 1 .. 3000 LOOP

        -- 1) 날씨 : 0~100 주사위를 굴려서 구간으로 나눈다 (맑음 40, 흐림 30, 비 22, 눈 8)
        v_r := DBMS_RANDOM.VALUE(0, 100);
        v_weather := CASE
                         WHEN v_r < 40 THEN 'CLEAR'
                         WHEN v_r < 70 THEN 'CLOUDY'
                         WHEN v_r < 92 THEN 'RAIN'
                         ELSE 'SNOW'
                     END;

        -- 2) 기온 : 눈 오는 날은 -8 ~ 3도, 그 외 -2 ~ 33도 (소수 첫째 자리)
        IF v_weather = 'SNOW' THEN
            v_temp := ROUND(DBMS_RANDOM.VALUE(-8, 3), 1);
        ELSE
            v_temp := ROUND(DBMS_RANDOM.VALUE(-2, 33), 1);
        END IF;

        -- 3) 회원 : gyul01 40%, gyul02 30%, 비회원 30%
        v_r := DBMS_RANDOM.VALUE(0, 100);
        v_member := CASE
                        WHEN v_r < 40 THEN v_gyul01
                        WHEN v_r < 70 THEN v_gyul02
                        ELSE NULL
                    END;

        -- 4) 카테고리 : 날씨별 확률표(2-2)를 누적 구간으로 바꿔서 사용
        v_r := DBMS_RANDOM.VALUE(0, 100);
        IF v_weather = 'RAIN' THEN
            v_category := CASE WHEN v_r < 15 THEN 'FOOD'    WHEN v_r < 50 THEN 'CAFE'
                               WHEN v_r < 55 THEN 'SPORTS'  WHEN v_r < 62 THEN 'TRAVEL'
                               WHEN v_r < 87 THEN 'CULTURE' ELSE 'DAILY' END;
        ELSIF v_weather = 'CLEAR' THEN
            v_category := CASE WHEN v_r < 17 THEN 'FOOD'    WHEN v_r < 29 THEN 'CAFE'
                               WHEN v_r < 54 THEN 'SPORTS'  WHEN v_r < 82 THEN 'TRAVEL'
                               WHEN v_r < 92 THEN 'CULTURE' ELSE 'DAILY' END;
        ELSIF v_weather = 'SNOW' THEN
            v_category := CASE WHEN v_r < 20 THEN 'FOOD'    WHEN v_r < 50 THEN 'CAFE'
                               WHEN v_r < 55 THEN 'SPORTS'  WHEN v_r < 63 THEN 'TRAVEL'
                               WHEN v_r < 75 THEN 'CULTURE' ELSE 'DAILY' END;
        ELSE -- CLOUDY
            v_category := CASE WHEN v_r < 20 THEN 'FOOD'    WHEN v_r < 40 THEN 'CAFE'
                               WHEN v_r < 52 THEN 'SPORTS'  WHEN v_r < 65 THEN 'TRAVEL'
                               WHEN v_r < 80 THEN 'CULTURE' ELSE 'DAILY' END;
        END IF;

        -- 5) 추운 날(10도 미만) : 여행·운동의 절반을 맛집으로
        IF v_temp < 10 AND v_category IN ('TRAVEL', 'SPORTS') AND DBMS_RANDOM.VALUE < 0.5 THEN
            v_category := 'FOOD';
        END IF;

        -- 6) 개인 취향 : gyul01 맛집, gyul02 운동 (30%)
        IF v_member = v_gyul01 AND DBMS_RANDOM.VALUE < 0.3 THEN
            v_category := 'FOOD';
        ELSIF v_member = v_gyul02 AND DBMS_RANDOM.VALUE < 0.3 THEN
            v_category := 'SPORTS';
        END IF;

        -- 7) 그 카테고리 글 중 하나를 무작위로 (없으면 0)
        SELECT NVL(MAX(BOARD_ID), 0) INTO v_board
          FROM (SELECT BOARD_ID FROM BOARD
                 WHERE CATEGORY = v_category
                 ORDER BY DBMS_RANDOM.VALUE)
         WHERE ROWNUM = 1;

        -- 8) 저장 : 시각은 지금부터 0~60일 전 사이 무작위
        INSERT INTO VIEW_LOG (LOG_ID, BOARD_ID, MEMBER_ID, CATEGORY, WEATHER, TEMP, VIEWED_AT)
        VALUES (VIEW_LOG_SEQ.NEXTVAL, v_board, v_member, v_category, v_weather, v_temp,
                SYSDATE - DBMS_RANDOM.VALUE(0, 60));
    END LOOP;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('샘플 조회 기록 3000건 생성 완료');
END;
/

-- 날씨별 건수 : 맑음 > 흐림 > 비 > 눈 순서로 대략 40 : 30 : 22 : 8
SELECT WEATHER, COUNT(*) AS CNT
  FROM VIEW_LOG
 GROUP BY WEATHER
 ORDER BY CNT DESC;
 
 
-- Q1. 비 오는 날에는 어떤 카테고리를 많이 볼까?
SELECT WEATHER,
       CATEGORY,
       COUNT(*) AS CNT,
       ROUND(COUNT(*) * 100 / SUM(COUNT(*)) OVER (PARTITION BY WEATHER), 1) AS PCT
  FROM VIEW_LOG
 WHERE WEATHER IS NOT NULL                -- 날씨 없는 기록 제외
 GROUP BY WEATHER, CATEGORY
 ORDER BY WEATHER, CNT DESC;              -- 날씨별로, 많이 본 순서


-- 날씨마다 1위 카테고리 한 줄씩
SELECT WEATHER, CATEGORY, CNT
  FROM (SELECT WEATHER,
               CATEGORY,
               COUNT(*) AS CNT,
               -- 같은 날씨 안에서 CNT 큰 순서로 등수 매기기
               RANK() OVER (PARTITION BY WEATHER ORDER BY COUNT(*) DESC) AS RNK
          FROM VIEW_LOG
         WHERE WEATHER IS NOT NULL
         GROUP BY WEATHER, CATEGORY)
 WHERE RNK = 1;
 
-- Q2. 추운 날과 더운 날은 다를까?
SELECT TEMP_BAND,
       CATEGORY,
       COUNT(*) AS CNT,
       ROUND(COUNT(*) * 100 / SUM(COUNT(*)) OVER (PARTITION BY TEMP_BAND), 1) AS PCT
  FROM (SELECT CATEGORY,
               -- 기온 숫자 → 구간 이름 (CASE 는 위에서부터 처음 맞는 것 하나)
               CASE
                   WHEN TEMP < 10 THEN 'COLD'
                   WHEN TEMP < 25 THEN 'MILD'
                   ELSE 'HOT'
               END AS TEMP_BAND
          FROM VIEW_LOG
         WHERE TEMP IS NOT NULL)
 GROUP BY TEMP_BAND, CATEGORY
 ORDER BY TEMP_BAND, CNT DESC;
 
 
 -- Q3. gyul01 은 평소 어떤 카테고리를 많이 볼까?
SELECT V.CATEGORY,
       COUNT(*) AS CNT,
       ROUND(COUNT(*) * 100 / SUM(COUNT(*)) OVER (), 1) AS PCT   -- OVER () : 전체 합계
  FROM VIEW_LOG V
  JOIN MEMBER M ON V.MEMBER_ID = M.MEMBER_ID
 WHERE M.USERNAME = 'gyul01'
 GROUP BY V.CATEGORY
 ORDER BY CNT DESC;
 
 
 -- ===============================================
 WITH
-- ① 비 오는 날 카테고리 비율
W AS (
    SELECT CATEGORY,
           COUNT(*) * 100 / SUM(COUNT(*)) OVER () AS PCT
      FROM VIEW_LOG
     WHERE WEATHER = 'RAIN'
     GROUP BY CATEGORY
),
-- ② gyul01 의 카테고리 비율
M AS (
    SELECT V.CATEGORY,
           COUNT(*) * 100 / SUM(COUNT(*)) OVER () AS PCT
      FROM VIEW_LOG V
      JOIN MEMBER MB ON V.MEMBER_ID = MB.MEMBER_ID
     WHERE MB.USERNAME = 'gyul01'
     GROUP BY V.CATEGORY
),
-- ③ 최근 7일 카테고리 비율
R AS (
    SELECT CATEGORY,
           COUNT(*) * 100 / SUM(COUNT(*)) OVER () AS PCT
      FROM VIEW_LOG
     WHERE VIEWED_AT >= SYSDATE - 7
     GROUP BY CATEGORY
),
-- ④ 카테고리 6개 목록 (기록이 0건인 카테고리도 빠지지 않게)
C AS (
    SELECT 'FOOD' AS CATEGORY FROM DUAL UNION ALL
    SELECT 'CAFE'    FROM DUAL UNION ALL
    SELECT 'SPORTS'  FROM DUAL UNION ALL
    SELECT 'TRAVEL'  FROM DUAL UNION ALL
    SELECT 'CULTURE' FROM DUAL UNION ALL
    SELECT 'DAILY'   FROM DUAL
)
SELECT C.CATEGORY,
       ROUND(NVL(W.PCT, 0), 1) AS WEATHER_PCT,
       ROUND(NVL(M.PCT, 0), 1) AS MY_PCT,
       ROUND(NVL(R.PCT, 0), 1) AS RECENT_PCT,
       ROUND(0.5 * NVL(W.PCT, 0) + 0.3 * NVL(M.PCT, 0) + 0.2 * NVL(R.PCT, 0), 1) AS SCORE
  FROM C
  LEFT JOIN W ON C.CATEGORY = W.CATEGORY      -- LEFT JOIN : 기록이 없어도 C 의 6줄은 남긴다
  LEFT JOIN M ON C.CATEGORY = M.CATEGORY
  LEFT JOIN R ON C.CATEGORY = R.CATEGORY
 ORDER BY SCORE DESC;
 
 -- ===================================================================
 select * from board;
 select * from view_log;
 
 UPDATE BOARD B
   SET VIEW_COUNT = (SELECT COUNT(*)
                       FROM VIEW_LOG V
                      WHERE V.BOARD_ID = B.BOARD_ID);

COMMIT;

-- 확인 : 카테고리별 조회수 TOP 3
SELECT CATEGORY, BOARD_ID, TITLE, VIEW_COUNT
  FROM (SELECT CATEGORY, BOARD_ID, TITLE, VIEW_COUNT,
               ROW_NUMBER() OVER (PARTITION BY CATEGORY ORDER BY VIEW_COUNT DESC, BOARD_ID DESC) AS RN
          FROM BOARD)
 WHERE RN <= 3
 ORDER BY CATEGORY, RN;
 
 commit;
 
 

 
 
 
 
 
 
 
 