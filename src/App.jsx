import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "daejeon-bread-bus-config-ai-space-v1";
const RESERVATION_KEY = "daejeon-bread-bus-reservations-ai-space-v1";
const ADMIN_PASSWORD = "tyty5656";

const defaultConfig = {
  title: "대전빵버스",
  pricePerPerson: 30000,
  maxPeople: 18,
  minPeople: 8,
  departure: "대전역 동광장",
  contact: "010-4797-0718",
  heroTitle: "달력에서 날짜를 선택하고\n대전 빵투어를 예약하세요.",
  heroDescription: "원하는 날짜를 누르면 모집 현황, 투어 일정, 예약 입력창이 아래에 바로 표시됩니다.",
  heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80",
  footerTitle: "Daejeon Bread Tour",
  footerDescription: "대전의 유명 빵집 및 여행처럼 즐기는 버스 투어 플랫폼",
  tourPackages: [
    {
      title: "대전 디저트 카페 버스 여행",
      date: "2026-05-30",
      image: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?auto=format&fit=crop&w=1400&q=80",
      description: "디저트, 카페, 베이커리를 함께 즐기는 달콤한 코스",
      itinerary: [
        { time: "10:30", text: "대전역 집결 및 탑승 확인" },
        { time: "11:00", text: "성심당 DCC 방문" },
        { time: "12:00", text: "버스에서 디저트 시식 시간" },
        { time: "12:30", text: "유성·둔산 디저트 카페 투어" },
        { time: "14:30", text: "둔산동 떡반 방문" },
        { time: "15:10", text: "대전역 복귀" }
      ]
    },
    {
      title: "로컬 베이커리 힐링 코스",
      date: "2026-06-06",
      image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80",
      description: "유성·둔산 로컬 베이커리와 떡반까지 이어지는 힐링 코스",
      itinerary: [
        { time: "10:30", text: "대전역 집결 및 탑승 확인" },
        { time: "11:00", text: "로컬 베이커리 첫 번째 코스" },
        { time: "12:00", text: "버스에서 시식 및 휴식" },
        { time: "12:40", text: "유성 베이커리 힐링 코스" },
        { time: "14:30", text: "둔산동 떡반 방문" },
        { time: "15:10", text: "대전역 복귀" }
      ]
    }
  ],
  bakeries: [
    { name: "성심당 DCC", area: "유성구 도룡동", highlight: "튀김소보로와 부추빵의 클래식 코스" },
    { name: "콜마르브레드", area: "유성구", highlight: "담백한 유럽식 식사빵과 커피" },
    { name: "하레하레", area: "서구 둔산동", highlight: "폭신한 케이크와 디저트 빵" },
    { name: "몽심", area: "대덕구", highlight: "감성적인 동네 베이커리 스폿" }
  ],
  notices: {
    included: ["전용 버스 이동", "투어 매니저 동행", "웰컴 간식", "카페 음료 1잔"],
    cancellation: ["투어 5일 전 100% 환불", "3일 전 50% 환불", "전날/당일 환불 불가", "최소 인원 미달 시 전액 환불"],
    inquiry: ["평일 10:00~18:00", "전화 010-4797-0718", "이메일 hello@bbangbus.kr", "단체 예약 별도 문의"]
  },
  faqs: [
    { question: "비가 와도 투어가 진행되나요?", answer: "전용 버스로 이동하기 때문에 우천 시에도 정상 운영됩니다." },
    { question: "좌석은 어떻게 배정되나요?", answer: "예약 접수 순서와 현장 탑승 확인 순서에 따라 안내됩니다." },
    { question: "결제는 어떻게 진행되나요?", answer: "현재 화면은 예약 접수형이며, 실제 운영 시 PG 결제창과 연동됩니다." }
  ],
  business: {
    company: "소망투어",
    owner: "이도현",
    address: "대전 서구 청사서로 29, 상가동 B101호 (월평동)",
    registrationNumber: "781-69-00237",
    mailOrderNumber: "2020-대전서구-0689"
  },
  legalPages: {
    terms: { title: "이용약관", content: "제1조 목적\n본 약관은 소망투어가 운영하는 대전빵버스 예약 서비스의 이용 조건과 절차를 정합니다.\n\n제2조 예약\n예약자는 정확한 이름, 연락처, 탑승 인원을 입력해야 합니다.\n\n제3조 취소 및 환불\n취소 및 환불은 홈페이지에 게시된 취소 안내 기준에 따릅니다." },
    privacy: { title: "개인정보처리방침", content: "소망투어는 예약 접수와 고객 안내를 위해 이름, 연락처, 예약 날짜, 인원 정보를 수집합니다.\n\n수집된 개인정보는 예약 확인, 고객 응대, 결제 안내 목적으로만 사용됩니다." },
    support: { title: "고객센터", content: "대전빵버스 고객센터\n\n전화: 010-4797-0718\n운영시간: 평일 10:00~18:00\n\n단체 예약, 기업 워크숍, 코스 커스터마이징 문의도 가능합니다." }
  }
};

function cx(...v) { return v.filter(Boolean).join(" "); }
function won(v) { return `${new Intl.NumberFormat("ko-KR").format(Number(v || 0))}원`; }
function clamp(v, min, max) { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min; }
function load(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? { ...fallback, ...JSON.parse(raw) } : fallback; } catch { return fallback; } }
function save(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function tourList(config) { return Array.isArray(config.tourPackages) && config.tourPackages.length ? config.tourPackages : defaultConfig.tourPackages; }
function selectedTour(config, date) { return tourList(config).find((t) => t.date === date) || tourList(config)[0]; }
function countPeople(reservations, date) { return reservations.filter((r) => r.status !== "취소" && r.date === date).reduce((s, r) => s + Number(r.people || 0), 0); }
function remaining(config, reservations, date) { return Math.max(0, Number(config.maxPeople || 18) - countPeople(reservations, date)); }
function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function months() { const t = new Date(); return [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth() + 1, 1)]; }
function grid(y, m) { const f = new Date(y, m, 1); const l = new Date(y, m + 1, 0); const arr = []; for (let i = 0; i < f.getDay(); i++) arr.push(null); for (let d = 1; d <= l.getDate(); d++) arr.push(new Date(y, m, d)); while (arr.length % 7) arr.push(null); return arr; }
function dateLabel(s) { const d = new Date(`${s}T00:00:00`); return Number.isNaN(d.getTime()) ? s : new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(d); }

function Button({ children, onClick, variant = "primary", disabled = false, className = "" }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cx("rounded-2xl px-4 py-3 text-sm font-extrabold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50", variant === "primary" && "bg-orange-500 text-white shadow-lg shadow-orange-100 hover:bg-orange-600", variant === "dark" && "bg-stone-900 text-white hover:bg-stone-800", variant === "ghost" && "bg-transparent text-stone-700 hover:bg-orange-50", variant === "outline" && "border border-stone-200 bg-white text-stone-800 hover:bg-stone-50", variant === "danger" && "bg-red-50 text-red-600 hover:bg-red-100", className)}>{children}</button>;
}
function Card({ children, className = "" }) { return <div className={cx("rounded-[2rem] bg-white", className)}>{children}</div>; }
function Input({ label, value, onChange, type = "text", disabled = false }) { return <label className="grid gap-2 text-sm font-extrabold text-stone-800">{label}<input type={type} disabled={disabled} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:bg-stone-100" /></label>; }
function Area({ label, value, onChange }) { return <label className="grid gap-2 text-sm font-extrabold text-stone-800">{label}<textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="min-h-24 rounded-2xl border border-stone-200 bg-white p-4 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" /></label>; }

function Calendar({ config, reservations, value, onSelect }) {
  const dates = new Set(tourList(config).map((t) => t.date));
  return <Card className="border border-orange-100 p-5 shadow-xl shadow-orange-100">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-black text-orange-600">예약 가능 날짜</p><h2 className="mt-1 text-3xl font-black">달력에서 날짜 선택</h2></div><div className="rounded-2xl bg-orange-50 px-4 py-3 text-sm font-black text-orange-700">선택일 {value}</div></div>
    <div className="grid gap-5 xl:grid-cols-2">{months().map((md) => { const y = md.getFullYear(); const m = md.getMonth(); const title = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(md); return <div key={`${y}-${m}`} className="rounded-3xl border border-stone-100 bg-white p-4 shadow-sm"><h3 className="mb-4 text-center text-xl font-black">{title}</h3><div className="mb-2 grid grid-cols-7 text-center text-xs font-black text-stone-400"><span className="text-red-500">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span className="text-blue-500">토</span></div><div className="grid grid-cols-7 gap-1.5">{grid(y, m).map((d, i) => { if (!d) return <div key={`e-${i}`} className="aspect-square" />; const key = dateKey(d); const has = dates.has(key); const full = has && remaining(config, reservations, key) <= 0; const picked = value === key; const reserved = countPeople(reservations, key); return <button key={key} onClick={() => onSelect(key)} className={cx("relative aspect-square rounded-2xl border text-sm font-black transition hover:-translate-y-0.5", picked && has && !full && "border-orange-500 bg-orange-500 text-white", picked && full && "border-red-500 bg-red-500 text-white", picked && !has && "border-stone-400 bg-stone-700 text-white", !picked && has && !full && "border-orange-200 bg-orange-50 text-orange-700", !picked && full && "border-red-200 bg-red-50 text-red-600", !picked && !has && "border-stone-100 bg-stone-50 text-stone-500")}><span>{d.getDate()}</span>{reserved > 0 && !full && <span className="absolute right-1 top-1 rounded-full bg-stone-900 px-1.5 text-[10px] text-white">{reserved}</span>}</button>; })}</div></div>; })}</div>
    <div className="mt-5 rounded-3xl bg-orange-50 p-4 text-sm font-bold text-stone-700">오렌지 날짜는 예약 가능, 빨간 날짜는 예약 마감입니다.</div>
  </Card>;
}

function Home({ config, reservations, form, setForm, reserve }) {
  const tour = selectedTour(config, form.date);
  const active = countPeople(reservations, form.date);
  const seats = Math.max(0, Number(config.maxPeople) - active);
  const full = seats <= 0;
  const people = clamp(form.people, 1, seats || config.maxPeople);
  const total = people * Number(config.pricePerPerson || 0);
  const progress = Math.min(100, Math.round((active / Number(config.maxPeople || 1)) * 100));

  return <main>
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 rounded-[2rem] bg-stone-950 p-8 text-white shadow-2xl shadow-orange-100 md:p-10"><p className="text-sm font-black uppercase tracking-[0.25em] text-orange-300">Reservation Calendar</p><div className="mt-3 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end"><div><h1 className="whitespace-pre-line text-4xl font-black leading-tight md:text-6xl">{config.heroTitle}</h1><p className="mt-4 max-w-2xl text-base font-bold leading-7 text-stone-300">{config.heroDescription}</p></div><div className="rounded-3xl bg-white/10 p-5 text-right"><p className="text-sm font-bold text-stone-300">1인 금액</p><p className="text-3xl font-black text-orange-300">{won(config.pricePerPerson)}</p></div></div></div>
      <div className="grid gap-6 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
        <div><Calendar config={config} reservations={reservations} value={form.date} onSelect={(date) => setForm({ ...form, date, people: Math.min(Number(form.people || 1), remaining(config, reservations, date) || 1) })} />
          <Card className="mt-6 border border-orange-100 bg-orange-50/60 p-5 shadow-lg shadow-orange-100"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black text-orange-600">선택 날짜 일정</p><h3 className="text-2xl font-black">투어 일정</h3></div><span className="rounded-full bg-white px-4 py-2 text-sm font-black text-stone-600">{tour.title}</span></div><div className="space-y-3">{tour.itinerary.map((it, i) => <div key={i} className="grid grid-cols-[76px_1fr] gap-3 rounded-2xl bg-white p-3 shadow-sm"><div className="rounded-xl bg-orange-100 px-2 py-2 text-center text-sm font-black text-orange-700">{it.time}</div><div className="flex items-center text-sm font-extrabold">{it.text}</div></div>)}</div></Card>
        </div>
        <Card className="overflow-hidden border border-orange-100 shadow-xl shadow-orange-100"><img src={tour.image || config.heroImage} alt={tour.title} className="h-56 w-full object-cover" /><div className="p-6"><div className="mb-4 flex justify-between"><span className={cx("rounded-full px-4 py-2 text-sm font-black", full ? "bg-stone-900 text-white" : "bg-orange-100 text-orange-600")}>{full ? "예약 완료" : "선택한 날짜"}</span><span className="text-sm font-black text-stone-500">{dateLabel(form.date)}</span></div><h2 className="text-3xl font-black">{tour.title}</h2><p className="mt-3 font-bold leading-7 text-stone-600">{tour.description}</p><div className="mt-6 grid gap-3 sm:grid-cols-3"><Stat label="모집 현황" value={`${active}/${config.maxPeople}명`} /><Stat label="잔여 좌석" value={`${seats}석`} /><Stat label="출발지" value={config.departure} /></div><div className="mt-6 rounded-2xl bg-stone-50 p-4"><div className="mb-2 flex justify-between text-sm font-bold"><span>예약 인원 달성률</span><span>{progress}%</span></div><div className="h-3 rounded-full bg-stone-200"><div className="h-full rounded-full bg-orange-500" style={{ width: `${progress}%` }} /></div></div><div className="mt-6 rounded-3xl border border-stone-100 bg-white p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black">예약자 정보</h3><p className="text-right text-sm font-bold text-stone-500">총 결제금액<br /><span className="text-2xl font-black text-orange-600">{won(total)}</span></p></div>{full && <div className="mb-4 rounded-2xl bg-stone-900 px-4 py-3 text-sm font-black text-white">이 날짜는 최대 {config.maxPeople}명 예약이 완료되었습니다.</div>}<div className="grid gap-4 md:grid-cols-2"><Input label="예약자 이름" value={form.name} disabled={full} onChange={(name) => setForm({ ...form, name })} /><Input label="연락처" value={form.phone} disabled={full} onChange={(phone) => setForm({ ...form, phone })} /></div><div className="mt-4"><Input label="인원" type="number" value={form.people} disabled={full} onChange={(v) => setForm({ ...form, people: clamp(v, 1, seats || config.maxPeople) })} /></div><Button onClick={reserve} disabled={full} className="mt-5 h-14 w-full text-base">{full ? "예약 완료" : `💳 ${won(total)} 결제하고 예약하기`}</Button></div></div></Card>
      </div>
    </section>
    <Info config={config} />
  </main>;
}
function Stat({ label, value }) { return <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm"><p className="text-xs font-bold text-stone-500">{label}</p><p className="mt-1 font-black">{value}</p></div>; }

function Info({ config }) { return <><section className="mx-auto max-w-7xl px-5 py-10"><div className="mb-8"><p className="font-extrabold text-orange-600">Bakery Route</p><h2 className="text-3xl font-black">오늘의 빵집 코스</h2></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{config.bakeries.map((b, i) => <Card key={i} className="border border-orange-100 shadow-sm"><div className="p-5"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-2xl font-black text-orange-600">{i + 1}</div><h3 className="text-xl font-black">{b.name}</h3><p className="mt-1 text-sm font-bold text-stone-500">📍 {b.area}</p><p className="mt-4 leading-7 text-stone-600">{b.highlight}</p></div></Card>)}</div></section><section className="mx-auto max-w-7xl px-5 pb-16"><div className="grid gap-6 md:grid-cols-3"><Notice title="포함 사항" items={config.notices.included} /><Notice title="취소 안내" items={config.notices.cancellation} /><Notice title="문의" items={config.notices.inquiry} /></div><Card className="mt-8 border border-orange-100 p-7 shadow-lg shadow-orange-100/60"><p className="text-sm font-black text-orange-600">FAQ</p><h2 className="text-3xl font-black">자주 묻는 질문</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{config.faqs.map((f, i) => <div key={i} className="rounded-3xl bg-orange-50/70 p-5"><h3 className="text-lg font-black">{f.question}</h3><p className="mt-3 text-sm font-bold leading-6 text-stone-600">{f.answer}</p></div>)}</div></Card></section></>; }
function Notice({ title, items }) { return <Card className="border border-orange-100 bg-white shadow-lg shadow-orange-100/60"><div className="p-7"><h3 className="mb-6 text-2xl font-black">{title}</h3><ul className="space-y-4">{items.map((item, i) => <li key={i} className="flex gap-3 font-bold leading-7"><span className="text-orange-500">✓</span><span>{item}</span></li>)}</ul></div></Card>; }

function LegalModal({ page, onClose }) { if (!page) return null; return <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 px-5"><div className="max-h-[82vh] w-full max-w-2xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-orange-100 px-6 py-5"><h2 className="text-2xl font-black">{page.title}</h2><button onClick={onClose} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black">닫기</button></div><div className="max-h-[64vh] overflow-y-auto whitespace-pre-line p-6 text-sm font-bold leading-7 text-stone-700">{page.content}</div></div></div>; }
function Footer({ config }) { const [page, setPage] = useState(null); const b = config.business; const legal = config.legalPages || defaultConfig.legalPages; return <><footer className="border-t border-orange-100 bg-white/80"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1fr_1.4fr_.6fr]"><div><div className="mb-3 inline-flex rounded-full bg-orange-100 px-4 py-2 text-xs font-black text-orange-600">🚌 DAEJEON BREAD TOUR</div><h2 className="text-3xl font-black">{config.footerTitle}</h2><p className="mt-4 font-bold leading-7 text-stone-600">{config.footerDescription}</p></div><div className="rounded-3xl border border-orange-100 bg-orange-50/60 p-6 text-sm leading-7"><div className="grid gap-6 md:grid-cols-2"><div><b>상호명</b><p>{b.company}</p><b>대표자</b><p>{b.owner}</p></div><div><b>사업자등록번호</b><p>{b.registrationNumber}</p><b>통신판매번호</b><p>{b.mailOrderNumber}</p></div></div><div className="mt-4 border-t border-orange-100 pt-4"><b>주소</b><p>{b.address}</p></div></div><div className="flex flex-col gap-4 text-sm font-black text-stone-600 lg:items-end"><button onClick={() => setPage(legal.terms)}>이용약관</button><button onClick={() => setPage(legal.privacy)}>개인정보처리방침</button><button onClick={() => setPage(legal.support)}>고객센터</button></div></div></footer><LegalModal page={page} onClose={() => setPage(null)} /></>; }

function Admin({ config, setConfig, reservations, setReservations, authed, password, setPassword, login, logout, resetAll }) {
  if (!authed) return <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5"><Card className="w-full shadow-2xl shadow-orange-100"><div className="p-8"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-2xl text-white">🔒</div><h1 className="text-3xl font-black">관리자 로그인</h1><p className="mt-2 text-sm text-stone-500">관리자 전용 페이지입니다.</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="비밀번호" className="mt-6 h-12 w-full rounded-2xl border px-4" /><Button onClick={login} variant="dark" className="mt-4 h-12 w-full">로그인</Button></div></Card></main>;
  const set = (patch) => setConfig({ ...config, ...patch });
  return <main className="mx-auto max-w-7xl px-5 py-10"><div className="mb-8 flex items-center justify-between gap-4"><div><p className="font-extrabold text-orange-600">Admin Dashboard</p><h1 className="text-4xl font-black">대전빵버스 관리자</h1></div><Button variant="outline" onClick={logout}>로그아웃</Button></div><div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]"><Card className="p-6 shadow-sm"><h2 className="mb-5 text-2xl font-black">전체 화면 문구 수정</h2><div className="grid gap-4"><Input label="사이트 제목" value={config.title} onChange={(title) => set({ title })} /><Input label="출발 장소" value={config.departure} onChange={(departure) => set({ departure })} /><Input label="문의 연락처" value={config.contact} onChange={(contact) => set({ contact })} /><Area label="예약 헤더 제목" value={config.heroTitle} onChange={(heroTitle) => set({ heroTitle })} /><Area label="예약 헤더 설명" value={config.heroDescription} onChange={(heroDescription) => set({ heroDescription })} /><Input label="1인 금액" type="number" value={config.pricePerPerson} onChange={(v) => set({ pricePerPerson: Number(v || 0) })} /><Input label="최대 인원" type="number" value={config.maxPeople} onChange={(v) => set({ maxPeople: Number(v || 1) })} /><Input label="푸터 제목" value={config.footerTitle} onChange={(footerTitle) => set({ footerTitle })} /><Area label="푸터 설명" value={config.footerDescription} onChange={(footerDescription) => set({ footerDescription })} /><div className="rounded-2xl bg-green-50 p-4 text-sm font-extrabold text-green-700">✅ 수정 내용은 자동 저장됩니다.</div></div></Card><div className="space-y-6"><AdminTours config={config} setConfig={setConfig} /><AdminText config={config} setConfig={setConfig} /><AdminReservations reservations={reservations} setReservations={setReservations} /><Card className="p-6"><h2 className="mb-4 text-2xl font-black">운영 관리</h2><Button variant="danger" onClick={resetAll}>전체 초기화</Button></Card></div></div></main>;
}
function AdminTours({ config, setConfig }) { return <Card className="p-6 shadow-sm"><div className="mb-4 flex justify-between"><h2 className="text-2xl font-black">현재 모집 중인 투어</h2><Button onClick={() => setConfig({ ...config, tourPackages: [...tourList(config), { title: "새 투어", date: "2026-06-13", image: config.heroImage, description: "투어 설명", itinerary: [{ time: "10:30", text: "대전역 집결" }] }] })}>추가</Button></div><div className="grid gap-4">{tourList(config).map((t, ti) => <div key={ti} className="rounded-3xl border border-orange-100 bg-orange-50/40 p-4"><Input label="투어명" value={t.title} onChange={(v) => setConfig({ ...config, tourPackages: tourList(config).map((x, i) => i === ti ? { ...x, title: v } : x) })} /><div className="mt-3"><Input label="날짜" type="date" value={t.date} onChange={(v) => setConfig({ ...config, tourPackages: tourList(config).map((x, i) => i === ti ? { ...x, date: v } : x) })} /></div><div className="mt-3"><Input label="이미지 URL" value={t.image} onChange={(v) => setConfig({ ...config, tourPackages: tourList(config).map((x, i) => i === ti ? { ...x, image: v } : x) })} /></div><div className="mt-3"><Area label="투어 설명" value={t.description} onChange={(v) => setConfig({ ...config, tourPackages: tourList(config).map((x, i) => i === ti ? { ...x, description: v } : x) })} /></div><div className="mt-4 grid gap-2">{t.itinerary.map((it, ii) => <div key={ii} className="grid gap-2 sm:grid-cols-[90px_1fr]"><input value={it.time} onChange={(e) => setConfig({ ...config, tourPackages: tourList(config).map((x, i) => i === ti ? { ...x, itinerary: x.itinerary.map((a, j) => j === ii ? { ...a, time: e.target.value } : a) } : x) })} className="h-10 rounded-xl border px-3" /><input value={it.text} onChange={(e) => setConfig({ ...config, tourPackages: tourList(config).map((x, i) => i === ti ? { ...x, itinerary: x.itinerary.map((a, j) => j === ii ? { ...a, text: e.target.value } : a) } : x) })} className="h-10 rounded-xl border px-3" /></div>)}</div></div>)}</div></Card>; }
function AdminText({ config, setConfig }) { return <Card className="p-6 shadow-sm"><h2 className="mb-4 text-2xl font-black">하단 문구 / 약관 수정</h2><Area label="포함사항 - 줄바꿈 구분" value={config.notices.included.join("\n")} onChange={(v) => setConfig({ ...config, notices: { ...config.notices, included: v.split("\n").filter(Boolean) } })} /><div className="mt-3"><Area label="취소안내 - 줄바꿈 구분" value={config.notices.cancellation.join("\n")} onChange={(v) => setConfig({ ...config, notices: { ...config.notices, cancellation: v.split("\n").filter(Boolean) } })} /></div><div className="mt-3"><Area label="문의 - 줄바꿈 구분" value={config.notices.inquiry.join("\n")} onChange={(v) => setConfig({ ...config, notices: { ...config.notices, inquiry: v.split("\n").filter(Boolean) } })} /></div><div className="mt-3"><Area label="이용약관" value={config.legalPages.terms.content} onChange={(v) => setConfig({ ...config, legalPages: { ...config.legalPages, terms: { ...config.legalPages.terms, content: v } } })} /></div><div className="mt-3"><Area label="개인정보처리방침" value={config.legalPages.privacy.content} onChange={(v) => setConfig({ ...config, legalPages: { ...config.legalPages, privacy: { ...config.legalPages.privacy, content: v } } })} /></div><div className="mt-3"><Area label="고객센터" value={config.legalPages.support.content} onChange={(v) => setConfig({ ...config, legalPages: { ...config.legalPages, support: { ...config.legalPages.support, content: v } } })} /></div></Card>; }
function AdminReservations({ reservations, setReservations }) { return <Card className="p-6 shadow-sm"><h2 className="mb-4 text-2xl font-black">예약 목록</h2><div className="overflow-x-auto rounded-3xl border border-stone-100"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-stone-100"><tr><th className="p-3">예약자</th><th className="p-3">날짜</th><th className="p-3">인원</th><th className="p-3">금액</th><th className="p-3">상태</th><th className="p-3">삭제</th></tr></thead><tbody>{reservations.length === 0 ? <tr><td colSpan="6" className="p-6 text-center text-stone-500">아직 예약이 없습니다.</td></tr> : reservations.map((r) => <tr key={r.id} className="border-t"><td className="p-3 font-bold">{r.name}<br /><span className="font-normal text-stone-500">{r.phone}</span></td><td className="p-3">{r.date}</td><td className="p-3">{r.people}명</td><td className="p-3">{won(r.amount)}</td><td className="p-3"><select value={r.status} onChange={(e) => setReservations(reservations.map((x) => x.id === r.id ? { ...x, status: e.target.value } : x))} className="rounded-xl border px-2 py-1"><option>결제대기</option><option>결제완료</option><option>취소</option></select></td><td className="p-3"><Button variant="danger" onClick={() => setReservations(reservations.filter((x) => x.id !== r.id))}>삭제</Button></td></tr>)}</tbody></table></div></Card>; }

export default function App() {
  const [config, setConfig] = useState(() => load(STORAGE_KEY, defaultConfig));
  const [reservations, setReservations] = useState(() => { try { return JSON.parse(localStorage.getItem(RESERVATION_KEY) || "[]"); } catch { return []; } });
  const [mode, setMode] = useState("home");
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", date: defaultConfig.tourPackages[0].date, people: 1 });

  useEffect(() => save(STORAGE_KEY, config), [config]);
  useEffect(() => save(RESERVATION_KEY, reservations), [reservations]);

  function login() { if (password === ADMIN_PASSWORD) { setAuthed(true); setPassword(""); setNotice(""); } else setNotice("관리자 비밀번호가 다릅니다. 기본 비밀번호는 admin1234 입니다."); }
  function reserve() {
    const current = countPeople(reservations, form.date);
    const req = clamp(form.people, 1, Number(config.maxPeople || 1));
    const seats = Math.max(0, Number(config.maxPeople || 1) - current);
    if (!form.name.trim() || !form.phone.trim() || !form.date) return setNotice("이름, 연락처, 투어 날짜를 입력해주세요.");
    if (seats <= 0) return setNotice("해당 날짜는 예약이 완료되었습니다. 다른 날짜를 선택해주세요.");
    if (req > seats) return setNotice(`잔여 좌석은 ${seats}석입니다. 인원을 다시 선택해주세요.`);
    const item = { id: Date.now(), name: form.name.trim(), phone: form.phone.trim(), date: form.date, people: req, amount: req * Number(config.pricePerPerson || 0), status: "결제대기", createdAt: new Date().toLocaleString("ko-KR") };
    setReservations([item, ...reservations]);
    setNotice("예약이 접수되었습니다. 결제 프로그램 연동 전까지는 결제대기 상태로 저장됩니다.");
    setForm({ name: "", phone: "", date: form.date, people: 1 });
  }
  function resetAll() { setConfig(defaultConfig); setReservations([]); setNotice("기본 설정과 예약 데이터가 초기화되었습니다."); }

  return <div className="min-h-screen bg-[#fff8ef] text-stone-900"><header className="sticky top-0 z-40 border-b border-orange-100 bg-white/90 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><button onClick={() => setMode("home")} className="flex items-center gap-3 text-left"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white">🚌</div><div><p className="text-xl font-black">{config.title}</p><p className="text-xs font-bold text-stone-500">Daejeon Bakery Bus Tour</p></div></button><nav className="flex gap-2"><Button variant="ghost" onClick={() => setMode("home")}>예약하기</Button><Button variant="ghost" onClick={() => setMode("admin")}>관리자</Button></nav></div></header>{notice && <div className="mx-auto mt-5 max-w-7xl px-5"><div className="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-700">{notice}</div></div>}{mode === "home" ? <><Home config={config} reservations={reservations} form={form} setForm={setForm} reserve={reserve} /><Footer config={config} /></> : <Admin config={config} setConfig={setConfig} reservations={reservations} setReservations={setReservations} authed={authed} password={password} setPassword={setPassword} login={login} logout={() => setAuthed(false)} resetAll={resetAll} />}</div>;
}
