import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// 로그인한 사람만 children 을 보여줌

function ProtectedRoute({ children }) {
  const { member, checking } = useAuth();
  const location = useLocation(); // location.pathname=지금 페이지 주소(예:"/mypage")

  if (checking) {
    return <p className="sub">로그인 상태를 확인하는 중...</p>;
  }

  //로그인 확인이 안되어 로그인 화면으로 보냄
  // replace: 방문 기록을 재 기록함(뒤로 가기를 눌러도 /mypage로 다시 튕기지 않게)
  // state:  이동할 페이지
  // Navigate: 사용자의 이벤트 없이 바로 url로 넘어감

  if (!member) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
