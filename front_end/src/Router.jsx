import { Routes, Route, Navigate } from "react-router-dom";

import App from "./App.jsx";
import LoginPage from "./login.jsx";
import SignupPage from "./signup.jsx";
import UploadPage from "./UploadPage.jsx";
import RiotConnectPage from "./RiotConnectPage.jsx";
import QuickAnalysisPage from "./QuickAnalysisPage.jsx";
import Mypage from "./Mypage.jsx";
import RankingPage from "./RankingPage.jsx";
import ConfidenceRankingPage from "./ConfidenceRankingPage.jsx";

// 로그인 여부 확인
function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

function Router() {
  return (
    <Routes>
      {/* 로그인 없이 접근 가능한 페이지 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* 로그인 후 접근 가능한 페이지 */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <App />
          </PrivateRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <PrivateRoute>
            <UploadPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/riot"
        element={
          <PrivateRoute>
            <RiotConnectPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/quick-analysis"
        element={
          <PrivateRoute>
            <QuickAnalysisPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/ranking"
        element={
          <PrivateRoute>
            <RankingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/confidence-ranking"
        element={
          <PrivateRoute>
            <ConfidenceRankingPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/mypage"
        element={
          <PrivateRoute>
            <Mypage />
          </PrivateRoute>
        }
      />

      {/* 없는 경로 접근 시 홈으로 이동 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default Router;
