import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/text/activate-license")({
  server: {
    handlers: {
      OPTIONS: async () => (await import("@/lib/text-license.server")).preflight(),
      POST: async ({ request }) => {
        const t = await import("@/lib/text-license.server");
        const b = await t.readJson(request);
        if (!b) return t.fail("bad_request", "Body must be JSON.");
        const key = t.normKey(b["license_key"]);
        const machine = t.str(b["machine_id"], 200);
        const device = t.str(b["device_name"], 120);
        const version = t.str(b["app_version"], 40);
        const os = t.str(b["os_info"], 120);
        if (!key || key.length > 80 || !machine || !device || !version || !os)
          return t.fail("bad_request", "license_key, machine_id, device_name, app_version and os_info are required.");
        const d = await t.db();
        try {
          const { data, error } = await d.rpc("text_activate_license", {
            p_key: key, p_machine: machine, p_device_name: device, p_app_version: version, p_os_info: os,
          });
          if (error) throw error;
          const r = data as { ok: boolean; code?: string; license_id?: string };
          if (!r.ok) {
            await t.log(d, request, { action: "activate", result: "error", license_id: r.license_id, license_key: key, machine_id: machine, error_code: r.code });
            const [msg, status] = t.MESSAGES[r.code ?? ""] ?? ["Activation failed.", 400];
            return t.fail(r.code ?? "failed", msg, status);
          }
          const lic = await t.licenceData(d, key);
          if (!lic) return t.fail("not_found", "License not found.", 404);
          const { token, exp } = await t.signToken({ lid: lic.id, k: key, m: machine }, lic.expires_at);
          await t.log(d, request, { action: "activate", result: "ok", license_id: lic.id, license_key: key, machine_id: machine, details: { app_version: version } });
          const { id: _id, ...data_ } = lic;
          return t.reply({ ok: true, data: { ...data_, token, token_expires_at: new Date(exp * 1000).toISOString() } });
        } catch {
          await t.log(d, request, { action: "activate", result: "error", license_key: key, machine_id: machine, error_code: "server_error" });
          return t.fail("server_error", "Could not activate right now.", 500);
        }
      },
    },
  },
});
