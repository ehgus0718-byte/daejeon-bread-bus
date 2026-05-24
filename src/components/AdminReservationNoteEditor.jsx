import React, { useEffect, useState } from "react";
import { getReservationNote } from "../core/reservationNotes.js";

export default function AdminReservationNoteEditor({
  reservation = {},
  onSaveNote,
  onClearNote
}) {
  const [note, setNote] = useState(getReservationNote(reservation));

  useEffect(() => {
    setNote(getReservationNote(reservation));
  }, [reservation]);

  function handleSave() {
    onSaveNote?.(reservation.id, note);
  }

  function handleClear() {
    setNote("");
    onClearNote?.(reservation.id);
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-stone-100 bg-stone-50 p-3">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="관리자 메모 입력"
        className="resize-none rounded-2xl border border-stone-200 bg-white px-3 py-3 text-xs font-bold text-stone-700 outline-none transition focus:border-orange-400"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-orange-500 px-3 py-2 text-xs font-black text-white transition hover:bg-orange-600"
        >
          메모 저장
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="rounded-full bg-stone-200 px-3 py-2 text-xs font-black text-stone-700 transition hover:bg-stone-300"
        >
          메모 삭제
        </button>
      </div>
    </div>
  );
}
