import { useAuth } from "../context/AuthContext";

function formatDateTime(value) {
  if (!value) return "";
  return value.replace("T", " ").slice(0, 16); // T 를 공백으로 바꾸고 앞에서 16글자만
}

function MyPage() {
  const { member } = useAuth();

  return (
    <section>
      <h1>내 정보</h1>
      <div className="card">
        <table className="profile">
          <tbody>
            <tr>
              <th>회원번호</th>
              <td>{member.memberId}</td>
            </tr>
            <tr>
              <th>아이디</th>
              <td>{member.username}</td>
            </tr>
            <tr>
              <th>이름</th>
              <td>{member.name}</td>
            </tr>
            <tr>
              <th>이메일</th>
              <td>{member.email}</td>
            </tr>
            <tr>
              <th>가입 일시</th>
              <td>{formatDateTime(member.createdAt)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MyPage;
