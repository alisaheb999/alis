import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/v1/text/deactivate-license")({
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
          await t.log(d, request, { action: "deactivate", result: "error", license_key: key, machine_id: machine, error_code: `token_${p}` });
          return t.fail(p === "bad" ? "invalid_token" : "token_expired", "A valid token for this device is required.", 401);
        }
        try {
          const { data, error } = await d.rpc("text_deactivate_license", { p_license: p.lid, p_machine: machine });
          if (error) throw error;
          await t.log(d, request, { action: "deactivate", result: data ? "ok" : "error", license_id: p.lid, license_key: key, machine_id: machine, error_code: data ? null : "device_not_active" });
          if (!data) return t.fail("device_not_active", "This device is not activated.", 404);
          return t.reply({ ok: true, data: { license_key: key, machine_id: machine, deactivated: true } });
        } catch {
          return t.fail("server_error", "Could not deactivate right now.", 500);
        }
      },
    },
  },
});
