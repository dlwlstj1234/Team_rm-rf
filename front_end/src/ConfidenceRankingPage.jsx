import Topbar from "./Topbar.jsx";
import "./ConfidenceRankingPage.css";
import { useState, useEffect } from "react";

const mockData = [
  { rank: 1, nickname: "철벽의뚝배기", confidence: 99420, tier: "브론즈", comment: "난 캐리력 있음 팀이 문제임" },
  { rank: 2, nickname: "미드장인임박", confidence: 88310, tier: "실버", comment: "오늘 컨디션이 안좋았을 뿐" },
  { rank: 3, nickname: "갱좀와줘요진짜", confidence: 75580, tier: "브론즈", comment: "정글이 와줬으면 이겼음" },
  { rank: 4, nickname: "난분명히잘함", confidence: 64200, tier: "아이언", comment: "AI도 내 플레이가 맞다고 했음" },
  { rank: 5, nickname: "서폿이문제야", confidence: 58900, tier: "실버", comment: "원딜만 잘했으면 이겼음" },
  { rank: 6, nickname: "탑솔로살아있다", confidence: 47300, tier: "브론즈", comment: "4대1 다이브는 변수였음 내 잘못 아님" },
  { rank: 7, nickname: "한타만나오면이김", confidence: 39100, tier: "실버", comment: "팀이 따라왔으면 무조건 이겼음" },
  { rank: 8, nickname: "바론만챙겼어도", confidence: 31750, tier: "골드", comment: "판단력은 내가 제일 좋음" },
  { rank: 9, nickname: "이즈리얼고수지망", confidence: 24400, tier: "실버", comment: "핑 때문에 짐 안 튀었으면 캐리함" },
  { rank: 10, nickname: "솔랭은운빨게임", confidence: 18800, tier: "브론즈", comment: "딜은 내가 제일 많이 함 뭐가 문제야" },
];

const tierColor = {
  챌린저: "#f4c542",
  그랜드마스터: "#f97316",
  마스터: "#c084fc",
  다이아: "#60a5fa",
  플래티넘: "#34d399",
  골드: "#facc15",
  실버: "#cbd5e1",
  브론즈: "#b45309",
  아이언: "#6b7280",
};

const rankMedal = { 1: "🥇", 2: "🥈", 3: "🥉" };

function ConfidenceRankingPage() {
  const [users, setUsers] = useState(mockData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:8000/ranking/geunjagam");
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((item) => ({
            rank: item.rank,
            nickname: item.username,
            confidence: item.geunjagam_point,
            tier: item.tier,
            comment: "근자감 넘치는 소환사",
          }));
          setUsers(formatted);
        }
      } catch {
        // 서버 없으면 목업 데이터 유지
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  return (
    <div className="cr-app">
      <Topbar />

      <main className="cr-container">

        {/* 히어로 */}
        <section className="cr-hero">
          <div className="cr-hero-text">
            <span className="cr-eyebrow">🤡 Confidence Ranking</span>
            <h1>근자감 랭킹</h1>
            <p>
              실력은 없는데 자신감만 하늘을 찌르는 유저들의 명예의 전당입니다.<br />
              <strong style={{color:"#9acd32"}}>랭크가 높을수록 더 못하면서 더 당당하다는 뜻입니다.</strong><br />
              1위를 목표로 하지 마세요. 부끄러운 겁니다.
            </p>
          </div>
          <div className="cr-hero-badge">
            <span>🤡</span>
            <strong>명예의전당</strong>
            <small>못하면서 자신만만</small>
          </div>
        </section>

        {/* 탑3 카드 */}
        <section className="cr-top3">
          {users.slice(0, 3).map((user) => (
            <div key={user.rank} className={`cr-podium cr-podium-${user.rank}`}>
              <div className="cr-podium-medal">{rankMedal[user.rank]}</div>
              <div className="cr-podium-rank">{user.rank}위</div>
              <div className="cr-podium-nickname">{user.nickname}</div>
              <div
                className="cr-podium-tier"
                style={{ color: tierColor[user.tier] ?? "#fff" }}
              >
                {user.tier}
              </div>
              <div className="cr-podium-score">
                🤡 {user.confidence.toLocaleString()}
              </div>
              <div className="cr-podium-comment">"{user.comment}"</div>
            </div>
          ))}
        </section>

        {/* 전체 리스트 */}
        <section className="cr-list-section">
          <h2>🤡 전체 명단 — 실력 역순 자신감 랭킹</h2>

          {loading ? (
            <div className="cr-loading">불러오는 중...</div>
          ) : (
            <div className="cr-list">
              {users.map((user) => (
                <div key={user.rank} className={`cr-row ${user.rank <= 3 ? "cr-row-top" : ""}`}>
                  <div className="cr-row-rank">
                    {rankMedal[user.rank] ?? user.rank}
                  </div>
                  <div className="cr-row-info">
                    <span className="cr-row-nickname">{user.nickname}</span>
                    <span
                      className="cr-row-tier"
                      style={{ color: tierColor[user.tier] ?? "#fff" }}
                    >
                      {user.tier}
                    </span>
                  </div>
                  <div className="cr-row-comment">"{user.comment}"</div>
                  <div className="cr-row-score">
                    🤡 {user.confidence.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default ConfidenceRankingPage;