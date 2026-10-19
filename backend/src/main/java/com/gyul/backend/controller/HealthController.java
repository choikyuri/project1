package com.gyul.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api") 
public class HealthController {

    // SQL을 실행하는 도구
    private final JdbcTemplate jdbcTemplate;

    // 생성자 주입
    public HealthController(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate=jdbcTemplate;
    }
    
    @GetMapping("/health")
    public Map<String, Object> health(){

        String dbTime=jdbcTemplate.queryForObject(
            "SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD HH24:MI:SS') FROM DUAL", String.class);

        Map<String, Object> result=new LinkedHashMap<>();
        result.put("status","OK");
        result.put("message","Spring Boot 서버와 oracle DB가 정상 연결되었습니다.");
        result.put("dbTime",dbTime);


        return result;
       
    }
    
}
