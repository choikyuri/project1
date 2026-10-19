package com.gyul.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.gyul.backend.dto.BoardDetailResponse;
import com.gyul.backend.dto.BoardListResponse;
import com.gyul.backend.dto.BoardPageResponse;
import com.gyul.backend.dto.BoardRequest;
import com.gyul.backend.entity.Category;
import com.gyul.backend.exception.UnauthorizedException;
import com.gyul.backend.service.BoardService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    //글 목록 - 페이징 · 카테고리 · 검색
    //GET /api/boards?page=0&size=10&category=CAFE&keyword=비
     @GetMapping
    public BoardPageResponse list(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "category", required = false) Category category,
            @RequestParam(name = "keyword", required = false) String keyword) {

        return boardService.getBoards(page, size, category, keyword);
    }
    /* 
    //chapter04
    // 글목록 메서드 통신
    @GetMapping
    public List<BoardListResponse> list() {
        return boardService.getBoards();
    }
    */

    // 글 상세 보기 
    @GetMapping("/{boardId}")
    public BoardDetailResponse detail(@PathVariable("boardId") Long boardId ){
       return boardService.getBoard(boardId);
    }

    /**
     * [Chapter 05] 조회수 올리기 + 조회 기록
     * POST /api/boards/3/views → 204
     *
     * 로그인하지 않아도 된다 (비회원 조회도 기록, 회원 번호는 null)
     * 상세 화면이 열릴 때 프론트가 한 번 보낸다
     */
    @PostMapping("/{boardId}/views")
    public ResponseEntity<Void> increaseView(
            @PathVariable("boardId") Long boardId,
            @SessionAttribute(name = SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId) {

        boardService.increaseView(boardId, loginMemberId);
        return ResponseEntity.noContent().build();
    }

    // 글 작성
    @PostMapping //POST /api/boards
    public ResponseEntity<BoardDetailResponse> create(@Valid @RequestBody BoardRequest request, 
        @SessionAttribute(name=SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId  ){

           Long memberId = requireLogin(loginMemberId); // 로그인 안했으면 401
           BoardDetailResponse saved=boardService.createBoard(request, memberId);
           return ResponseEntity.status(HttpStatus.CREATED).body(saved); 
    }

    /**
     * 글 수정 (작성자 본인만)
     * PUT /api/boards/3
     */
    @PutMapping("/{boardId}")
    public BoardDetailResponse update(
            @PathVariable("boardId") Long boardId,
            @Valid @RequestBody BoardRequest request,
            @SessionAttribute(name = SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId) {

        Long memberId = requireLogin(loginMemberId);
        return boardService.updateBoard(boardId, request, memberId);
    }

    /**
     * 글 삭제 (작성자 본인만)
     * DELETE /api/boards/3  → 204 No Content
     */
    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> delete(
            @PathVariable("boardId") Long boardId,
            @SessionAttribute(name = SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId) {

        Long memberId = requireLogin(loginMemberId);
        boardService.deleteBoard(boardId, memberId);
        return ResponseEntity.noContent().build();
    }

    private Long requireLogin(Long loginMemberId) {
        if (loginMemberId == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }
        return loginMemberId;
    }
    
}
