package com.gyul.backend.dto;

import java.util.List;

import com.gyul.backend.entity.WeatherCondition;

import lombok.AllArgsConstructor;
import lombok.Getter;


@Getter
@AllArgsConstructor 
public class RecommendationResponse {
    
    private final String city;                // 도시 이름
    private final WeatherCondition condition; // 기준 날씨 (모르면 null)
    private final String conditionLabel;      // 기준 날씨 이름 (모르면 null)
    private final Double temp;                // 기온 (모르면 null)
    private final boolean simulated;          // 시연 모드 여부
    private final String headline;            // 한 줄 요약
    private final List<RecommendedCategory> recommendations; // 추천 1~3위
    private final List<String> notes;         // 추천 근거 / 대체 안내
}
