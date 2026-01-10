import React, { useMemo, useRef, useState, useEffect } from "react";

export default function ChatWidget({ faqMap = {}, latestResult, variant = "floating" }) {
  const isEmbedded = variant === "embedded";

  const [open, setOpen] = useState(isEmbedded);
  const [faqOpen, setFaqOpen] = useState(true);

  useEffect(() => {
    if (isEmbedded) setOpen(true);
  }, [isEmbedded]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => [
    { role: "assistant", text: "질문을 입력하거나 자주 묻는 질문을 눌러주세요.", source: "system" },
  ]);

  const faqList = useMemo(() => (faqMap ? Object.keys(faqMap) : []), [faqMap]);
  
  const push = (msg) => setMessages((prev) => [...prev, msg]);

 // 메시지 영역 드래그 스크롤
  const faqRef = useRef(null);
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0 });

  const onFaqMouseDown = (e) => {
    if (!faqRef.current) return;
    dragRef.current.down = true;
    dragRef.current.startX = e.pageX;
    dragRef.current.scrollLeft = faqRef.current.scrollLeft;
  };
  const onFaqMouseUp = () => { dragRef.current.down = false; };
  const onFaqMouseLeave = () => { dragRef.current.down = false; };
  const onFaqMouseMove = (e) => {
    if (!dragRef.current.down || !faqRef.current) return;
    e.preventDefault();
    const walk = e.pageX - dragRef.current.startX;
    faqRef.current.scrollLeft = dragRef.current.scrollLeft - walk;
  };

  // --- [답변 로직] ---
  const answerFromDb = (question) => {
    if (!latestResult) return null;
    const q = question.replace(/\s+/g, "");
    
    if (q.includes("예측") || q.includes("결과")) {
      return `최신 예측 결과: 부족할 과목은 ${latestResult?.부족할과목 ?? "정보 없음"} 입니다.`;
    }
    if (q.includes("학번")) {
      return `저장된 학번: ${latestResult?.studentId ?? "정보 없음"} 입니다.`;
    }
    return null;
  };

  const handleSend = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    push({ role: "user", text: trimmed });
    setInput("");

    // 1) FAQ 고정 답변
    if (faqMap[trimmed]) {
      push({ role: "assistant", text: faqMap[trimmed], source: "faq" });
      return;
    }

    // 2) DB 기반 답변
    const dbAnswer = answerFromDb(trimmed);
    if (dbAnswer) {
      push({ role: "assistant", text: dbAnswer, source: "db" });
      return;
    }

    // 3) AI 서버 연결
    try {
      const payload = {
        message: trimmed,
        context: latestResult // AI에게 예측 결과 전달
      };

      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("서버 응답 에러");
      }

      const data = await response.json();
      
      push({
        role: "assistant", text: data.response, source: "ai",});

    } catch (error) {
      console.error("채팅 에러:", error);
      push({
        role: "assistant", text: "죄송합니다. AI 서버와 연결할 수 없습니다.", source: "error",});
    }
  };

  // --- [UI: 채팅창 패널] ---
  const chatPanel = (
    <div
      className={[
        isEmbedded ? "w-full h-full relative" : "absolute right-4 sm:right-6 bottom-24 w-[92vw] sm:w-[420px] h-[78vh] max-h-[78vh]",
        "rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur shadow-2xl overflow-hidden flex flex-col",
      ].join(" ")}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="text-sm font-semibold">AI 채팅</div>
        {!isEmbedded && (
          <button
            className="text-xs px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 transition"
            onClick={() => setOpen(false)}
          >
            닫기
          </button>
        )}
      </div>

      {/* FAQ 영역 */}
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs opacity-80">자주 묻는 질문</div>
          <button
            onClick={() => setFaqOpen((v) => !v)}
            className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/15"
          >
            {faqOpen ? "접기" : "펼치기"}
          </button>
        </div>

        {faqOpen && (
          <div 
            className="max-h-40 sm:max-h-48 overflow-y-auto pr-1 space-y-2 no-scrollbar cursor-grab active:cursor-grabbing"
            ref={faqRef}
            onMouseDown={onFaqMouseDown}
            onMouseUp={onFaqMouseUp}
            onMouseLeave={onFaqMouseLeave}
            onMouseMove={onFaqMouseMove}
          >
            {faqList.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="w-full text-left text-sm px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m, idx) => (
          <MessageBubble key={idx} msg={m} />
        ))}
      </div>

      {/* 입력창 */}
      <div className="p-3 border-t border-white/10 flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={latestResult ? "궁금한 점을 물어보세요" : "질문을 입력하세요..."}
          className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/10 outline-none focus:ring-2 focus:ring-white/20 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend(input);
          }}
        />
        <button
          onClick={() => handleSend(input)}
          className="px-4 py-2 rounded-xl bg-yellow-300 text-slate-900 text-sm hover:bg-yellow-200 font-bold"
        >
          전송
        </button>
      </div>
    </div>
  );

  // --- [렌더링] ---
  if (isEmbedded) {
    return chatPanel;
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-white text-slate-900 shadow-2xl hover:scale-105 transition flex items-center justify-center z-50"
          aria-label="chat"
        >
          💬
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          {chatPanel}
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const label =
    msg.source === "faq" ? "고정 답변" : msg.source === "ai" ? "AI 답변" : msg.source === "db" ? "DB 답변" : "";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm border",
          isUser ? "bg-white text-slate-900 border-white" : "bg-white/10 border-white/10",
        ].join(" ")}
      >
        {label && <div className="text-[10px] opacity-70 mb-1">{label}</div>}
        <div className="whitespace-pre-wrap">{msg.text}</div>
      </div>
    </div>
  );
}