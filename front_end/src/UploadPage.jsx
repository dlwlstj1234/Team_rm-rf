import "./UploadPage.css";
import "./App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar";

const BASE = "http://localhost:8000";

// MM:SS → 초 변환
const timeToSeconds = (timeStr) => {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseInt(timeStr) || 0;
};

function UploadPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    youtubeLink: "",
    title: "",
    startTime: "",
    endTime: "",
    champion1: "",
    champion2: "",
  });

  const openModal = () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.youtubeLink || !form.title || !form.startTime || !form.endTime || !form.champion1 || !form.champion2) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  // ✅ 토큰에서 user_id 꺼내기 (백엔드 수정 없이!)
  const token = localStorage.getItem("token");
  if (!token) {
    alert("로그인이 필요합니다.");
    navigate("/login");
    return;
  }
  const payload = JSON.parse(atob(token.split(".")[1]));
  const userId = payload.user_id;

    const startSec = timeToSeconds(form.startTime);
    const endSec = timeToSeconds(form.endTime);

    if (startSec >= endSec) {
      alert("끝 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title: form.title,
          video_url: form.youtubeLink,
          champion_a: form.champion1,
          champion_b: form.champion2,
          start_time: startSec,
          end_time: endSec,
          is_lol_video: true,
          ai_score_a: 50,
          ai_score_b: 50,
          ai_opinion: "",
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        alert("등록 완료! AI가 영상을 분석 중입니다 🤖");
        setForm({ youtubeLink: "", title: "", startTime: "", endTime: "", champion1: "", champion2: "" });
        closeModal();
        window.location.href = "/";
      } else {
        alert(data.detail || "등록 중 오류가 발생했습니다.");
      }
    } catch (err) {
      console.error("업로드 실패:", err);
      alert("서버 연결에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <Topbar />
      <div className="upload-content">
        <div className="upload-card">
          <h2>분석할 영상을 등록하세요</h2>
          <p>로그인한 사용자만 업로드할 수 있습니다.</p>
          <button className="open-upload-btn" onClick={openModal}>업로드</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>영상 업로드 정보 입력</h3>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            <form className="upload-form" onSubmit={handleSubmit}>
              <label>유튜브 링크
                <input type="text" name="youtubeLink" value={form.youtubeLink} onChange={handleChange} placeholder="https://www.youtube.com/..." />
              </label>
              <label>영상 제목
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="예: 진 vs 쓰레쉬, 누가 더 못했나요?" />
              </label>
              <label>시작 시간
                <input type="text" name="startTime" value={form.startTime} onChange={handleChange} placeholder="예: 01:20" />
              </label>
              <label>끝 시간
                <input type="text" name="endTime" value={form.endTime} onChange={handleChange} placeholder="예: 02:10" />
              </label>
              <label>챔피언 1 (본인)
                <input type="text" name="champion1" value={form.champion1} onChange={handleChange} placeholder="예: 진" />
              </label>
              <label>챔피언 2
                <input type="text" name="champion2" value={form.champion2} onChange={handleChange} placeholder="예: 쓰레쉬" />
              </label>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "등록 중..." : "등록하기"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;