package com.gyul.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gyul.backend.dto.WeatherResponse;
import com.gyul.backend.service.WeatherService;

import lombok.RequiredArgsConstructor;


@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
public class WeatherController {

    private final WeatherService weatherService;

    @GetMapping
    public WeatherResponse current() {
        return weatherService.getCurrentWeather();
    }
    
}
