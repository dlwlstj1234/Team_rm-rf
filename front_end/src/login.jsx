import "./login.css";
import "./App.css";

import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

 const handleLogin = () => {
  const nickname = "소환사123"; // 👉 나중엔 input 값으로 바꾸면 됨

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("nickname", nickname);

  navigate("/");
  window.location.reload();
};

  return (
    <div className="login-page">
      <div className="login-overlay" />

      <div className="login-card">
        <div className="login-logo-wrap">
          <img src="/logo.png" alt="롤문철 로고" className="login-logo" />
        </div>

       
        <div className="social-row">
          
        </div>

        <div className="login-divider" />

        <p className="email-login-label">로그인</p>

        <div className="input-group">
          <input type="email" placeholder="Username" className="login-input" />
          <input type="password" placeholder="Password" className="login-input" />
        </div>

        <button className="main-login-btn" onClick={handleLogin}>
          로그인
        </button>

        <div className="login-links">
          <div className="signup-links">
          <span onClick={() => navigate("/signup")}>계정이 없으신가요? </span>
          <span onClick={() => navigate("/signup")}>회원가입 </span>
        </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;