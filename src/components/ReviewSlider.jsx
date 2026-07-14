import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reviewsClient, DEFAULT_REVIEW_SETTINGS } from "../api/reviewsClient.js";

const THEME_STYLES = {
  light: {
    section: "border-orange-200 bg-white",
    eyebrow: "text-orange-700",
    title: "text-stone-950",
    subtitle: "text-stone-600",
    card: "border-orange-100 bg-orange-50/60",
    name: "text-stone-900",
    content: "text-stone-700",
    dotActive: "bg-orange-600",
    dot: "bg-orange-200",
    control: "border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
  },
  warm: {
    section: "border-orange-300 bg-orange-50",
    eyebrow: "text-orange-800",
    title: "text-stone-950",
    subtitle: "text-stone-700",
    card: "border-orange-200 bg-white",
    name: "text-stone-900",
    content: "text-stone-700",
    dotActive: "bg-orange-700",
    dot: "bg-orange-300",
    control: "border-orange-300 bg-white text-orange-800 hover:bg-orange-100"
  },
  dark: {
    section: "border-stone-800 bg-stone-950",
    eyebrow: "text-orange-300",
    title: "text-white",
    subtitle: "text-stone-300",
    card: "border-stone-800 bg-stone-900",
    name: "text-white",
    content: "text-stone-300",
    dotActive: "bg-orange-400",
    dot: "bg-stone-700",
    control: "border-stone-700 bg-stone-900 text-orange-300 hover:bg-stone-800"
  }
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`별점 5점 만점에 ${rating}점`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden="true" className={n <= rating ? "text-orange-500" : "text-stone-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ProfileAvatar({ review }) {
  if (review.profile_url) {
    return (
      <img
        src={review.profile_url}
        alt={`${review.author_name} 프로필 사진`}
        loading="lazy"
        decoding="async"
        className="h-11 w-11 shrink-0 rounded-full border border-orange-200 object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-white"
    >
      {String(review.author_name || "?").slice(0, 1)}
    </span>
  );
}

function shuffleArray(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function usePerView(cardsDesktop) {
  const compute = useCallback(() => {
    if (typeof window === "undefined") return cardsDesktop;
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 1024) return Math.min(2, cardsDesktop);
    return cardsDesktop;
  }, [cardsDesktop]);
  const [perView, setPerView] = useState(compute);
  useEffect(() => {
    const handleResize = () => setPerView(compute());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [compute]);
  return perView;
}

export default function ReviewSlider({ previewMode = false }) {
  const [reviews, setReviews] = useState(null);
  const [settings, setSettings] = useState({ ...DEFAULT_REVIEW_SETTINGS });
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [reviewResult, settingsResult] = await Promise.all([
          reviewsClient.listVisible(),
          reviewsClient.getSettings()
        ]);
        if (!alive) return;
        if (!reviewResult.ok) {
          setLoadFailed(true);
          return;
        }
        setSettings({ ...DEFAULT_REVIEW_SETTINGS, ...(settingsResult.data || {}) });
        setReviews(reviewResult.data || []);
      } catch (error) {
        if (alive) setLoadFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const sortedReviews = useMemo(() => {
    const list = Array.isArray(reviews) ? reviews : [];
    const featured = list.filter((r) => r.is_featured);
    const rest = list.filter((r) => !r.is_featured);
    let orderedRest = rest;
    if (settings.sort_mode === "latest") {
      orderedRest = [...rest].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (settings.sort_mode === "popular") {
      orderedRest = [...rest].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (settings.sort_mode === "random") {
      orderedRest = shuffleArray(rest);
    }
    return [...featured, ...orderedRest];
  }, [reviews, settings.sort_mode]);

  const perView = usePerView(settings.cards_desktop);
  const count = sortedReviews.length;
  const loopEnabled = count > perView;
  const clones = loopEnabled ? perView : 0;

  const extendedSlides = useMemo(() => {
    if (!loopEnabled) return sortedReviews;
    return [...sortedReviews.slice(-clones), ...sortedReviews, ...sortedReviews.slice(0, clones)];
  }, [sortedReviews, loopEnabled, clones]);

  const [index, setIndex] = useState(clones);
  const [transitionOn, setTransitionOn] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [detailReview, setDetailReview] = useState(null);
  const trackRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, moved: false });

  useEffect(() => {
    setIndex(clones);
  }, [clones, count, perView]);

  const goTo = useCallback(
    (nextIndex) => {
      setTransitionOn(true);
      setIndex(nextIndex);
    },
    []
  );
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  const handleTransitionEnd = useCallback(() => {
    if (!loopEnabled) return;
    if (index >= clones + count) {
      setTransitionOn(false);
      setIndex(index - count);
    } else if (index < clones) {
      setTransitionOn(false);
      setIndex(index + count);
    }
  }, [index, clones, count, loopEnabled]);

  useEffect(() => {
    if (!transitionOn) {
      const raf = requestAnimationFrame(() => setTransitionOn(true));
      return () => cancelAnimationFrame(raf);
    }
    return undefined;
  }, [transitionOn]);

  useEffect(() => {
    if (!settings.autoplay || isPaused || !loopEnabled || detailReview) return undefined;
    const timer = setInterval(() => {
      setTransitionOn(true);
      setIndex((prev) => prev + 1);
    }, Math.max(1500, settings.autoplay_speed_ms));
    return () => clearInterval(timer);
  }, [settings.autoplay, settings.autoplay_speed_ms, isPaused, loopEnabled, detailReview]);

  const handlePointerDown = useCallback((event) => {
    dragState.current = { dragging: true, startX: event.clientX, moved: false };
    setIsPaused(true);
  }, []);

  const handlePointerMove = useCallback((event) => {
    if (!dragState.current.dragging) return;
    const delta = event.clientX - dragState.current.startX;
    if (Math.abs(delta) > 5) dragState.current.moved = true;
    setDragOffsetPx(delta);
  }, []);

  const endDrag = useCallback(
    (event) => {
      if (!dragState.current.dragging) return;
      const delta = event.clientX - dragState.current.startX;
      dragState.current.dragging = false;
      setDragOffsetPx(0);
      setIsPaused(false);
      if (!loopEnabled) return;
      const width = trackRef.current ? trackRef.current.offsetWidth / perView : 300;
      if (delta <= -width * 0.2) goNext();
      else if (delta >= width * 0.2) goPrev();
    },
    [goNext, goPrev, loopEnabled, perView]
  );

  if (loadFailed || reviews === null || count === 0) return null;

  const theme = THEME_STYLES[settings.theme] || THEME_STYLES.light;
  const realIndex = loopEnabled ? (((index - clones) % count) + count) % count : 0;
  const slidePercent = 100 / perView;
  const gapPx = settings.slide_gap_px;

  return (
    <section
      className={`mt-10 min-w-0 rounded-[2rem] border p-6 shadow-xl shadow-orange-100/60 md:p-8 ${theme.section}`}
      aria-roledescription="carousel"
      aria-label="고객 후기 슬라이더"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      itemScope
      itemType="https://schema.org/ItemList"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className={`text-sm font-black tracking-[0.2em] ${theme.eyebrow}`}>CUSTOMER REVIEWS</p>
          <h3 className={`mt-2 text-3xl font-black ${theme.title}`}>고객님들의 생생한 후기</h3>
        </div>
        <div className="flex items-center gap-2">
          {loopEnabled ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="이전 후기"
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-black transition ${theme.control}`}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="다음 후기"
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg font-black transition ${theme.control}`}
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className="mt-6 w-full min-w-0 overflow-hidden"
        ref={trackRef}
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="flex w-full min-w-0 select-none"
          style={{
            transform: `translateX(calc(-${index * slidePercent}% + ${dragOffsetPx}px))`,
            transition: transitionOn && dragOffsetPx === 0 ? "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            marginLeft: `-${gapPx / 2}px`,
            marginRight: `-${gapPx / 2}px`
          }}
          onTransitionEnd={handleTransitionEnd}
          aria-live={settings.autoplay ? "off" : "polite"}
        >
          {extendedSlides.map((review, slideIdx) => (
            <div
              key={`${review.id}-${slideIdx}`}
              className="shrink-0"
              style={{ width: `${slidePercent}%`, padding: `0 ${gapPx / 2}px` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${count}개 후기 중 ${(((slideIdx - clones) % count) + count) % count + 1}번째`}
            >
              <article
                className={`flex h-full flex-col rounded-3xl border p-5 ${theme.card}`}
                itemScope
                itemType="https://schema.org/Review"
              >
                <div className="flex items-center gap-3">
                  <ProfileAvatar review={review} />
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-black ${theme.name}`} itemProp="author">
                      {review.author_name}
                    </p>
                    <StarRating rating={review.rating} />
                  </div>
                  {review.is_featured ? (
                    <span className="ml-auto shrink-0 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-black text-white">
                      대표 후기
                    </span>
                  ) : null}
                </div>
                <p
                  className={`mt-4 flex-1 whitespace-pre-line text-sm font-bold leading-6 ${theme.content}`}
                  itemProp="reviewBody"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {review.content}
                </p>
                {review.photo_url ? (
                  <img
                    src={review.photo_url}
                    alt={`${review.author_name} 후기 사진`}
                    loading="lazy"
                    decoding="async"
                    className="mt-4 h-36 w-full rounded-2xl border border-orange-100 object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}
                <div className="mt-4 flex items-center justify-between">
                  <time className="text-[11px] font-black text-stone-400" dateTime={review.created_at}>
                    {new Date(review.created_at).toLocaleDateString("ko-KR")}
                  </time>
                  <button
                    type="button"
                    onClick={() => setDetailReview(review)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition ${theme.control}`}
                  >
                    자세히 보기
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {loopEnabled ? (
        <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="후기 페이지 이동">
          {sortedReviews.map((review, dotIdx) => (
            <button
              key={review.id}
              type="button"
              role="tab"
              aria-selected={dotIdx === realIndex}
              aria-label={`${dotIdx + 1}번째 후기로 이동`}
              onClick={() => goTo(clones + dotIdx)}
              className={`h-2.5 rounded-full transition-all ${
                dotIdx === realIndex ? `w-6 ${theme.dotActive}` : `w-2.5 ${theme.dot}`
              }`}
            />
          ))}
        </div>
      ) : null}

      {detailReview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${detailReview.author_name} 후기 상세`}
          onClick={() => setDetailReview(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-orange-200 bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <ProfileAvatar review={detailReview} />
              <div>
                <p className="text-base font-black text-stone-900">{detailReview.author_name}</p>
                <StarRating rating={detailReview.rating} />
              </div>
              <button
                type="button"
                onClick={() => setDetailReview(null)}
                aria-label="후기 상세 닫기"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-lg font-black text-stone-500 hover:bg-stone-50"
              >
                ×
              </button>
            </div>
            {detailReview.photo_url ? (
              <img
                src={detailReview.photo_url}
                alt={`${detailReview.author_name} 후기 사진`}
                loading="lazy"
                decoding="async"
                className="mt-4 w-full rounded-2xl border border-orange-100 object-cover"
              />
            ) : null}
            <p className="mt-4 whitespace-pre-line text-sm font-bold leading-7 text-stone-700">{detailReview.content}</p>
            <p className="mt-4 text-[11px] font-black text-stone-400">
              작성일 {new Date(detailReview.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>
      ) : null}

      {previewMode ? (
        <p className="mt-4 text-center text-[11px] font-black text-stone-400">미리보기 모드 — 실제 홈페이지와 동일하게 표시됩니다.</p>
      ) : null}
    </section>
  );
}
