package com.gyul.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.SessionAttribute;

import com.gyul.backend.dto.LoginRequest;
import com.gyul.backend.dto.MemberResponse;
import com.gyul.backend.dto.MemberSignupRequest;
import com.gyul.backend.dto.UsernameCheckResponse;
import com.gyul.backend.exception.UnauthorizedException;
import com.gyul.backend.service.MemberService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController 
@RequestMapping("api/members") 
@RequiredArgsConstructor
public class MemberController {


    private final MemberService memberService; // 주방장이 요리 해옴
    
    //아이디 중복 확인
    @GetMapping("/check-username") // http://localhost:8080/api/members/check-username?username=soldesk
    public UsernameCheckResponse checkUsername(@RequestParam("username") String username) {
        return memberService.checkUsername(username);
    }

    //회원 가입
    @PostMapping("/signup")
    public ResponseEntity<MemberResponse> signup(@Valid @RequestBody MemberSignupRequest request) {
        MemberResponse response = memberService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    //로그인
    @PostMapping("/login") // api/members/login
    public MemberResponse login(@Valid @RequestBody LoginRequest loginRequest,
                                HttpServletRequest request) {
            // 아이디, 비번 확인은 Service에게 맡김
            MemberResponse member=memberService.login(loginRequest);   
            
            // 이전에 로그인 되었으면 비워버림
            // 로그인 할때마다 새 session으로 교체 없으면 null
            HttpSession oldSession =request.getSession(false);
            // 이미 만들어져 있으면 꺼내고 없으면 새로 만들지 않음
            if (oldSession != null) {
            oldSession.invalidate();
        }

        // 새 세션 만들기
        // 서버가 응답을 하면 JSESSIONID를 쿠키에서 받는다
        HttpSession session = request.getSession();
        session.setAttribute(SessionConst.LOGIN_MEMBER_ID, member.getMemberId());

        return member;
                                }

        // 로그인 상태에서 회원 정보 가져오기
        /*
        @SessionAttribute: 세션에서 LOGIN_MEMBER_ID 이름의 값을 꺼내서 매개변수로 사용
        required = false: 로그인을 안해도 오류내지 말고 null을 인정해라 개발자가 직접 처리한다
        */                        

       //로그아웃 (성공은 했지만 돌려줄 내용 없음)
        @PostMapping("/logout")
        public ResponseEntity<Void> logout(HttpServletRequest request) {
        
        // 기존 세션을 가져와서 
        HttpSession session = request.getSession(false);
        // 사물함에 로그인 정보가 있을 때만 비우고 없앤다 (로그인 안 한 상태에서 눌러도 오류 없이 성공)
        if (session != null) {
            session.invalidate();
        }

        // ResponseEntity<Void> : 본문 없는 응답, noContent() = 204
        return ResponseEntity.noContent().build();
    }

        @GetMapping("/me")
    public MemberResponse me(
            @SessionAttribute(name = SessionConst.LOGIN_MEMBER_ID, required = false) Long loginMemberId) {

        // 사물함이 없거나, 사물함에 회원 번호가 없으면 → 로그인하지 않은 상태
        if (loginMemberId == null) {
            throw new UnauthorizedException("로그인이 필요합니다.");
        }

        // 회원 번호로 DB에서 최신 회원 정보를 조회해서 돌려준다
        return memberService.getMember(loginMemberId);
    }                        
    
}
