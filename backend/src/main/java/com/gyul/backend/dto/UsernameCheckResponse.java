package com.gyul.backend.dto;


import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor // 모든 필드를 받는 생성자 자동 생성  
public class UsernameCheckResponse {

    private final boolean available; // 사용 가능하면 true
    private final String message; // 화면에 보여줄 안내 문구

}
