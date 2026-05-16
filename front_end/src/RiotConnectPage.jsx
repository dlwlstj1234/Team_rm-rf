import "./RiotConnectPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar.jsx";

function RiotConnectPage() {
  const navigate = useNavigate();
  const [gameNickname, setGameNickname] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ token 먼저 체크
    const token = localStorage.getItem("token");
    if (!token || token === "null" || token === "undefined") {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    const value = gameNickname.trim();

    if (!value) {
      alert("게임 닉네임+태그를 입력해주세요.");
      return;
    }

    const parts = value.split("#");
    if (parts.length !== 2) {
      alert("닉네임#태그 형식으로 입력해주세요. 예: Hide on bush#KR1");
      return;
    }

    const summoner_name = parts[0].trim();
    const tag = parts[1].trim();

    try {
      const response = await fetch(`http://localhost:8000/riot/link?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summoner_name: summoner_name,
          tag: tag,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      localStorage.setItem("gameNickname", value);
      localStorage.setItem("tier", data.tier);
      alert("라이엇 연동 완료!");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("서버 오류 발생");
    }
  };

  return (
    <div className="app">
      <Topbar />

      <div className="riot-page">
        <div className="riot-card">
          <h1 className="riot-title">라이엇 연동</h1>
          <p className="riot-subtitle">게임 닉네임+태그를 입력해주세요.</p>

          <form className="riot-form" onSubmit={handleSubmit}>
            <label className="riot-label">
              게임 닉네임 + 태그
              <input
                type="text"
                className="riot-input"
                placeholder="예: Hide on bush#KR1"
                value={gameNickname}
                onChange={(e) => setGameNickname(e.target.value)}
              />
            </label>

            <button type="submit" className="riot-submit-btn">
              연동하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RiotConnectPage;