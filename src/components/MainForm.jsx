import React, { useMemo, useState } from "react";
import YearToggle from "./YearToggle";
import GradeRow from "./GradeRow";
import { COURSES } from "../data/courses";

export default function MainForm({ onSubmit }) {
  const gradeOptions = useMemo(
    () => ["A+", "A0", "B+", "B0", "C+", "C0", "D+", "D0", "F", "미수강"],
    []
  );

  const [studentId, setStudentId] = useState("");
  const [year, setYear] = useState("1");

  const [gradesByCourseNo, setGradesByCourseNo] = useState(() => {
    const init = {};
    COURSES.forEach((c) => (init[c.no] = "미수강"));
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleCourses = useMemo(() => {
    const y = Number(year);
    return COURSES.filter((c) => c.year === y);
  }, [year]);

  const sem1 = useMemo(
    () => visibleCourses.filter((c) => c.semester === 1),
    [visibleCourses]
  );
  const sem2 = useMemo(
    () => visibleCourses.filter((c) => c.semester === 2),
    [visibleCourses]
  );

  const canSubmit = studentId.trim().length > 0;

  const handleChangeGrade = (courseNo, value) => {
    setGradesByCourseNo((prev) => ({ ...prev, [courseNo]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    const y = Number(year);
    const payload = {
      studentId: Number(studentId),
      year: y,
      courses: COURSES.filter((c) => c.year === y).map((c) => ({
        courseNo: c.no,
        courseName: c.name,
        recYear: c.year,
        recSemester: c.semester,
        credits: c.credits,
        grade: gradesByCourseNo[c.no] ?? "미수강",
      })),
    };

    setIsSubmitting(true);
    try {
      await onSubmit(payload);
      // 여기서 alert/console.log는 빼라는 요구였으니 호출만
    } catch (e) {
      // 필요하면 상위에서 처리하거나, 여기서만 최소 처리
      alert("저장 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 학번 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-2">
          <LabelPill text="학번 입력" />
        </div>
        <div className="md:col-span-10">
          <input
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="학번을 입력하세요"
            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      {/* 학년 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-2">
          <LabelPill text="학년" />
        </div>
        <div className="md:col-span-10">
          <div className="w-full overflow-x-auto">
            <div className="inline-block min-w-max">
              <YearToggle value={year} onChange={setYear} />
            </div>
          </div>
        </div>
      </div>

      {/* 과목 리스트 카드 */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="text-sm opacity-80">{year}학년 과목 목록</div>
          <div className="text-xs opacity-60">
            스크롤 중에도 하단 제출 버튼이 고정됩니다
          </div>
        </div>

        {/* 스크롤 영역 (제출바는 밖으로 뺌) */}
        <div className="max-h-[calc(100vh-420px)] sm:max-h-[calc(100vh-380px)] overflow-y-auto overflow-x-hidden pr-0 md:pr-2 space-y-6">
          <SemesterSection
            title="1학기"
            courses={sem1}
            gradeOptions={gradeOptions}
            gradesByCourseNo={gradesByCourseNo}
            onChangeGrade={handleChangeGrade}
          />

          <SemesterSection
            title="2학기"
            courses={sem2}
            gradeOptions={gradeOptions}
            gradesByCourseNo={gradesByCourseNo}
            onChangeGrade={handleChangeGrade}
          />
        </div>

        {/* 제출 바: 정보 영역과 버튼을 분리 */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            {/* 왼쪽 정보 바 */}
            <div className="flex-1 bg-slate-950/60 backdrop-blur border border-white/10 rounded-xl px-4 py-3">
              <div className="text-xs opacity-80">
                학번 {studentId ? studentId : "미입력"} , {year}학년 과목 {visibleCourses.length}개
              </div>
            </div>

            {/* 오른쪽 제출 버튼(독립) */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={[
                "w-full sm:w-auto px-7 py-3 rounded-xl border font-semibold transition",
                "shadow-lg",
                !canSubmit || isSubmitting
                  ? "!bg-white/10 !text-white/50 !border-white/10 cursor-not-allowed"
                  : "!bg-yellow-300 !text-slate-900 !border-yellow-300 hover:!bg-yellow-200",
              ].join(" ")}
            >
              {isSubmitting ? "저장 중" : "제출"}
            </button>
          </div>

        </div>
      </div>
  );
}

function SemesterSection({
  title,
  courses,
  gradeOptions,
  gradesByCourseNo,
  onChangeGrade,
}) {
  if (!courses || courses.length === 0) {
    return (
      <div>
        <div className="text-xs opacity-70 mb-2">{title}</div>
        <div className="text-xs opacity-60">해당 학기 과목이 없습니다</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs opacity-70">{title}</div>

      {courses.map((c) => (
        <div
          key={c.no}
          className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start"
        >
          {/* 과목 카드 */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="rounded-xl bg-sky-400/15 border border-sky-300/20 px-3 py-3">
              <div className="text-sm">{c.name}</div>
              <div className="text-[11px] opacity-70 mt-1">
                과목번호 {c.no} , 학점 {c.credits}
              </div>
            </div>
          </div>

          {/* 성적 버튼: 여기만 가로 스크롤되게 가둠 (전체 카드에 가로 스크롤바 안 생기게) */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="w-full overflow-x-auto">
              <div className="min-w-max">
                <GradeRow
                  options={gradeOptions}
                  value={gradesByCourseNo[c.no] ?? "미수강"}
                  onChange={(v) => onChangeGrade(c.no, v)}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LabelPill({ text }) {
  return (
    <div className="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-sky-400/20 border border-sky-300/30 text-sm w-full md:w-auto">
      {text}
    </div>
  );
}
