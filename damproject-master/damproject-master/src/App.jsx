import React, { useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import MainForm from "./components/MainForm";
import ResultPage from "./pages/ResultPage";
// 챗봇을 쓰기 위해 임포트
import ChatWidget from "./components/ChatWidget";

// [1] FAQ 데이터
const FAQ_MAP = {
  "왜 이 과목이 부족하다고 나와?": "입력한 성적과 학년 기준으로 부족 과목 후보를 계산합니다.",
  "미수강은 어떻게 처리돼?": "미수강은 0점으로 처리되어 저장하고 모델에서 별도 처리합니다.",
  "성적을 수정하면 바로 반영돼?": "수정 저장 후 다시 예측을 돌려 최신 결과로 갱신합니다.",
  "학년은 왜 필요해?": "학년에 따라 권장 이수 과목과 기준이 달라져서입니다.",
  "내 데이터는 어디에 저장돼?": "MariaDB에 저장됩니다.",
};

// [2] 홈 화면 (입력 폼 + 플로팅 챗봇)
function HomeRoute() {
  const navigate = useNavigate();

  const handleSubmit = async (payload) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`서버 에러: ${response.status}`);
      }

      const result = await response.json();

      // 결과 페이지로 이동하며 데이터 전달
      navigate("/result", { 
        state: { 
          result: result,      // 예측 결과
          inputPayload: payload // 입력했던 데이터
        } 
      });

    } catch (error) {
      console.error("에러 발생:", error);
      alert("서버와 연결할 수 없습니다. 백엔드 실행 여부를 확인");
    }
  };

  return (
    <div className="flex flex-col items-center">
        {/* 헤더 */}
        <header className="flex items-center justify-between w-full mb-8">
            <div className="text-sm opacity-80">Suwon UNIV AI</div>
            <button className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-xs">
            사용 가이드
            </button>
        </header>

        {/* 메인 카드 */}
        <div className="w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-yellow-200/20 border border-yellow-200/30 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                </div>
                <div className="flex-1">
                    <div className="inline-block px-4 py-3 rounded-2xl bg-white text-slate-900 max-w-2xl">
                    안녕하세요. 학번, 학년, 과목 성적을 입력하면 예측 결과를 알려드릴게요.
                    </div>
                </div>
            </div>
            
            <MainForm onSubmit={handleSubmit} />
        </div>

        {/*홈 화면용 챗봇 (결과 보기 전에도 질문 가능) */}
        <ChatWidget faqMap={FAQ_MAP} variant="floating" />
    </div>
  );
}

// 3. 결과 화면
function ResultRouteWrapper() {
  return (
    // FAQ 데이터만 넘겨줌
    <ResultPage faqMap={FAQ_MAP} />
  );
}

// [4] 메인 App
export default function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-rose-950 text-white">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 max-w-screen-xl 2xl:max-w-screen-2xl">
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/result" element={<ResultRouteWrapper />} />
        </Routes>
      </div>
    </div>
  );
}