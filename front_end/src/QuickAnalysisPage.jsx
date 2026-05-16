import "./QuickAnalysisPage.css";
import { useState } from "react";
import Topbar from "./Topbar.jsx";

const BASE = "http://localhost:8000";

function QuickAnalysisPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [form, setForm] = useState({
    youtubeLink: "",
    title: "",
    startTime: "",
    endTime: "",
    champion1: "",
    champion2: "",
  });

  const openModal = () => {
    setIsModalOpen(true);
    setAnalysisResult(null); // 새 분석 시 이전 결과 초기화
  };
  
  const closeModal = () => { if (!loading) setIsModalOpen(false); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const timeToSeconds = (timeStr) => {
    if (!timeStr || !timeStr.includes(":")) return parseInt(timeStr) || 0;
    const [min, sec] = timeStr.split(":").map(Number);
    return (min || 0) * 60 + (sec || 0);
  };

  // AI 분석 완료 여부를 확인하는 폴링 함수
  const pollAnalysisResult = async (caseId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${BASE}/cases/${caseId}`);
        const data = await response.json();

        // ai_opinion이 기본값이 아니면 분석 완료로 판단
        if (data.ai_opinion && data.ai_opinion !== "AI가 분석 중입니다..." && data.ai_opinion !== "") {
          clearInterval(interval);
          setAnalysisResult({
            summary: data.ai_opinion,
            champion1: data.champion_a,
            champion2: data.champion_b,
            percent1: data.ai_score_a,
            percent2: data.ai_score_b,
            conclusion: data.ai_score_a > data.ai_score_b 
              ? `${data.champion_a}의 과실이 더 높습니다.` 
              : `${data.champion_b}의 과실이 더 높습니다.`,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error("결과 확인 중 오류:", error);
      }
    }, 2000); // 2초마다 확인
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestData = {
        user_id: 1,
        title: form.title,
        video_url: form.youtubeLink,
        champion_a: form.champion1,
        champion_b: form.champion2,
        start_time: timeToSeconds(form.startTime),
        end_time: timeToSeconds(form.endTime),
        is_lol_video: true,
        ai_opinion: "AI가 분석 중입니다..."
      };

      const response = await fetch(`${BASE}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error("서버 요청 실패");

      setIsModalOpen(false); // 입력창 닫기
      pollAnalysisResult(data.case_id); // 실시간 감시 시작

    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Topbar />
      <div className="quick-analysis-page">
        <div className="quick-analysis-card">
          <h1>빠른 AI 분석</h1>
          <p>시간대를 지정하여 AI 판사에게 정밀 분석을 의뢰하세요.</p>
          <button className="open-analysis-btn" onClick={openModal} disabled={loading}>
            {loading ? "AI 판결 대기 중..." : "AI 분석 시작하기"}
          </button>
        </div>

        {/* 결과 카드 섹션 */}
        {analysisResult && (
          <div className="analysis-result-card">
            <h2>AI 분석 결과</h2>
            <div className="result-video-title">{form.title}</div>
            
            <p className="result-summary">{analysisResult.summary}</p>

            <div className="result-bars">
              <div className="result-side">
                <div className="result-name">{analysisResult.champion1}</div>
                <div className="result-percent">책임도 {analysisResult.percent1}%</div>
              </div>
              <div className="result-side">
                <div className="result-name">{analysisResult.champion2}</div>
                <div className="result-percent">책임도 {analysisResult.percent2}%</div>
              </div>
            </div>

            <div className="result-conclusion">{analysisResult.conclusion}</div>
            <button className="reanalyze-btn" onClick={openModal}>다시 분석하기</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="analysis-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>AI 분석 의뢰서</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <form className="analysis-form" onSubmit={handleAnalyze}>
              <label>유튜브 링크
                <input type="text" name="youtubeLink" value={form.youtubeLink} onChange={handleChange} placeholder="ex) https://www.youtube.com/watch?v=..." required />
              </label>
              <label>사건 제목
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="ex) 미드 정글 주먹다짐 누가 잘못인가요?" required />
              </label>

              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ flex: 1 }}>시작 시간
                  <input type="text" name="startTime" value={form.startTime} onChange={handleChange} placeholder="ex) 01:20" required />
                </label>
                <label style={{ flex: 1 }}>종료 시간
                  <input type="text" name="endTime" value={form.endTime} onChange={handleChange} placeholder="ex) 02:10" required />
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <label style={{ flex: 1 }}>챔피언 1 (본인)
                  <input type="text" name="champion1" value={form.champion1} onChange={handleChange} placeholder="ex) 리신" required />
                </label>
                <label style={{ flex: 1 }}>챔피언 2 (상대)
                  <input type="text" name="champion2" value={form.champion2} onChange={handleChange} placeholder="ex) 야스오" required />
                </label>
              </div>

              <button type="submit" className="submit-btn">분석 시작</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickAnalysisPage;
