import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Clock from "./Clock";
import WeatherWidget from "./WeatherWidget";

function Header() {
  //로그인 정보
  const { member, checking, logout } = useAuth();
  const navigate = useNavigate();

  //로그아웃 버튼
  const handleLogout = async () => {
    await logout(); // 서버 세션 삭제 -> 화면에서 회원정보 비우기
    navigate("/");
  };

  let userMenu;
  if (checking) {
    userMenu = null;
  } else if (member) {
    // 로그인 상태
    userMenu = (
      <>
        <Link to="/mypage">내 정보</Link>
        <span className="user-name">{member.name}님</span>
        {/* 페이지 이동이 아니라 "동작"이므로 Link 가 아니라 button */}
        <button type="button" className="link-button" onClick={handleLogout}>
          로그아웃
        </button>
      </>
    );
  } else {
    // 로그인 안 한 상태
    userMenu = (
      <>
        <Link to="/login">로그인</Link>
        <Link to="/signup">회원가입</Link>
      </>
    );
  }

  return (
    <>
      <div className="border-b border-solid border-orange-100 bg-orange-50">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-between gap-2 px-4 py-1.5">
          <Clock />
          <WeatherWidget />
        </div>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            1차 프로젝트
          </Link>

          {/* 메뉴 */}
          <nav className="nav">
            <Link to="/">홈</Link>
            <Link to="/boards">게시판</Link>
            <Link to="/analysis">분석</Link>
            {userMenu}
          </nav>
        </div>
      </header>
    </>
  );
}

export default Header;
