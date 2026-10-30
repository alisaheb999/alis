/**
 * Ghostae Caption panel logic.
 * Flow: create job -> multipart upload -> adaptive poll -> apply cues in AE.
 * No worker token is used anywhere: the AE endpoints are open client endpoints.
 * The server URL is built in — the user never has to enter or verify anything.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "ghostCaptionServerUrl";
  var DEFAULT_SERVER = "https://project--964336c5-fd86-4aa6-beae-f4a5ad624063.lovable.app";
  var MAX_BYTES = 500 * 1024 * 1024;
  var POLL_MS = 1500;
  var FAST_POLL_MS = 700;
  var MAX_JOB_MS = 10 * 60 * 1000;
  var MAX_CONSECUTIVE_ERRORS = 6;

  var el = function (id) { return document.getElementById(id); };
  var fileInput = el("file");
  var generate = el("generate");
  var cancelBtn = el("cancel");
  var cancelAllBtn = el("cancelAll");
  var applyBtn = el("apply");
  var statusEl = el("status");
  var resultInfo = el("resultInfo");
  var srtBox = el("srt");
  var fill = el("fill");
  var serverInput = el("serverUrl");
  var saveServer = el("saveServer");
  var serverStatus = el("serverStatus");
  var cueCounter = el("cueCounter");
  var activePresetLabel = el("activePresetLabel");
  var liveCaptionPreview = el("liveCaptionPreview");
  var captionAnim = el("captionAnim");
  var elapsedEl = el("elapsed");
  var pickLayerBtn = el("pickLayer");
  var layerInfo = el("layerInfo");
  var layerSource = null; // { path, name }



  var currentJobId = null;
  var polling = null;
  var lastCues = null;
  var appliedCues = false;
  var idempotencyKey = null;

  var PRESET_MAP = {
    "royal_gold": { template: "royal_gold" },
    "cyan_rise": { template: "cyan_rise" },
    "sunset_glow": { template: "sunset_glow" },
    "platinum_elite": { template: "platinum_elite" }
  };
  var PRESET_KEYS = ["royal_gold", "cyan_rise", "sunset_glow", "platinum_elite"];

  var selectedPresetKey = "royal_gold";
  var selectedTemplate = "royal_gold";

  window.selectPreset = function (presetKey) {
    selectedPresetKey = presetKey;
    var preset = PRESET_MAP[presetKey] || PRESET_MAP["royal_gold"];
    selectedTemplate = preset.template;

    PRESET_KEYS.forEach(function (k) {
      var card = el("preset-" + k);
      if (card) {
        card.className = (k === presetKey) ? "preset-card active" : "preset-card";
      }
    });
  };

  window.checkServerHealth = function () {
    checkHealth();
  };

  /** Stable per-install user identity */
  function userId() {
    var stored = null;
    try { stored = window.localStorage.getItem("ghostae.userId"); } catch (e) { stored = null; }
    if (!stored) {
      stored = "user-" + uuid();
      try { window.localStorage.setItem("ghostae.userId", stored); } catch (e) {}
    }
    return stored;
  }
  var cancelling = false;

  function readServer() {
    var stored = "";
    try { stored = window.localStorage.getItem(STORAGE_KEY) || ""; } catch (e) { stored = ""; }
    return String(stored || DEFAULT_SERVER).replace(/\/+$/, "");
  }

  function writeServer(value) {
    var clean = String(value || "").trim().replace(/\/+$/, "");
    try { window.localStorage.setItem(STORAGE_KEY, clean); } catch (e) { /* ignore */ }
    return clean;
  }

  function api() { return readServer() + "/api/public/caption"; }

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = "status " + (kind || "muted");
  }

  function setProgress(value) {
    fill.style.width = Math.max(0, Math.min(100, Number(value) || 0)) + "%";
  }

  /* ---- Elapsed timer (starts when "ক্যাপশন তৈরি করুন" is clicked) ---- */
  var timerHandle = null;
  var timerStartedAt = 0;

  function formatElapsed(ms) {
    var total = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
  }

  function renderElapsed() {
    if (elapsedEl) elapsedEl.textContent = formatElapsed(Date.now() - timerStartedAt);
  }

  function startTimer() {
    stopTimer(true);
    timerStartedAt = Date.now();
    if (elapsedEl) elapsedEl.style.display = "block";
    renderElapsed();
    timerHandle = window.setInterval(renderElapsed, 1000);
  }

  function stopTimer(hide) {
    if (timerHandle) { window.clearInterval(timerHandle); timerHandle = null; }
    if (hide && elapsedEl) { elapsedEl.style.display = "none"; elapsedEl.textContent = "00:00"; }
  }

  function elapsedText() {
    if (!timerStartedAt) return "";
    return " • সময় লেগেছে " + formatElapsed(Date.now() - timerStartedAt);
  }

  /**
   * Professional, user-facing progress wording.
   * Server messages are intentionally NOT shown: they expose backend steps
   * (upload / worker / AI queue). The user only sees polished stage names.
   */
  function stageText(progress) {
    var p = Number(progress) || 0;
    if (p < 10) return "প্রস্তুতি নেওয়া হচ্ছে";
    if (p < 30) return "মিডিয়া প্রস্তুত করা হচ্ছে";
    if (p < 55) return "ভয়েস বিশ্লেষণ করা হচ্ছে";
    if (p < 80) return "বাংলা টেক্সটে রূপান্তর চলছে";
    if (p < 100) return "টাইমিং সূক্ষ্মভাবে ঠিক করা হচ্ছে";
    return "প্রায় শেষ";
  }


  function errorMessage(data, res) {
    if (data && data.error && typeof data.error === "object") {
      return (data.error.message || "অনুরোধ ব্যর্থ হয়েছে") + " (" + (data.error.code || "ত্রুটি") + ")";
    }
    if (data && typeof data.error === "string") return data.error;
    if (data && typeof data.message === "string") return data.message;
    return "ক্যাপশন সেবা এখন সাড়া দিচ্ছে না (কোড " + (res ? res.status : "?") + ")।";
  }

  function request(path, options) {
    var opts = options || {};
    return fetch(api() + path, opts).then(function (res) {
      return res.text().then(function (text) {
        var data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (e) { data = {}; }
        if (!res.ok || data.ok === false) throw new Error(errorMessage(data, res));
        return data;
      });
    }, function (networkError) {
      throw new Error("সংযোগ পাওয়া যাচ্ছে না। ইন্টারনেট যাচাই করুন।");
    });
  }

  function uuid() {
    var out = "";
    var hex = "0123456789abcdef";
    for (var i = 0; i < 32; i++) out += hex.charAt(Math.floor(Math.random() * 16));
    return out.slice(0, 8) + "-" + out.slice(8, 12) + "-4" + out.slice(13, 16) + "-a" +
      out.slice(17, 20) + "-" + out.slice(20, 32);
  }

  function busy(isBusy) {
    generate.disabled = isBusy;
    fileInput.disabled = isBusy;
    if (cancelBtn) cancelBtn.disabled = !isBusy;
  }

  function stopPolling() {
    if (polling) { clearInterval(polling); polling = null; }
  }

  function startPolling(ms) {
    stopPolling();
    if (!pollStartedAt) pollStartedAt = Date.now();
    polling = setInterval(poll, ms || POLL_MS);
    poll();
  }

  function showResult(job) {
    var result = job.result || {};
    lastCues = result.cues || null;
    appliedCues = false;
    if (lastCues && lastCues.length) {
      resultInfo.style.display = "block";
      resultInfo.textContent = lastCues.length + "টি ক্যাপশন কিউ প্রস্তুত। এখন \"After Effects এ যুক্ত করুন\" চাপুন।";
      resultInfo.className = "status ok";
      if (cueCounter) {
        cueCounter.style.display = "inline-block";
        cueCounter.textContent = lastCues.length + "টি কিউ";
      }
      srtBox.style.display = "block";
      srtBox.textContent = result.srt || "";
      applyBtn.disabled = false;
      // NOTE: captions are NEVER auto-applied. Auto-apply plus the button
      // used to create two duplicate sets of layers in the comp.
    } else {
      resultInfo.style.display = "block";
      resultInfo.textContent = "কোনো ক্যাপশন তৈরি হয়নি — অডিওতে স্পষ্ট কথা পাওয়া যায়নি।";
      resultInfo.className = "status bad";
      if (cueCounter) cueCounter.style.display = "none";
    }
  }

  var pollStartedAt = 0;
  var consecutiveErrors = 0;

  function poll() {
    if (!currentJobId) return;
    if (pollStartedAt && Date.now() - pollStartedAt > MAX_JOB_MS) {
      stopPolling();
      busy(false);
      stopTimer();
      setStatus("নির্ধারিত সময়ের মধ্যে ক্যাপশন প্রস্তুত হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", "bad");
      return;
    }
    request("/jobs/" + currentJobId, { method: "GET", headers: { accept: "application/json" } })
      .then(function (data) {
        consecutiveErrors = 0;
        var job = data.job || {};
        if (typeof job.progress === "number") {
          setProgress(job.progress);
        }
        if (job.status === "completed") {
          stopPolling();
          busy(false);
          setProgress(100);
          stopTimer();
          setStatus("ক্যাপশন প্রস্তুত।" + elapsedText(), "ok");
          showResult(job);
        } else if (job.status === "failed") {
          stopPolling();
          busy(false);
          stopTimer();
          setStatus("ক্যাপশন তৈরি সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", "bad");
        } else if (job.status === "cancelled") {
          stopPolling();
          busy(false);
          stopTimer(true);
          setStatus("প্রক্রিয়াটি বন্ধ করা হয়েছে।", "muted");
        } else {
          if ((job.progress || 0) >= 85 && polling) startPolling(FAST_POLL_MS);
          setStatus(stageText(job.progress) + "... " + (job.progress || 10) + "%", "muted");
        }
      })
      .catch(function () {
        consecutiveErrors++;
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          stopPolling();
          busy(false);
          stopTimer();
          setStatus("সংযোগে সমস্যা হচ্ছে। ইন্টারনেট যাচাই করে আবার চেষ্টা করুন।", "bad");
        } else {
          setStatus("সংযোগ পুনরায় স্থাপন করা হচ্ছে...", "muted");
        }
      });

  }

  function guessMime(name) {
    var n = String(name || "").toLowerCase();
    if (/\.mp3$/.test(n)) return "audio/mpeg";
    if (/\.wav$/.test(n)) return "audio/wav";
    if (/\.(m4a|aac)$/.test(n)) return "audio/mp4";
    if (/\.(aif|aiff)$/.test(n)) return "audio/aiff";
    if (/\.ogg$/.test(n)) return "audio/ogg";
    if (/\.flac$/.test(n)) return "audio/flac";
    if (/\.mp4$/.test(n)) return "video/mp4";
    if (/\.mov$/.test(n)) return "video/quicktime";
    if (/\.webm$/.test(n)) return "video/webm";
    return "application/octet-stream";
  }

  /** True when the file is already audio — no AE export needed. */
  function isAudioFile(name) {
    return /\.(mp3|wav|wave|m4a|aac|aif|aiff|ogg|oga|flac|opus|wma)$/i.test(String(name || ""));
  }

  function baseNameOf(p) {
    var s2 = String(p || "").replace(/\\/g, "/");
    return s2.substring(s2.lastIndexOf("/") + 1);
  }

  /* Temp audio file produced by AE — cleaned up after upload or failure. */
  var pendingTempFile = null;

  function base64ToBlob(b64, mime) {
    var bin = "";
    try { bin = atob(b64); } catch (e) { bin = ""; }
    var len = bin.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime || "application/octet-stream" });
  }

  /** Reads a file from disk as a Blob. Node fs first, then CEP cep.fs fallback. */
  function readFileAsBlob(path, name, callback) {
    try {
      var fs = require("fs");
      var buf = fs.readFileSync(path);
      var blob = new Blob([new Uint8Array(buf)], { type: guessMime(name) });
      callback(null, { name: name, size: blob.size, type: blob.type, blob: blob });
      return;
    } catch (e1) { /* fall through to cep.fs */ }
    try {
      if (window.cep && window.cep.fs) {
        var res = window.cep.fs.readFile(path);
        if (res.err === 0 && res.data) {
          var blob2 = base64ToBlob(res.data, guessMime(name));
          callback(null, { name: name, size: blob2.size, type: blob2.type, blob: blob2 });
          return;
        }
      }
    } catch (e2) { /* fall through */ }
    callback("এক্সপোর্ট করা অডিও ফাইলটি পড়া যায়নি।", null);
  }

  function cleanupTempFile(path) {
    if (!path) return;
    try { require("fs").unlinkSync(path); return; } catch (e1) {}
    try { if (window.cep && window.cep.fs) window.cep.fs.deleteFile(path); } catch (e2) {}
  }

  /**
   * Converts any media (video or layer footage) to a small audio file inside
   * AE, then reads it back as a Blob. NEVER falls back to uploading the
   * original video: if extraction fails, the job stops with a clear error.
   */
  function extractAudio(sourcePath, callback) {
    if (!window.GhostCep.available()) { callback("আফটার ইফেক্টসের সাথে প্যানেল কানেক্টেড নেই।", null); return; }
    setStatus("ভিডিও থেকে অডিও আলাদা করা হচ্ছে (AE রেন্ডার)...", "muted");
    window.GhostCep.evalScript("ghostExtractAudio(" + JSON.stringify(String(sourcePath)) + ")", function (raw) {
      var out = {};
      try { out = JSON.parse(raw); } catch (e) { out = { ok: false, message: "অডিও এক্সপোর্টের উত্তর পড়া যায়নি।" }; }
      if (!out.ok || !out.path) { callback(out.message || "অডিও এক্সপোর্ট করা যায়নি।", null); return; }
      var audioName = baseNameOf(out.path) || out.name || ("ghost-audio-" + Date.now() + ".wav");
      readFileAsBlob(out.path, audioName, function (err, file) {
        if (err) { callback(err, null); return; }
        pendingTempFile = out.path;
        callback(null, file);
      });
    });
  }

  /** Either the picked file, or the media of the selected AE layer — always as audio. */
  function resolveSourceAsync(callback) {
    var file = fileInput.files && fileInput.files[0];
    if (file) {
      var fpath = "";
      try { fpath = file.path || ""; } catch (e0) { fpath = ""; }
      if (isAudioFile(file.name) || isAudioFile(fpath)) {
        callback(null, { name: file.name, size: file.size, type: guessMime(file.name), blob: file });
        return;
      }
      if (fpath) { extractAudio(fpath, callback); return; }
      // No disk path (shouldn't happen in CEP): upload the file as-is.
      callback(null, { name: file.name, size: file.size, type: file.type || guessMime(file.name), blob: file });
      return;
    }
    if (layerSource && layerSource.path) {
      if (isAudioFile(layerSource.path)) {
        setStatus("অডিও ফাইল পড়া হচ্ছে...", "muted");
        readFileAsBlob(layerSource.path, baseNameOf(layerSource.path) || layerSource.name || "layer-audio", callback);
        return;
      }
      extractAudio(layerSource.path, callback);
      return;
    }
    callback(null, null);
  }

  function startJob() {
    setStatus("অডিও প্রস্তুত করা হচ্ছে...", "muted");
    resolveSourceAsync(function (err, file) {
      if (err) { setStatus(err, "bad"); return; }
      if (!file) { setStatus("একটি ফাইল নির্বাচন করুন, অথবা টাইমলাইনে লেয়ার সিলেক্ট করে \"সিলেক্ট করা লেয়ার ব্যবহার করুন\" চাপুন।", "bad"); return; }
      if (file.size > MAX_BYTES) { setStatus("ফাইলের সাইজ ৫০০ মেগাবাইটের বেশি।", "bad"); return; }
      startJobWithFile(file);
    });
  }

  function startJobWithFile(file) {



    if (!idempotencyKey) idempotencyKey = uuid();
    consecutiveErrors = 0;
    pollStartedAt = Date.now();
    startTimer();

    busy(true);
    cancelling = false;
    stopPolling();
    applyBtn.disabled = true;
    srtBox.style.display = "none";
    if (cueCounter) cueCounter.style.display = "none";
    resultInfo.textContent = "ক্যাপশন প্রস্তুত হচ্ছে...";
    resultInfo.className = "status muted";
    setProgress(2);
    setStatus("প্রস্তুতি নেওয়া হচ্ছে...", "muted");

    request("/jobs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "idempotency-key": idempotencyKey
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        requestId: "req-" + idempotencyKey,
        userId: userId()
      })
    })
      .then(function (data) {
        currentJobId = data.job && data.job.id;
        if (!currentJobId) throw new Error("ক্যাপশন প্রক্রিয়া শুরু করা যায়নি, আবার চেষ্টা করুন।");
        if (data.job && data.job.status === "completed" && data.job.result) {
          stopPolling();
          busy(false);
          setProgress(100);
          stopTimer();
          setStatus("ক্যাপশন প্রস্তুত।" + elapsedText(), "ok");
          showResult(data.job);
          return null;
        }
        setStatus("মিডিয়া ফাইল আপলোড করা হচ্ছে...", "muted");
        var form = new FormData();
        form.append("file", file.blob, file.name);
        return request("/jobs/" + currentJobId + "/upload", {
          method: "POST",
          headers: { accept: "application/json" },
          body: form
        });
      })
      .then(function (data) {
        cleanupTempFile(pendingTempFile); pendingTempFile = null;
        if (!data) return;
        var job = data.job || {};
        setProgress(job.progress || 5);
        if (job.status === "completed") {
          stopPolling();
          busy(false);
          setProgress(100);
          stopTimer();
          setStatus("ক্যাপশন প্রস্তুত।" + elapsedText(), "ok");
          showResult(job);
          return;
        }
        setStatus(stageText(job.progress) + "...", "muted");
        startPolling(POLL_MS);
      })
      .catch(function (error) {
        // NO mock captions here. A real failure must be reported as a failure,
        // otherwise the user gets fake captions and thinks it worked.
        cleanupTempFile(pendingTempFile); pendingTempFile = null;
        stopPolling();
        busy(false);
        setProgress(0);
        currentJobId = null;
        idempotencyKey = null;
        stopTimer();
        setStatus("ক্যাপশন তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", "bad");
        resultInfo.style.display = "block";
        resultInfo.textContent = "কোনো ক্যাপশন তৈরি হয়নি।";
        resultInfo.className = "status bad";
      });
  }

  function cancelJob() {
    cancelling = true;
    stopPolling();
    busy(false);
    setProgress(0);
    stopTimer(true);
    setStatus("প্রক্রিয়াটি বন্ধ করা হয়েছে।", "muted");
    if (currentJobId) {
      request("/jobs/" + currentJobId + "/cancel", { method: "POST", headers: { accept: "application/json" } }).catch(function () {});
      currentJobId = null;
    }
  }

  function cancelAllJobs() {
    cancelling = true;
    stopPolling();
    busy(false);
    idempotencyKey = null;
    currentJobId = null;
    lastCues = null;
    appliedCues = false;
    layerSource = null;
    if (layerInfo) layerInfo.style.display = "none";
    applyBtn.disabled = true;
    srtBox.style.display = "none";
    if (cueCounter) cueCounter.style.display = "none";
    setProgress(0);
    stopTimer(true);
    setStatus("রিসেট সম্পন্ন। নতুন ফাইল নির্বাচন করুন।", "muted");
    resultInfo.style.display = "block";
    resultInfo.textContent = "এখনও কোনো ক্যাপশন নেই।";
    resultInfo.className = "status muted";

    // Clear file input label
    try {
      var placeholder = el("dropPlaceholder");
      var fileLabel = el("dropFileName");
      if (placeholder) placeholder.style.display = "block";
      if (fileLabel) { fileLabel.style.display = "none"; fileLabel.innerText = ""; }
      if (fileInput) fileInput.value = "";
    } catch (e) {}

    request("/jobs/cancel-all", { method: "POST", headers: { accept: "application/json" } }).catch(function () {});
    checkHealth();
  }

  /** Absolute path of the installed extension folder (most reliable way for host.jsx to find bundled .ffx files). */
  function ghostExtRootPath() {
    try {
      if (window.__adobe_cep__ && window.__adobe_cep__.getSystemPath) {
        return window.__adobe_cep__.getSystemPath("extension");
      }
    } catch (e) {}
    return "";
  }

  /** Caption options sent to AE (position/size/case controls were removed). */
  function readOptions() {
    return {
      template: selectedTemplate || "royal_gold",
      position: "lower",
      fontSizeScale: 1.0,
      animation: (captionAnim && captionAnim.value) || "",
      animPreset: window.ghostSelectedFfx || "",
      extRoot: ghostExtRootPath(),
      fontFamily: "Hind Siliguri"
    };
  }

  function applyTextCase(text) {
    return text;
  }


  function applyCaptions() {
    if (!lastCues || !lastCues.length) return;
    if (!window.GhostCep.available()) {
      resultInfo.style.display = "block";
      resultInfo.textContent = "ক্যাপশন প্রস্তুত, কিন্তু আফটার ইফেক্টসের সাথে প্যানেল কানেক্টেড নেই।";
      resultInfo.className = "status bad";
      return;
    }
    if (appliedCues) {
      var again = window.confirm("এই ক্যাপশনগুলো ইতিমধ্যে কম্পে যুক্ত করা হয়েছে। আবার যুক্ত করলে ডুপ্লিকেট লেয়ার তৈরি হবে। চালিয়ে যেতে চান?");
      if (!again) return;
    }

    var options = readOptions();

    var payload = JSON.stringify(lastCues.map(function (cue) {
      return {
        start: Number(cue.start) || 0,
        end: Number(cue.end) || 0,
        text: applyTextCase(String(cue.text || ""))
      };
    }));
    var optsPayload = JSON.stringify(options);

    applyBtn.disabled = true;
    resultInfo.style.display = "block";
    resultInfo.textContent = "আফটার ইফেক্টসে ক্যাপশন লেয়ার তৈরি করা হচ্ছে...";
    resultInfo.className = "status muted";

    var script = "ghostApplyCaptions(" + JSON.stringify(payload) + ", " + JSON.stringify(optsPayload) + ")";
    window.GhostCep.evalScript(script, function (raw) {
      var out = {};
      try { out = JSON.parse(raw); } catch (e) { out = { ok: false, message: String(raw || "আফটার ইফেক্টস থেকে কোনো উত্তর পাওয়া যায়নি।") }; }
      resultInfo.textContent = out.message || (out.ok ? "ক্যাপশন যুক্ত করা হয়েছে।" : "ক্যাপশন যুক্ত করা যায়নি।");
      resultInfo.className = "status " + (out.ok ? "ok" : "bad");
      applyBtn.disabled = false;
      if (out.ok) {
        appliedCues = true;
        idempotencyKey = null;
      }
    });
  }

  function checkHealth() {
    var server = readServer();
    var dot = el("statusDot");
    if (dot) dot.className = "status-dot checking";
    if (serverStatus) {
      serverStatus.className = "status muted";
      serverStatus.textContent = "সংযোগ যাচাই করা হচ্ছে...";
    }
    fetch(server + "/api/public/health", { cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data || !data.ok) throw new Error("offline");
        var online = (data.workers && data.workers.online) || 0;
        if (dot) dot.className = "status-dot";
        if (serverStatus) {
          serverStatus.className = "status ok";
          serverStatus.textContent = online > 0
            ? "সংযোগ ঠিক আছে — ক্যাপশন তৈরির জন্য প্রস্তুত।"
            : "সংযোগ ঠিক আছে। এখন ব্যস্ত থাকায় কাজটি শুরু হতে কিছুটা সময় নিতে পারে।";
        }
      })
      .catch(function () {
        if (dot) dot.className = "status-dot offline";
        if (serverStatus) {
          serverStatus.className = "status bad";
          serverStatus.textContent = "সংযোগ করা যাচ্ছে না। আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন।";
        }
      });
  }

  generate.addEventListener("click", startJob);
  if (cancelBtn) cancelBtn.addEventListener("click", cancelJob);
  if (cancelAllBtn) cancelAllBtn.addEventListener("click", cancelAllJobs);
  applyBtn.addEventListener("click", applyCaptions);

  // Hidden diagnostic: Ctrl+Shift+D shows the resolved .ffx path and the real applyPreset error.
  document.addEventListener("keydown", function (ev) {
    if (ev.ctrlKey && ev.shiftKey && (ev.key === "D" || ev.key === "d")) {
      if (!window.GhostCep.available()) { window.alert("আফটার ইফেক্টস কানেক্টেড নেই।"); return; }
      window.GhostCep.evalScript(
        "ghostDiagFfx(" + JSON.stringify(ghostExtRootPath()) + ", " + JSON.stringify(window.ghostSelectedFfx || "") + ")",
        function (raw) { window.alert(String(raw)); }
      );
    }
  });
  if (saveServer) {
    saveServer.addEventListener("click", function () {
      serverInput.value = writeServer(serverInput.value);
      checkHealth();
    });
  }
  if (pickLayerBtn) {
    pickLayerBtn.addEventListener("click", function () {
      if (!window.GhostCep.available()) {
        setStatus("আফটার ইফেক্টসের সাথে প্যানেল কানেক্টেড নেই।", "bad");
        return;
      }
      setStatus("সিলেক্ট করা লেয়ার পড়া হচ্ছে...", "muted");
      window.GhostCep.evalScript("ghostSelectedLayerMedia()", function (raw) {
        var out = {};
        try { out = JSON.parse(raw); } catch (e) { out = { ok: false, message: "লেয়ার পড়া যায়নি।" }; }
        if (!out.ok || !out.path) {
          layerSource = null;
          if (layerInfo) layerInfo.style.display = "none";
          setStatus(out.message || "লেয়ার পড়া যায়নি।", "bad");
          return;
        }
        layerSource = { path: out.path, name: out.name || "layer-audio" };
        try { if (fileInput) fileInput.value = ""; } catch (e2) {}
        try {
          var ph = el("dropPlaceholder"), fl = el("dropFileName");
          if (ph) ph.style.display = "block";
          if (fl) { fl.style.display = "none"; fl.innerText = ""; }
        } catch (e3) {}
        lastCues = null;
        appliedCues = false;
        applyBtn.disabled = true;
        idempotencyKey = null;
        currentJobId = null;
        if (layerInfo) {
          layerInfo.style.display = "block";
          layerInfo.textContent = "লেয়ার: " + layerSource.name;
        }
        setStatus("লেয়ার প্রস্তুত — এখন \"ক্যাপশন তৈরি করুন\" চাপুন।", "ok");
      });
    });
  }

  fileInput.addEventListener("change", function () {
    layerSource = null;
    if (layerInfo) layerInfo.style.display = "none";

    idempotencyKey = null;
    currentJobId = null;
    lastCues = null;
    applyBtn.disabled = true;
    cancelling = false;
    srtBox.style.display = "none";
    if (cueCounter) cueCounter.style.display = "none";
    setProgress(0);
    var file = fileInput.files && fileInput.files[0];
    setStatus(file ? "প্রস্তুত ফাইল: " + file.name : "শুরু করতে একটি ফাইল নির্বাচন করুন।", "muted");
  });

  if (serverInput) serverInput.value = readServer();
  checkHealth();
})();
