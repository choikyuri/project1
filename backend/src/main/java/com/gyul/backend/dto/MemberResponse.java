package com.gyul.backend.dto;

// 회원 정보 응답: 화면으로 나가는 데이터  
import java.time.LocalDateTime;
import com.gyul.backend.entity.Member;

import lombok.Getter;

@Getter
public class MemberResponse {

    private final Long memberId;            // 회원 번호
    private final String username;          // 아이디
    private final String name;              // 이름
    private final String email;             // 이메일
    private final LocalDateTime createdAt;  // 가입 일시

    public MemberResponse(Member member) {
        this.memberId = member.getMemberId();
        this.username = member.getUsername();
        this.name = member.getName();
        this.email = member.getEmail();
        this.createdAt = member.getCreatedAt();
        // member.getPassword()는 옮기지 않음
    }

}
