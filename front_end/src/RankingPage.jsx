import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar.jsx";
import "./RankingPage.css";

const BASE = "http://localhost:8000";

function RankingCard({ video, rank, type }) {
  const navigate = useNavigate();
  
  const videoId = video.video_url?.split('v=')[1]?.split('&')[0] || video.video_url?.split('/').pop();
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "";

  // [수정] 백엔드에서 계산해서 보내준 side_a_ratio, side_b_ratio를 사용
  const getScore = () => {
    if (type === "views") return `${(video.views || 0).toLocaleString()}회`;
    
    // 박빙: 차이가 적은 순
    if (type === "tight") {
      const diff = Math.abs((video.side_a_ratio || 0) - (video.side_b_ratio || 0));
      return `차이 ${diff.toFixed(1)}%`;
    }
    
    // 근자감: 차이가 큰 순 (압도적)
    const maxScore = Math.max(video.side_a_ratio || 0, video.side_b_ratio || 0);
    return `유죄 ${maxScore.toFixed(1)}%`;
  };

  return (
    // [수정] 클릭 시 해당 사건의 상세 페이지로 이동
    <div className="ranking-card" onClick={() => navigate(`/case/${video.id}`)}>
      <div className="ranking-badge">{rank}위</div>
      <div className="ranking-video-preview"><img src={thumbUrl} alt="thumb" /></div>
      <div className="ranking-info">
        <h3 className="ranking-video-title">{video.title}</h3>
        <p className="ranking-video-desc">{video.champion_a || '챔피언'} vs {video.champion_b || '챔피언'}</p>
      </div>
      <div className="ranking-score-box">
        <strong>{getScore()}</strong>
        <span>{type === "views" ? "조회수" : "유저 판결"}</span>
      </div>
    </div>
  );
}

function RankingPage() {
  const [viewRanking, setViewRanking] = useState([]);
  const [tightRanking, setTightRanking] = useState([]);
  const [overwhelmingRanking, setOverwhelmingRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  // [핵심 수정] 형이 만든 백엔드 랭킹 API 3개를 각각 호출
  useEffect(() => {
    const fetchAllRankings = async () => {
      try {
        const [viewsRes, tightRes, overwhelmRes] = await Promise.all([
          fetch(`${BASE}/cases/ranking/views`),
          fetch(`${BASE}/cases/ranking/tight`),
          fetch(`${BASE}/cases/ranking/overwhelming`)
        ]);

        if (viewsRes.ok) setViewRanking((await viewsRes.json()).slice(0, 3));
        if (tightRes.ok) setTightRanking((await tightRes.json()).slice(0, 3));
        if (overwhelmRes.ok) setOverwhelmingRanking((await overwhelmRes.json()).slice(0, 3));
        
      } catch (err) {
        console.error("랭킹 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllRankings();
  }, []);

  if (loading) return <div className="status-screen">실시간 랭킹 집계 중...</div>;

  return (
    <div className="ranking-app">
      <Topbar />
      <main className="ranking-container">
        <section className="ranking-hero-card">
          <h1>오늘의 판결 랭킹</h1>
          <p>유저들의 투표로 결정된 실시간 데이터입니다.</p>
        </section>

        <div className="ranking-sections">
          <RankingSection 
            badge="POPULAR" 
            title="조회수 순 랭킹" 
            videos={viewRanking} 
            type="views" 
          />
          <RankingSection 
            badge="CLOSE" 
            title="투표 박빙 랭킹" 
            videos={tightRanking} 
            type="tight" 
          />
          <RankingSection 
            badge="OVERWHELM" 
            title="근자감 대참사 랭킹" 
            videos={overwhelmingRanking} 
            type="overwhelming" 
          />
        </div>
      </main>
    </div>
  );
}

function RankingSection({ badge, title, videos, type }) {
  return (
    <section className="ranking-group">
      <div className="ranking-group-header">
        <span className="ranking-group-badge">{badge}</span>
        <h2>{title}</h2>
      </div>
      <div className="ranking-list">
        {videos.length > 0 ? (
          videos.map((v, idx) => <RankingCard key={v.id} video={v} rank={idx + 1} type={type} />)
        ) : (
          <p className="no-data">데이터가 부족합니다 (최소 10표 필요)</p>
        )}
      </div>
    </section>
  );
}

export default RankingPage;
