package com.gyul.backend.dto;

import java.util.List;

import com.gyul.backend.entity.Category;

import lombok.Getter;

// 그룹 분석
// 날씨별 사용자의 카테고리 선택

@Getter
public class GroupStat {

    private final String key;                   // 묶음 코드 : RAIN, COLD, ME ...
    private final String label;                 // 화면 이름 : 비, 10°C 미만, 내 조회 기록
    private final long total;                   // 이 묶음의 전체 조회 수
    private final Category topCategory;         // 1위 카테고리 (기록이 없으면 null)
    private final String topCategoryLabel;      // 1위 카테고리 이름 (없으면 null)
    private final List<CategoryStat> categories; // 6개 카테고리 (항상 같은 순서, 0건 포함)

    public GroupStat(String key, String label, long total, Category topCategory, List<CategoryStat> categories) {
        this.key = key;
        this.label = label;
        this.total = total;
        this.topCategory = topCategory;
        // 삼항 연산자 : 1위가 있으면 이름, 없으면 null
        this.topCategoryLabel = topCategory != null ? topCategory.getLabel() : null;
        this.categories = categories;
    }
    
}
