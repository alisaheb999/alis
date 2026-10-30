/* Behaviour for the raw HTML homepage (particle ingestion + Ghostae AI assistant). */

const SITE_KNOWLEDGE = {
  afterEffects:
    "Ghostae Text V2-এর বর্তমান পেজ অনুযায়ী After Effects ও Premiere Pro 2023+ সাপোর্ট করে। Windows 10/11 ও আধুনিক macOS-এর সেটআপ গাইড পণ্যের পেজে দেখুন।",
  licenseKey:
    "After Effects-এ Window > Extensions > Ghostae Text খুলুন, লাইসেন্স কী পেস্ট করে Activate চাপুন। একটি কী একটি পিসিতে চলে; পিসি বদল করলে WhatsApp-এ জানালে রিসেট করে দেওয়া হয়।",
  macos:
    "macOS সেটআপের জন্য Text পেজের Mac setup খুলুন; সেখানে ডাউনলোড ও ম্যানুয়াল ইনস্টল নির্দেশনা রয়েছে।",
  freePlan:
    "Text-এর ফ্রি ভার্সন দিয়ে পরীক্ষা করুন; পূর্ণ সুবিধার জন্য Lifetime আছে। বর্তমান দাম ও মালিকের নির্ধারিত ছাড় পণ্যের পেজে দেখুন—এখানে পুরোনো দাম বলা হবে না।",
};

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resolveLocalAnswer(query: string) {
  const q = query.toLowerCase();
  if (q.includes("after effect") || q.includes("version") || q.includes("supported"))
    return { content: SITE_KNOWLEDGE.afterEffects, matched: true };
  if (q.includes("license") || q.includes("licence") || q.includes("activate") || q.includes("key"))
    return { content: SITE_KNOWLEDGE.licenseKey, matched: true };
  if (q.includes("mac") || q.includes("apple") || q.includes("silicon"))
    return { content: SITE_KNOWLEDGE.macos, matched: true };
  if (q.includes("free") || q.includes("plan") || q.includes("price") || q.includes("cost"))
    return { content: SITE_KNOWLEDGE.freePlan, matched: true };
  return {
    content:
      "এই মুহূর্তে AI উত্তর দিতে পারছে না। সর্বশেষ পণ্যের তথ্য ghostae.com/products-এ দেখুন, অথবা WhatsApp +880 1345 407572-এ যোগাযোগ করুন।",
    matched: false,
  };
}

export function initHomePage(root: HTMLElement): () => void {
  const q = <T extends HTMLElement>(id: string) => root.querySelector<T>("#" + id);

  const assistantCard = q<HTMLDivElement>("assistantCard");
  const triggerWrapper = q<HTMLDivElement>("triggerWrapper");
  const openTriggerBtn = q<HTMLButtonElement>("openTriggerBtn");
  const closeBtn = q<HTMLButtonElement>("closeBtn");
  const resetChatBtn = q<HTMLButtonElement>("resetChatBtn");
  const scrollContentArea = q<HTMLDivElement>("scrollContentArea");
  const questionListSection = q<HTMLDivElement>("questionListSection");
  const chatMessages = q<HTMLDivElement>("chatMessages");
  const typingIndicator = q<HTMLDivElement>("typingIndicator");
  const chatForm = q<HTMLFormElement>("chatForm");
  const messageInput = q<HTMLInputElement>("messageInput");
  const sendBtn = q<HTMLButtonElement>("sendBtn");
  const toastNotification = q<HTMLDivElement>("toastNotification");
  const toastMessage = q<HTMLSpanElement>("toastMessage");
  const mouseSpotlight = q<HTMLDivElement>("mouseSpotlight");
  const heroHeadline = q<HTMLElement>("heroHeadline");
  const heroParagraph = q<HTMLElement>("heroParagraph");
  const heroCtas = q<HTMLElement>("heroCtas");
  const ingestionStatusPill = q<HTMLElement>("ingestionStatusPill");
  const vacuumCanvas = q<HTMLCanvasElement>("dataVacuumCanvas");
  const categoryChips = Array.from(root.querySelectorAll<HTMLButtonElement>(".filter-chip"));
  const pillButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(".pill-question-btn"));

  if (!assistantCard || !openTriggerBtn || !vacuumCanvas || !chatForm || !messageInput) return () => {};
  const canvasEl = vacuumCanvas as HTMLCanvasElement;
  const ctx = canvasEl.getContext("2d");

  const history: { role: "user" | "assistant"; content: string }[] = [];
  let isVacuuming = false;
  let isBotTyping = false;

  const onMouseMove = (e: MouseEvent) => {
    if (mouseSpotlight) {
      mouseSpotlight.style.left = `${e.clientX}px`;
      mouseSpotlight.style.top = `${e.clientY}px`;
    }
  };
  window.addEventListener("mousemove", onMouseMove);

  const resizeCanvas = () => {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  };
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function showToast(msg: string) {
    if (!toastNotification || !toastMessage) return;
    toastMessage.textContent = msg;
    toastNotification.classList.remove("opacity-0", "translate-y-6", "pointer-events-none");
    setTimeout(() => {
      toastNotification.classList.add("opacity-0", "translate-y-6", "pointer-events-none");
    }, 2000);
  }

  function copyTextToClipboard(text: string) {
    void navigator.clipboard?.writeText(text).catch(() => {});
    showToast("Copied to clipboard");
  }

  function appendMessage(sender: "user" | "bot", text: string) {
    if (!chatMessages) return;
    const div = document.createElement("div");
    div.className = `flex flex-col ${sender === "user" ? "items-end" : "items-start"} space-y-1`;
    const timeString = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (sender === "user") {
      div.innerHTML = `
          <div class="max-w-[85%] bg-blue-600 text-white rounded-[18px] rounded-tr-sm px-4 py-2.5 text-[13px] leading-relaxed shadow-sm">
            ${escapeHtml(text)}
          </div>
          <span class="text-[10px] text-slate-400 px-2">${timeString}</span>
        `;
    } else {
      div.innerHTML = `
          <div class="flex items-start space-x-2 max-w-[95%] group">
            <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-1 shadow-sm">
              AI
            </div>
            <div class="flex-1">
              <div class="bg-slate-100 text-slate-800 rounded-[18px] rounded-tl-sm px-4 py-2.5 text-[13px] leading-relaxed border border-slate-200/50 shadow-sm">
                ${escapeHtml(text)}
              </div>
              <div class="flex items-center space-x-2 pt-1 px-1 text-[10.5px] text-slate-400">
                <span>${timeString}</span>
                <span>•</span>
                <button class="hover:text-blue-600 copy-msg-btn transition-colors" title="Copy text">Copy</button>
              </div>
            </div>
          </div>
        `;
      div.querySelector(".copy-msg-btn")?.addEventListener("click", () => copyTextToClipboard(text));
    }

    chatMessages.appendChild(div);
    if (scrollContentArea) scrollContentArea.scrollTop = scrollContentArea.scrollHeight;
  }

  async function fetchAIResponse(text: string): Promise<string> {
    history.push({ role: "user", content: text });
    const response = await fetch("/api/site-assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-10) }),
    });
    if (!response.ok || !response.body) throw new Error("assistant unavailable");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          answer += json.choices?.[0]?.delta?.content ?? "";
        } catch {
          /* partial chunk */
        }
      }
    }
    if (!answer.trim()) throw new Error("empty answer");
    history.push({ role: "assistant", content: answer });
    return answer;
  }

  async function handleUserSubmit(text: string) {
    if (!text || isBotTyping) return;
    messageInput!.value = "";
    questionListSection?.classList.add("hidden");
    chatMessages?.classList.remove("hidden");
    appendMessage("user", text);

    isBotTyping = true;
    if (sendBtn) sendBtn.disabled = true;
    typingIndicator?.classList.remove("hidden");
    if (scrollContentArea) scrollContentArea.scrollTop = scrollContentArea.scrollHeight;

    try {
      const answer = await fetchAIResponse(text);
      typingIndicator?.classList.add("hidden");
      appendMessage("bot", answer);
    } catch {
      typingIndicator?.classList.add("hidden");
      appendMessage("bot", resolveLocalAnswer(text).content);
    } finally {
      isBotTyping = false;
      if (sendBtn) sendBtn.disabled = false;
      messageInput?.focus();
    }
  }

  function openWidgetWithAnimation() {
    triggerWrapper?.classList.add("hidden");
    assistantCard!.classList.remove("hidden", "pop-close-br");
    assistantCard!.classList.add("pop-origin-br");
    assistantCard!.querySelectorAll<HTMLElement>(".stagger-item").forEach((el) => {
      el.style.animation = "none";
      void el.offsetHeight;
      el.style.animation = "";
    });
    setTimeout(() => messageInput?.focus(), 350);
  }

  function closeWidgetWithAnimation() {
    assistantCard!.classList.remove("pop-origin-br");
    assistantCard!.classList.add("pop-close-br");
    [heroHeadline, heroParagraph, heroCtas].forEach((el) => {
      if (el) {
        el.style.transition = "opacity 0.6s ease, filter 0.6s ease, transform 0.6s ease";
        el.style.opacity = "1";
        el.style.filter = "none";
        el.style.transform = "none";
      }
    });
    setTimeout(() => {
      assistantCard!.classList.add("hidden");
      triggerWrapper?.classList.remove("hidden");
    }, 300);
  }

  function startDataVacuumIngestion() {
    if (isVacuuming || !ctx) {
      openWidgetWithAnimation();
      return;
    }
    isVacuuming = true;

    const sourceElements = [heroHeadline, heroParagraph, heroCtas].filter(
      (el): el is HTMLElement => !!el,
    );
    sourceElements.forEach((el) => {
      el.style.transition =
        "opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1), filter 0.28s ease, transform 0.28s ease";
      el.style.opacity = "0.08";
      el.style.filter = "blur(4px)";
      el.style.transform = "scale(0.985)";
    });

    ingestionStatusPill?.classList.remove("hidden");
    canvasEl.classList.remove("hidden");

    const btnRect = openTriggerBtn!.getBoundingClientRect();
    const targetX = btnRect.left + btnRect.width / 2;
    const targetY = btnRect.top + btnRect.height / 2;

    // Pages without the hero (every page except home) stream from the middle of
    // the viewport so the ingestion animation still plays.
    const sources: { rect: DOMRect; count: number }[] = sourceElements.length
      ? sourceElements.map((el) => ({
          rect: el.getBoundingClientRect(),
          count: el === heroHeadline ? 160 : 60,
        }))
      : [
          {
            rect: new DOMRect(
              window.innerWidth * 0.5 - 240,
              window.innerHeight * 0.42,
              480,
              140,
            ),
            count: 190,
          },
        ];

    const headRect = sources[0]!.rect;
    const originX = headRect.left + headRect.width / 2;
    const originY = headRect.top + headRect.height * 0.6;
    const ctrlX = (originX + targetX) * 0.5 + 40;
    const ctrlY = (originY + targetY) * 0.5 + 70;

    const palette = ["#38bdf8", "#00a8ff", "#60a5fa", "#818cf8", "#ffffff", "#93c5fd"];
    type P = {
      startX: number; startY: number; x: number; y: number; prevX: number; prevY: number;
      progress: number; speed: number; delay: number; tubeOffset: number; color: string;
      width: number; spiralFreq: number; spiralAmp: number;
    };
    const particles: P[] = [];

    sources.forEach(({ rect, count }) => {
      for (let i = 0; i < count; i++) {
        const sx = rect.left + Math.random() * rect.width;
        const sy = rect.top + Math.random() * rect.height;
        const burstAngle = Math.random() * Math.PI * 2;
        const burstDist = 6 + Math.random() * 24;
        particles.push({
          startX: sx + Math.cos(burstAngle) * burstDist,
          startY: sy + Math.sin(burstAngle) * burstDist,
          x: sx, y: sy, prevX: sx, prevY: sy,
          progress: 0,
          speed: 0.00065 + Math.random() * 0.00055,
          delay: Math.random() * 220,
          tubeOffset: (Math.random() - 0.5) * 26,
          color: palette[Math.floor(Math.random() * palette.length)]!,
          width: 1.2 + Math.random() * 1.8,
          spiralFreq: 3 + Math.random() * 4,
          spiralAmp: 6 + Math.random() * 14,
        });
      }
    });

    const startTime = performance.now();
    const streamDuration = 1350;
    const quadraticBezier = (p0: number, p1: number, p2: number, t: number) => {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    };

    function animateConduit(now: number) {
      const elapsed = now - startTime;
      ctx!.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const curBtnRect = openTriggerBtn!.getBoundingClientRect();
      const curTargetX = curBtnRect.left + curBtnRect.width / 2;
      const curTargetY = curBtnRect.top + curBtnRect.height / 2;

      const conduitLife = Math.min(1, Math.max(0, elapsed / streamDuration));
      const conduitAlpha = Math.sin(conduitLife * Math.PI) * 0.28;

      if (conduitAlpha > 0.01) {
        ctx!.save();
        ctx!.beginPath();
        ctx!.moveTo(originX, originY);
        ctx!.quadraticCurveTo(ctrlX, ctrlY, curTargetX, curTargetY);
        ctx!.strokeStyle = `rgba(56, 189, 248, ${conduitAlpha * 0.35})`;
        ctx!.lineWidth = 18;
        ctx!.lineCap = "round";
        ctx!.stroke();

        ctx!.beginPath();
        ctx!.moveTo(originX, originY);
        ctx!.quadraticCurveTo(ctrlX, ctrlY, curTargetX, curTargetY);
        ctx!.strokeStyle = `rgba(147, 197, 253, ${conduitAlpha * 0.75})`;
        ctx!.lineWidth = 2;
        ctx!.setLineDash([6, 10]);
        ctx!.lineDashOffset = -elapsed * 0.08;
        ctx!.stroke();
        ctx!.restore();
      }

      let activeParticles = 0;
      for (const p of particles) {
        if (elapsed < p.delay) continue;
        p.progress += p.speed * 16.6;
        if (p.progress >= 1) continue;
        activeParticles++;

        p.prevX = p.x;
        p.prevY = p.y;
        const t = p.progress;
        const easeT = t * t * (3 - 2 * t);
        const bx = quadraticBezier(p.startX, ctrlX, curTargetX, easeT);
        const by = quadraticBezier(p.startY, ctrlY, curTargetY, easeT);
        const spiralFade = Math.sin(t * Math.PI);
        const wave = Math.sin(t * Math.PI * p.spiralFreq) * p.spiralAmp * spiralFade;
        const tanX = -(curTargetY - p.startY) * 0.0012;
        const tanY = (curTargetX - p.startX) * 0.0012;
        p.x = bx + tanX * p.tubeOffset + tanX * wave;
        p.y = by + tanY * p.tubeOffset + tanY * wave;

        const vx = p.x - p.prevX;
        const vy = p.y - p.prevY;
        const speed = Math.hypot(vx, vy);
        const streakLen = Math.min(26, Math.max(3, speed * 2.2));
        const normX = speed > 0.001 ? vx / speed : 0;
        const normY = speed > 0.001 ? vy / speed : 0;
        const alpha = Math.min(1, Math.sin(t * Math.PI) * 1.3);

        ctx!.save();
        ctx!.strokeStyle = p.color;
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx!.lineWidth = p.width;
        ctx!.lineCap = "round";
        ctx!.beginPath();
        ctx!.moveTo(p.x, p.y);
        ctx!.lineTo(p.x - normX * streakLen, p.y - normY * streakLen);
        ctx!.stroke();
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.width * 0.75, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      if (elapsed < streamDuration || activeParticles > 0) {
        requestAnimationFrame(animateConduit);
      } else {
        ctx!.clearRect(0, 0, canvasEl.width, canvasEl.height);
        canvasEl.classList.add("hidden");
        ingestionStatusPill?.classList.add("hidden");
        openTriggerBtn!.classList.add("animate-absorption-pulse");
        setTimeout(() => {
          openTriggerBtn!.classList.remove("animate-absorption-pulse");
          openWidgetWithAnimation();
          isVacuuming = false;
        }, 240);
      }
    }

    requestAnimationFrame(animateConduit);
  }

  const onOpen = (e: Event) => {
    e.preventDefault();
    startDataVacuumIngestion();
  };
  openTriggerBtn.addEventListener("click", onOpen);
  closeBtn?.addEventListener("click", closeWidgetWithAnimation);

  resetChatBtn?.addEventListener("click", () => {
    if (chatMessages) {
      chatMessages.innerHTML = "";
      chatMessages.classList.add("hidden");
    }
    history.length = 0;
    questionListSection?.classList.remove("hidden");
    showToast("Conversation reset");
  });

  categoryChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      categoryChips.forEach((c) => {
        c.classList.remove("active-chip", "bg-blue-50", "text-blue-600", "border-blue-200/70");
        c.classList.add("bg-white", "text-slate-600", "border-slate-200");
      });
      chip.classList.add("active-chip", "bg-blue-50", "text-blue-600", "border-blue-200/70");
      chip.classList.remove("bg-white", "text-slate-600", "border-slate-200");
      const filter = chip.getAttribute("data-filter");
      pillButtons.forEach((btn) => {
        const cat = btn.getAttribute("data-cat");
        btn.classList.toggle("hidden", !(filter === "all" || cat === filter));
      });
    });
  });

  pillButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.querySelector("span")?.textContent?.trim() || btn.textContent?.trim() || "";
      void handleUserSubmit(text);
    });
  });

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const val = messageInput.value.trim();
    if (val) void handleUserSubmit(val);
  };
  chatForm.addEventListener("submit", onSubmit);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !assistantCard.classList.contains("hidden")) closeWidgetWithAnimation();
  };
  window.addEventListener("keydown", onKeyDown);

  // Scroll down → the launcher tucks to the right and shows only the logo.
  // Scroll up → it expands back to the full "Ask Ghostae AI" pill.
  const launcherLabel = Array.from(openTriggerBtn.querySelectorAll<HTMLElement>("span")).find(
    (s) => (s.textContent ?? "").trim().startsWith("Ask Ghostae"),
  );
  let lastY = window.scrollY;
  let scrollFrame = 0;
  let collapsed = false;
  const setCollapsed = (next: boolean) => {
    if (collapsed === next) return;
    collapsed = next;
    if (launcherLabel) {
      launcherLabel.style.transition = "max-width .35s ease, opacity .25s ease, margin .35s ease";
      launcherLabel.style.overflow = "hidden";
      launcherLabel.style.whiteSpace = "nowrap";
      launcherLabel.style.maxWidth = next ? "0px" : "160px";
      launcherLabel.style.opacity = next ? "0" : "1";
      launcherLabel.style.marginLeft = next ? "0px" : "";
    }
    if (triggerWrapper) {
      triggerWrapper.style.transition = "transform .4s cubic-bezier(.4,0,.2,1)";
      triggerWrapper.style.transform = next ? "translateX(14px)" : "translateX(0)";
    }
  };
  const onScrollLauncher = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 6) {
        setCollapsed(y > lastY && y > 120);
        lastY = y;
      }
    });
  };
  window.addEventListener("scroll", onScrollLauncher, { passive: true });

  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("resize", resizeCanvas);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("scroll", onScrollLauncher);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
  };
}
