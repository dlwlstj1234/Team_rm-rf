import { useEffect, useState } from "react";
import Topbar from "./Topbar.jsx";
import "./Mypage.css";

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

function Mypage() {
  const [nickname, setNickname] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [isRiotLinked, setIsRiotLinked] = useState(false);
  const [riotNickname, setRiotNickname] = useState("");
  const [tierName, setTierName] = useState("UNRANKED");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedNickname = localStorage.getItem("nickname") || "소환사";
    setNickname(savedNickname);

    const fetchMypageData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8000/me?token=${token}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("마이페이지 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // 근자감 포인트는 별도 API로 가져오기
        const token2 = localStorage.getItem("token");
        const rankResponse = await fetch("http://localhost:8000/ranking/geunjagam");
        const rankData = await rankResponse.json();

        // 내 username으로 근자감 포인트 찾기
        const myRank = rankData.find(item => item.username === savedNickname);
        setConfidence(myRank ? myRank.geunjagam_point : 0);

        setIsRiotLinked(data.is_verified ?? false);
        setRiotNickname(data.summoner_name ? `${data.summoner_name}` : "");
        setTierName(data.tier ? data.tier.split(" ")[0].toUpperCase() : "UNRANKED");
      } catch (error) {
        console.error(error);
        setConfidence(0);
        setIsRiotLinked(false);
        setRiotNickname("");
        setTierName("UNRANKED");
      } finally {
        setLoading(false);
      }
    };

    fetchMypageData();
  }, []);

  const tierImage = tierImageMap[tierName] || tierImageMap.UNRANKED;

  return (
    <div className="mypage-app">
      <Topbar />

      <main className="mypage-container">
        <section className="mypage-card">
          <div className="mypage-header">
            <h1>마이페이지</h1>
            <p>내 정보와 라이엇 연동 상태를 확인할 수 있습니다.</p>
          </div>

          {loading ? (
            <div className="mypage-loading">불러오는 중...</div>
          ) : (
            <div className="mypage-content">
              <div className="profile-section">
                <div className="profile-avatar">{nickname.charAt(0)}</div>

                <div className="profile-info">
                  <div className="info-row">
                    <span className="info-label">닉네임</span>
                    <span className="info-value">{nickname}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">근자감 포인트</span>
                    <span className="info-value confidence-text">
                      🤡 {confidence.toLocaleString()}
                    </span>
                  </div>

                  <div className="info-row">
  <span className="info-label">라이엇 연동</span>
  {isRiotLinked ? (
    <span className="info-value riot-nickname">
      ✅ 연동 완료
    </span>
  ) : (
    <span className="info-value link-status unlinked">
      연동 안됨
    </span>
  )}
</div>
                </div>
              </div>

              <div className="tier-section">
                <h2>티어 정보</h2>

                {isRiotLinked ? (
                  <div className="tier-card">
                    <img
                      src={tierImage}
                      alt={`${tierName} 티어`}
                      className="tier-image"
                    />
                    <div className="tier-name">{tierName}</div>
                  </div>
                ) : (
                  <div className="tier-empty">
                    라이엇 연동 후 티어 정보를 확인할 수 있습니다.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Mypage;