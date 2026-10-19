package com.gyul.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// 화면으로 보낸는 Json {"username": "gyul01", "password":"gyul1234"}

@Getter // request.getUsername
@Setter // Json 값을 객체에 넣기 위함
@NoArgsConstructor   // 빈객체를 만들기 위한 디폴트 생성자
public class LoginRequest {

    @NotBlank(message = "아이디를 입력하세요.")
    private String username;

    @NotBlank(message = "비밀번호를 입력하세요.")
    private String password;
    
}
