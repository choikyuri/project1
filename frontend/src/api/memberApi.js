import api from "./axios";

// 아이디 중복 확인
// Get /api/members/check-username?username=입력값
// Promise(available,message)
export async function checkUsername(username) {
  const res = await api.get("/members/check-username", {
    params: { username },
  });
  return res.data; //JSON
}

export async function signup(form) {
  const res = await api.post("/members/signup", {
    username: form.username,
    password: form.password,
    name: form.name,
    email: form.email,
  });
  return res.data;
}

// 성공하면 JSESSIONID 쿠키를 보내고, 부라우저가 자동으로 저장
export async function login(username, password) {
  const res = await api.post("/members/login", {
    username,
    password,
  });
  return res.data;
}

export async function logout() {
  await api.post("/members/logout");
}

// 브라우져가 저장한 JSESSIONID 쿠키를 자동으로 붙여 보냄
// 고로 로그인 상태에서 회원 정보를 돌려준다
export async function fetchMe() {
  const res = await api.get("/members/me");
  return res.data;
}
