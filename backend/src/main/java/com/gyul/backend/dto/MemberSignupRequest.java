package com.gyul.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import lombok.Setter;
// 유효성 검사 
@Getter 
@Setter
@NoArgsConstructor  
public class MemberSignupRequest {
   
    @NotNull(message="아이디를 입력하세요.")
    @Pattern(regexp = "^[a-z0-9]{4,20}$",
        message="아이디는 영문 소문자와 숫자 4~20자로 입력하세요."
    )
    private String username;

    @NotNull(message="비밀번호를 입력하세요.")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)\\S{8,20}$",
        message="비밀번호는 영문 소문자와 숫자를 포함하여 공백없이 8~20자로 입력하세요."
    )
    private String password;

    @NotBlank(message="이름를 입력하세요.") // 공백도 허용 하지 않음
    @Size(max=16,
        message="이름은 16자 이하로 입력하세요."
    )
    private String name;

    @NotBlank(message = "이메일을 입력하세요.")
    @Email(message = "이메일 형식이 올바르지 않습니다.") 
    @Size(max = 100, message = "이메일은 100자 이하로 입력하세요.")
    private String email;
    
}
