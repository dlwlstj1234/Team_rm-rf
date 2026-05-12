import Topbar from "./Topbar.jsx";
import "./RankingPage.css";

const rankingVideos = [
  {
    id: 1,
    title: "봇 라인 데스의 원인",
    description: "쓰레쉬의 포지셔닝 실수와 진의 후속 대응을 두고 갈린 판결",
    videoId: 3,
    views: 18760,
    voteCount: 10534,
    leftName: "진",
    rightName: "쓰레쉬",
    leftPercent: 25,
    rightPercent: 75,
    category: "라인전",
  },
  {
    id: 2,
    title: "용 싸움 콜은 누가 틀렸나",
    description: "오브젝트 판단을 두고 양쪽 의견이 거의 반반으로 갈린 장면",
    videoId: 8,
    views: 15420,
    voteCount: 8931,
    leftName: "리 신",
    rightName: "아리",
    leftPercent: 51,
    rightPercent: 49,
    category: "한타",
  },
  {
    id: 3,
    title: "바론 오더 대참사",
    description: "바론을 치자는 콜이 문제였는지, 따라간 팀이 문제였는지에 대한 판결",
    videoId: 11,
    views: 14120,
    voteCount: 7744,
    leftName: "오공",
    rightName: "카이사",
    leftPercent: 50,
    rightPercent: 50,
    category: "오더",
  },
  {
    id: 4,
    title: "미드 솔킬 후 던진 플레이",
    description: "유리한 상황에서 나온 무리한 진입 때문에 압도적으로 표가 몰린 영상",
    videoId: 14,
    views: 21390,
    voteCount: 12601,
    leftName: "제드",
    rightName: "빅토르",
    leftPercent: 8,
    rightPercent: 92,
    category: "미드",
  },
  {
    id: 5,
    title: "정글 갱 타이밍 논란",
    description: "라인 상황을 보고도 들어간 갱킹이 맞았는지 따지는 영상",
    videoId: 21,
    views: 12380,
    voteCount: 6902,
    leftName: "엘리스",
    rightName: "이즈리얼",
    leftPercent: 88,
    rightPercent: 12,
    category: "정글",
  },
  {
    id: 6,
    title: "서폿 로밍 타이밍 판결",
    description: "원딜을 버린 로밍 판단이 이득이었는지 손해였는지 분석",
    videoId: 25,
    views: 9630,
    voteCount: 5120,
    leftName: "루시안",
    rightName: "나미",
    leftPercent: 47,
    rightPercent: 53,
    category: "운영",
  },
];

const medalLabel = {
  1: "GOLD",
  2: "SILVER",
  3: "BRONZE",
};

function formatNumber(value) {
  return value.toLocaleString("ko-KR");
}

function getVoteGap(video) {
  return Math.abs(video.leftPercent - video.rightPercent);
}

function getDominantPercent(video) {
  return Math.max(video.leftPercent, video.rightPercent);
}

function getDominantSide(video) {
  return video.leftPercent >= video.rightPercent ? video.leftName : video.rightName;
}

function getScoreText(video, type) {
  if (type === "views") return { value: formatNumber(video.views), label: "조회수" };
  if (type === "close") return { value: `${getVoteGap(video)}%p`, label: "표 차이" };
  return { value: `${getDominantPercent(video)}%`, label: `${getDominantSide(video)} 압도` };
}

function RankingCard({ video, rank, type }) {
  const score = getScoreText(video, type);

  return (
    <article className={`ranking-card rank-card-${rank}`}>
      <div className={`ranking-rank rank-${rank}`}>
        <strong>{rank}</strong>
        <span>{medalLabel[rank]}</span>
      </div>

      <div className="ranking-video-preview">
        <div className="ranking-preview-glow" />
        <div className="ranking-play-circle">▶</div>
        <span className="ranking-video-id">Video ID: {video.videoId}</span>
      </div>

      <div className="ranking-card-main">
        <div className="ranking-card-meta">
          <span className="ranking-category">{video.category}</span>
          <span>조회수 {formatNumber(video.views)}회</span>
          <span>{formatNumber(video.voteCount)}명 투표</span>
        </div>

        <h3>{video.title}</h3>
        <p>{video.description}</p>

        <div className="ranking-vote-info">
          <div className="ranking-vote-labels">
            <span className="left-side">{video.leftName} {video.leftPercent}%</span>
            <span className="right-side">{video.rightName} {video.rightPercent}%</span>
          </div>

          <div className="ranking-vote-bar">
            <div className="ranking-vote-left" style={{ width: `${video.leftPercent}%` }} />
            <div className="ranking-vote-right" style={{ width: `${video.rightPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="ranking-score-box">
        <strong>{score.value}</strong>
        <span>{score.label}</span>
      </div>
    </article>
  );
}

function RankingSection({ badge, title, description, videos, type }) {
  const topVideos = videos.slice(0, 3);

  return (
    <section className="ranking-section">
      <div className="ranking-section-header">
        <div>
          <span className="ranking-section-badge">{badge}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="ranking-top3-label">TOP 3</span>
      </div>

      <div className="ranking-list">
        {topVideos.map((video, index) => (
          <RankingCard
            key={`${type}-${video.id}`}
            video={video}
            rank={index + 1}
            type={type}
          />
        ))}
      </div>
    </section>
  );
}

function RankingPage() {
  const viewRanking = [...rankingVideos].sort((a, b) => b.views - a.views).slice(0, 3);
  const closeRanking = [...rankingVideos]
    .sort((a, b) => getVoteGap(a) - getVoteGap(b))
    .slice(0, 3);
  const mockRanking = [...rankingVideos]
    .sort((a, b) => getDominantPercent(b) - getDominantPercent(a))
    .slice(0, 3);

  return (
    <div className="ranking-app">
      <Topbar />

      <main className="ranking-container">
        <section className="ranking-hero-card">
          <div className="ranking-hero-text">
            <span className="ranking-eyebrow">LOL Muncheol Ranking</span>
            <h1>오늘의 판결 랭킹</h1>
            <p>
              가장 많이 본 영상, 가장 아슬아슬한 박빙 판결, 자신감은 넘쳤으나 완벽하게 패배해버린 근자감 랭킹을
              TOP 3만
            </p>
            <div className="ranking-hero-tags">
              <span>조회수 TOP 3</span>
              <span>박빙 TOP 3</span>
              <span>근자감 TOP 3</span>
            </div>
          </div>

          <div className="ranking-summary-card">
            <span>분석 영상</span>
            <strong>{rankingVideos.length}</strong>
            <small>실시간 랭킹 데이터</small>
          </div>
        </section>

        <div className="ranking-sections">
          <RankingSection
            badge="POPULAR"
            title="영상 조회수 순 랭킹"
            description="유저들이 가장 많이 확인한 인기 판결 영상입니다."
            videos={viewRanking}
            type="views"
          />

          <RankingSection
            badge="CLOSE GAME"
            title="투표 박빙 순 랭킹"
            description="두 진영의 책임 투표가 50:50에 가장 가까운 치열한 판결입니다."
            videos={closeRanking}
            type="close"
          />

          <RankingSection
            badge="ONE-SIDED"
            title="근자감 랭킹"
            description="사람들의 투표가 한쪽으로 강하게 몰린 압도적인 판결입니다."
            videos={mockRanking}
            type="mock"
          />
        </div>
      </main>
    </div>
  );
}

export default RankingPage;
