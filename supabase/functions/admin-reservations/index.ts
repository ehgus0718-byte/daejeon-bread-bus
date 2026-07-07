import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

const SELECT_COLUMNS =
  "id,reservation_date,name,phone,people,amount,status,admin_note,created_at";

function normalizeRow(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    id: row.id,
    date: row.reservation_date,
    name: row.name || "",
    phone: row.phone || "",
    people: Number(row.people || 1),
    amount: Number(row.amount || 0),
    status: row.status || "결제대기",
    adminNote: row.admin_note || "",
    createdAt: row.created_at || ""
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "지원하지 않는 요청입니다." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const adminAccessCode = Deno.env.get("ADMIN_ACCESS_CODE") || "";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ ok: false, message: "서버 설정이 없습니다." }, 500);
    }

    if (!adminAccessCode) {
      return jsonResponse({ ok: false, message: "관리자 접근 코드가 설정되지 않았습니다." }, 503);
    }

    const body = await request.json().catch(() => ({}));
    const accessCode = String(body.accessCode || "");
    const action = String(body.action || "");

    if (accessCode.length === 0 || accessCode !== adminAccessCode) {
      return jsonResponse({ ok: false, message: "관리자 인증에 실패했습니다." }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (action === "list") {
      const limit = Number(body.limit || 0);
      let query = supabase
        .from("reservations")
        .select(SELECT_COLUMNS)
        .order("reservation_date", { ascending: false });
      if (Number.isInteger(limit) && limit > 0) {
        query = query.range(0, limit - 1);
      }
      const { data, error } = await query;
      if (error) {
        console.error("admin list failed", error);
        return jsonResponse({ ok: false, message: "예약 조회에 실패했습니다." }, 500);
      }
      return jsonResponse({
        ok: true,
        reservations: (data || []).map(normalizeRow).filter(Boolean)
      });
    }

    if (action === "update") {
      const id = String(body.id || "");
      if (!id) return jsonResponse({ ok: false, message: "예약 ID가 없습니다." }, 400);
      const patch: Record<string, unknown> = {};
      if (body.status !== undefined) patch.status = String(body.status);
      if (body.adminNote !== undefined) patch.admin_note = String(body.adminNote || "");
      if (Object.keys(patch).length === 0) {
        return jsonResponse({ ok: true, reservation: null });
      }
      const { data, error } = await supabase
        .from("reservations")
        .update(patch)
        .eq("id", id)
        .select(SELECT_COLUMNS)
        .single();
      if (error) {
        console.error("admin update failed", error);
        return jsonResponse({ ok: false, message: "예약 수정에 실패했습니다." }, 500);
      }
      return jsonResponse({ ok: true, reservation: normalizeRow(data) });
    }

    if (action === "remove") {
      const id = String(body.id || "");
      if (!id) return jsonResponse({ ok: false, message: "예약 ID가 없습니다." }, 400);
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) {
        console.error("admin remove failed", error);
        return jsonResponse({ ok: false, message: "예약 삭제에 실패했습니다." }, 500);
      }
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, message: "알 수 없는 요청입니다." }, 400);
  } catch (error) {
    console.error("admin-reservations error", error);
    return jsonResponse({ ok: false, message: "관리자 요청 처리 중 오류가 발생했습니다." }, 500);
  }
});
