import "./App.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function Topbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [gold, setGold] = useState(0);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const nickname = localStorage.getItem("nickname");

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchGold = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/user/gold");
        const data = await response.json();
        setGold(data.gold ?? 0);
      } catch (error) {
        console.error(error);
      }
    };

    fetchGold();
  }, [isLoggedIn]);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand" onClick={() => navigate("/")}>
          <img src="/logo.png" className="logo" alt="롤문철 로고" />
        </div>

        <div className="nav-menu">
          <span onClick={() => navigate("/quick-analysis")}>빠른분석</span>
          <span onClick={() => navigate("/ranking")}>랭킹</span>
          <span onClick={() => navigate("/upload")}>업로드</span>
          {/* <span>데이터</span> */}
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-text">누가 더 못했는지 AI가 판단합니다</span>

        <button
          className="riot-btn"
          onClick={() => navigate("/riot")}
        >
          라이엇 연동
        </button>

        {isLoggedIn && (
          <div className="gold-box">
            💰 {gold.toLocaleString()}
          </div>
        )}

        {!isLoggedIn && (
          <>
            <button
              className="login-btn"
              onClick={() => navigate("/login")}
            >
              로그인
            </button>

            <button
              className="signup-btn"
              onClick={() => navigate("/signup")}
            >
              회원가입
            </button>
          </>
        )}

        {isLoggedIn && (
          <div className="user-menu">
            <span
              className="nickname"
              onClick={() => setIsOpen(!isOpen)}
            >
              {nickname}님 ▾
            </span>

            {isOpen && (
              <div className="dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/mypage")}
                >
                  마이페이지
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("nickname");
                    navigate("/login");
                    window.location.reload();
                  }}
                >
                  로그아웃
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;