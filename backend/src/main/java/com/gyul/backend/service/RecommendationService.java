package com.gyul.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gyul.backend.dto.CategoryCount;
import com.gyul.backend.dto.RecommendationResponse;
import com.gyul.backend.dto.RecommendedBoard;
import com.gyul.backend.dto.RecommendedCategory;
import com.gyul.backend.dto.WeatherResponse;
import com.gyul.backend.entity.Board;
import com.gyul.backend.entity.Category;
import com.gyul.backend.entity.WeatherCondition;
import com.gyul.backend.repository.BoardRepository;
import com.gyul.backend.repository.ViewLogRepository;

import lombok.RequiredArgsConstructor;

/**
 * 추천 Service - 날씨 · 내 취향 · 최근 인기를 섞어 카테고리를 추천한다
 *
 * 추천 점수 = 0.5 × 날씨 비율 + 0.3 × 내 비율 + 0.2 × 최근 7일 비율
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecommendationService {

    // ----- 추천 규칙 (숫자를 바꿔 실험해 볼 수 있다) -----
    private static final double WEIGHT_WEATHER = 0.5;
    private static final double WEIGHT_MY = 0.3;
    private static final double WEIGHT_RECENT = 0.2;

    private static final long MIN_WEATHER_LOGS = 30; // 날씨 기록이 이보다 적으면 전체 인기로 대체
    private static final long MIN_MY_LOGS = 10;      // 내 기록이 이보다 적으면 전체 인기로 대체
    private static final int RECENT_DAYS = 7;        // "최근" 의 기준
    private static final int TOP_N = 3;              // 추천할 카테고리 수

    /** 카테고리 하나의 점수 계산 결과 (이 클래스 안에서만 쓰는 작은 record) */
    private record Scored(Category category, double score, double weather, double my, double recent) {
    }

    private final ViewLogRepository viewLogRepository;
    private final BoardRepository boardRepository;
    private final WeatherService weatherService;

    /**
     * 카테고리 추천
     *
     * @param loginMemberId    로그인 회원 번호 (비회원이면 null)
     * @param simulatedWeather 시연용 날씨 (없으면 null → 실제 날씨 사용)
     */
    public RecommendationResponse recommend(Long loginMemberId, WeatherCondition simulatedWeather) {

        List<String> notes = new ArrayList<>(); // 추천 근거 · 대체 안내 문구

        // ========== ① 기준 날씨 정하기 ==========
        WeatherResponse current = weatherService.getCurrentWeather(); // 도시 이름 + 실제 날씨 (10분 캐시)
        boolean simulated = simulatedWeather != null;
        WeatherCondition condition = null;
        Double temp = null;

        if (simulated) {
            condition = simulatedWeather;
            notes.add("시연 모드 : 날씨를 '" + condition.getLabel() + "' 으로 가정했어요.");
        } else if (current.isAvailable()) {
            condition = current.getCondition();
            temp = current.getTemp();
        } else {
            notes.add("날씨 정보를 받지 못해 날씨 점수는 전체 인기로 대신했어요.");
        }

        // ========== ② 대체값 : 전체 인기 비율 ==========
        Map<Category, Double> overall = toPercentMap(viewLogRepository.categoryCountsAll());

        // ========== ③-1 재료 : 날씨 비율 ==========
        Map<Category, Double> weatherPart = overall; // 기본은 대체값
        if (condition != null) {
            List<CategoryCount> counts = viewLogRepository.categoryCountsByWeather(condition);
            long total = sum(counts);
            if (total >= MIN_WEATHER_LOGS) {
                weatherPart = toPercentMap(counts);
                notes.add(condition.getLabel() + " 날씨 조회 기록 " + String.format("%,d", total) + "건을 반영했어요.");
            } else {
                notes.add(condition.getLabel() + " 날씨 기록이 " + total + "건뿐이라 전체 인기로 대신했어요.");
            }
        }

        // ========== ③-2 재료 : 내 비율 ==========
        Map<Category, Double> myPart = overall;
        if (loginMemberId == null) {
            notes.add("로그인하면 내 취향도 반영돼요.");
        } else {
            List<CategoryCount> counts = viewLogRepository.categoryCountsByMember(loginMemberId);
            long total = sum(counts);
            if (total >= MIN_MY_LOGS) {
                myPart = toPercentMap(counts);
                notes.add("내 조회 기록 " + String.format("%,d", total) + "건을 반영했어요.");
            } else {
                notes.add("내 조회 기록이 " + total + "건뿐이라 전체 인기로 대신했어요. 글을 더 읽으면 내 취향이 반영돼요.");
            }
        }

        // ========== ③-3 재료 : 최근 7일 비율 ==========
        Map<Category, Double> recentPart = overall;
        List<CategoryCount> recentCounts =
                viewLogRepository.categoryCountsSince(LocalDateTime.now().minusDays(RECENT_DAYS));
        long recentTotal = sum(recentCounts);
        if (recentTotal > 0) {
            recentPart = toPercentMap(recentCounts);
            notes.add("최근 " + RECENT_DAYS + "일 조회 기록 " + String.format("%,d", recentTotal) + "건을 반영했어요.");
        } else {
            notes.add("최근 " + RECENT_DAYS + "일 기록이 없어 전체 인기로 대신했어요.");
        }

        // ========== ④ 점수 계산 (6개 카테고리) ==========
        List<Scored> scoredList = new ArrayList<>();
        for (Category category : Category.values()) {
            double w = weatherPart.get(category);
            double m = myPart.get(category);
            double r = recentPart.get(category);
            double score = WEIGHT_WEATHER * w + WEIGHT_MY * m + WEIGHT_RECENT * r;
            scoredList.add(new Scored(category, score, w, m, r));
        }

        // ========== ⑤ 점수 큰 순서로 정렬 ==========
        // (a, b) -> Double.compare(b, a) : b 가 크면 앞으로 → 내림차순
        scoredList.sort((a, b) -> Double.compare(b.score(), a.score()));

        // ========== ⑥ 상위 3개 + 인기 글 ==========
        List<RecommendedCategory> recommendations = new ArrayList<>();
        for (int i = 0; i < TOP_N && i < scoredList.size(); i++) {
            Scored s = scoredList.get(i);

            List<RecommendedBoard> boards = new ArrayList<>();
            for (Board board : boardRepository.findTop3ByCategoryOrderByViewCountDescBoardIdDesc(s.category())) {
                boards.add(RecommendedBoard.from(board));
            }

            recommendations.add(new RecommendedCategory(
                    i + 1,                    // 순위
                    s.category(),
                    round1(s.score()),        // 화면용으로 소수 첫째 자리
                    round1(s.weather()),
                    round1(s.my()),
                    round1(s.recent()),
                    boards));
        }

        // ========== ⑦ 한 줄 요약 ==========
        String headline = buildHeadline(current.getCity(), condition, temp, simulated, recommendations);

        return new RecommendationResponse(
                current.getCity(),
                condition,
                condition != null ? condition.getLabel() : null,
                temp,
                simulated,
                headline,
                recommendations,
                notes);
    }

    // ===================== 도우미 메서드 =====================

    /**
     * (카테고리, 건수) 목록 → 카테고리별 비율(%) 메모장
     * 6개 카테고리가 모두 들어 있다 (기록이 없으면 0.0)
     * 계산 중에는 반올림하지 않는다 (반올림은 마지막 화면용에서 한 번만)
     */
    private Map<Category, Double> toPercentMap(List<CategoryCount> counts) {
        Map<Category, Double> map = new EnumMap<>(Category.class);
        for (Category category : Category.values()) {
            map.put(category, 0.0); // 먼저 0 으로 다 채우고
        }

        long total = sum(counts);
        if (total == 0) {
            return map; // 기록이 하나도 없으면 전부 0
        }
        for (CategoryCount c : counts) {
            map.put(c.category(), c.count() * 100.0 / total); // 있는 것만 덮어쓰기
        }
        return map;
    }

    /** 건수 합계 */
    private long sum(List<CategoryCount> counts) {
        long total = 0;
        for (CategoryCount c : counts) {
            total += c.count();
        }
        return total;
    }

    /** 소수 첫째 자리 반올림 : 26.345 → 26.3 */
    private double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }

    /**
     * 한 줄 요약 만들기
     * 예) "지금 서울 날씨는 비, 14.2°C — 카페, 문화·공연 글을 추천해요"
     *     "(시연) 비 오는 날 기준 — 카페, 문화·공연 글을 추천해요"
     *     "오늘의 추천 — 맛집, 카페 글을 추천해요"   (날씨 모름)
     */
    private String buildHeadline(String city, WeatherCondition condition, Double temp,
                                 boolean simulated, List<RecommendedCategory> recommendations) {

        // 상위 2개 카테고리 이름 : "카페, 문화·공연"
        List<String> names = new ArrayList<>();
        for (int i = 0; i < Math.min(2, recommendations.size()); i++) {
            names.add(recommendations.get(i).getCategoryLabel());
        }
        String picks = String.join(", ", names) + " 글을 추천해요";

        if (condition == null) {
            return "오늘의 추천 — " + picks;
        }
        if (simulated) {
            return "(시연) " + condition.getLabel() + " 날씨 기준 — " + picks;
        }
        // String.format("%.1f", 14.2) → "14.2"
        String tempText = (temp != null) ? ", " + String.format("%.1f", temp) + "°C" : "";
        return "지금 " + city + " 날씨는 " + condition.getLabel() + tempText + " — " + picks;
    }
}