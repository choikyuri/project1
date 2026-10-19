package com.gyul.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "VIEW_LOG")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ViewLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "view_log_seq_generator")
    @SequenceGenerator(name = "view_log_seq_generator", sequenceName = "VIEW_LOG_SEQ", allocationSize = 1)
    @Column(name = "LOG_ID")
    private Long logId;

    @Column(name = "BOARD_ID")
    private Long boardId;      // 본 글 번호

    @Column(name = "MEMBER_ID")
    private Long memberId;     // 본 회원 번호 (비회원이면 null)

    @Enumerated(EnumType.STRING)
    @Column(name = "CATEGORY")
    private Category category; // 볼 당시의 카테고리

    @Enumerated(EnumType.STRING)
    @Column(name = "WEATHER")
    private WeatherCondition weather;    // 볼 당시의 날씨 - 06챕터에서 채운다 (지금은 null)

    @Column(name = "TEMP")
    private Double temp;       // 볼 당시의 기온 - 06챕터에서 채운다 (지금은 null)

    @Column(name = "VIEWED_AT")
    private LocalDateTime viewedAt; // 본 시각

    /**
     * 조회 기록 생성
     * @param boardId  본 글 번호
     * @param memberId 로그인 회원 번호 (비회원이면 null)
     * @param category 글의 현재 카테고리
     */
    public ViewLog(Long boardId, Long memberId, Category category, WeatherCondition weather, Double temp) {
        this.boardId = boardId;
        this.memberId = memberId;
        this.category = category;
        this.weather = weather;
        this.temp = temp;
        this.viewedAt = LocalDateTime.now(); // 조회일시
    }
    
}
