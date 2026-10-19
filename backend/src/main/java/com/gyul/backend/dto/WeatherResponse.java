package com.gyul.backend.dto;

import java.time.LocalDateTime;

import com.gyul.backend.entity.WeatherCondition;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE) // 생성자는 숨기고, 아래 두 static 메서드로만 만든다
public class WeatherResponse {

    private final boolean available;          // 날씨를 받아 왔는가
    private final String city;                // 도시 이름 (설정값 "서울")
    private final WeatherCondition condition; // CLEAR / CLOUDY / RAIN / SNOW
    private final String conditionLabel;      // 맑음 / 흐림 / 비 / 눈
    private final String description;         // OpenWeather 한국어 설명 ("실 비")
    private final Double temp;                // 기온 (실패 시 null 이어야 하므로 Double)
    private final Integer humidity;           // 습도
    private final LocalDateTime fetchedAt;    // 외부에서 받아 온 시각
    private final String message;             // 실패 이유 (성공이면 null)

    /**
     * 성공 응답 만들기
     * 사용 예) WeatherResponse.success("서울", WeatherCondition.CLEAR, "맑음", 18.4, 52)
     */
    public static WeatherResponse success(String city, WeatherCondition condition,
                                          String description, double temp, int humidity) {
        return new WeatherResponse(true, city, condition, condition.getLabel(), description,
                temp, humidity, LocalDateTime.now(), null);
    }

    /**
     * 실패 응답 만들기
     * 사용 예) WeatherResponse.unavailable("서울", "날씨 API 키가 설정되지 않았습니다.")
     */
    public static WeatherResponse unavailable(String city, String message) {
        return new WeatherResponse(false, city, null, null, null,
                null, null, LocalDateTime.now(), message);
    }
}
