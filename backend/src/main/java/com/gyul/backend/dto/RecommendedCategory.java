package com.gyul.backend.dto;

import java.util.List;

import com.gyul.backend.entity.Category;

import lombok.Getter;

/**
 * 추천 카테고리 하나 (서버 → 화면)
 * - 점수뿐 아니라 점수를 만든 재료(세 비율)도 함께 보낸다 → 화면이 "왜 추천했는지" 보여줄 수 있다
 */
@Getter
public class RecommendedCategory {

    private final int rank;                 // 순위 (1, 2, 3)
    private final Category category;
    private final String categoryLabel;
    private final double score;             // 추천 점수 (0 ~ 100)
    private final double weatherPercent;    // 재료 ① 날씨 비율
    private final double myPercent;         // 재료 ② 내 비율
    private final double recentPercent;     // 재료 ③ 최근 7일 비율
    private final List<RecommendedBoard> boards; // 이 카테고리의 인기 글

    public RecommendedCategory(int rank, Category category, double score,
                               double weatherPercent, double myPercent, double recentPercent,
                               List<RecommendedBoard> boards) {
        this.rank = rank;
        this.category = category;
        this.categoryLabel = category.getLabel();
        this.score = score;
        this.weatherPercent = weatherPercent;
        this.myPercent = myPercent;
        this.recentPercent = recentPercent;
        this.boards = boards;
    }
}