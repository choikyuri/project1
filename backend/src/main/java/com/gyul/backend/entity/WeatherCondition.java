package com.gyul.backend.entity;


public enum WeatherCondition {

    CLEAR("맑음"),
    CLOUDY("흐림"),
    RAIN("비"),
    SNOW("눈");

    private final String label; // 화면에 보여줄 한글 이름

    WeatherCondition(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * OpenWeather 의 날씨 이름("Clear", "Rain" 등) → 우리 4가지로 바꾸기
     *
     * switch 식 (Java 14 이상)
     *  - case "A", "B" -> 값;   : A 또는 B 이면 이 값
     *  - default -> 값;          : 위에 없는 나머지 전부
     *
     * @param openWeatherMain OpenWeather 응답의 weather[0].main 값
     */
    public static WeatherCondition fromOpenWeather(String openWeatherMain) {
        if (openWeatherMain == null) {
            return CLOUDY;
        }
        return switch (openWeatherMain) {
            case "Clear" -> CLEAR;
            case "Rain", "Drizzle", "Thunderstorm" -> RAIN;
            case "Snow" -> SNOW;
            default -> CLOUDY; // Clouds, Mist, Haze, Fog, Dust 등
        };
    }
}