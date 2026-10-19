package com.gyul.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.gyul.backend.dto.RecommendationResponse;
import com.gyul.backend.entity.WeatherCondition;
import com.gyul.backend.service.RecommendationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public RecommendationResponse recommend(
            // ?weather=RAIN → WeatherCondition.RAIN 으로 자동 변환 (없는 값이면 400 - 05챕터 예외처리기)
            @RequestParam(name = "weather", required = false) WeatherCondition weather,
            @SessionAttribute(name = SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId) {

        return recommendationService.recommend(loginMemberId, weather);
    }
    
}
