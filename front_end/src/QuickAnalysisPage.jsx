import "./QuickAnalysisPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar.jsx";

function QuickAnalysisPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    youtubeLink: "",
    title: "",
    startTime: "",
    endTime: "",
    champion1: "",
    champion2: "",
  });

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

    try {
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
            <div className="result-meta">
              <span>{form.champion1}</span>
              <span className="vs-text">VS</span>
              <span>{form.champion2}</span>
            </div>

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

            <div className="result-conclusion">
              {analysisResult.conclusion}
            </div>

            <button
              className="reanalyze-btn"
              onClick={() => setIsModalOpen(true)}
            >
              다시 분석하기
            </button>
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuickAnalysisPage;