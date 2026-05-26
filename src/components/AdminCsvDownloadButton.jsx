import React from "react";
import {
  createReservationCsvFilename,
  reservationsToExcelCsv
} from "../core/reservationCsvExport.js";

function downloadTextFile({ filename, content, mimeType }) {
  if (typeof document === "undefined") {
    return false;
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}

export default function AdminCsvDownloadButton({
  reservations = [],
  label = "현재 목록 CSV 다운로드"
}) {
  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const disabled = safeReservations.length === 0;
  const helperText = disabled
    ? "다운로드할 예약 내역이 없습니다."
    : `현재 화면에 표시된 ${safeReservations.length}건의 예약 내역을 CSV로 다운로드합니다.`;

  function handleDownload() {
    if (disabled) {
      return;
    }

    const csvContent = reservationsToExcelCsv(safeReservations);
    const filename = createReservationCsvFilename("daejeon-bread-bus-filtered-reservations");

    downloadTextFile({
      filename,
      content: csvContent,
      mimeType: "text/csv;charset=utf-8;"
    });
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled}
      aria-label={helperText}
      title={helperText}
      className="rounded-full bg-stone-950 px-4 py-3 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
    >
      {label}
    </button>
  );
}
