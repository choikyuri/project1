package com.gyul.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gyul.backend.entity.Member;

public interface MemberRepository extends JpaRepository<Member, Long>{

    // 같은 아이디를 가진 회원이 있는지 확인
    // 존재하냐?(exists)+조건(by)+필드이름(username)
    // select 1 from member where username=soldesk; -> 1건이라도 있으면 true
    boolean existsByUsername(String username);

    // 같은 이메일을 가진 회원이 있는지 확인
    // select 1 from member where email=?;

    boolean existsByEmail(String email);

    //Optional:  회원이 없을때: 빈 상자(null 이 아님)
    // select * from member where userbname=?
    Optional<Member> findByUsername(String username);
  
}
