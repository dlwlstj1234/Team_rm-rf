import "./App.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const BASE = "http://localhost:8000";

function Topbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [riotNickname, setRiotNickname] = useState("");

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const nickname = localStorage.getItem("nickname");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const fetchData = async () => {
      try {
        const [meRes, rankRes] = await Promise.all([
          fetch(`${BASE}/me?token=${token}`),
          fetch(`${BASE}/ranking/geunjagam`),
        ]);

        const meData = await meRes.json();
        const rankData = await rankRes.json();

        if (meData.is_verified && meData.summoner_name) {
          setRiotNickname(meData.summoner_name);
        }

        const myEntry = rankData.find(
          (item) => item.username === (meData.username ?? nickname)
        );
        setConfidence(myEntry ? myEntry.geunjagam_point : 0);
      } catch (error) {
        console.error("Topbar fetch 에러:", error);
      }
    };

    fetchData();
  }, [isLoggedIn, token]);

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
          <span onClick={() => navigate("/confidence-ranking")}>🤡 근자감 랭킹</span>
        </div>
      </div>

      <div className="topbar-right">
        <span className="topbar-text">누가 더 못했는지 AI가 판단합니다</span>

        {isLoggedIn && (
          <>
            {riotNickname ? (
              <span className="riot-linked-name" onClick={() => navigate("/riot")}>
                🎮 {riotNickname}
              </span>
            ) : (
              <button className="riot-btn" onClick={() => navigate("/riot")}>
                라이엇 연동
              </button>
            )}

            <div className="confidence-box">
              🤡 {confidence.toLocaleString()}
            </div>
          </>
        )}

        {!isLoggedIn && (
          <>
            <button className="login-btn" onClick={() => navigate("/login")}>
              로그인
            </button>
            <button className="signup-btn" onClick={() => navigate("/signup")}>
              회원가입
            </button>
          </>
        )}

        {isLoggedIn && (
          <div className="user-menu">
            <span className="nickname" onClick={() => setIsOpen(!isOpen)}>
              {nickname}님 ▾
            </span>

            {isOpen && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={() => navigate("/mypage")}>
                  마이페이지
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    localStorage.removeItem("isLoggedIn");
                    localStorage.removeItem("nickname");
                    localStorage.removeItem("token");
                    localStorage.removeItem("userId");
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
