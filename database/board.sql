CREATE TABLE BOARD (
    BOARD_ID    NUMBER          NOT NULL,                  -- 글 번호 (BOARD_SEQ 로 자동 발급)
    MEMBER_ID   NUMBER          NOT NULL,                  -- 작성자 회원 번호 (MEMBER 테이블의 MEMBER_ID)
    TITLE       VARCHAR2(300)   NOT NULL,                  -- 제목 (한글 100자 = 300바이트)
    CONTENT     VARCHAR2(4000)  NOT NULL,                  -- 내용 (한글 1000자 = 3000바이트, 최대 4000바이트)
    CREATED_AT  DATE            DEFAULT SYSDATE NOT NULL,  -- 작성 일시
    UPDATED_AT  DATE            DEFAULT SYSDATE NOT NULL,  -- 마지막 수정 일시
    CONSTRAINT PK_BOARD PRIMARY KEY (BOARD_ID),
    -- 외래키 : MEMBER_ID 에는 MEMBER 테이블에 실제로 있는 회원 번호만 들어갈 수 있다
    CONSTRAINT FK_BOARD_MEMBER FOREIGN KEY (MEMBER_ID) REFERENCES MEMBER (MEMBER_ID)
);

-- 글 번호 발급기 (Entity 의 allocationSize = 1 과 INCREMENT BY 1 이 같아야 한다)
CREATE SEQUENCE BOARD_SEQ
    START WITH 1
    INCREMENT BY 1
    NOCACHE;

-- 작성자로 글을 찾을 때 빠르게 찾기 위한 색인 (책 맨 뒤의 "찾아보기" 와 같은 역할)
CREATE INDEX IDX_BOARD_MEMBER ON BOARD (MEMBER_ID);


-- 작성자 번호를 직접 외우지 않도록, 아이디로 회원 번호를 찾아서 넣는다 (서브쿼리)
INSERT INTO BOARD (BOARD_ID, MEMBER_ID, TITLE, CONTENT)
VALUES (BOARD_SEQ.NEXTVAL,
        (SELECT MEMBER_ID FROM MEMBER WHERE USERNAME = 'gyul01'),
        '게시판 오픈 안내',
        '1차 프로젝트 게시판이 열렸습니다.' || CHR(10) || '자유롭게 글을 남겨 주세요.');
        -- CHR(10) : 줄바꿈 문자. 상세 화면에서 줄이 바뀌어 보이는지 확인용

INSERT INTO BOARD (BOARD_ID, MEMBER_ID, TITLE, CONTENT)
VALUES (BOARD_SEQ.NEXTVAL,
        (SELECT MEMBER_ID FROM MEMBER WHERE USERNAME = 'gyul01'),
        '오늘 점심 메뉴 추천',
        '비 오는 날에는 칼국수가 최고입니다.');

INSERT INTO BOARD (BOARD_ID, MEMBER_ID, TITLE, CONTENT)
VALUES (BOARD_SEQ.NEXTVAL,
        (SELECT MEMBER_ID FROM MEMBER WHERE USERNAME = 'gyul01'),
        'Spring Boot 공부 중',
        'Controller, Service, Repository 역할이 조금씩 이해됩니다.');

-- 반드시 COMMIT! (안 하면 Spring Boot 에서는 이 글들이 보이지 않는다)
COMMIT;

select * from board;

ALTER TABLE BOARD ADD(CATEGORY VARCHAR2(20) DEFAULT 'DAILY' NOT NULL, VIEW_COUNT NUMBER DEFAULT 0 NOT NULL);

ALTER TABLE BOARD ADD CONSTRAINT CK_BOARD_CATEGORY CHECK (CATEGORY IN ('FOOD', 'CAFE','SPORTS','TRAVEL','CULTURE','DAILY'));

CREATE INDEX IDX_BOARD_CATEGORY ON BOARD (CATEGORY);

COMMIT;

-- ============================================================
-- 조회 기록 테이블(글을 한번 볼때마다 한 줄씩 쌓인다)
CREATE TABLE VIEW_LOG (
    LOG_ID     NUMBER        NOT NULL,                  -- 기록 번호 (VIEW_LOG_SEQ)
    BOARD_ID   NUMBER        NOT NULL,                  -- 본 글 번호
    MEMBER_ID  NUMBER,                                  -- 본 회원 번호 (로그인 안 했으면 NULL)
    CATEGORY   VARCHAR2(20)  NOT NULL,                  -- 볼 때의 글 카테고리
    WEATHER    VARCHAR2(20),                            -- 볼 때의 날씨 (06챕터부터 기록, 지금은 NULL)
    TEMP       NUMBER(4,1),                             -- 볼 때의 기온 (06챕터부터 기록, 지금은 NULL)
    VIEWED_AT  DATE          DEFAULT SYSDATE NOT NULL,  -- 본 시각
    CONSTRAINT PK_VIEW_LOG PRIMARY KEY (LOG_ID)
);

CREATE SEQUENCE VIEW_LOG_SEQ START WITH 1 INCREMENT BY 1 NOCACHE;

-- 07챕터 분석에서 자주 쓰는 조건에 색인
CREATE INDEX IDX_VIEW_LOG_CATEGORY  ON VIEW_LOG (CATEGORY);
CREATE INDEX IDX_VIEW_LOG_VIEWED_AT ON VIEW_LOG (VIEWED_AT);


-- 페이징 처리를 위한 자료
INSERT INTO BOARD(BOARD_ID, MEMBER_ID, CATEGORY, TITLE, CONTENT, VIEW_COUNT, CREATED_AT, UPDATED_AT)
SELECT BOARD_SEQ.NEXTVAL, (SELECT MEMBER_ID FROM MEMBER WHERE USERNAME='gyul01'), 
DECODE(MOD(LEVEL,6),0, 'FOOD', 1, 'CAFE', 2, 'SPORTS',
                             3, 'TRAVEL', 4, 'CULTURE', 'DAILY' ), 
DECODE(MOD(LEVEL, 6), 0, '맛집 탐방 기록 ', 1, '오늘의 카페 ', 2, '운동 일지 ',
                             3, '여행 후기 ', 4, '공연 관람 후기 ', '일상 이야기 ') || LEVEL,
       '페이징 · 검색 확인용 샘플 글입니다. 번호 ' || LEVEL,
       0,
       SYSDATE - (58 - LEVEL) / 24,                                         -- 1시간 간격으로 과거 시각
       SYSDATE - (58 - LEVEL) / 24
FROM DUAL
CONNECT BY LEVEL <= 57;

COMMIT;

SELECT CATEGORY, COUNT(*) AS CNT
FROM BOARD
GROUP BY CATEGORY
ORDER BY CATEGORY;

DESC BOARD;
DESC VIEW_LOG;

SELECT LOG_ID, BOARD_ID, MEMBER_ID, CATEGORY, WEATHER, TEMP,
       TO_CHAR(VIEWED_AT, 'YYYY-MM-DD HH24:MI:SS') AS VIEWED_AT
  FROM VIEW_LOG
 ORDER BY LOG_ID DESC;
 
 select * from view_log;
 
 desc view_log;
 
 ALTER TABLE VIEW_LOG ADD CONSTRAINT CK_VIEW_LOG_WEATHER 
 CHECK (WEATHER IN ('CLEAR', 'CLOUDY','RAIN','SNOW'));





















