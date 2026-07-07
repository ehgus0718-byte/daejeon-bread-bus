import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MID = Deno.env.get('NICEPAY_MID') || 'somangt01m';
const SIGN_KEY = Deno.env.get('NICEPAY_SIGN_KEY') || 'IOSbs3hgPu8HH1oe3Ykz6gTVTxlG/aXGFtqj15WBH7yuGBAC9gwcYyN9oqurG65esabKt7VR09bN4pqtgFCkzg==';
const SUPABASE_URL = 'https://mnwimnwdilerkktizzqn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ud2ltbndkaWxlcmtrdGl6enFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzM2MjMsImV4cCI6MjA2Mzc0OTYyM30.pFCnb6G3BuFiQ72H-eCbMaEJFVy0KJHD-IFsTqCqGgg';

async function sha256hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function getEdiDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2,'0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Prefer': 'return=minimal',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const { Amt, Moid, BuyerName, BuyerTel, GoodsName, ReturnURL, ReqReserved } = await req.json();
    if (!Amt || !Moid) return new Response(JSON.stringify({ ok: false, message: '필수 파라미터 누락 (Amt, Moid)' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } });

    const EdiDate = getEdiDate();
    const SignData = await sha256hex(EdiDate + MID + Amt + SIGN_KEY);

    // Moid가 UUID(pending reservation_id)면 phone을 DB에 UPDATE
    // Moid가 fallback(BUS...)이면 INSERT로 예약 생성
    const phone = (BuyerTel || '').replace(/\D/g, '');
    if (phone && isUuid(Moid)) {
      // pending 예약에 phone UPDATE (이미 저장된 행)
      await fetch(`${SUPABASE_URL}/rest/v1/reservations?id=eq.${Moid}`, {
        method: 'PATCH',
        headers: DB_HEADERS,
        body: JSON.stringify({ phone }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {});
      console.log(`nicepay-sign: UUID Moid ${Moid} phone PATCH → ${phone}`);
    } else if (phone && !isUuid(Moid)) {
      // fallback Moid: admin_note에 Moid+phone 저장해둠 (nicepay-return에서 조회용)
      // reservations에 임시 행 INSERT
      let reservedInfo: Record<string, string> = {};
      try { reservedInfo = JSON.parse(ReqReserved || '{}'); } catch {}
      const reservationDate = reservedInfo['date'] || '';
      // ✅ 인원 구성(성인/아동/유아)이 함께 왔으면 관리자 메모에 남김 (PC 예약과 동일 포맷)
      const adultCount  = reservedInfo['adultCount'] !== undefined ? Number(reservedInfo['adultCount']) : null;
      const childCount  = reservedInfo['childCount'] !== undefined ? Number(reservedInfo['childCount']) : null;
      const infantCount = reservedInfo['infantCount'] !== undefined ? Number(reservedInfo['infantCount']) : null;
      const passengerSummary = (adultCount !== null && childCount !== null && infantCount !== null)
        ? `성인 ${adultCount}명 / 아동 ${childCount}명 / 유아 ${infantCount}명 · `
        : '';
      if (reservationDate) {
        await fetch(`${SUPABASE_URL}/rest/v1/reservations`, {
          method: 'POST',
          headers: DB_HEADERS,
          body: JSON.stringify({
            reservation_date: reservationDate,
            name: BuyerName || '고객',
            phone,
            people: 1,
            amount: Number(Amt) || 0,
            status: '결제대기',
            admin_note: `${passengerSummary}MOID:${Moid}`,
          }),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
        console.log(`nicepay-sign: fallback Moid INSERT phone=${phone}, moid=${Moid}`);
      }
    }

    return new Response(JSON.stringify({
      ok: true, MID, EdiDate, SignData,
      Amt: String(Amt), Moid,
      GoodsName: GoodsName || '대전빵버스',
      BuyerName: BuyerName || '',
      BuyerTel: BuyerTel || '',
      ReturnURL: ReturnURL || '',
      ReqReserved: ReqReserved || '',
      CharSet: 'utf-8', GoodsCl: '1', TransType: '0',
    }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch (err) {
    console.error('nicepay-sign 오류:', err);
    return new Response(JSON.stringify({ ok: false, message: '서버 내부 오류' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
});
