import React from "react";

function getStatusLabel(report = {}) {
  if (report.healthy) {
    return "정상";
  }

  if ((report.errorCount || 0) > 0) {
    return "확인 필요";
  }

  return "주의";
}

export default function AdminHealthReport({ report }) {
  if (!report) {
    return null;
  }

  const statusLabel = getStatusLabel(report);

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black text-orange-600">
            Admin Health Report
          </p>
          <h3 className="mt-1 text-3xl font-black text-stone-900">
            운영 상태 점검
          </h3>
          <p className="mt-2 text-sm font-bold text-stone-500">
            예약 데이터와 관리자 설정 구조를 점검합니다.
          </p>
        </div>

        <div className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black text-stone-700">
          상태: {statusLabel}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl bg-stone-50 p-4">
          <p className="text-xs font-black text-stone-500">전체 이슈</p>
          <p className="mt-2 text-2xl font-black text-stone-950">
            {report.issueCount || 0}
          </p>
        </div>
        <div className="rounded-3xl bg-red-50 p-4">
          <p className="text-xs font-black text-red-500">오류</p>
          <p className="mt-2 text-2xl font-black text-red-700">
            {report.errorCount || 0}
          </p>
        </div>
        <div className="rounded-3xl bg-orange-50 p-4">
          <p className="text-xs font-black text-orange-500">주의</p>
          <p className="mt-2 text-2xl font-black text-orange-700">
            {report.warningCount || 0}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-stone-100">
        {report.issues?.length ? (
          <div className="divide-y divide-stone-100">
            {report.issues.map((issue, index) => (
              <div key={`${issue.code}-${index}`} className="p-4 text-sm font-bold">
                <p className="text-xs font-black text-stone-400">
                  {issue.level || "warning"} · {issue.code}
                </p>
                <p className="mt-1 text-stone-700">{issue.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm font-bold text-stone-500">
            감지된 운영 데이터 이슈가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
