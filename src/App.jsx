import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import MainForm from "./components/MainForm.jsx";
import ResultPage from "./pages/ResultPage.jsx";

const FAQ_MAP = {
  "내 예측 결과가 뭐야?": "제출한 성적을 기준으로 부족할 과목을 예측합니다. (백엔드 연동 전)",
  "왜 이 과목이 부족하다고 나와?": "학년과 과목 성적 패턴을 기반으로 부족 과목 후보를 추정합니다. (백엔드 연동 전)",
  "미수강은 어떻게 처리돼?": "미수강은 해당 과목을 아직 듣지 않은 상태로 저장됩니다. (백엔드 연동 전)",
  "성적을 수정하면 바로 반영돼?": "수정 후 다시 제출하면 최신 값으로 다시 예측합니다. (백엔드 연동 전)",
  "학년은 왜 필요해?": "학년에 따라 권장 이수 과목과 기준이 달라집니다. (백엔드 연동 전)",
  "내 데이터는 어디에 저장돼?": "MariaDB에 저장됩니다. (백엔드 연동 전)",
};

function HomeRoute() {
  const navigate = useNavigate();

  const handleSubmitAndGoResult = async (payload) => {
    // 나중에 여기서 SpringBoot로 저장 요청을 하면 됨
    // await fetch("/api/grades", { method:"POST", headers:{...}, body: JSON.stringify(payload) })

    // 결과 페이지로 이동
    // state로 학번과 학년을 넘겨서 결과 페이지에서 바로 조회 가능하게 함
    navigate("/result", {
      state: {
        studentId: payload.studentId,
        year: payload.year,
      },
    });
  };

  return <MainForm onSubmit={handleSubmitAndGoResult} />;
}

export default function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-rose-950 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-10 max-w-screen-2xl mx-auto">
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/result" element={<ResultPage faqMap={FAQ_MAP} />} />
        </Routes>
      </div>
    </div>
  );
}
