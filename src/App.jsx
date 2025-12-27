import React, { useMemo, useState } from "react";
import MainForm from "./components/MainForm";
import ChatWidget from "./components/ChatWidget";

export default function App() {
  const [latestResult, setLatestResult] = useState(null);

  const faqMap = useMemo(() => {
    return {
      "내 예측 결과가 뭐야?": "저장된 최신 예측 결과를 보여줄게요. (백엔드 연동 전이라 더미 응답입니다)",
      "왜 이 과목이 부족하다고 나와?": "입력한 성적과 학년 기준으로 부족 과목 후보를 계산합니다. (백엔드 연동 전)",
      "미수강은 어떻게 처리돼?": "미수강은 결측값으로 저장하고 모델에서 별도 처리합니다. (백엔드 연동 전)",
      "성적을 수정하면 바로 반영돼?": "수정 저장 후 다시 예측을 돌려 최신 결과로 갱신합니다. (백엔드 연동 전)",
      "학년은 왜 필요해?": "학년에 따라 권장 이수 과목과 기준이 달라져서입니다. (백엔드 연동 전)",
      "내 데이터는 어디에 저장돼?": "MariaDB에 저장됩니다. (백엔드 연동 전)",
    };
  }, []);

  const handleSubmit = async (payload) => {
    // 2단계에서 여기서 Spring Boot API 호출로 바꿀 예정
    // 지금은 화면 확인용 더미 결과만 만들어 둠
    const dummy = {
      studentId: payload.studentId,
      year: payload.year,
      부족할과목: "예시과목A",
      createdAt: new Date().toISOString(),
    };
    setLatestResult(dummy);
    return dummy;
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-950 via-indigo-950 to-rose-950">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 py-10 max-w-screen-xl 2xl:max-w-screen-2xl">
        <header className="flex items-center justify-between mb-8">
          <div className="text-sm opacity-80">Suwon UNIV AI</div>
          <button className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-xs">
            사용 가이드
          </button>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-yellow-200/20 border border-yellow-200/30 flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div className="flex-1">
              <div className="inline-block px-4 py-3 rounded-2xl bg-white text-slate-900 max-w-2xl">
                안녕하세요. 학번, 학년, 과목 성적을 입력하면 예측 결과를 알려드릴게요.
              </div>
              <div className="mt-2 text-xs opacity-70">
                제출 후 우측 하단 채팅을 눌러 결과를 질문할 수 있어요.
              </div>
            </div>
          </div>

          <MainForm onSubmit={handleSubmit} />
        </div>

        <ChatWidget faqMap={faqMap} latestResult={latestResult} />
      </div>
    </div>
  );
}
