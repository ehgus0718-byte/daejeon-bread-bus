import { hasSupabaseConfig, supabaseClient } from "./supabaseClient.js";

const POPUP_TABLE = "site_popup";
const POPUP_ROW_ID = "default";

export const DEFAULT_POPUP = Object.freeze({
  enabled: false,
  display_mode: "image",
  title: "",
  content: "",
  image_url: "",
  link_url: ""
});

function ok(data = null, status = 200) {
  return { ok: true, data, error: null, status };
}

function fail(error, status = 0) {
  return { ok: false, data: null, error: String(error?.message || error || "unknown error"), status };
}

function notConfigured() {
  return fail("Supabase 설정이 없어 팝업 기능을 사용할 수 없습니다.", 503);
}

function sanitizePopupInput(input = {}) {
  const displayMode = input.display_mode === "text" ? "text" : "image";
  return {
    id: POPUP_ROW_ID,
    enabled: input.enabled === true,
    display_mode: displayMode,
    title: String(input.title || "").trim().slice(0, 80),
    content: String(input.content || "").trim().slice(0, 2000),
    image_url: String(input.image_url || "").trim() || null,
    link_url: String(input.link_url || "").trim() || null,
    updated_at: new Date().toISOString()
  };
}

const POPUP_IMAGE_BUCKET = "popup-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extFromFile(file) {
  const fromName = String(file?.name || "").split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = String(file?.type || "").split("/").pop();
  return fromType || "jpg";
}

export const popupClient = {
  async uploadPopupImage(file) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    if (!file) return fail("업로드할 이미지 파일을 선택해주세요.", 400);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return fail("이미지 파일(JPG, PNG, WEBP, GIF)만 업로드할 수 있습니다.", 400);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return fail("이미지 용량은 5MB 이하만 업로드할 수 있습니다.", 400);
    }
    const path = `popup-${Date.now()}.${extFromFile(file)}`;
    const { error: uploadError } = await supabaseClient.storage
      .from(POPUP_IMAGE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) return fail(uploadError, 0);
    const { data } = supabaseClient.storage.from(POPUP_IMAGE_BUCKET).getPublicUrl(path);
    if (!data?.publicUrl) return fail("업로드는 되었지만 공개 URL을 가져오지 못했습니다.", 0);
    return ok({ url: data.publicUrl, path });
  },

  async getPopup() {
    if (!hasSupabaseConfig() || !supabaseClient) return ok({ ...DEFAULT_POPUP });
    const { data, error, status } = await supabaseClient
      .from(POPUP_TABLE)
      .select("*")
      .eq("id", POPUP_ROW_ID)
      .maybeSingle();
    if (error || !data) return ok({ ...DEFAULT_POPUP });
    return ok({ ...DEFAULT_POPUP, ...data }, status);
  },

  async savePopup(input = {}) {
    if (!hasSupabaseConfig() || !supabaseClient) return notConfigured();
    const payload = sanitizePopupInput(input);
    if (payload.enabled) {
      if (payload.display_mode === "image" && !payload.image_url) {
        return fail("이미지 팝업을 켜려면 이미지 URL을 입력해주세요.", 400);
      }
      if (payload.display_mode === "text" && !payload.title && !payload.content) {
        return fail("텍스트 팝업을 켜려면 제목 또는 내용을 입력해주세요.", 400);
      }
    }
    const { data, error, status } = await supabaseClient
      .from(POPUP_TABLE)
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (error) return fail(error, status);
    return ok({ ...DEFAULT_POPUP, ...data }, status);
  }
};
