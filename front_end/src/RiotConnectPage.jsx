import "./RiotConnectPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar.jsx";

function RiotConnectPage() {
  const navigate = useNavigate();
  const [gameNickname, setGameNickname] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const value = gameNickname.trim();

    if (!value) {
      alert("게임 닉네임+태그를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/riot/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riotId: value,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert("올바른 닉네임+태그를 입력해주세요");
        return;
      }

      localStorage.setItem("gameNickname", value);
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