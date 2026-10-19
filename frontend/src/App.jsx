import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import MyPage from "./pages/MyPage";
import BoardWritePage from "./pages/BoardWritePage";
import BoardEditPage from "./pages/BoardEditPage";

import BoardListPage from "./pages/BoardListPage";
import BoardDetailPage from "./pages/BoardDetailPage";
import AnalysisPage from "./pages/AnalysisPage";
import ChatWidget from "./components/ChatWidget";

import "./App.css";

function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          {/* 누구나 볼수 있는 페이지 */}
          {/* http://localhost:5173/ */}
          <Route path="/" element={<HomePage />} />
          {/* http://localhost:5173/signup */}
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/boards" element={<BoardListPage />} />
          <Route path="/boards/:boardId" element={<BoardDetailPage />} />

          {/* 로그인 해야지만 볼수 있는 페이지 */}
          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />

          {/* 글 등록 글 수정 */}
          <Route
            path="/boards/new"
            element={
              <ProtectedRoute>
                <BoardWritePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:boardId/edit"
            element={
              <ProtectedRoute>
                <BoardEditPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <ChatWidget />
    </>
  );
}

export default App;
