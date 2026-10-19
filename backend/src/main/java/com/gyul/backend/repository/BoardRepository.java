package com.gyul.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.gyul.backend.entity.Board;
import com.gyul.backend.entity.Category;

public interface BoardRepository extends JpaRepository<Board, Long>{
    
    // chapter04
    /*
    findAll(전부 찾아라) + By +OrderBy(정렬)+BoardId(글번호)+Desc
    select * from board order by board_id desc
    @EntityGraph(attributePaths = "writer"): 글 가져올때 작성자도 Join으로 한번에 같이 가져오기
    */

    /* 
    @EntityGraph(attributePaths = "writer")
    List<Board> findAllByOrderByBoardIdDesc();
    */
  
    @EntityGraph(attributePaths = "writer")
    @Query(value = """
            SELECT b FROM Board b
             WHERE (:category IS NULL OR b.category = :category)
               AND (:keyword IS NULL
                    OR b.title   LIKE CONCAT('%', :keyword, '%')
                    OR b.content LIKE CONCAT('%', :keyword, '%'))
            """,
           countQuery = """
            SELECT COUNT(b) FROM Board b
             WHERE (:category IS NULL OR b.category = :category)
               AND (:keyword IS NULL
                    OR b.title   LIKE CONCAT('%', :keyword, '%')
                    OR b.content LIKE CONCAT('%', :keyword, '%'))
            """)
    Page<Board> search(@Param("category") Category category,
                       @Param("keyword") String keyword,
                       Pageable pageable);


     /**
     * [Chapter 08] 카테고리별 인기 글 3개 (조회수 큰 순, 같으면 최신 글 먼저)
     * SQL (개념) : SELECT * FROM BOARD WHERE CATEGORY = ?
     *              ORDER BY VIEW_COUNT DESC, BOARD_ID DESC FETCH FIRST 3 ROWS ONLY
     * 작성자(writer)는 쓰지 않으므로 @EntityGraph 가 필요 없다
     */
    List<Board> findTop3ByCategoryOrderByViewCountDescBoardIdDesc(Category category);

}
