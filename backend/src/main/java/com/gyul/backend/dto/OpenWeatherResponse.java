package com.gyul.backend.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
/* 
{
    "weather":[{"main": "Clear", "description": "맑음"}]
    "main": { "temp": 18.4, "humidity": 52 }
    "name":"Seoul"

}
*/

@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenWeatherResponse(
        String name,            // 도시 이름 (영문, 참고용)
        List<Weather> weather,  // 날씨 목록 (보통 1개) → [ { } ] 모양이라 List
        Main main               // 기온·습도
) {

    /** "weather": [ { "main": "Clear", "description": "맑음" } ] 의 { } 하나 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Weather(
            String main,        // 날씨 이름 (Clear, Rain, Snow, Clouds ...)
            String description  // 한국어 설명 (lang=kr) : "맑음", "실 비"
    ) {
    }

    /** "main": { "temp": 18.4, "humidity": 52 } */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Main(
            double temp,        // 기온 (units=metric → 섭씨)
            int humidity        // 습도 (%)
    ) {
    }
    
}
