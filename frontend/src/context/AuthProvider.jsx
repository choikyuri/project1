import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

import {
  fetchMe,
  login as loginApi,
  logout as logoutApi,
} from "../api/memberApi";

function AuthProvider({ children }) {
  // 로그인한 회원 정보 (로그인 안 했으면 null)
  const [member, setMember] = useState(null);

  // 처음 로그인 상태를 확인하는 중인지 확인 이유는 확인이 끝나기 전에 "로그인 안됨" 으로 판단해서 로그인이 튕김
  const [checking, setChecking] = useState(true);

  // 화면이 처음 열릴 때 한번: 로그인 되어 있나요?
  useEffect(() => {
    fetchMe()
      .then((data) => setMember(data)) //로그인이 된 상태
      .catch(() => setMember(null)) //로그인이 안되 상태
      .finally(() => setChecking(false)); //성공이든 실패든 확인 종료
  }, []);

  //로그인
  const login = async (username, password) => {
    const data = await loginApi(username, password);
    setMember(data);
    return data;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setMember(null);
    }
  };

  const value = { member, checking, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
