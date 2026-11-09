import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const allowedOrigin = Deno.env.get("INVITATION_ORIGIN");
const rateLimitSecret = Deno.env.get("RATE_LIMIT_SECRET");

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };

function response(status: number, body: Record<string, unknown>, origin: string | null) {
  const headers = new Headers(jsonHeaders);
  if (origin && origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
    headers.set("Vary", "Origin");
  }
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
}

function normalizeGuestName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function hashFingerprint(ip: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    if (origin !== allowedOrigin) return response(403, { error: "Origen no permitido." }, null);
    return response(204, {}, origin);
  }

  if (request.method !== "POST") {
    return response(405, { error: "Método no permitido." }, origin);
  }

  if (!supabaseUrl || !serviceRoleKey || !allowedOrigin || !rateLimitSecret) {
    console.error("Faltan secretos requeridos para guest-rsvp.");
    return response(503, { error: "El servicio de invitados no está configurado." }, origin);
  }

  if (origin !== allowedOrigin) {
    return response(403, { error: "Origen no permitido." }, null);
  }

  const ip = request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) {
    return response(503, { error: "No se pudo validar la solicitud." }, origin);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const reader = request.body?.getReader();
    if (!reader) {
      return response(400, { error: "Solicitud no válida." }, origin);
    }

    const chunks: Uint8Array[] = [];
    let bodyLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bodyLength += value.byteLength;
      if (bodyLength > 16_384) {
        await reader.cancel();
        return response(413, { error: "La solicitud es demasiado grande." }, origin);
      }
      chunks.push(value);
    }

    const bodyBytes = new Uint8Array(bodyLength);
    let offset = 0;
    for (const chunk of chunks) {
      bodyBytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bodyBytes));
    } catch {
      return response(400, { error: "Solicitud no válida." }, origin);
    }
    if (!isRecord(body)) {
      return response(400, { error: "Solicitud no válida." }, origin);
    }

    const fingerprint = await hashFingerprint(ip, rateLimitSecret);
    const { data: allowed, error: rateError } = await supabase.rpc(
      "consume_guest_rsvp_request",
      { p_fingerprint: fingerprint },
    );
    if (rateError) throw rateError;
    if (!allowed) {
      return response(429, { status: "rate_limited" }, origin);
    }

    if (body.action === "validate") {
      if (typeof body.nombre !== "string" || body.nombre.trim().length < 3 || body.nombre.length > 120) {
        return response(400, { error: "Nombre no válido." }, origin);
      }

      const { data: status, error } = await supabase.rpc(
        "check_invited_guest",
        { p_name: body.nombre },
      );
      if (error) throw error;
      if (!["available", "registered", "not_found"].includes(status)) {
        throw new Error("Estado de invitado inesperado.");
      }
      return response(200, { status }, origin);
    }

    if (body.action === "submit") {
      const answer = body.respuesta;
      if (!isRecord(answer)) {
        return response(400, { error: "Respuesta no válida." }, origin);
      }

      const attendees = answer.invitados;
      if (answer.asistencia === "Sí") {
        if (!Array.isArray(attendees) || attendees.length < 1 || attendees.length > 5) {
          return response(400, { error: "Número de asistentes no válido." }, origin);
        }
        const keys = attendees.map((attendee) =>
          isRecord(attendee) && typeof attendee.nombre === "string"
            ? normalizeGuestName(attendee.nombre)
            : ""
        );
        if (keys.some((name: string) => !name) || new Set(keys).size !== keys.length) {
          return response(400, { status: "duplicate" }, origin);
        }
      }

      const { data: result, error } = await supabase.rpc(
        "submit_guest_rsvp",
        { p_response: answer },
      );
      if (error) throw error;
      if (!result || typeof result.status !== "string") {
        throw new Error("Respuesta inesperada al guardar la confirmación.");
      }
      const httpStatus = result.status === "ok" ? 200 :
        ["not_found", "registered", "duplicate"].includes(result.status) ? 409 :
        result.status === "invalid" ? 400 : 500;
      return response(httpStatus, result, origin);
    }

    return response(400, { error: "Acción no válida." }, origin);
  } catch (error) {
    console.error("Error en guest-rsvp:", error);
    return response(500, { error: "No se pudo procesar la solicitud." }, origin);
  }
});
