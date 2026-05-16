import "./QuickAnalysisPage.css";
<<<<<<< Updated upstream
import { useState } from "react";
import { useNavigate } from "react-router-dom";
=======
import { useState, useEffect } from "react";
>>>>>>> Stashed changes
import Topbar from "./Topbar.jsx";

function QuickAnalysisPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
<<<<<<< Updated upstream
=======
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [pollingCaseId, setPollingCaseId] = useState(null); // ✅ 추가
>>>>>>> Stashed changes

  const [form, setForm] = useState({
    youtubeLink: "",
    title: "",
    startTime: "",
    endTime: "",
    champion1: "",
    champion2: "",
  });

<<<<<<< Updated upstream
  const [analysisResult, setAnalysisResult] = useState(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
=======
  const openModal = () => {
    setIsModalOpen(true);
    setAnalysisResult(null);
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

  // ✅ setInterval → useEffect로 변경 (페이지 이탈 시 자동 정리)
  useEffect(() => {
    if (!pollingCaseId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${BASE}/cases/${pollingCaseId}`);
        const data = await response.json();

        if (data.ai_opinion && data.ai_opinion !== "") {
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
          setPollingCaseId(null);
        }
      } catch (error) {
        clearInterval(interval);
        console.error("결과 확인 중 오류:", error);
        setLoading(false);
      }
    }, 2000);

    return () => clearInterval(interval); // ✅ 페이지 이탈 시 자동 정리
  }, [pollingCaseId]);
>>>>>>> Stashed changes

  const handleAnalyze = async (e) => {
    e.preventDefault();

    if (
      !form.youtubeLink ||
      !form.title ||
      !form.startTime ||
      !form.endTime ||
      !form.champion1 ||
      !form.champion2
    ) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    const token = localStorage.getItem("token");
    const userId = token ? JSON.parse(atob(token.split(".")[1])).user_id : 1;

    try {
<<<<<<< Updated upstream
      // 나중에 백엔드 연결할 자리
      // const response = await fetch("http://localhost:8080/api/ai/analyze", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });
      // const data = await response.json();

      // 임시 더미 결과
      const data = {
        summary: `${form.champion2}의 포지셔닝 실수가 더 치명적이었습니다.`,
        champion1: form.champion1,
        champion2: form.champion2,
        percent1: 28,
        percent2: 72,
        conclusion: `${form.champion2}의 책임도가 더 높습니다.`,
      };

      setAnalysisResult(data);
      closeModal();
=======
      const requestData = {
        user_id: userId,
        title: form.title,
        video_url: form.youtubeLink,
        champion_a: form.champion1,
        champion_b: form.champion2,
        start_time: timeToSeconds(form.startTime),
        end_time: timeToSeconds(form.endTime),
        is_lol_video: true,
        ai_score_a: 50,
        ai_score_b: 50,
        ai_opinion: "",
      };

      const response = await fetch(`${BASE}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error("서버 요청 실패");

      setIsModalOpen(false);
      setPollingCaseId(data.case_id); // ✅ 변경
>>>>>>> Stashed changes
    } catch (error) {
      console.error(error);
      alert("AI 분석 요청 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="app">
      <Topbar />

      <div className="quick-analysis-page">
        <div className="quick-analysis-card">
          <h1>빠른 AI 분석</h1>
          <p>업로드 없이 바로 분석 결과를 확인할 수 있습니다.</p>

          <button className="open-analysis-btn" onClick={openModal}>
            AI 분석 받기
          </button>
        </div>

        {analysisResult && (
          <div className="analysis-result-card">
            <h2>AI 분석 결과</h2>

            <div className="result-video-title">{form.title}</div>
<<<<<<< Updated upstream
            <div className="result-meta">
              <span>{form.champion1}</span>
              <span className="vs-text">VS</span>
              <span>{form.champion2}</span>
            </div>

=======
>>>>>>> Stashed changes
            <p className="result-summary">{analysisResult.summary}</p>
            <div className="result-bars">
              <div className="result-side">
                <div className="result-name">{analysisResult.champion1}</div>
                <div className="result-percent">
                  책임도 {analysisResult.percent1}%
                </div>
              </div>

              <div className="result-side">
                <div className="result-name">{analysisResult.champion2}</div>
                <div className="result-percent">
                  책임도 {analysisResult.percent2}%
                </div>
              </div>
            </div>
<<<<<<< Updated upstream

            <div className="result-conclusion">
              {analysisResult.conclusion}
            </div>

            <button
              className="reanalyze-btn"
              onClick={() => setIsModalOpen(true)}
            >
              다시 분석하기
            </button>
=======
            <div className="result-conclusion">{analysisResult.conclusion}</div>
            <button className="reanalyze-btn" onClick={openModal}>다시 분석하기</button>
>>>>>>> Stashed changes
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="analysis-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>AI 분석 정보 입력</h3>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="analysis-form" onSubmit={handleAnalyze}>
              <label>
                유튜브 링크
                <input
                  type="text"
                  name="youtubeLink"
                  value={form.youtubeLink}
                  onChange={handleChange}
                  placeholder="https://www.youtube.com/..."
                />
              </label>
<<<<<<< Updated upstream

              <label>
                영상 제목
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="예: 진 vs 쓰레쉬, 누가 더 못했나요?"
                />
              </label>

              <label>
                시작 시간
                <input
                  type="text"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  placeholder="예: 01:20"
                />
              </label>

              <label>
                끝 시간
                <input
                  type="text"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  placeholder="예: 02:10"
                />
              </label>

              <label>
                챔피언 1
                <input
                  type="text"
                  name="champion1"
                  value={form.champion1}
                  onChange={handleChange}
                  placeholder="예: 진"
                />
              </label>

              <label>
                챔피언 2
                <input
                  type="text"
                  name="champion2"
                  value={form.champion2}
                  onChange={handleChange}
                  placeholder="예: 쓰레쉬"
                />
              </label>

              <button type="submit" className="submit-btn">
                분석 시작
              </button>
=======
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
>>>>>>> Stashed changes
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickAnalysisPage;