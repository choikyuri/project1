package com.gyul.backend.dto;

import com.gyul.backend.entity.Board;

/*
{ "boardId": 31, "title": "오늘의 카페 31", "viewCount": 58 }
*/

public record RecommendedBoard(Long boardId, String title, long viewCount) {

    /** Board Entity → RecommendedBoard (작성자는 쓰지 않는다) */
    public static RecommendedBoard from(Board board) {
        return new RecommendedBoard(board.getBoardId(), board.getTitle(), board.getViewCount());
    }
    
}
