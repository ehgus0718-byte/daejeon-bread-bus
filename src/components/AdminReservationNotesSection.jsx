import React from "react";
import AdminReservationNoteEditor from "./AdminReservationNoteEditor.jsx";
import AdminSectionTitle from "./AdminSectionTitle.jsx";

export default function AdminReservationNotesSection({
  reservations = [],
  onSaveNote,
  onClearNote
}) {
  if (!reservations.length) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <AdminSectionTitle
          eyebrow="Admin Reservation Notes"
          title="예약별 관리자 메모"
          description="예약별 특이사항, 입금 확인, 고객 요청사항을 기록할 수 있습니다."
        />
      </div>

      <div className="grid gap-4">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="grid gap-3 rounded-3xl border border-stone-100 bg-stone-50 p-4 md:grid-cols-[1fr_2fr]"
          >
            <div className="text-sm font-bold text-stone-700">
              <p className="text-xs font-black text-stone-400">예약 정보</p>
              <p className="mt-2 text-base font-black text-stone-950">
                {reservation.name || "예약자 미입력"}
              </p>
              <p className="mt-1">{reservation.date || "날짜 미정"}</p>
              <p className="mt-1">{reservation.people || 0}명</p>
              <p className="mt-1">{reservation.status || "상태 미정"}</p>
            </div>

            <AdminReservationNoteEditor
              reservation={reservation}
              onSaveNote={onSaveNote}
              onClearNote={onClearNote}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
