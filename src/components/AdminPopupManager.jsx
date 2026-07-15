import React, { useEffect, useState } from "react";
import { popupClient, DEFAULT_POPUP } from "../api/popupClient.js";
import CustomerPopup from "./CustomerPopup.jsx";

function fieldClass() {
  return "w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-900 focus:border-orange-500 focus:outline-none";
}

export default function AdminPopupManager() {
  const [form, setForm] = useState({ ...DEFAULT_POPUP });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const result = await popupClient.getPopup();
      if (!alive) return;
      if (result.ok) setForm({ ...DEFAULT_POPUP, ...result.data });
      setIsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (overrides = {}) => {
    setIsSaving(true);
    setNotice("");
    setErrorNotice("");
    const payload = { ...form, ...overrides };
    const result = await popupClient.savePopup(payload);
    setIsSaving(false);
    if (!result.ok) {
      setErrorNotice(`저장 실패: ${result.error}`);
      return;
    }
    setForm({ ...DEFAULT_POPUP, ...result.data });
    setNotice("팝업 설정이 저장되었습니다. 고객 화면에 바로 반영됩니다.");
  };

  const handleToggleEnabled = () => handleSave({ enabled: !form.enabled });

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    setNotice("");
    setErrorNotice("");
    const result = await popupClient.uploadPopupImage(file);
    setIsUploading(false);
    if (!result.ok) {
      setErrorNotice(`이미지 업로드 실패: ${result.error}`);
      return;
    }
    setField("image_url", result.data.url);
    setNotice("이미지가 업로드되었습니다. 하단의 '팝업 저장' 버튼을 눌러 반영하세요.");
  };

  if (isLoading) {
    return (
      <section className="min-w-0 rounded-[2rem] border border-stone-200 bg-white p-6">
        <p className="py-6 text-center text-sm font-black text-stone-400">팝업 설정 불러오는 중...</p>
      </section>
    );
  }

  return (
    <section className="min-w-0 rounded-[2rem] border border-stone-200 bg-white p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-orange-600">SITE POPUP</p>
          <h3 className="mt-1 text-2xl font-black text-stone-950">홈페이지 팝업 관리</h3>
          <p className="mt-1 text-xs font-bold text-stone-500">
            고객 화면 접속 시 표시되는 팝업입니다. 고객은 "오늘하루 안 보기"로 하루 동안 숨길 수 있습니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((prev) => !prev)}
            className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 hover:bg-orange-100"
          >
            {showPreview ? "미리보기 닫기" : "팝업 미리보기"}
          </button>
          <button
            type="button"
            onClick={handleToggleEnabled}
            disabled={isSaving}
            className={`rounded-full px-4 py-2 text-xs font-black text-white transition disabled:opacity-50 ${
              form.enabled ? "bg-green-600 hover:bg-green-700" : "bg-stone-400 hover:bg-stone-500"
            }`}
          >
            {form.enabled ? "팝업 켜짐 (끄려면 클릭)" : "팝업 꺼짐 (켜려면 클릭)"}
          </button>
        </div>
      </div>

      {notice ? <p className="mt-3 rounded-2xl bg-green-50 px-4 py-2 text-xs font-black text-green-700">{notice}</p> : null}
      {errorNotice ? (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-xs font-black text-red-700">{errorNotice}</p>
      ) : null}

      {showPreview ? (
        <div className="mt-4 min-w-0 overflow-hidden rounded-[2rem] border border-dashed border-orange-300 bg-orange-50/40 p-4">
          <CustomerPopup previewData={{ ...form }} />
          <p className="mt-3 text-center text-[11px] font-black text-stone-400">
            미리보기 모드 — 저장된 내용 기준이 아닌 현재 입력 중인 내용이 표시됩니다.
          </p>
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm font-black text-stone-900">노출 방식</p>
          <label className="flex items-center gap-2 text-xs font-black text-stone-700">
            <input
              type="radio"
              name="popup-display-mode"
              checked={form.display_mode === "image"}
              onChange={() => setField("display_mode", "image")}
            />
            이미지만 (클릭 시 링크 이동)
          </label>
          <label className="flex items-center gap-2 text-xs font-black text-stone-700">
            <input
              type="radio"
              name="popup-display-mode"
              checked={form.display_mode === "text"}
              onChange={() => setField("display_mode", "text")}
            />
            텍스트 + 이미지(선택)
          </label>
        </div>

        <div className="mt-4 grid gap-3">
          {form.display_mode === "text" ? (
            <>
              <input
                className={fieldClass()}
                placeholder="팝업 제목 (최대 80자)"
                value={form.title}
                maxLength={80}
                onChange={(e) => setField("title", e.target.value)}
              />
              <textarea
                className={`${fieldClass()} min-h-[96px]`}
                placeholder="팝업 내용 (최대 2000자)"
                value={form.content}
                maxLength={2000}
                onChange={(e) => setField("content", e.target.value)}
              />
            </>
          ) : null}
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${fieldClass()} flex-1`}
                placeholder={form.display_mode === "image" ? "팝업 이미지 URL (필수)" : "이미지 URL (선택)"}
                value={form.image_url || ""}
                onChange={(e) => setField("image_url", e.target.value)}
              />
              <label className="cursor-pointer rounded-2xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-xs font-black text-orange-700 hover:bg-orange-100">
                {isUploading ? "업로드 중..." : "파일에서 업로드"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageFileChange}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            </div>
            {form.image_url ? (
              <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-2">
                <img
                  src={form.image_url}
                  alt="팝업 이미지 미리보기"
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <p className="truncate text-[11px] font-bold text-stone-400">{form.image_url}</p>
              </div>
            ) : null}
          </div>
          <input
            className={fieldClass()}
            placeholder="클릭 시 이동할 링크 URL (선택, https://로 시작)"
            value={form.link_url || ""}
            onChange={(e) => setField("link_url", e.target.value)}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="rounded-full bg-orange-600 px-5 py-2 text-xs font-black text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "팝업 저장"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-bold text-stone-400">
        이미지 팝업을 켜려면 이미지 URL이 필요하고, 텍스트 팝업은 제목 또는 내용이 필요합니다. 팝업이 꺼져 있으면 고객 화면에 표시되지 않습니다.
      </p>
    </section>
  );
}
