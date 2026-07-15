import React, { useEffect, useState } from "react";
import { popupClient } from "../api/popupClient.js";

const HIDE_STORAGE_KEY = "daejeon-bread-bus-popup-hide-date";

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isHiddenToday() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HIDE_STORAGE_KEY) === getTodayKey();
  } catch (error) {
    return false;
  }
}

function hideForToday() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIDE_STORAGE_KEY, getTodayKey());
  } catch (error) {
    console.warn("Popup hide save failed", error);
  }
}

function isValidHttpUrl(url = "") {
  const s = String(url || "").trim();
  return s.startsWith("http://") || s.startsWith("https://");
}

export default function CustomerPopup({ previewData = null }) {
  const isPreview = previewData !== null;
  const [popup, setPopup] = useState(isPreview ? previewData : null);
  const [isOpen, setIsOpen] = useState(isPreview);

  useEffect(() => {
    if (isPreview) {
      setPopup(previewData);
      setIsOpen(true);
      return undefined;
    }
    if (isHiddenToday()) return undefined;
    let alive = true;
    (async () => {
      const result = await popupClient.getPopup();
      if (!alive || !result.ok) return;
      const data = result.data || {};
      if (!data.enabled) return;
      if (data.display_mode === "image" && !data.image_url) return;
      if (data.display_mode === "text" && !data.title && !data.content) return;
      setPopup(data);
      setIsOpen(true);
    })();
    return () => {
      alive = false;
    };
  }, [isPreview, previewData]);

  if (!isOpen || !popup) return null;

  const hasLink = isValidHttpUrl(popup.link_url);

  const handleClose = () => setIsOpen(false);
  const handleHideToday = () => {
    if (!isPreview) hideForToday();
    setIsOpen(false);
  };

  const imageElement = popup.image_url ? (
    <img
      src={popup.image_url}
      alt={popup.title || "안내 팝업"}
      className="block max-h-[60vh] w-full rounded-t-[2rem] object-contain bg-white"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  ) : null;

  return (
    <div
      className={`${isPreview ? "relative" : "fixed inset-0 z-[60] bg-stone-950/60 p-4"} flex items-center justify-center`}
      role="dialog"
      aria-modal={!isPreview}
      aria-label="안내 팝업"
      onClick={isPreview ? undefined : handleClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[2rem] border border-orange-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {popup.display_mode === "image" ? (
          hasLink ? (
            <a href={popup.link_url} target="_blank" rel="noopener noreferrer" aria-label="팝업 링크 열기">
              {imageElement}
            </a>
          ) : (
            imageElement
          )
        ) : (
          <div className="p-6">
            {popup.title ? <p className="text-xl font-black text-stone-950">{popup.title}</p> : null}
            {popup.content ? (
              <p className="mt-3 whitespace-pre-line text-sm font-bold leading-7 text-stone-700">{popup.content}</p>
            ) : null}
            {imageElement ? <div className="mt-4 overflow-hidden rounded-2xl border border-orange-100">{imageElement}</div> : null}
            {hasLink ? (
              <a
                href={popup.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full bg-orange-600 px-5 py-2.5 text-sm font-black text-white hover:bg-orange-700"
              >
                자세히 보기 →
              </a>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-4 py-3">
          <button
            type="button"
            onClick={handleHideToday}
            className="text-xs font-black text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-700"
          >
            오늘하루 안 보기
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full bg-stone-950 px-5 py-2 text-xs font-black text-white hover:bg-stone-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
