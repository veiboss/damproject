import React, { useEffect, useMemo, useRef, useState } from "react";

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

  const faqList = useMemo(() => Object.keys(faqMap), [faqMap]);

  const push = (msg) => setMessages((prev) => [...prev, msg]);

  // 메시지 영역 드래그 스크롤 (마우스 + 터치 모두)
  const msgRef = useRef(null);
  const msgDragRef = useRef({ down: false, startY: 0, scrollTop: 0 });

  const onMsgPointerDown = (e) => {
    if (!msgRef.current) return;

    msgDragRef.current.down = true;
    msgDragRef.current.startY = e.clientY;
    msgDragRef.current.scrollTop = msgRef.current.scrollTop;

    try {
      msgRef.current.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const onMsgPointerMove = (e) => {
    if (!msgDragRef.current.down || !msgRef.current) return;

    const walk = e.clientY - msgDragRef.current.startY;
    msgRef.current.scrollTop = msgDragRef.current.scrollTop - walk;
  };

  const onMsgPointerUp = (e) => {
    msgDragRef.current.down = false;

    try {
      if (msgRef.current) msgRef.current.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  const answerFromDb = (question) => {
    if (!latestResult) return null;

    const q = String(question || "").replace(/\s+/g, "");
    if (q.includes("예측") || q.includes("결과")) {
      return `최신 예측 결과: 부족할 과목은 ${latestResult.부족할과목 ?? "없음"} 입니다.`;
    }
    if (q.includes("학번")) {
      return `저장된 학번: ${latestResult.studentId ?? "없음"} 입니다.`;
    }
    return null;
  };

  const handleSend = async (text) => {
    const trimmed = (text || "").trim();
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

    // 3) AI 더미
    push({
      role: "assistant",
      text: "지금은 백엔드 연결 전이라 AI 더미 답변입니다. 다음 단계에서 실제 AI로 연결할게요.",
      source: "ai",
    });
  };

  const panel = (
    <div
      className={[
        isEmbedded
          ? "w-full h-full"
          : "absolute right-4 sm:right-6 bottom-24 w-[92vw] sm:w-[420px] h-[78vh] max-h-[78vh]",
        "rounded-2xl border border-white/10 bg-slate-950/90 backdrop-blur shadow-2xl overflow-hidden flex flex-col",
      ].join(" ")}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="text-sm">AI 채팅</div>
        {!isEmbedded && (
          <button
            className="text-xs px-3 py-2 rounded-md bg-white/10 hover:bg-white/15"
            onClick={() => setOpen(false)}
          >
            닫기
          </button>
        )}
      </div>

      {/* FAQ */}
      <div className="px-4 py-3 border-b border-white/10">
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
          <div className="max-h-40 sm:max-h-48 overflow-y-auto pr-1 space-y-2">
            {faqList.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="w-full text-left text-sm px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {faqOpen && (
          <div className="text-[11px] opacity-60 mt-2">
            위아래로 스크롤해서 질문을 선택할 수 있어요
          </div>
        )}
      </div>

      {/* 메시지 영역: 채팅 박스 안에서만 드래그 스크롤 */}
      <div
        ref={msgRef}
        onPointerDown={onMsgPointerDown}
        onPointerMove={onMsgPointerMove}
        onPointerUp={onMsgPointerUp}
        onPointerCancel={onMsgPointerUp}
        className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        {messages.map((m, idx) => (
          <MessageBubble key={idx} msg={m} />
        ))}
      </div>

      {/* 입력창 */}
      <div className="p-3 border-t border-white/10 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="예: 내 예측 결과가 뭐야?"
          className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/10 outline-none focus:ring-2 focus:ring-white/20 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend(input);
          }}
        />
        <button
          onClick={() => handleSend(input)}
          className="px-4 py-2 rounded-xl bg-yellow-300 text-slate-900 text-sm hover:bg-yellow-200"
        >
          전송
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* floating 모드 버튼 */}
      {!isEmbedded && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-6 bottom-6 w-14 h-14 rounded-full bg-white text-slate-900 shadow-2xl hover:scale-105 transition flex items-center justify-center"
          aria-label="chat"
        >
          💬
        </button>
      )}

      {/* embedded 모드는 항상 panel */}
      {isEmbedded && panel}

      {/* floating 모드 모달 */}
      {!isEmbedded && open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          {panel}
        </div>
      )}
    </>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const label =
    msg.source === "faq"
      ? "고정 답변"
      : msg.source === "ai"
      ? "AI 답변"
      : msg.source === "db"
      ? "DB 답변"
      : "";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm border",
          isUser ? "bg-white text-slate-900 border-white" : "bg-white/10 border-white/10",
        ].join(" ")}
      >
        {label && <div className="text-[10px] opacity-70 mb-1">{label}</div>}
        <div>{msg.text}</div>
      </div>
    </div>
  );
}
