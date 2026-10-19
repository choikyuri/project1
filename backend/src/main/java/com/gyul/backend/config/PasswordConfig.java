package com.gyul.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

// 암호화를 한번만 만들어 두고, Service에서 받아서 사용

@Configuration // 이 클래스는 설정 클래스다(서버가 켜질 때 가장 먼저 읽힌다) 
public class PasswordConfig {

    // 비밀번호 암호화 
    // 반환 타입은 PasswordEncoder(인터페이스), 실제 객체는 BCryptPasswordEncoder
    
    @Bean
    public PasswordEncoder passwordEncoder(){
        return  new BCryptPasswordEncoder();
    }
 
}
