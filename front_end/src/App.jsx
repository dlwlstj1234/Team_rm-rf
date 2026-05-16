import "./App.css";
import "./Topbar.jsx";
import { useEffect, useState } from "react";
import Topbar from "./Topbar.jsx";

const tierImageMap = {
  IRON: "/tiers/iron.webp",
  BRONZE: "/tiers/bronze.webp",
  SILVER: "/tiers/silver.webp",
  GOLD: "/tiers/gold.webp",
  PLATINUM: "/tiers/platinum.webp",
  EMERALD: "/tiers/emerald.webp",
  DIAMOND: "/tiers/diamond.webp",
  MASTER: "/tiers/master.webp",
  GRANDMASTER: "/tiers/grandmaster.webp",
  CHALLENGER: "/tiers/challenger.webp",
  UNRANKED: "/tiers/unranked.webp",
};

function MessageCard({ nickname, tier, time, text }) {
  const normalizedTier = tier?.trim()?.toUpperCase() || "UNRANKED";
  const tierImage = tierImageMap[normalizedTier] || tierImageMap.UNRANKED;

  return (
    <div className="message-card">
      <div className="message-top">
        <div className="message-user-wrap">
          <img
            src={tierImage}
            alt={`${normalizedTier} 티어`}
            className="message-tier-icon"
          />
          <span className="message-user">{nickname}</span>
        </div>
        <span className="message-time">{time}</span>
      </div>
      <p className="message-text">{text}</p>
    </div>
  );
}

function SidePanel({ team, subtitle, count, messages, placeholder, variant, votedSide, mySide, inputValue, onInputChange, onSend }) {
  const isLocked = votedSide === null || votedSide !== mySide;

  const lockMessage =
    votedSide === null
      ? "투표 후 채팅에 참여할 수 있습니다"
      : `${team} 진영에 투표한 유저만 채팅할 수 있습니다`;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isLocked) onSend(mySide);
  };

  return (
    <aside className={`side-panel ${variant}`}>
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="panel-icon">💬</span>
          <h2>{team}</h2>
        </div>
        <p className="panel-subtitle">{subtitle}</p>
        <div className="panel-status">
          <span className="status-dot" />
          <span>{count}개 메시지</span>
        </div>
      </div>

      <div className="panel-messages">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <MessageCard
              key={msg.id}
              nickname={msg.nickname}
              tier={msg.tier}
              time={msg.time}
              text={msg.text}
            />
          ))
        ) : (
          <div className="empty-message">아직 채팅이 없습니다.</div>
        )}
      </div>

      <div className={`panel-input-wrap ${isLocked ? "input-locked" : ""}`}>
        {isLocked && (
          <div className="chat-lock-overlay">
            <span className="chat-lock-icon">🔒</span>
            <span className="chat-lock-msg">{lockMessage}</span>
          </div>
        )}
        <input
          className="panel-input"
          placeholder={placeholder}
          disabled={isLocked}
          value={inputValue}
          onChange={(e) => onInputChange(mySide, e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
          disabled={isLocked}
          onClick={() => !isLocked && onSend(mySide)}
        >
          ➤
        </button>
      </div>
    </aside>
  );
}

function ResponsibilityChart({
  leftChampion,
  rightChampion,
  leftPercent,
  rightPercent,
  reason,
}) {
  const chartStyle = {
    background: `conic-gradient(
      #56a2ff 0% ${leftPercent}%,
      #b16cff ${leftPercent}% 100%
    )`,
  };

  return (
    <div className="responsibility-card">
      <div className="responsibility-top">
        <div className="responsibility-chart-wrap">
          <div className="responsibility-chart" style={chartStyle}>
            <div className="responsibility-chart-inner">
              <span className="chart-center-title">책임도</span>
              <strong>{Math.max(leftPercent, rightPercent)}%</strong>
            </div>
          </div>
        </div>

        <div className="responsibility-legend">
          <div className="legend-item">
            <span className="legend-dot blue" />
            <span className="legend-name">{leftChampion}</span>
            <strong>{leftPercent}%</strong>
          </div>
          <div className="legend-item">
            <span className="legend-dot purple" />
            <span className="legend-name">{rightChampion}</span>
            <strong>{rightPercent}%</strong>
          </div>
        </div>
      </div>

      <div className="reason-box">
        <div className="reason-title">판단 이유</div>
        <p className="reason-text">{reason}</p>
      </div>
    </div>
  );
}

function App() {
  const [chatData, setChatData] = useState({
    leftTeam: { teamName: "진", messageCount: 0, messages: [] },
    rightTeam: { teamName: "쓰레쉬", messageCount: 0, messages: [] },
  });
  const [loadingChats, setLoadingChats] = useState(true);
  const [votedSide, setVotedSide] = useState(null); // null | "left" | "right"
  const [chatInputs, setChatInputs] = useState({ left: "", right: "" });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/chats", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("채팅 데이터를 불러오지 못했습니다.");

        const data = await response.json();

        setChatData({
          leftTeam: {
            teamName: data.leftTeam?.teamName ?? "진",
            messageCount: data.leftTeam?.messageCount ?? data.leftTeam?.messages?.length ?? 0,
            messages: data.leftTeam?.messages ?? [],
          },
          rightTeam: {
            teamName: data.rightTeam?.teamName ?? "쓰레쉬",
            messageCount: data.rightTeam?.messageCount ?? data.rightTeam?.messages?.length ?? 0,
            messages: data.rightTeam?.messages ?? [],
          },
        });
      } catch (error) {
        console.error(error);
        setChatData({
          leftTeam: {
            teamName: "진",
            messageCount: 3,
            messages: [
              { id: 1, nickname: "소환사123", tier: "GOLD", time: "10분 전", text: "진짜 이 타이밍에 왜 그랬지?" },
              { id: 2, nickname: "롤마스터", tier: "DIAMOND", time: "8분 전", text: "맵 안보고 간게 너무 팀탓" },
              { id: 3, nickname: "챌린저꿈나무", tier: "CHALLENGER", time: "6분 전", text: "이건 좀 변호가 안되네" },
            ],
          },
          rightTeam: {
            teamName: "쓰레쉬",
            messageCount: 3,
            messages: [
              { id: 4, nickname: "소환사321", tier: "PLATINUM", time: "10분 전", text: "와 이건 진짜 실수네" },
              { id: 5, nickname: "라인전장인", tier: "EMERALD", time: "8분 전", text: "포지셔닝 실수가 치명적" },
              { id: 6, nickname: "그마유저", tier: "GRANDMASTER", time: "6분 전", text: "완전히 잘못 판단함" },
            ],
          },
        });
      } finally {
        setLoadingChats(false);
      }
    };

    fetchChats();
  }, []);

  const handleVote = (side) => {
    if (votedSide !== null) return; // 이미 투표한 경우 무시
    setVotedSide(side);
  };

  const handleInputChange = (side, value) => {
    setChatInputs((prev) => ({ ...prev, [side]: value }));
  };

  const handleSend = (side) => {
    const text = chatInputs[side].trim();
    if (!text) return;

    const teamKey = side === "left" ? "leftTeam" : "rightTeam";
    const nickname = localStorage.getItem("nickname") || "소환사";
    const newMsg = {
      id: Date.now(),
      nickname,
      tier: "UNRANKED",
      time: "방금",
      text,
    };

    setChatData((prev) => ({
      ...prev,
      [teamKey]: {
        ...prev[teamKey],
        messageCount: prev[teamKey].messageCount + 1,
        messages: [...prev[teamKey].messages, newMsg],
      },
    }));
    setChatInputs((prev) => ({ ...prev, [side]: "" }));

    // 백엔드 전송
    fetch("http://localhost:8080/api/chats", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side, text }),
    }).catch(console.error);
  };

  return (
    <div className="app">
      <Topbar />

      <main className="layout">
        <SidePanel
          team={chatData.leftTeam.teamName}
          subtitle="진영 채팅방"
          count={chatData.leftTeam.messageCount}
          messages={chatData.leftTeam.messages}
          placeholder={`${chatData.leftTeam.teamName} 진영 채팅...`}
          variant="left"
          votedSide={votedSide}
          mySide="left"
          inputValue={chatInputs.left}
          onInputChange={handleInputChange}
          onSend={handleSend}
        />

        <section className="center-panel">
          <div className="video-card">
            <div className="video-header">
              <h1>봇 라인 데스의 원인</h1>
              <div className="video-meta">
                <span className="blue-dot" />
                <span>진</span>
                <span className="vs">VS</span>
                <span className="purple-dot" />
                <span>쓰레쉬</span>
              </div>
            </div>

            <div className="video-player">
              <div className="play-circle">▶</div>
              <div className="video-title">League of Legends 플레이 영상</div>
              <div className="video-subtitle">Video ID: 3</div>
              <div className="video-caption">YouTube 링크 연동 준비 완료</div>

              <div className="video-page-badge">3 / 3</div>

              <div className="video-nav">
                <button className="nav-btn">⌃</button>
                <button className="nav-btn">⌄</button>
              </div>
            </div>
          </div>

          <section className="analysis-section">
            <h2>AI 분석 결과</h2>
            <ResponsibilityChart
              leftChampion="진"
              rightChampion="쓰레쉬"
              leftPercent={25}
              rightPercent={75}
              reason="쓰레쉬의 포지셔닝 실수와 진입 판단이 가장 치명적이었고, 진은 후속 대응이 아쉬웠지만 직접적인 데스 유발 비중은 상대적으로 낮았습니다."
            />
          </section>

          <section className="vote-section">
            <h2>누가 더 못했나요?</h2>
            <div className="vote-count">10,534명 투표</div>

            <div className="vote-labels">
              <span className="vote-left-label">진 27%</span>
              <span className="vote-right-label">쓰레쉬 73%</span>
            </div>

            <div className="vote-bar">
              <div className="vote-bar-left" />
              <div className="vote-bar-right" />
            </div>

            <div className="vote-buttons">
              <button
                className={`vote-btn left-btn ${votedSide === "left" ? "voted" : ""}`}
                onClick={() => handleVote("left")}
                disabled={votedSide !== null}
              >
                진 <span>2,891</span>
              </button>
              <button
                className={`vote-btn right-btn ${votedSide === "right" ? "voted" : ""}`}
                onClick={() => handleVote("right")}
                disabled={votedSide !== null}
              >
                쓰레쉬 <span>7,643</span>
              </button>
            </div>

            {votedSide && (
              <p className="voted-notice">
                ✅ {votedSide === "left" ? chatData.leftTeam.teamName : chatData.rightTeam.teamName} 진영에 투표했습니다. 해당 진영 채팅에 참여할 수 있습니다.
              </p>
            )}
          </section>
        </section>

        <SidePanel
          team={chatData.rightTeam.teamName}
          subtitle="진영 채팅방"
          count={chatData.rightTeam.messageCount}
          messages={chatData.rightTeam.messages}
          placeholder={`${chatData.rightTeam.teamName} 진영 채팅...`}
          variant="right"
          votedSide={votedSide}
          mySide="right"
          inputValue={chatInputs.right}
          onInputChange={handleInputChange}
          onSend={handleSend}
        />
      </main>
    </div>
  );
}

export default App;
