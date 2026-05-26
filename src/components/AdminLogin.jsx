import React, { useEffect, useState } from "react";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

const MAX_LOGIN_ATTEMPTS = 5;

export default function AdminLogin({
  password = "",
  error = "",
  onChangePassword,
  onSubmit
}) {
  const [attemptCount, setAttemptCount] = useState(0);
  const isLocked = attemptCount >= MAX_LOGIN_ATTEMPTS;
  const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - attemptCount);

  useEffect(() => {
    if (!password) {
      setAttemptCount(0);
    }
  }, [password]);

  function handleSubmit() {
    if (isLocked) return;

    setAttemptCount((count) => Math.min(MAX_LOGIN_ATTEMPTS, count + 1));
    onSubmit?.();
  }

  function handleResetAttempts() {
    setAttemptCount(0);
    onChangePassword?.("");
  }

  return (
    <section className="mt-10 rounded-[2.5rem] border border-stone-200 bg-white p-6 shadow-sm md:p-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-center">
        <AdminSectionTitle
          eyebrow="ADMIN ACCESS"
          title="관리자 로그인"
          description="예약 상태, 날짜별 정원, 가격, 모집 상태 관리는 운영자 로그인 후에만 사용할 수 있습니다."
        />

        <div className="rounded-[2rem] bg-stone-50 p-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-black text-stone-700">
              관리자 비밀번호
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => onChangePassword?.(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSubmit();
                }
              }}
              placeholder="비밀번호를 입력해주세요"
              autoComplete="current-password"
              disabled={isLocked}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-4 font-bold outline-none transition focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
            />
          </label>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLocked}
            className="mt-4 w-full rounded-2xl bg-stone-950 px-5 py-4 text-sm font-black text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:hover:translate-y-0"
          >
            {isLocked ? "로그인 시도 제한" : "관리자 접속"}
          </button>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-black text-stone-400">
            <span>로그인 가능 횟수: {remainingAttempts}회</span>
            {isLocked ? (
              <button
                type="button"
                onClick={handleResetAttempts}
                className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-black text-stone-600 transition hover:bg-stone-100"
              >
                다시 입력하기
              </button>
            ) : null}
          </div>

          {isLocked ? (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm font-black text-red-600">
              관리자 로그인 시도 횟수를 초과했습니다. 다시 입력하기 버튼을 눌러 비밀번호를 새로 입력해주세요.
            </div>
          ) : null}

          {error && !isLocked ? (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm font-black text-orange-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
