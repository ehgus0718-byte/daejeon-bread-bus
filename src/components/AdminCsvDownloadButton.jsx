import React from "react";
import {
  createReservationCsvFilename,
  reservationsToCsv
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
  label = "예약 CSV 다운로드"
}) {
  function handleDownload() {
    const csvContent = reservationsToCsv(reservations);
    const filename = createReservationCsvFilename();

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
      disabled={reservations.length === 0}
      className="rounded-full bg-stone-950 px-4 py-3 text-xs font-black text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
    >
      {label}
    </button>
  );
}
