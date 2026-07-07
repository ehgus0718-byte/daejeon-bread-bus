import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MID = Deno.env.get('NICEPAY_MID') || 'somangt01m';
const SIGN_KEY = Deno.env.get('NICEPAY_SIGN_KEY') || 'IOSbs3hgPu8HH1oe3Ykz6gTVTxlG/aXGFtqj15WBH7yuGBAC9gwcYyN9oqurG65esabKt7VR09bN4pqtgFCkzg==';

async function sha256hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function buildFormBody(params: Record<string, string>): string {
  return Object.entries(params).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

function getEdiDate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2,'0');
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  try {
    const body = await req.json();
    const { AuthResultCode, AuthToken, TxTid, Amt, NextAppURL, NetCancelURL, PayMethod } = body;
    if (AuthResultCode !== '0000') {
      return new Response(JSON.stringify({ ok: false, message: `인증 실패: ${body.AuthResultMsg || AuthResultCode}` }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } });
    }
    const expectedAmt = body.expectedAmt;
    if (expectedAmt && String(Amt) !== String(expectedAmt)) {
      return new Response(JSON.stringify({ ok: false, message: '결제 금액 위변조가 감지되었습니다.' }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } });
    }
    const ediDate = getEdiDate();
    const signData = await sha256hex(AuthToken + MID + Amt + ediDate + SIGN_KEY);
    const approveParams: Record<string, string> = { TID: TxTid, AuthToken, MID, Amt, EdiDate: ediDate, SignData: signData, CharSet: 'utf-8', EdiType: 'JSON' };
    let approveResult: Record<string, unknown>;
    try {
      const approveResp = await fetch(NextAppURL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=euc-kr' }, body: buildFormBody(approveParams), signal: AbortSignal.timeout(10000) });
      approveResult = JSON.parse(await approveResp.text());
    } catch (fetchErr) {
      console.error('승인 API 실패, 망취소 진행:', fetchErr);
      try { await fetch(NetCancelURL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=euc-kr' }, body: buildFormBody({ ...approveParams, NetCancel: '1' }), signal: AbortSignal.timeout(5000) }); } catch {}
      return new Response(JSON.stringify({ ok: false, message: '결제 승인 통신 오류. 망취소 처리되었습니다.' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
    }
    const resultCode = approveResult.ResultCode as string;
    const method = (approveResult.PayMethod || PayMethod) as string;
    const successCodes: Record<string,string> = { CARD:'3001', BANK:'4000', VBANK:'4100', CELLPHONE:'A000' };
    const isSuccess = resultCode === successCodes[method] || resultCode === '3001';
    if (!isSuccess) return new Response(JSON.stringify({ ok: false, message: approveResult.ResultMsg || '결제 승인 실패', ResultCode: resultCode }), { status: 400, headers: { 'Content-Type': 'application/json', ...CORS } });
    return new Response(JSON.stringify({
      ok: true,
      TID: approveResult.TID, ResultCode: resultCode, ResultMsg: approveResult.ResultMsg,
      PayMethod: approveResult.PayMethod, Amt: approveResult.Amt,
      AuthCode: approveResult.AuthCode, AuthDate: approveResult.AuthDate,
      GoodsName: approveResult.GoodsName, CardName: approveResult.CardName,
    }), { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch (err) {
    console.error('nicepay-approve 오류:', err);
    return new Response(JSON.stringify({ ok: false, message: '서버 내부 오류' }), { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } });
  }
});
