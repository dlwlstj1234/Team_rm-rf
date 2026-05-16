import "./login.css";
import "./App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("nickname", username);

      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("서버 오류 발생");
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay" />

      <div className="login-card">
        <div className="login-logo-wrap">
          <img src="/logo.png" alt="롤문철 로고" className="login-logo" />
        </div>

        <div className="login-divider" />

        <p className="email-login-label">로그인</p>

        <div className="input-group">
          <input
            type="text"
            placeholder="Username"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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