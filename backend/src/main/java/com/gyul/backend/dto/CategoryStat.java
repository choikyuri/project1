package com.gyul.backend.dto;

import com.gyul.backend.entity.Category;

import lombok.Getter;

@Getter
public class CategoryStat {

    private final Category category;     // 카테고리 코드
    private final String categoryLabel;  // 한글 이름
    private final long count;            // 조회 수
    private final double percent;        // 이 묶음 안에서의 비율 (%)

    public CategoryStat(Category category, long count, double percent) {
        this.category = category;
        this.categoryLabel = category.getLabel();
        this.count = count;
        this.percent = percent;
    }
    
}
