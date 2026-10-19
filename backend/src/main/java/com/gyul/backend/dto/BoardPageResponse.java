package com.gyul.backend.dto;

import java.util.List;

import org.springframework.data.domain.Page;

import com.gyul.backend.entity.Board;

import lombok.Getter;

@Getter
public class BoardPageResponse {
    /*
      글 목록 페이지 응답(서버 -> 화면)

      "boards":[{...}, {...}] 글(최대 size 개)
      "page":0 쪽번호(0부터)
      "size":10 한 쪽에 몇개씩 보여줄건지
      "totalElements":57
      "totalPages":6
      "first":true -> 첫쪽인가?
      "last":false -> 마지막쪽인가?
    */
    private final List<BoardListResponse> boards;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean first;
    private final boolean last;

    public BoardPageResponse(List<BoardListResponse> boards, Page<Board> result){

        this.boards=boards;
        this.page=result.getNumber();
        this.size=result.getSize();
        this.totalElements = result.getTotalElements();
        this.totalPages = result.getTotalPages();
        this.first = result.isFirst();
        this.last = result.isLast();


    }


}
