import React, { useEffect, useMemo, useRef, useState } from "react";
import { reviewsClient, DEFAULT_REVIEW_SETTINGS } from "../api/reviewsClient.js";
import ReviewSlider from "./ReviewSlider.jsx";

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  author_name: "",
  content: "",
  rating: 5,
  photo_url: "",
  profile_url: "",
  is_visible: true,
  is_featured: false
};

function fieldClass() {
  return "w-full rounded-2xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold text-stone-900 focus:border-orange-500 focus:outline-none";
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`별점 ${n}점`}
          className={`text-2xl transition ${n <= value ? "text-orange-500" : "text-stone-300 hover:text-orange-300"}`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm font-black text-stone-600">{value}점</span>
    </div>
  );
}

export default function AdminReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [settings, setSettings] = useState({ ...DEFAULT_REVIEW_SETTINGS });
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [page, setPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const dragItemId = useRef(null);

  const showNotice = (message) => {
    setNotice(message);
    setErrorNotice("");
  };
  const showError = (message) => {
    setErrorNotice(message);
    setNotice("");
  };

  const reload = async () => {
    const [reviewResult, settingsResult] = await Promise.all([reviewsClient.listAll(), reviewsClient.getSettings()]);
    if (reviewResult.ok) setReviews(reviewResult.data || []);
    else showError(`리뷰 목록을 불러오지 못했습니다: ${reviewResult.error}`);
    if (settingsResult.ok) setSettings({ ...DEFAULT_REVIEW_SETTINGS, ...(settingsResult.data || {}) });
    setIsLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const filteredReviews = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return reviews.filter((review) => {
      if (filterMode === "visible" && !review.is_visible) return false;
      if (filterMode === "hidden" && review.is_visible) return false;
      if (filterMode === "featured" && !review.is_featured) return false;
      if (!keyword) return true;
      return (
        String(review.author_name || "").toLowerCase().includes(keyword) ||
        String(review.content || "").toLowerCase().includes(keyword)
      );
    });
  }, [reviews, searchKeyword, filterMode]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedReviews = filteredReviews.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isReorderable = !searchKeyword.trim() && filterMode === "all";

  const refreshPreview = () => setPreviewKey((prev) => prev + 1);

  const handleSubmit = async () => {
    const action = editingId
      ? reviewsClient.update(editingId, form)
      : reviewsClient.create({ ...form, sort_order: reviews.length });
    const result = await action;
    if (!result.ok) {
      showError(`저장 실패: ${result.error}`);
      return;
    }
    showNotice(editingId ? "리뷰가 수정되었습니다." : "리뷰가 등록되었습니다.");
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    await reload();
    refreshPreview();
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setForm({
      author_name: review.author_name || "",
      content: review.content || "",
      rating: review.rating || 5,
      photo_url: review.photo_url || "",
      profile_url: review.profile_url || "",
      is_visible: review.is_visible !== false,
      is_featured: review.is_featured === true
    });
    showNotice(`"${review.author_name}" 리뷰를 수정 중입니다.`);
  };

  const handleDelete = async (review) => {
    if (typeof window !== "undefined" && !window.confirm(`"${review.author_name}" 리뷰를 삭제할까요?`)) return;
    const result = await reviewsClient.remove(review.id);
    if (!result.ok) {
      showError(`삭제 실패: ${result.error}`);
      return;
    }
    showNotice("리뷰가 삭제되었습니다.");
    if (editingId === review.id) {
      setEditingId(null);
      setForm({ ...EMPTY_FORM });
    }
    await reload();
    refreshPreview();
  };

  const handleToggle = async (review, field) => {
    const result = await reviewsClient.patch(review.id, { [field]: !review[field] });
    if (!result.ok) {
      showError(`변경 실패: ${result.error}`);
      return;
    }
    await reload();
    refreshPreview();
  };

  const handleDrop = async (targetId) => {
    const sourceId = dragItemId.current;
    dragItemId.current = null;
    if (!sourceId || sourceId === targetId || !isReorderable) return;
    const ids = reviews.map((r) => r.id);
    const fromIdx = ids.indexOf(sourceId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    ids.splice(toIdx, 0, ids.splice(fromIdx, 1)[0]);
    const reordered = ids.map((id) => reviews.find((r) => r.id === id));
    setReviews(reordered);
    setIsSavingOrder(true);
    const result = await reviewsClient.saveOrder(ids);
    setIsSavingOrder(false);
    if (!result.ok) {
      showError(`순서 저장 실패: ${result.error}`);
      await reload();
      return;
    }
    showNotice("리뷰 순서가 저장되었습니다.");
    refreshPreview();
  };

  const handleSettingsSave = async (partial) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    const result = await reviewsClient.saveSettings(next);
    if (!result.ok) {
      showError(`설정 저장 실패: ${result.error}`);
      return;
    }
    setSettings({ ...DEFAULT_REVIEW_SETTINGS, ...result.data });
    showNotice("슬라이더 설정이 저장되었습니다.");
    refreshPreview();
  };

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-orange-600">CUSTOMER REVIEWS</p>
          <h3 className="mt-1 text-2xl font-black text-stone-950">고객후기 관리</h3>
          <p className="mt-1 text-xs font-bold text-stone-500">
            홈페이지 후기 슬라이더에 노출되는 리뷰를 등록·수정하고 순서를 드래그로 변경할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview((prev) => !prev)}
          className="rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-black text-orange-700 hover:bg-orange-100"
        >
          {showPreview ? "미리보기 닫기" : "홈페이지 미리보기"}
        </button>
      </div>

      {notice ? <p className="mt-3 rounded-2xl bg-green-50 px-4 py-2 text-xs font-black text-green-700">{notice}</p> : null}
      {errorNotice ? (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-xs font-black text-red-700">{errorNotice}</p>
      ) : null}

      {showPreview ? (
        <div className="mt-4 rounded-[2rem] border border-dashed border-orange-300 bg-orange-50/40 p-3">
          <ReviewSlider key={previewKey} previewMode />
        </div>
      ) : null}

      <div className="mt-5 rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <p className="text-sm font-black text-stone-900">{editingId ? "리뷰 수정" : "새 리뷰 등록"}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className={fieldClass()}
            placeholder="작성자 이름 (필수)"
            value={form.author_name}
            maxLength={40}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          />
          <StarPicker value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          <input
            className={fieldClass()}
            placeholder="리뷰 사진 URL (선택)"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
          />
          <input
            className={fieldClass()}
            placeholder="프로필 사진 URL (선택)"
            value={form.profile_url}
            onChange={(e) => setForm({ ...form, profile_url: e.target.value })}
          />
        </div>
        <textarea
          className={`${fieldClass()} mt-3 min-h-[96px]`}
          placeholder="리뷰 내용 (필수, 최대 2000자)"
          value={form.content}
          maxLength={2000}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-black text-stone-700">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
            />
            홈페이지 노출
          </label>
          <label className="flex items-center gap-2 text-xs font-black text-stone-700">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            대표 리뷰 고정
          </label>
          <div className="ml-auto flex gap-2">
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...EMPTY_FORM });
                }}
                className="rounded-full border border-stone-300 px-4 py-2 text-xs font-black text-stone-600 hover:bg-stone-100"
              >
                취소
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-full bg-orange-600 px-5 py-2 text-xs font-black text-white hover:bg-orange-700"
            >
              {editingId ? "수정 저장" : "리뷰 등록"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          className={`${fieldClass()} max-w-xs`}
          placeholder="이름·내용 검색"
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(1);
          }}
        />
        <select
          className={`${fieldClass()} w-auto`}
          value={filterMode}
          onChange={(e) => {
            setFilterMode(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">전체</option>
          <option value="visible">노출 중</option>
          <option value="hidden">숨김</option>
          <option value="featured">대표 리뷰</option>
        </select>
        <p className="text-xs font-black text-stone-500">
          총 {filteredReviews.length}건 {isSavingOrder ? "· 순서 저장 중..." : ""}
        </p>
        {!isReorderable ? (
          <p className="text-[11px] font-bold text-orange-600">드래그 순서 변경은 검색/필터 해제 상태에서만 가능합니다.</p>
        ) : null}
      </div>

      <div className="mt-3 space-y-2">
        {isLoading ? <p className="py-6 text-center text-sm font-black text-stone-400">불러오는 중...</p> : null}
        {!isLoading && pagedReviews.length === 0 ? (
          <p className="py-6 text-center text-sm font-black text-stone-400">표시할 리뷰가 없습니다.</p>
        ) : null}
        {pagedReviews.map((review) => (
          <div
            key={review.id}
            draggable={isReorderable}
            onDragStart={() => {
              dragItemId.current = review.id;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(review.id)}
            className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${
              review.is_visible ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-100 opacity-70"
            } ${isReorderable ? "cursor-grab" : ""}`}
          >
            <span className="text-stone-300" aria-hidden="true">
              ⠿
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-stone-900">{review.author_name}</p>
                <span className="text-xs text-orange-500">{"★".repeat(review.rating)}</span>
                {review.is_featured ? (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">대표</span>
                ) : null}
                <span className="text-[11px] font-bold text-stone-400">
                  {new Date(review.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="mt-1 truncate text-xs font-bold text-stone-600">{review.content}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleToggle(review, "is_visible")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                  review.is_visible ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-500"
                }`}
              >
                {review.is_visible ? "노출 ON" : "노출 OFF"}
              </button>
              <button
                type="button"
                onClick={() => handleToggle(review, "is_featured")}
                className={`rounded-full px-3 py-1.5 text-[11px] font-black ${
                  review.is_featured ? "bg-orange-100 text-orange-700" : "bg-stone-100 text-stone-500"
                }`}
              >
                대표 {review.is_featured ? "해제" : "고정"}
              </button>
              <button
                type="button"
                onClick={() => handleEdit(review)}
                className="rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-black text-white"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => handleDelete(review)}
                className="rounded-full bg-red-100 px-3 py-1.5 text-[11px] font-black text-red-700"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              className={`h-8 w-8 rounded-full text-xs font-black ${
                pageNumber === safePage ? "bg-orange-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-stone-200 bg-stone-50 p-5">
        <p className="text-sm font-black text-stone-900">슬라이더 설정</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <label className="text-xs font-black text-stone-700">
            자동재생
            <select
              className={`${fieldClass()} mt-1`}
              value={settings.autoplay ? "on" : "off"}
              onChange={(e) => handleSettingsSave({ autoplay: e.target.value === "on" })}
            >
              <option value="on">켜기</option>
              <option value="off">끄기</option>
            </select>
          </label>
          <label className="text-xs font-black text-stone-700">
            자동재생 속도 (초)
            <select
              className={`${fieldClass()} mt-1`}
              value={String(settings.autoplay_speed_ms)}
              onChange={(e) => handleSettingsSave({ autoplay_speed_ms: Number(e.target.value) })}
            >
              {[2000, 3000, 4000, 5000, 7000, 10000].map((ms) => (
                <option key={ms} value={ms}>
                  {ms / 1000}초
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black text-stone-700">
            슬라이드 간격 (px)
            <select
              className={`${fieldClass()} mt-1`}
              value={String(settings.slide_gap_px)}
              onChange={(e) => handleSettingsSave({ slide_gap_px: Number(e.target.value) })}
            >
              {[8, 16, 24, 32, 40].map((px) => (
                <option key={px} value={px}>
                  {px}px
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black text-stone-700">
            PC 카드 개수
            <select
              className={`${fieldClass()} mt-1`}
              value={String(settings.cards_desktop)}
              onChange={(e) => handleSettingsSave({ cards_desktop: Number(e.target.value) })}
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black text-stone-700">
            정렬 방식
            <select
              className={`${fieldClass()} mt-1`}
              value={settings.sort_mode}
              onChange={(e) => handleSettingsSave({ sort_mode: e.target.value })}
            >
              <option value="order">지정 순서</option>
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="random">랜덤 노출</option>
            </select>
          </label>
          <label className="text-xs font-black text-stone-700">
            테마
            <select
              className={`${fieldClass()} mt-1`}
              value={settings.theme}
              onChange={(e) => handleSettingsSave({ theme: e.target.value })}
            >
              <option value="light">라이트</option>
              <option value="warm">웜톤</option>
              <option value="dark">다크</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-[11px] font-bold text-stone-400">
          설정은 선택 즉시 저장되며, 미리보기와 홈페이지에 바로 반영됩니다. 대표 리뷰는 항상 맨 앞에 고정됩니다.
        </p>
      </div>
    </section>
  );
}
