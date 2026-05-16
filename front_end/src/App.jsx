import "./App.css";
import "./Topbar.jsx";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Topbar from "./Topbar.jsx";

const BASE = "http://localhost:8000";

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
  const normalizedTier = tier?.trim()?.toUpperCase().split(" ")[0] || "UNRANKED";
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
              nickname={msg.username ?? msg.nickname}
              tier={msg.tier}
              time={
                msg.created_at
                  ? new Date(msg.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                  : msg.time
              }
              text={msg.content ?? msg.text}
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

function ResponsibilityChart({ leftChampion, rightChampion, leftPercent, rightPercent, reason }) {
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
        <p className="reason-text">{reason || "AI가 분석 중입니다..."}</p>
      </div>
    </div>
  );
}

function App() {
  const [cases, setCases] = useState([]);
  const [caseIndex, setCaseIndex] = useState(null); // ✅ null로 초기화
  const [caseDetail, setCaseDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingCase, setLoadingCase] = useState(true);
  const [votedSide, setVotedSide] = useState(null);
  const [chatInputs, setChatInputs] = useState({ left: "", right: "" });
  const [searchParams] = useSearchParams();

  const token = localStorage.getItem("token");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).user_id : 0;

  // 1. 사건 목록 불러오기 + searchParams 한 번에 처리
  useEffect(() => {
    fetch(`${BASE}/cases`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCases(data);
          const caseId = searchParams.get("caseId");
          if (caseId) {
            const idx = data.findIndex((c) => c.id === parseInt(caseId));
            setCaseIndex(idx !== -1 ? idx : 0); // ✅ 바로 올바른 인덱스 설정
          } else {
            setCaseIndex(0);
          }
        }
      })
      .catch((e) => console.error("cases 불러오기 실패:", e));
  }, []);

  // 2. 현재 사건 상세 + 댓글 불러오기
  const fetchCaseDetail = useCallback(async (caseId) => {
    setLoadingCase(true);
    setVotedSide(null);
    setComments([]);
    try {
      const [detailRes, commentsRes] = await Promise.all([
        fetch(`${BASE}/cases/${caseId}`),
        fetch(`${BASE}/cases/${caseId}/comments`),
      ]);
      const detailData = await detailRes.json();
      const commentsData = await commentsRes.json();
      setCaseDetail(detailData);
      setComments(Array.isArray(commentsData) ? commentsData : []);

      if (userId) {
        const voteRes = await fetch(`${BASE}/votes/my?user_id=${userId}&case_id=${caseId}`);
        const voteData = await voteRes.json();
        if (voteData.selected_side) {
          setVotedSide(voteData.selected_side === "A" ? "left" : "right");
        }
      }
    } catch (e) {
      console.error("사건 상세 불러오기 실패:", e);
    } finally {
      setLoadingCase(false);
    }
  }, [userId]);

  // ✅ caseIndex가 null이면 fetch 안 함 (초기 이중 fetch 방지)
  useEffect(() => {
    if (cases.length > 0 && caseIndex !== null) {
      fetchCaseDetail(cases[caseIndex].id);
    }
  }, [cases, caseIndex, fetchCaseDetail]);

  // 현재 사건 데이터
  const currentCase = caseDetail;
  const votingStats = caseDetail?.voting_stats;
  const champA = currentCase?.champion_a ?? "A";
  const champB = currentCase?.champion_b ?? "B";
  const scoreA = votingStats?.side_a_ratio ?? 50;
  const scoreB = votingStats?.side_b_ratio ?? 50;
  const countA = votingStats?.side_a_count ?? 0;
  const countB = votingStats?.side_b_count ?? 0;
  const totalVotes = votingStats?.total_votes ?? 0;

  const leftComments  = comments.filter((c) => c.side === "A");
  const rightComments = comments.filter((c) => c.side === "B");

  // 3. 투표
  const handleVote = async (side) => {
    if (votedSide !== null || !currentCase) return;
    if (!userId) { alert("로그인이 필요합니다."); return; }

    try {
      const res = await fetch(`${BASE}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          case_id: currentCase.id,
          selected_side: side === "left" ? "A" : "B",
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setVotedSide(side);
        fetchCaseDetail(currentCase.id);
      } else {
        alert(data.detail || "이미 투표하셨거나 오류가 발생했습니다.");
      }
    } catch (e) {
      console.error("투표 실패:", e);
    }
  };

  const handleInputChange = (side, value) => {
    setChatInputs((prev) => ({ ...prev, [side]: value }));
  };

  // 4. 댓글(채팅) 전송
  const handleSend = async (side) => {
    const text = chatInputs[side].trim();
    if (!text || !currentCase) return;
    if (!userId) { alert("로그인이 필요합니다."); return; }

    try {
      const res = await fetch(`${BASE}/cases/${currentCase.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          case_id: currentCase.id,
          content: text,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setChatInputs((prev) => ({ ...prev, [side]: "" }));
        const cr = await fetch(`${BASE}/cases/${currentCase.id}/comments`);
        const cd = await cr.json();
        setComments(Array.isArray(cd) ? cd : []);
      } else {
        alert(data.detail || "투표 후 채팅이 가능합니다.");
      }
    } catch (e) {
      console.error("채팅 전송 실패:", e);
    }
  };

  const getEmbedUrl = (url, startTime, endTime) => {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (!match) return null;
  return `https://www.youtube.com/embed/${match[1]}?start=${startTime ?? 0}&end=${endTime ?? 0}&autoplay=1&mute=1`;
};
  const embedUrl = currentCase
  ? getEmbedUrl(currentCase.video_url, currentCase.start_time, currentCase.end_time)
  : null;
  return (
    <div className="app">
      <Topbar />

      <main className="layout">
        <SidePanel
          team={champA}
          subtitle="진영 채팅방"
          count={leftComments.length}
          messages={leftComments}
          placeholder={`${champA} 진영 채팅...`}
          variant="left"
          votedSide={votedSide}
          mySide="left"
          inputValue={chatInputs.left}
          onInputChange={handleInputChange}
          onSend={handleSend}
        />

        <section className="center-panel">
          {loadingCase ? (
            <div style={{ color: "#8192b8", textAlign: "center", padding: "60px" }}>
              불러오는 중...
            </div>
          ) : cases.length === 0 ? (
            <div style={{ color: "#8192b8", textAlign: "center", padding: "60px" }}>
              등록된 사건이 없습니다.
            </div>
          ) : (
            <>
              <div className="video-card">
                <div className="video-header">
                  <h1>{currentCase?.title ?? "제목 없음"}</h1>
                  <div className="video-meta">
                    <span className="blue-dot" />
                    <span>{champA}</span>
                    <span className="vs">VS</span>
                    <span className="purple-dot" />
                    <span>{champB}</span>
                  </div>
                </div>

                <div className="video-player">
                  {embedUrl ? (
                    <iframe
  key={embedUrl}  // ✅ 추가
  width="100%"
  height="480px"
  src={embedUrl}
  title="YouTube video"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  style={{ borderRadius: "12px", minHeight: "480px" }}
/>
                  ) : (
                    <>
                      <div className="play-circle">▶</div>
                      <div className="video-title">{currentCase?.title}</div>
                      <div className="video-caption">영상 URL을 확인해주세요</div>
                    </>
                  )}

                  <div className="video-page-badge">
                    {caseIndex + 1} / {cases.length}
                  </div>

                  <div className="video-nav">
                    <button
  className="nav-btn"
  onClick={() => setCaseIndex((i) => Math.max(0, i - 1))}
  disabled={caseIndex === 0}
>⌃</button>
<button
  className="nav-btn"
  onClick={() => setCaseIndex((i) => i === cases.length - 1 ? 0 : i + 1)} // ✅ 마지막이면 0으로
  disabled={false} // ✅ disabled 제거
>⌄</button>
                  </div>
                </div>
              </div>

              <section className="analysis-section">
                <h2>AI 분석 결과</h2>
                <ResponsibilityChart
                  leftChampion={champA}
                  rightChampion={champB}
                  leftPercent={currentCase?.ai_score_a ?? 50}
                  rightPercent={currentCase?.ai_score_b ?? 50}
                  reason={currentCase?.ai_opinion}
                />
              </section>

              <section className="vote-section">
                <h2>누가 더 못했나요?</h2>
                <div className="vote-count">{totalVotes.toLocaleString()}명 투표</div>

                <div className="vote-labels">
                  <span className="vote-left-label">{champA} {scoreA}%</span>
                  <span className="vote-right-label">{champB} {scoreB}%</span>
                </div>

                <div className="vote-bar">
                  <div className="vote-bar-left" style={{ width: `${scoreA}%` }} />
                  <div className="vote-bar-right" style={{ width: `${scoreB}%` }} />
                </div>

                <div className="vote-buttons">
                  <button
                    className={`vote-btn left-btn ${votedSide === "left" ? "voted" : ""}`}
                    onClick={() => handleVote("left")}
                    disabled={votedSide !== null}
                  >
                    {champA} <span>{countA.toLocaleString()}</span>
                  </button>
                  <button
                    className={`vote-btn right-btn ${votedSide === "right" ? "voted" : ""}`}
                    onClick={() => handleVote("right")}
                    disabled={votedSide !== null}
                  >
                    {champB} <span>{countB.toLocaleString()}</span>
                  </button>
                </div>

                {votedSide && (
                  <p className="voted-notice">
                    ✅ {votedSide === "left" ? champA : champB} 진영에 투표했습니다. 해당 진영 채팅에 참여할 수 있습니다.
                  </p>
                )}
              </section>
            </>
          )}
        </section>

        <SidePanel
          team={champB}
          subtitle="진영 채팅방"
          count={rightComments.length}
          messages={rightComments}
          placeholder={`${champB} 진영 채팅...`}
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
