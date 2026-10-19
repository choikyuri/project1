package com.gyul.backend.dto;

import com.gyul.backend.entity.Category;

// 집계 쿼리 결과(카테고리 건수)
// record: 읽기 전용 
public record CategoryCount(Category category, Long count) {
} 
