CREATE TABLE MEMBER (
    MEMBER_ID   NUMBER          NOT NULL,     -- 회원번호(시퀀스로 1,2,...)            
    USERNAME    VARCHAR2(30)    NOT NULL,     -- 로그인 ID(영문 소문자+숫자 4~20)            
    PASSWORD    VARCHAR2(100)   NOT NULL,     -- 암호화된 비밀번호(BCrypt)            
    NAME        VARCHAR2(50)    NOT NULL,     -- 이름 (최대 16자)    
    EMAIL       VARCHAR2(100)   NOT NULL,                 
    CREATED_AT  DATE            DEFAULT SYSDATE NOT NULL, -- 가입일시 
    CONSTRAINT PK_MEMBER          PRIMARY KEY (MEMBER_ID), 
    CONSTRAINT UK_MEMBER_USERNAME UNIQUE (USERNAME),      
    CONSTRAINT UK_MEMBER_EMAIL    UNIQUE (EMAIL) 
    );
    
CREATE SEQUENCE MEMBER_SEQ
    START WITH 1    -- 1부터 시작  
    INCREMENT BY 1  -- 1씩 증가  
    NOCACHE;    -- 번호 건너뛰지 않게   
    
    
DESC MEMBER;   
-- 시퀀시 확인 
SELECT SEQUENCE_NAME, LAST_NUMBER FROM USER_SEQUENCES;

SELECT * FROM MEMBER;


    