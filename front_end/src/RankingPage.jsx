import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar.jsx";
import "./RankingPage.css";

const BASE = "http://localhost:8000";

const BADGE_CONFIG = {
  views:        { label: "POPULAR",   color: "#5C6BC0", bg: "#E8EAF6", icon: "🔥" },
  tight:        { label: "CLOSE",     color: "#00897B", bg: "#E0F2F1", icon: "⚖️" },
  overwhelming: { label: "OVERWHELM", color: "#E53935", bg: "#FFEBEE", icon: "💀" },
};

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];

function RankingCard({ video, rank, type }) {
  const navigate = useNavigate();
  const videoId = video.video_url?.split("v=")[1]?.split("&")[0]
    || video.video_url?.split("/").pop();
  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  const getScore = () => {
    if (type === "views") return { main: `${(video.views || 0).toLocaleString()}`, sub: "조회수" };
    if (type === "tight") {
      const diff = Math.abs((video.side_a_ratio || 0) - (video.side_b_ratio || 0));
      return { main: `${diff.toFixed(1)}%`, sub: "차이" };
    }
    const maxScore = Math.max(video.side_a_ratio || 0, video.side_b_ratio || 0);
    return { main: `${maxScore.toFixed(1)}%`, sub: "유죄율" };
  };

  const score = getScore();
  const rankColor = RANK_COLORS[rank - 1] || "#888";

  return (
    <div
      className="rk-card"
      onClick={() => navigate(`/?caseId=${video.id}`)}
      style={{ animationDelay: `${(rank - 1) * 80}ms` }}
    >
      <div className="rk-rank" style={{ color: rankColor }}>{rank}</div>
      <div className="rk-thumb">
        {thumbUrl ? <img src={thumbUrl} alt="" /> : <div className="rk-thumb-placeholder">🎬</div>}
      </div>
      <div className="rk-info">
        <p className="rk-title">{video.title || "제목 없음"}</p>
        <p className="rk-champs">
          {video.champion_a || "챔피언"} <span className="rk-vs">vs</span> {video.champion_b || "챔피언"}
        </p>
      </div>
      <div className="rk-score">
        <strong>{score.main}</strong>
        <span>{score.sub}</span>
      </div>
    </div>
  );
}

function RankingSection({ type, videos }) {
  const cfg = BADGE_CONFIG[type];
  return (
    <section className="rk-section">
      <div className="rk-section-header">
        <span className="rk-badge" style={{ color: cfg.color, background: cfg.bg }}>
          {cfg.icon} {cfg.label}
        </span>
        <h2>
          {type === "views" && "조회수 TOP 3"}
          {type === "tight" && "박빙 승부 TOP 3"}
          {type === "overwhelming" && "압도적 유죄 TOP 3"}
        </h2>
      </div>
      <div className="rk-list">
        {videos.length > 0 ? (
          videos.map((v, i) => <RankingCard key={v.id} video={v} rank={i + 1} type={type} />)
        ) : (
          <div className="rk-empty">
            <span>⏳</span>
            <p>데이터 부족 (최소 10표 필요)</p>
          </div>
        )}
      </div>
    </section>
  );
}

function RankingPage() {
  const [viewRanking, setViewRanking]             = useState([]);
  const [tightRanking, setTightRanking]           = useState([]);
  const [overwhelmingRanking, setOverwhelmRanking] = useState([]);
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [vRes, tRes, oRes] = await Promise.all([
          fetch(`${BASE}/cases/ranking/views`),
          fetch(`${BASE}/cases/ranking/tight`),
          fetch(`${BASE}/cases/ranking/overwhelming`),
        ]);
        if (vRes.ok) setViewRanking((await vRes.json()).slice(0, 3));
        if (tRes.ok) setTightRanking((await tRes.json()).slice(0, 3));
        if (oRes.ok) setOverwhelmRanking((await oRes.json()).slice(0, 3));
      } catch (e) {
        console.error("랭킹 로드 실패:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="rk-app">
        <Topbar />
        <div className="rk-loading">실시간 랭킹 집계 중...</div>
      </div>
    );

  return (
    <div className="rk-app">
      <Topbar />
      <main className="rk-container">
        <div className="rk-hero">
          <h1>오늘의 판결 랭킹</h1>
          <p>유저들의 투표로 결정된 실시간 데이터</p>
        </div>
        <div className="rk-grid">
          <RankingSection type="views"        videos={viewRanking} />
          <RankingSection type="tight"        videos={tightRanking} />
          <RankingSection type="overwhelming" videos={overwhelmingRanking} />
        </div>
      </main>
    </div>
  );
}

export default RankingPage;
