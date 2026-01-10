import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWidget from "../components/ChatWidget.jsx";

export default function ResultPage({ faqMap }) {
  const nav = useNavigate();
  const { state } = useLocation();

  // 1. App.jsx에서 넘겨준 파이썬 결과 데이터
  const apiResult = state?.result;

  const studentId = apiResult?.studentId || state?.studentId || "";
  const year = apiResult?.year || state?.year || "1";

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (apiResult) {
      setResult({
        weakCourse: apiResult.부족할과목, 
        futureRisk: apiResult.위험할미래과목,
        recommendations: apiResult.recommendations, // 추천 자료 리스트
        prediction_text: apiResult.prediction_text
      });
      setLoading(false); 
    } else {
      setLoading(false);
    }
  }, [apiResult]);

  // 데이터가 없을 때 안내 화면
  if (!state) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg">결과 페이지</div>
          <div className="text-sm opacity-70 mt-2">
            입력 정보가 없어서 결과를 표시할 수 없습니다.
          </div>
          <button
            onClick={() => nav("/")}
            className="mt-4 px-4 py-2 rounded-xl bg-yellow-300 text-slate-900 hover:bg-yellow-200"
          >
            입력 화면으로
          </button>
        </div>
      </div>
    );
  }

  return (
    // 전체 화면 높이 고정 (스크롤은 내부에서)
    <div className="h-screen overflow-hidden flex flex-col p-4 sm:p-6 gap-4">
      
      {/* 1. 상단 헤더 */}
      <div className="flex items-center justify-between shrink-0">
        <div className="text-lg opacity-90">Suwon UNIV AI</div>
        <button
          onClick={() => nav("/")}
          className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 transition"
        >
          입력 화면
        </button>
      </div>

    {/* 2. 결과 카드 영역 [스크롤 가능하게 변경] */}
    <div className="shrink-0 space-y-3 overflow-y-auto max-h-[30vh] pr-1">

      {/* 2. 결과 카드 (위쪽 영역) */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shrink-0">
        <div className="text-sm opacity-70 mb-2">
          학번 {studentId} , {year}학년 기준
        </div>

        <div className="text-2xl sm:text-3xl">
          내가 약한 과목은{" "}
          <span className="text-yellow-300 font-bold">
            {loading ? "분석 중..." : result?.weakCourse ?? "없음"}
          </span>{" "}
          입니다
        </div>
    </div>

    {/* (2) 위험 경고 (빨간 박스) */}
        {result?.futureRisk && result.futureRisk !== "없음" && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🚨</span>
              <div className="text-sm text-red-200 font-semibold">수강 위험 경보</div>
            </div>
            <div className="text-lg sm:text-xl text-red-100">
               앞으로 <span className="font-bold underline decoration-red-400 decoration-2 underline-offset-4">
                {result.futureRisk}
              </span> 수업이 매우 힘들어집니다!
            </div>
          </div>
        )}

        {/* (3) [추가] 상세 조언 카드 리스트 */}
        {result?.recommendations?.map((rec, idx) => (
          <a 
            key={idx} 
            href={rec.url} 
            target="_blank" 
            rel="noreferrer"
            className="block p-4 rounded-xl border border-indigo-400/30 bg-indigo-900/40 hover:bg-indigo-800/60 transition group"
          >
            <div className="flex justify-between items-start">
              <div className="font-bold text-indigo-100 mb-1 group-hover:text-white">
                {rec.title}
              </div>
              <div className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-2 py-1 rounded">
                🔗 바로가기
              </div>
            </div>
            <div className="text-sm opacity-70 text-gray-300 mt-1">
              {rec.desc}
            </div>
          </a>
        ))}

        {/* (4) 하단 코멘트 */}
        <div className="text-xs opacity-60 px-1 pt-1">
          {result?.prediction_text ? `📢 ${result.prediction_text}` : ""}
        </div>
      </div>

      {/* 3. 챗봇 영역*/}
      {/* flex-1: 남은 공간 모두 차지, min-h-0: 내부 스크롤을 위해 필수 */}
      <div className="flex-1 min-h-0 relative border-t border-white/5 pt-2">
        <ChatWidget
          variant="embedded"  // 박스 형태로 삽입
          faqMap={faqMap}
          latestResult={{
            studentId,
            year,
            부족할과목: result?.weakCourse ?? null,
            위험할미래과목: result?.futureRisk ?? null, // 챗봇에게도 전달
            prediction: apiResult?.prediction ?? 0 // 백엔드에 전달할 예측값
          }}
        />
      </div>
    </div>
  );
}