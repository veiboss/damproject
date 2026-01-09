import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ChatWidget from "../components/ChatWidget.jsx";

// 더미: 나중에 여기만 DB API 호출로 바꾸면 됨
async function fetchPredictionFromDbExample(studentId, year) {
  await new Promise((r) => setTimeout(r, 200));
  return {
    studentId,
    year,
    weakCourse: "통계학2", // 임시
  };
}

export default function ResultPage({ faqMap }) {
  const nav = useNavigate();
  const { state } = useLocation();

  // state가 없을 때(새로고침, 직접 /result 접속 등)도 터지지 않게 방어
  const studentId = state?.studentId ?? "";
  const year = state?.year ?? "1";

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchPredictionFromDbExample(studentId, year);
        if (alive) setResult(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [studentId, year]);

  // state가 아예 없으면 안내 화면 띄우기
  if (!state) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-lg">결과 페이지</div>
          <div className="text-sm opacity-70 mt-2">
            입력 정보가 없어서 결과를 표시할 수 없습니다. 입력 화면에서 제출 후 이동해주세요.
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
    <div className="h-screen overflow-hidden">
      <div className="h-full flex flex-col gap-4 p-4 sm:p-6">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between">
          <div className="text-lg opacity-90">Suwon UNIV AI</div>
          <button
            onClick={() => nav("/")}
            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15"
          >
            입력 화면
          </button>
        </div>

        {/* 결과 카드 */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm opacity-70 mb-2">
            학번 {studentId} , {year}학년 기준
          </div>

          <div className="text-2xl sm:text-3xl">
            내가 약한 과목은{" "}
            <span className="text-yellow-300">
              {loading ? "불러오는 중" : result?.weakCourse ?? "없음"}
            </span>{" "}
            이다
          </div>

          <div className="text-xs opacity-60 mt-2">
            현재는 더미 데이터이며, 나중에 MariaDB 조회 API로 바로 교체하면 됩니다
          </div>
        </div>

        {/* 여기 중요: min-h-0 이 있어야 내부 스크롤이 제대로 됨 */}
        <div className="flex-1 min-h-0 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <ChatWidget
            variant="embedded"
            faqMap={faqMap}
            latestResult={{
              studentId,
              year,
              부족할과목: result?.weakCourse ?? null,
            }}
          />
        </div>
      </div>
    </div>
  );
}
