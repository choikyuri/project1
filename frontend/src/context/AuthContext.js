import { createContext, useContext } from "react";

// 로그인 정보를 담을 곳
// 실제로 보낼 값은 AuthProvider 가 정함
// 최초에 null이므로 아무것도 없다는 뜻
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);

  //// AuthProvider 로 감싸지 않은 곳에서 쓰면 바로 알 수 있도록 오류 메세지
  if (context === null) {
    throw new Error(
      "useAuth는 AuthProvider 안에서만 사용할 수 있습니다. main.jsx를 확인하세요.",
    );
  }

  return context;
}
