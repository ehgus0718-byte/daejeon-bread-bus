import React from "react";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

export default function AdminLogin({
  password = "",
  error = "",
  onChangePassword,
  onSubmit
}) {
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
                  onSubmit?.();
                }
              }}
              placeholder="비밀번호를 입력해주세요"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-4 font-bold outline-none transition focus:border-orange-400"
            />
          </label>

          <button
            type="button"
            onClick={onSubmit}
            className="mt-4 w-full rounded-2xl bg-stone-950 px-5 py-4 text-sm font-black text-white transition hover:translate-y-[-1px]"
          >
            관리자 접속
          </button>

          {error ? (
            <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4 text-sm font-black text-orange-700">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
