package com.gyul.backend.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.gyul.backend.dto.LoginRequest;
import com.gyul.backend.dto.MemberResponse;
import com.gyul.backend.dto.MemberSignupRequest;
import com.gyul.backend.dto.UsernameCheckResponse;
import com.gyul.backend.entity.Member;
import com.gyul.backend.exception.DuplicateMemberException;
import com.gyul.backend.exception.UnauthorizedException;
import com.gyul.backend.repository.MemberRepository;

import lombok.RequiredArgsConstructor;

@Service // 여러 클래스의 객체을 만들어서 보관 
@RequiredArgsConstructor // 생성자를 통해서 자동 주입 
@Transactional(readOnly = true) // 조회전용 트랜젝션
public class MemberService {

      // 아이디 규칙  
     private static final String USERNAME_RULE = "^[a-z0-9]{4,20}$";
     private static final String LOGIN_FAIL_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

     private  final MemberRepository memberRepository; // DB담당
     private  final PasswordEncoder  passwordEncoder ; // 암호와 도구(BCryptPasswordEncoder 객체)

     // 아이디 중복 확인
     // 중복 확인 버튼으로 호출
     // 조회만 하므로 클래스에 붙은 readOnly 트랜잭션이 적용

     public UsernameCheckResponse checkUsername(String username){
        
        // 규칙에 맞지 않을때
        if(username==null || !username.matches(USERNAME_RULE)){
            return new UsernameCheckResponse(false, "아이디는 영문 소문자와 숫자 4~20자로 입력하세요");
        }

        // 같은 아이디가 이미 있는가?
        if(memberRepository.existsByUsername(username)){
            return new UsernameCheckResponse(false, "이미 사용 중인 아이디입니다."); 
        }

        // 둘 다 통과 -> 사용 가능
        return new UsernameCheckResponse(true, "사용할 수 있는 아이디입니다.");

     }

    // 저장
   @Transactional
   public MemberResponse signup(MemberSignupRequest request){


        String name= request.getName().trim();
        String email= request.getEmail().trim();

        // 1) 아이디 중복 확인 → 이미 있으면 예외를 던진다 (GlobalExceptionHandler가 409로 응답)
        if (memberRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateMemberException("username", "이미 사용 중인 아이디입니다.");
        }

        // 2) 이메일 중복 확인
        if (memberRepository.existsByEmail(email)) {
            throw new DuplicateMemberException("email", "이미 가입된 이메일입니다.");
        }

        // 3) 비밀번호 암호화 : "gyul1234" → "$2a$10$..."
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        // 4) 회원 Entity 생성 (원래 비밀번호가 아니라 암호화된 비밀번호를 넣는다!)
        Member member = new Member(request.getUsername(), encodedPassword, name, email);

        // 5) 저장 : JPA가 INSERT SQL을 만들어 실행한다
        //    저장 후 돌려받은 saved 에는 시퀀스로 발급된 memberId 가 들어 있다
        // save: insert into .......
        Member saved = memberRepository.save(member);

        // 6) Entity → 응답 DTO 로 바꿔서 돌려준다 (비밀번호는 빠진다)
        return new MemberResponse(saved);
   }

   public MemberResponse login(LoginRequest request) {

      // 아이디로 회원 찾기: 없으면 빈상자 -> 로그인 실패로 던짐
        Member member = memberRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException(LOGIN_FAIL_MESSAGE));

      // 비번 비교: matches(입력한 비번이랑 암호화된 DB비밀번호)
      // 결과가 false로 나오면 메세지(LOGIN_FAIL_MESSAGE)
      if (!passwordEncoder.matches(request.getPassword(), member.getPassword())) {
            throw new UnauthorizedException(LOGIN_FAIL_MESSAGE); // 아이디 없음과 같은 문구!
            }//if
             return new MemberResponse(member);
        
    }//login

      //회원 번호로 회원 정보 조회(내 정보, 새로고침 시 로그인 유지 확인에서 사용하기 위함)
      // @param memberId: 세션에 저장되어 있던 회원 번호
     public MemberResponse getMember(Long memberId) {

        // findById : JpaRepository 가 기본으로 주는 메서드 (Optional 상자로 돌려준다)
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new UnauthorizedException("회원 정보를 찾을 수 없습니다. 다시 로그인해 주세요."));

        return new MemberResponse(member);
    }//getMember

}
