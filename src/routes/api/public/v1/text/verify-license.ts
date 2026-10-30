import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/text/verify-license")({
  server: {
    handlers: {
      OPTIONS: async () => (await import("@/lib/text-license.server")).preflight(),
      POST: async ({ request }) => {
        const t = await import("@/lib/text-license.server");
        const b = await t.readJson(request);
        if (!b) return t.fail("bad_request", "Body must be JSON.");
        const key = t.normKey(b["license_key"]);
        const machine = t.str(b["machine_id"], 200);
        const token = t.str(b["token"], 2048);
        if (!key || !machine || !token) return t.fail("bad_request", "license_key, machine_id and token are required.");
        const d = await t.db();
        const p = await t.checkToken(token, key, machine);
        if (p === "bad" || p === "expired") {
          await t.log(d, request, { action: "verify", result: "error", license_key: key, machine_id: machine, error_code: `token_${p}` });
          return t.fail(p === "bad" ? "invalid_token" : "token_expired", p === "bad" ? "Token is invalid." : "Token has expired. Activate again.", 401);
        }
        try {
          const lic = await t.licenceData(d, key);
          let code: string | null = null;
          if (!lic || lic.id !== p.lid) code = "not_found";
          else if (lic.status !== "active") code = `license_${lic.status}`;
          else if (lic.expires_at && Date.parse(lic.expires_at) <= Date.now()) code = "license_expired";
          if (!code) {
            const { data: act } = await d
              .from("license_activations")
              .select("id, revoked")
              .eq("license_id", p.lid)
              .eq("device_fingerprint", machine)
              .maybeSingle();
            if (!act || act.revoked) code = "device_not_active";
            else await d.from("license_activations").update({ last_seen_at: new Date().toISOString() }).eq("id", act.id);
          }
          if (code) {
            await t.log(d, request, { action: "verify", result: "error", license_id: p.lid, license_key: key, machine_id: machine, error_code: code });
            const [msg, status] = t.MESSAGES[code] ?? ["This device is no longer activated.", 403];
            return t.fail(code, msg, status);
          }
          const { token: fresh, exp } = await t.signToken({ lid: p.lid, k: key, m: machine }, lic!.expires_at);
          await t.log(d, request, { action: "verify", result: "ok", license_id: p.lid, license_key: key, machine_id: machine });
          const { id: _id, ...data } = lic!;
          return t.reply({ ok: true, data: { ...data, token: fresh, token_expires_at: new Date(exp * 1000).toISOString() } });
        } catch {
          return t.fail("server_error", "Could not verify right now.", 500);
        }
      },
    },
  },
});
