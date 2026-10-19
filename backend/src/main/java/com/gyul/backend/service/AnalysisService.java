package com.gyul.backend.service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gyul.backend.dto.CategoryCount;
import com.gyul.backend.dto.CategoryStat;
import com.gyul.backend.dto.GroupStat;
import com.gyul.backend.entity.Category;
import com.gyul.backend.entity.WeatherCondition;
import com.gyul.backend.repository.ViewLogRepository;

import lombok.RequiredArgsConstructor;



/**
 * 분석 Service - 조회 기록(VIEW_LOG)을 묶음별 카테고리 비율로 만든다
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 조회만 한다
public class AnalysisService {

    /**
     * 기온 구간 정의 (구간 기준을 바꾸려면 여기만 고친다)
     * record 를 클래스 안에 작게 만들어 "구간 하나" 를 표현한다
     */
    private record TempBand(String key, String label, double minTemp, double maxTemp) {
    }

    private static final List<TempBand> TEMP_BANDS = List.of(
            new TempBand("COLD", "10°C 미만", -100, 10),  // -100 ~ 10 미만
            new TempBand("MILD", "10~25°C", 10, 25),      // 10 이상 ~ 25 미만
            new TempBand("HOT", "25°C 이상", 25, 100));   // 25 이상 ~ 100 미만

    private final ViewLogRepository viewLogRepository;

    /**
     * Q1. 날씨별 분석 - 날씨 4개 각각의 묶음
     */
    public List<GroupStat> getWeatherStats() {
        List<GroupStat> result = new ArrayList<>();

        // WeatherCondition.values() : enum 의 모든 값 [CLEAR, CLOUDY, RAIN, SNOW]
        for (WeatherCondition weather : WeatherCondition.values()) {
            List<CategoryCount> counts = viewLogRepository.categoryCountsByWeather(weather);
            result.add(toGroupStat(weather.name(), weather.getLabel(), counts));
            // weather.name() : enum 이름 글자 "RAIN"
        }
        return result;
    }

    /**
     * Q2. 기온 구간별 분석 - 구간 3개 각각의 묶음
     */
    public List<GroupStat> getTemperatureStats() {
        List<GroupStat> result = new ArrayList<>();

        for (TempBand band : TEMP_BANDS) {
            List<CategoryCount> counts =
                    viewLogRepository.categoryCountsByTempRange(band.minTemp(), band.maxTemp());
            result.add(toGroupStat(band.key(), band.label(), counts));
        }
        return result;
    }

    /**
     * Q3. 회원 한 명의 분석
     * @param memberId 로그인 회원 번호 (Controller 가 세션에서 꺼내 넘긴다)
     */
    public GroupStat getMemberStats(Long memberId) {
        List<CategoryCount> counts = viewLogRepository.categoryCountsByMember(memberId);
        return toGroupStat("ME", "내 조회 기록", counts);
    }

    /**
     * (카테고리, 건수) 목록 → 묶음 하나 (도우미)
     *
     * 1) 받은 건수를 카테고리별 메모장(Map)에 옮기며 합계를 구한다
     * 2) 6개 카테고리를 enum 순서대로 돌며 (없으면 0건) 비율을 계산한다
     * 3) 가장 많은 카테고리를 1위로 기억한다
     */
    private GroupStat toGroupStat(String key, String label, List<CategoryCount> counts) {

        // 1) 메모장 : 카테고리 → 건수
        //    EnumMap : enum 을 열쇠로 쓰는 Map (enum 순서를 지키고 빠르다)
        Map<Category, Long> countMap = new EnumMap<>(Category.class);
        long total = 0;
        for (CategoryCount c : counts) {
            countMap.put(c.category(), c.count()); // record 는 getCount() 가 아니라 count()
            total += c.count();
        }

        // 2) 6개 카테고리 모두 채우기 + 비율 계산 + 3) 1위 찾기
        List<CategoryStat> stats = new ArrayList<>();
        Category top = null;
        long topCount = 0;

        for (Category category : Category.values()) {
            // getOrDefault : 메모장에 없으면 0 (그 카테고리는 한 번도 안 봄)
            long count = countMap.getOrDefault(category, 0L);

            // 비율 (%) : 합계가 0 이면 나눌 수 없으므로 0
            //  count * 1000.0 / total → 반올림 → ÷ 10.0  = 소수 첫째 자리까지
            //  예) 662 * 1000.0 / 1902 = 348.05... → 348 → 34.8
            double percent = (total == 0) ? 0 : Math.round(count * 1000.0 / total) / 10.0;

            stats.add(new CategoryStat(category, count, percent));

            if (count > topCount) { // 더 큰 값이 나오면 1위 교체
                top = category;
                topCount = count;
            }
        }

        return new GroupStat(key, label, total, top, stats);
    }
}
