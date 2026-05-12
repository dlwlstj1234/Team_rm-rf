import "./signup.css";
import "./login.css";
import { useNavigate } from "react-router-dom";

function SignupPage() {
  const navigate = useNavigate();

  const handleSignup = () => {
    alert("회원가입 완료!");
    navigate("/login");
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
          <input type="text" placeholder="닉네임" className="signup-input" />
          <input type="password" placeholder="비밀번호" className="signup-input" />
          <input type="password" placeholder="비밀번호 확인" className="signup-input" />
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