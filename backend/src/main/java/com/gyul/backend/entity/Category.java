package com.gyul.backend.entity;

public enum Category {

    FOOD("맛집"),
    CAFE("카페"),
    SPORTS("운동"),
    TRAVEL("여행"),
    CULTURE("문화·공연"),
    DAILY("일상");

    // 각 카테고리의 한글 이름
    private final String label;

    Category(String label){
        this.label=label;
    }

   public String getLabel(){
    return label;
   }

    
}
