package com.gyul.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gyul.backend.dto.CategoryCount;
import com.gyul.backend.entity.ViewLog;
import com.gyul.backend.entity.WeatherCondition;

/**
 * ViewLogRepository
 * 조회 기록 지금은 save()만 사용
 * JPQL : JPA + SQL
 */
public interface ViewLogRepository extends JpaRepository<ViewLog, Long>{

    // 특정 날씨에 대한 카테고리 조회 수
    @Query("""
            SELECT new com.gyul.backend.dto.CategoryCount(v.category, COUNT(v))
              FROM ViewLog v
             WHERE v.weather = :weather
             GROUP BY v.category
            """)
     List<CategoryCount> categoryCountsByWeather(@Param("weather") WeatherCondition weather);      


    // 기온 구간에 대한 카테고리 조회 수
    @Query("""
            SELECT new com.gyul.backend.dto.CategoryCount(v.category, COUNT(v))
              FROM ViewLog v
             WHERE v.temp >= :minTemp
               AND v.temp <  :maxTemp
             GROUP BY v.category
            """)
    List<CategoryCount> categoryCountsByTempRange(@Param("minTemp") double minTemp,
                                                  @Param("maxTemp") double maxTemp);

    // 특정 회원의 카테고리 조회 수
     @Query("""
            SELECT new com.gyul.backend.dto.CategoryCount(v.category, COUNT(v))
              FROM ViewLog v
             WHERE v.memberId = :memberId
             GROUP BY v.category
            """)
    List<CategoryCount> categoryCountsByMember(@Param("memberId") Long memberId);

    /**
     * [Chapter 08] 전체 기록의 카테고리별 조회 수 (콜드 스타트 대체값)
     * SQL : SELECT CATEGORY, COUNT(*) FROM VIEW_LOG GROUP BY CATEGORY
     */
    @Query("""
            SELECT new com.gyul.backend.dto.CategoryCount(v.category, COUNT(v))
              FROM ViewLog v
             GROUP BY v.category
            """)
    List<CategoryCount> categoryCountsAll();

    /**
     * [Chapter 08] 특정 시각 이후 카테고리별 조회 수 (최근 7일 인기)
     * SQL : ... WHERE VIEWED_AT >= ? GROUP BY CATEGORY
     * @param from 이 시각부터 (예: 지금 - 7일)
     */
    @Query("""
            SELECT new com.gyul.backend.dto.CategoryCount(v.category, COUNT(v))
              FROM ViewLog v
             WHERE v.viewedAt >= :from
             GROUP BY v.category
            """)
    List<CategoryCount> categoryCountsSince(@Param("from") LocalDateTime from);

}
