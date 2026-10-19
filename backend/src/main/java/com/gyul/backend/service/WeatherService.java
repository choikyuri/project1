package com.gyul.backend.service;

import java.time.Duration;
import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.gyul.backend.dto.OpenWeatherResponse;
import com.gyul.backend.dto.WeatherResponse;
import com.gyul.backend.entity.WeatherCondition;
import lombok.extern.slf4j.Slf4j;

@Slf4j // 콘솔에 기록을 남길 수 있게 log 변수를 만들어 준다
@Service
public class WeatherService {

     private static final Duration SUCCESS_CACHE_TIME = Duration.ofMinutes(10); // 성공 결과 보관 시간
    private static final Duration FAILURE_CACHE_TIME = Duration.ofMinutes(1);  // 실패 결과 보관 시간
    private static final Duration TIMEOUT = Duration.ofSeconds(3);             // 외부 서버 최대 대기 시간

    private final RestClient restClient; // 외부 서버에 요청을 보내는 도구
    private final String apiKey;         // secret.yml 의 weather.api-key
    private final String cityName;       // application.yml 의 weather.city-name
    private final double lat;
    private final double lon;

    // ----- 캐시 (메모) -----
    private WeatherResponse cachedWeather;   // 마지막으로 받은 날씨
    private LocalDateTime cachedUntil;       // 이 시각까지 메모가 유효

    /**
     * 생성자 - 설정 파일의 값을 받아서 준비한다
     *
     * @Value("${이름:기본값}") : application.yml / secret.yml 의 값을 넣어 준다
     *   콜론(:) 뒤는 그 값이 없을 때 쓸 기본값 (api-key 는 없으면 빈 글자 "")
     */
    public WeatherService(
            @Value("${weather.api-key:}") String apiKey,
            @Value("${weather.city-name:서울}") String cityName,
            @Value("${weather.lat:37.5665}") double lat,
            @Value("${weather.lon:126.9780}") double lon) {

        this.apiKey = apiKey;
        this.cityName = cityName;
        this.lat = lat;
        this.lon = lon;

        // 외부 서버 연결 3초, 응답 3초까지만 기다린다 (넘으면 실패로 처리)
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT);
        requestFactory.setReadTimeout(TIMEOUT);

        this.restClient = RestClient.builder()
                .baseUrl("https://api.openweathermap.org") // 모든 요청 주소 앞에 붙는다
                .requestFactory(requestFactory)
                .build();
    }

    /**
     * 지금 날씨 (10분 캐시)
     * - 항상 WeatherResponse 를 돌려준다 (실패해도 예외를 던지지 않고 available=false)
     *   → 날씨 때문에 게시판 조회 같은 다른 기능이 멈추면 안 되기 때문
     *
     * synchronized : 동시에 여러 요청이 와도 한 번에 하나씩 실행
     */
    public synchronized WeatherResponse getCurrentWeather() {

        // 1) 메모가 있고 아직 유효하면 그대로 돌려준다
        LocalDateTime now = LocalDateTime.now();
        if (cachedWeather != null && now.isBefore(cachedUntil)) {
            log.info("[날씨] 캐시 사용 (유효 시각 {})", cachedUntil);
            return cachedWeather;
        }

        // 2) 키가 없으면 외부 호출 없이 "정보 없음"
        if (apiKey.isBlank()) {
            log.warn("[날씨] API 키가 없습니다. secret.yml 의 weather.api-key 를 확인하세요.");
            return remember(WeatherResponse.unavailable(cityName, "날씨 API 키가 설정되지 않았습니다."),
                    FAILURE_CACHE_TIME);
        }

        // 3) 외부 호출
        try {
            log.info("[날씨] OpenWeather 호출");

            OpenWeatherResponse res = restClient.get()
                    // uriBuilder : 주소 뒤 ?이름=값 을 안전하게 이어 붙여 주는 도구
                    .uri(uriBuilder -> uriBuilder
                            .path("/data/2.5/weather")
                            .queryParam("lat", lat)
                            .queryParam("lon", lon)
                            .queryParam("units", "metric") // 섭씨
                            .queryParam("lang", "kr")      // 한국어 설명
                            .queryParam("appid", apiKey)
                            .build())
                    .retrieve()                            // 요청 보내기 (4xx, 5xx 면 예외)
                    .body(OpenWeatherResponse.class);      // JSON → record

            // 4) 외부 모양 → 우리 모양으로 바꾸기
            WeatherResponse weather = toWeatherResponse(res);
            log.info("[날씨] 받아 옴 : {} {}°C", weather.getConditionLabel(), weather.getTemp());
            return remember(weather, SUCCESS_CACHE_TIME);

        } catch (Exception e) {
            // 키 오류(401), 호출 한도 초과(429), 시간 초과, 인터넷 끊김 등 모든 실패
            // (주의) 로그에 API 키를 찍지 않는다
            log.warn("[날씨] 호출 실패 : {}", e.getMessage());
            return remember(WeatherResponse.unavailable(cityName, "날씨 정보를 불러올 수 없습니다."),
                    FAILURE_CACHE_TIME);
        }
    }

    /**
     * 메모해 두고 그대로 돌려주기 (도우미)
     * @param weather  보관할 결과
     * @param keepTime 보관 시간
     */
    private WeatherResponse remember(WeatherResponse weather, Duration keepTime) {
        this.cachedWeather = weather;
        this.cachedUntil = LocalDateTime.now().plus(keepTime);
        return weather;
    }

    /**
     * OpenWeather 응답 → 우리 응답 (도우미)
     * weather 목록이 비어 있는 이상한 응답에도 오류가 나지 않게 확인한다
     */
    private WeatherResponse toWeatherResponse(OpenWeatherResponse res) {
        if (res == null || res.main() == null || res.weather() == null || res.weather().isEmpty()) {
            return WeatherResponse.unavailable(cityName, "날씨 응답 형식이 올바르지 않습니다.");
        }

        OpenWeatherResponse.Weather first = res.weather().get(0); // 목록의 첫 번째 날씨
        WeatherCondition condition = WeatherCondition.fromOpenWeather(first.main());

        // 기온은 소수 첫째 자리까지만 (18.437 → 18.4)
        double temp = Math.round(res.main().temp() * 10) / 10.0;

        return WeatherResponse.success(cityName, condition, first.description(), temp, res.main().humidity());
    }
    
}
