import "./UploadPage.css";
import "./App.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar";

function UploadPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
<Topbar />
  const [form, setForm] = useState({
    youtubeLink: "",
    startTime: "",
    endTime: "",
    champion1: "",
    champion2: "",
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
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

    console.log("업로드 데이터:", form);
    alert("업로드 정보가 저장되었습니다!");

    setForm({
      youtubeLink: "",
      startTime: "",
      endTime: "",
      champion1: "",
      champion2: "",
    });

    closeModal();
  };


  
  return (
    <div className="app">
        <Topbar />
      <div className="upload-content">
        <div className="upload-card">
          <h2>분석할 영상을 등록하세요</h2>
          <p>로그인한 사용자만 업로드할 수 있습니다.</p>

          <button className="open-upload-btn" onClick={openModal}>
            업로드
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>영상 업로드 정보 입력</h3>
              <button className="close-btn" onClick={closeModal}>
                ✕
              </button>
            </div>

            <form className="upload-form" onSubmit={handleSubmit}>
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
                챔피언 1 (본인)
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
                등록하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadPage;