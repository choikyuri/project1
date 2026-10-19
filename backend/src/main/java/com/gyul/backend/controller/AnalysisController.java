package com.gyul.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.gyul.backend.dto.GroupStat;
import com.gyul.backend.exception.UnauthorizedException;
import com.gyul.backend.service.AnalysisService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    // 날씨별
    @GetMapping("/weather")
    public List<GroupStat> weather() {
        return analysisService.getWeatherStats();
    }


    // 기온 구간별
    @GetMapping("/temperature")
    public List<GroupStat> temperature() {
        return analysisService.getTemperatureStats();
    }



    // 내 조회 기록
    @GetMapping("/me")
    public GroupStat me(
            @SessionAttribute(name = SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId) {

        if (loginMemberId == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        return analysisService.getMemberStats(loginMemberId);
    }


    
}
