import "./signup.css";
import "./login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const handleSignup = async () => {
    if (!username || !password || !password2) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    if (password !== password2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (password.length < 6) {
      alert("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert("회원가입 완료!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert("서버 오류 발생");
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-overlay" />

      <div className="signup-card">
        <div className="signup-logo-wrap">
          <img src="/logo.png" alt="롤문철 로고" className="signup-logo" />
        </div>

        <h1 className="signup-title">롤문철 회원가입</h1>
        <p className="signup-subtitle">새 계정을 만들고 시작해보세요</p>

        <div className="signup-divider" />

        <div className="signup-input-group">
          <input
            type="text"
            placeholder="닉네임"
            className="signup-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="signup-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호 확인"
            className="signup-input"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>

        <button className="main-signup-btn" onClick={handleSignup}>
          회원가입
        </button>

        <div className="signup-links">
          <span onClick={() => navigate("/login")}>이미 계정이 있나요?</span>
          <span onClick={() => navigate("/login")}>로그인 </span>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;