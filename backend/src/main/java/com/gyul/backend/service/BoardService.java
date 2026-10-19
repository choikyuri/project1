package com.gyul.backend.service;

import java.util.ArrayList;
import java.util.List;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gyul.backend.dto.BoardDetailResponse;
import com.gyul.backend.dto.BoardListResponse;
import com.gyul.backend.dto.BoardPageResponse;
import com.gyul.backend.dto.BoardRequest;
import com.gyul.backend.dto.WeatherResponse;
import com.gyul.backend.entity.Board;
import com.gyul.backend.entity.Category;
import com.gyul.backend.entity.Member;
import com.gyul.backend.entity.ViewLog;
import com.gyul.backend.entity.WeatherCondition;
import com.gyul.backend.exception.ForbiddenException;
import com.gyul.backend.exception.NotFoundException;
import com.gyul.backend.exception.UnauthorizedException;
import com.gyul.backend.repository.BoardRepository;
import com.gyul.backend.repository.MemberRepository;
import com.gyul.backend.repository.ViewLogRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본 조회
public class BoardService {

    // 한쪽에 최대 몇 개까지 허용할건지 설정
    private static final int MAX_PAGE_SIZE = 50;

    //글 DB
    private final BoardRepository boardRepository;
    //회원 DB
    private final MemberRepository memberRepository;
    //회원 DB
    private final ViewLogRepository  viewLogRepository;
    // 조회 기록에 날씨를 등록
    private final WeatherService weatherService;

    // 글 목록
    public BoardPageResponse getBoards(int page, int size, Category category, String keyword){

        // 이상한 값 막기: 음수 쪽->0쪽, 크기는 1 ~ 50 사이로
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);

        // 검색어 정리: 공백뿐인게 있으면 제외
        String safeKeyword = null;
        if (keyword != null && !keyword.isBlank()) {
            safeKeyword = keyword.trim();
        }

        // 페이지 요청서 만들기: (몇 쪽, 몇 개씩, 글 번호 큰 순서=최신 글 위로)
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "boardId"));
        
        // 글 목록 조회(작성자도 한번에 조회)
       Page<Board> result=boardRepository.search(category, safeKeyword, pageable);

       // DTO 목록으로 하나씩 옮겨 담기
       List<BoardListResponse> boards=new ArrayList<>();
       for(Board board:result.getContent()){
        boards.add(new BoardListResponse(board));
       }
       return new BoardPageResponse(boards, result);
    }

    //글 상세
    public BoardDetailResponse getBoard(Long boardId) {
        Board board = findBoard(boardId);
        return new BoardDetailResponse(board); // 여기서 작성자 정보를 꺼낸다 (트랜잭션 안이라 OK)
    }

    // 조회수 증가
    @Transactional
    public void increaseView(Long boardId, Long loginMemberId) {

        Board board = findBoard(boardId);   // 1) 글 찾기 (없으면 404)
        board.increaseViewCount();          // 2) 조회수 +1 (변경 감지로 UPDATE)
        
        // 지금 날씨(10분 캐시에 있는 날씨 호출)
        WeatherResponse weather = weatherService.getCurrentWeather();

        // 날씨를 받으면 가져오고 못받으면 null
        WeatherCondition condition = weather.isAvailable() ? weather.getCondition() : null;
        Double temp = weather.isAvailable() ? weather.getTemp() : null;

        // 3) 방명록에 한 줄 쓰기 (INSERT) - 날씨·기온은 06챕터에서 추가
        viewLogRepository.save(new ViewLog(board.getBoardId(), loginMemberId, board.getCategory(), condition, temp));
    }

    // 글작성
    // @param request: 제목 내용
    // @param loginMemberId: 세션에서 꺼낸 로그인 회원 번호(Controller가 준다)
    @Transactional
    public BoardDetailResponse createBoard(BoardRequest request, Long loginMemberId) {

        // 1) 작성자(로그인 회원) 찾기 : 세션에는 번호만 있으므로 DB에서 회원을 꺼낸다
        Member writer = memberRepository.findById(loginMemberId)
                .orElseThrow(() -> new UnauthorizedException("회원 정보를 찾을 수 없습니다. 다시 로그인해 주세요."));

        // 2) 새 글 만들기 (제목은 앞뒤 공백 제거, 내용은 줄바꿈·띄어쓰기를 그대로 보존)
        Board board = new Board(writer, request.getCategory(), request.getTitle().trim(), request.getContent());

        // 3) 저장 (INSERT) → 시퀀스로 받은 글 번호가 들어 있는 객체를 돌려받는다
        Board saved = boardRepository.save(board);

        return new BoardDetailResponse(saved);
    }

    // 글수정
    @Transactional
    public BoardDetailResponse updateBoard(Long boardId, BoardRequest request, Long loginMemberId) {

        Board board = findBoard(boardId);   // 1) 글 찾기 (없으면 404)
        checkWriter(board, loginMemberId);  // 2) 작성자 확인 (다르면 403)

        // 3) 값 바꾸기 → 트랜잭션 끝에 UPDATE 자동 실행
        board.update(request.getCategory(), request.getTitle().trim(), request.getContent());

        return new BoardDetailResponse(board); // 바뀐 값으로 응답
    }

    // 글삭제
    @Transactional
    public void deleteBoard(Long boardId, Long loginMemberId) {

        Board board = findBoard(boardId);   // 1) 글 찾기 (없으면 404)
        checkWriter(board, loginMemberId);  // 2) 작성자 확인 (다르면 403)

        boardRepository.delete(board);      // 3) 삭제 (DELETE)
    }


    //------------------private 메서드로 이 클래스에서만 사용------------------------------------
    // 글번호 찾기 - 없으면 404 예외처리
    private Board findBoard(Long boardId) {
        return boardRepository.findById(boardId)
                .orElseThrow(() -> new NotFoundException("게시글을 찾을 수 없습니다."));
    }

    //작성자 본인이 아니면 권한 불충분 - 아니면 403 예외
    private void checkWriter(Board board, Long loginMemberId) {
        if (!board.isWrittenBy(loginMemberId)) {
            throw new ForbiddenException("작성자만 수정하거나 삭제할 수 있습니다.");
        }
    }
 
}


