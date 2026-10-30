/* Ghost Motion transaction engine. ES3/ExtendScript safe. */
(function (root) {
  "use strict";
  var VERSION = 1;

  function fail(stage, message, details) {
    return { ok: false, stage: stage, error: String(message || "Unknown error"), details: details || [] };
  }

  function validate(plan, adapter) {
    var errors = [];
    if (!plan || plan.version < 3) errors.push("A Ghost Motion v3 execution plan is required.");
    if (!plan || !plan.signature) errors.push("Execution plan has no stable signature.");
    if (!plan || !plan.operations || !plan.operations.length) errors.push("Execution plan has no operations.");
    if (!adapter) errors.push("Apply adapter is missing.");
    var required = ["begin", "resolve", "apply", "verify", "commit", "rollback"];
    for (var i = 0; i < required.length; i += 1) {
      if (!adapter || typeof adapter[required[i]] !== "function") errors.push("Apply adapter is missing " + required[i] + "().");
    }
    return errors;
  }

  function execute(plan, adapter, options) {
    var errors = validate(plan, adapter);
    if (errors.length) return fail("validate", errors.join(" "), errors);
    var opts = options || {}, retries = Number(opts.retries);
    if (!isFinite(retries) || retries < 0) retries = 1;
    if (retries > 2) retries = 2;
    var log = [], last = null;
    for (var attempt = 0; attempt <= retries; attempt += 1) {
      var tx = null;
      try {
        log.push("attempt " + (attempt + 1) + ": begin " + plan.signature);
        tx = adapter.begin(plan, attempt);
        if (!tx) throw new Error("Adapter did not create a transaction.");
        for (var i = 0; i < plan.operations.length; i += 1) {
          var resolved = adapter.resolve(tx, plan.operations[i], plan);
          if (!resolved) throw new Error("Could not resolve operation " + i + " (" + plan.operations[i].kind + ").");
          adapter.apply(tx, resolved, plan.operations[i], plan);
        }
        var verification = adapter.verify(tx, plan) || { ok: false, errors: ["Verifier returned no result."] };
        if (!verification.ok) {
          last = fail("verify", (verification.errors || ["Verification failed."]).join(" | "), verification.errors || []);
          log.push("attempt " + (attempt + 1) + ": verification failed");
          adapter.rollback(tx, plan, last);
          continue;
        }
        adapter.commit(tx, plan);
        log.push("attempt " + (attempt + 1) + ": committed");
        return { ok: true, stage: "commit", attempts: attempt + 1, verification: verification, log: log, signature: plan.signature };
      } catch (error) {
        last = fail("apply", error && error.message ? error.message : error);
        log.push("attempt " + (attempt + 1) + ": " + last.error);
        try { if (tx) adapter.rollback(tx, plan, last); } catch (ignored) {}
      }
    }
    last = last || fail("apply", "Apply failed.");
    last.attempts = retries + 1;
    last.log = log;
    return last;
  }

  root.GhostApplyEngine = { VERSION: VERSION, validate: validate, execute: execute };
})(typeof window !== "undefined" ? window : (typeof $ !== "undefined" && $.global ? $.global : this));