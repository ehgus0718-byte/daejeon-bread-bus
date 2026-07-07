import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MID = Deno.env.get('NICEPAY_MID') || 'somangt01m';
const SIGN_KEY = Deno.env.get('NICEPAY_SIGN_KEY') || 'IOSbs3hgPu8HH1oe3Ykz6gTVTxlG/aXGFtqj15WBH7yuGBAC9gwcYyN9oqurG65esabKt7VR09bN4pqtgFCkzg==';
const SUPABASE_URL = 'https://mnwimnwdilerkktizzqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2ltbndkaWxlcmtrdGl6enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzM2MjMsImV4cCI6MjA2Mzc0OTYyM30.pFCnb6G3BuFiQ72H-eCbMaEJFVy0KJHD-IFsTqCqGgg';
const SITE_URL = 'https://xn--vk1bm4puqbp6gr2h.com';
const SMS_URL = `${SUPABASE_URL}/functions/v1/send-reservation-status-sms`;
const ADMIN_PHONE = '01045606701';
const BOARDING_TIME = '10:00';

async function sha256hex(str: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
function buildFormBody(p: Record<string,string>): string {
  return Object.entries(p).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}
function getEdiDate(): string {
  const now = new Date();
  const p = (n:number) => String(n).padStart(2,'0');
  return `${now.getFullYear()}${p(now.getMonth()+1)}${p(now.getDate())}${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}`;
}
function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
function normalizePhone(v: string): string {
  return String(v || '').replace(/\D/g, '');
}
// GoodsName("대전빵버스 2026-07-28 (1명)")에서 날짜 추출 — DB조회/ReqReserved 모두 실패했을 때의 3차 fallback
function extractDateFromGoodsName(goodsName: string): string {
  const match = String(goodsName || '').match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}
function html(success: boolean, title: string, desc: string, detail: string): string {
  const icon = success ? '\uD83C\uDF89' : '\u26A0\uFE0F';
  const bs = success ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0' : 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca';
  const redir = success ? `<script>setTimeout(()=>{location.href='${SITE_URL}'},3000)<\/script>` : '';
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff8ef;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:white;border-radius:24px;padding:40px 28px;max-width:420px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}.icon{font-size:52px;margin-bottom:16px}.title{font-size:22px;font-weight:900;color:#0c0a09;margin-bottom:8px}.desc{font-size:14px;font-weight:600;color:#78716c;line-height:1.6}.badge{padding:12px 16px;border-radius:14px;font-size:13px;font-weight:700;margin-top:12px}.note{margin-top:12px;font-size:12px;color:#a8a29e}.btn{display:inline-block;margin-top:20px;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:900;text-decoration:none;background:#f97316;color:white}</style></head><body><div class="card"><div class="icon">${icon}</div><div class="title">${title}</div><div class="desc">${desc}</div>${detail?`<div class="badge" style="${bs}">${detail}</div>`:''} ${success?'<div class="note">\uC608\uC57D \uD655\uC815 \uBB38\uC790\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.<br>3\uCD08 \uD6C4 \uD648\uC73C\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.</div>':`<a href="${SITE_URL}" class="btn">\uD648\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30</a>`}</div>${redir}</body></html>`;
}

async function sendSms(phone: string, status: string, name: string, date: string) {
  const p = normalizePhone(phone);
  if (!/^010\d{8}$/.test(p)) {
    console.warn(`SMS skip [${status}]: phone="${phone}" -> "${p}"`);
    return;
  }
  try {
    const r = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ phone: p, status, name, date, boardingTime: BOARDING_TIME }),
      signal: AbortSignal.timeout(8000),
    });
    const result = await r.json();
    console.log(`SMS [${status}] -> ${p}: ok=${result.ok}, name="${name}", date="${date}"`);
  } catch(e) { console.warn(`SMS fail(${p}):`, e); }
}

const DB_HEADERS = { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` };

async function getReservationById(id: string): Promise<Record<string,unknown>|null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}&select=id,reservation_date,name,phone,people,status`, { headers: DB_HEADERS, signal: AbortSignal.timeout(5000) });
  const rows = await r.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}
async function updateReservation(id: string, patch: Record<string,unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...DB_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(patch),
    signal: AbortSignal.timeout(5000),
  });
}
async function insertReservation(data: Record<string,unknown>): Promise<void> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
    method: 'POST',
    headers: { ...DB_HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    console.warn('reservations INSERT 실패:', r.status, t);
  } else {
    console.log('reservations INSERT 성공');
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(html(false, '잘못된 요청', '', ''), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const rawText = await req.text();
  let params: Record<string,string> = {};
  try {
    new URLSearchParams(rawText).forEach((v, k) => { params[k] = v; });
    if (!Object.keys(params).length && rawText.startsWith('{')) params = JSON.parse(rawText);
  } catch(e) {
    return new Response(html(false, '파라미터 오류', '', String(e)), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const authResultCode = params['AuthResultCode'] || '';
  const authResultMsg  = params['AuthResultMsg'] || '';
  const authToken      = params['AuthToken'] || '';
  const txTid          = params['TxTid'] || '';
  const amt            = params['Amt'] || '';
  const nextAppURL     = params['NextAppURL'] || '';
  const netCancelURL   = params['NetCancelURL'] || '';
  const moid           = params['Moid'] || '';
  // 나이스페이 폼에서 직접 오는 구매자 정보
  const buyerTel       = normalizePhone(params['BuyerTel'] || '');
  const buyerName      = (params['BuyerName'] || '').trim();
  // GoodsName은 나이스페이 표준 필드라 DB조회/ReqReserved가 모두 실패해도 그대로 돌아옴 (투어일 3차 fallback용)
  const goodsNameParam = params['GoodsName'] || '';

  // ReqReserved 파싱 — JSON 파싱 실패 시 로그 + 빈 객체로 진행
  let reservedInfo: Record<string,string> = {};
  const rawReserved = params['ReqReserved'] || '';
  try {
    if (rawReserved) reservedInfo = JSON.parse(rawReserved);
  } catch(e) {
    console.warn(`ReqReserved JSON 파싱 실패: "${rawReserved}" / 오류: ${e}`);
  }

  const reservedDate   = reservedInfo['date'] || '';
  const reservedPhone  = normalizePhone(reservedInfo['buyerTel'] || '');
  // buyerName 필드 + 폼 파라미터 BuyerName 모두 fallback
  const reservedName   = (reservedInfo['buyerName'] || '').trim();
  const reservedPeople = Number(reservedInfo['people'] || 1);
  const reservedId     = reservedInfo['reservationId'] || '';

  console.log(`[return] authCode=${authResultCode}, Moid=${moid}`);
  console.log(`[params] buyerTel=${buyerTel}, buyerName="${buyerName}"`);
  console.log(`[reserved] date=${reservedDate}, name="${reservedName}", phone=${reservedPhone}, id=${reservedId}`);

  if (authResultCode !== '0000') {
    if (moid && isUuid(moid)) await updateReservation(moid, { status: '결제실패' }).catch(() => {});
    return new Response(html(false, '결제 인증 실패', '결제가 취소되었거나 인증에 실패했습니다.', `오류: ${authResultMsg || authResultCode}`), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  // DB에서 pending 예약 조회
  let reservation: Record<string,unknown> | null = null;
  const lookupId = (moid && isUuid(moid)) ? moid : ((reservedId && isUuid(reservedId)) ? reservedId : '');
  if (lookupId) {
    reservation = await getReservationById(lookupId).catch(() => null);
    console.log(`[DB] id=${lookupId}, found=${!!reservation}, name="${reservation?.['name'] || ''}", date=${reservation?.['reservation_date'] || ''}, phone=${reservation?.['phone'] || ''}`);
  }

  // 승인 API 호출
  const ediDate  = getEdiDate();
  const signData = await sha256hex(authToken + MID + amt + ediDate + SIGN_KEY);
  const approveParams = { TID: txTid, AuthToken: authToken, MID, Amt: amt, EdiDate: ediDate, SignData: signData, CharSet: 'utf-8', EdiType: 'JSON' };

  let approveResult: Record<string,unknown>;
  try {
    const r = await fetch(nextAppURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=euc-kr' },
      body: buildFormBody(approveParams),
      signal: AbortSignal.timeout(10000),
    });
    approveResult = JSON.parse(await r.text());
  } catch {
    try { await fetch(netCancelURL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=euc-kr' }, body: buildFormBody({ ...approveParams, NetCancel: '1' }), signal: AbortSignal.timeout(5000) }); } catch {}
    if (lookupId) await updateReservation(lookupId, { status: '결제실패' }).catch(() => {});
    return new Response(html(false, '결제 승인 오류', '결제 승인 중 오류가 발생했습니다.', ''), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const resultCode = approveResult.ResultCode as string;
  const payMethod  = (approveResult.PayMethod || params['PayMethod'] || 'CARD') as string;
  const successCodes: Record<string,string> = { CARD: '3001', BANK: '4000', VBANK: '4100', CELLPHONE: 'A000' };
  const isSuccess  = resultCode === successCodes[payMethod] || resultCode === '3001';

  if (!isSuccess) {
    if (lookupId) await updateReservation(lookupId, { status: '결제실패' }).catch(() => {});
    return new Response(html(false, '결제 승인 실패', '', `${approveResult.ResultMsg || ''} (${resultCode})`), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const amtNum = Number(approveResult.Amt || amt);
  const tid    = String(approveResult.TID || txTid);
  // 나이스페이 승인응답에도 BuyerTel이 올 수 있음
  const approveBuyerTel = normalizePhone(String(approveResult.BuyerTel || ''));
  // 승인응답에도 GoodsName이 올 수 있음 (폼파라미터 GoodsName과 함께 fallback 후보)
  const approveGoodsName = String(approveResult.GoodsName || '');
  const goodsNameDate = extractDateFromGoodsName(goodsNameParam) || extractDateFromGoodsName(approveGoodsName);

  // 최종값 결정: DB > 폼파라미터(BuyerName/BuyerTel) > ReqReserved 순서
  // DB가 가장 신뢰할 수 있고, 폼파라미터는 나이스페이가 직접 전달하므로 그 다음 우선순위
  const dbPhone  = normalizePhone(String(reservation?.['phone'] || ''));
  const dbName   = String(reservation?.['name'] || '').trim();
  const dbDate   = String(reservation?.['reservation_date'] || '').trim();

  const finalPhone = dbPhone || approveBuyerTel || buyerTel || reservedPhone;
  const finalName  = dbName || buyerName || reservedName;
  // 투어일 3차 fallback: DB > ReqReserved > GoodsName("대전빵버스 2026-07-28 (1명)")에서 추출
  // 기존엔 DB조회와 ReqReserved 파싱이 모두 실패하면 투어일이 완전히 빈 값이 되어 문자에서 "투어일" 줄이 통째로 빠졌음.
  // GoodsName은 나이스페이가 결제 전 과정에서 그대로 왕복시키는 표준 필드라 안정적인 마지막 fallback으로 사용.
  const finalDate  = dbDate || reservedDate || goodsNameDate;

  console.log(`[final] phone="${finalPhone}", name="${finalName}", date="${finalDate}" (goodsNameDate="${goodsNameDate}")`);

  // DB 업데이트 또는 INSERT
  if (reservation?.['id']) {
    await updateReservation(String(reservation['id']), {
      status: '결제완료',
      amount: amtNum,
      admin_note: `TID:${tid}`,
    }).catch(e => console.warn('update fail:', e));
  } else {
    if (finalDate) {
      await insertReservation({
        reservation_date: finalDate,
        name:             finalName || '고객',
        phone:            finalPhone || '',
        people:           reservedPeople || 1,
        amount:           amtNum,
        status:           '결제완료',
        admin_note:       `TID:${tid}`,
      });
    } else {
      console.warn('finalDate 없음 — INSERT 스킵');
    }
  }

  await Promise.allSettled([
    sendSms(finalPhone, '결제완료', finalName, finalDate),
    sendSms(ADMIN_PHONE, '예약접수', finalName, finalDate),
  ]);

  return new Response(
    html(true, '결제 완료!', '예약이 확정되었습니다.', `결제금액: ${amtNum.toLocaleString()}원 · 승인번호: ${approveResult.AuthCode || '-'}`),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
});
