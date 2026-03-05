/**
 * YT Shorts Frame Skipper — content.js (FIXED)
 * Targets: video.video-stream.html5-main-video (YouTube's actual DOM class)
 * Comma (,) = back 1 frame | Dot (.) = forward 1 frame
 */

(function () {
  "use strict";

  const DEFAULT_FPS = 30;
  const HUD_DURATION = 1200;
  const HUD_ID = "yt-shorts-frame-hud";
  let hudTimeout = null;

  // ── Shorts context check ──────────────────────────────────────────────────

  function isOnShortsPage() {
    return location.pathname.startsWith("/shorts");
  }

  function isMiniplayerWithShorts() {
    const miniplayer = document.querySelector("ytd-miniplayer[active]");
    if (!miniplayer) return false;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) return canonical.href.includes("/shorts/");
    return false;
  }

  function isShortsActive() {
    return isOnShortsPage() || isMiniplayerWithShorts();
  }

  // ── Get video element ─────────────────────────────────────────────────────
  // Matches YouTube's actual element:
  // <video class="video-stream html5-main-video" data-no-fullscreen="true" ...>

  function getShortsVideo() {
    // Exact class match — this is what YouTube Shorts uses
    const all = document.querySelectorAll("video.video-stream.html5-main-video");
    if (all.length === 0) return null;
    if (all.length === 1) return all[0];

    // Multiple videos (e.g. ad + short): prefer one inside Shorts containers
    const shortsContainers = [
      "ytd-reel-video-renderer",
      "ytd-shorts",
      "#shorts-player",
      "ytd-miniplayer",
    ];
    for (const selector of shortsContainers) {
      const container = document.querySelector(selector);
      if (container) {
        const v = container.querySelector("video.video-stream.html5-main-video");
        if (v) return v;
      }
    }

    // Last resort: return last video (Shorts player is last in DOM)
    return all[all.length - 1];
  }

  // ── HUD overlay ───────────────────────────────────────────────────────────

  function ensureHUD() {
    let hud = document.getElementById(HUD_ID);
    if (!hud) {
      hud = document.createElement("div");
      hud.id = HUD_ID;
      Object.assign(hud.style, {
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: "2147483647",
        background: "rgba(0,0,0,0.82)",
        color: "#fff",
        fontFamily: "'Segoe UI', system-ui, monospace",
        fontSize: "13px",
        fontWeight: "700",
        letterSpacing: "0.04em",
        padding: "8px 20px",
        borderRadius: "22px",
        border: "1px solid rgba(255,255,255,0.15)",
        pointerEvents: "none",
        opacity: "0",
        transition: "opacity 0.15s ease",
        userSelect: "none",
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      });
      document.body.appendChild(hud);
    }
    return hud;
  }

  function showHUD(text) {
    const hud = ensureHUD();
    hud.textContent = text;
    hud.style.opacity = "1";
    clearTimeout(hudTimeout);
    hudTimeout = setTimeout(() => { hud.style.opacity = "0"; }, HUD_DURATION);
  }

  // ── Frame stepping ────────────────────────────────────────────────────────

  function stepFrame(direction) {
    const video = getShortsVideo();

    if (!video) {
      showHUD("⚠️  No Shorts video found");
      return;
    }

    // Auto-pause if still playing — first press pauses, subsequent presses step
    if (!video.paused) {
      video.pause();
      showHUD("⏸  Paused — use  ,  and  .  to step frames");
      return;
    }

    const frameDuration = 1 / DEFAULT_FPS;
    const duration = isFinite(video.duration) ? video.duration : 0;
    const next = Math.max(0, Math.min(duration, video.currentTime + direction * frameDuration));

    video.currentTime = next;

    const frame = Math.round(next * DEFAULT_FPS);
    const total = Math.round(duration * DEFAULT_FPS);
    const arrow = direction > 0 ? "▶▶" : "◀◀";
    showHUD(`${arrow}  Frame ${frame} / ${total}   ${next.toFixed(3)}s`);
  }

  // ── Keyboard listener ─────────────────────────────────────────────────────

  function handleKeyDown(e) {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable) return;
    if (!isShortsActive()) return;

    if (e.key === ",") {
      e.preventDefault();
      e.stopImmediatePropagation();
      stepFrame(-1);
    } else if (e.key === ".") {
      e.preventDefault();
      e.stopImmediatePropagation();
      stepFrame(+1);
    }
  }

  // Capture phase so we intercept before YouTube's own listeners
  document.addEventListener("keydown", handleKeyDown, { capture: true });

  // ── SPA navigation watcher ────────────────────────────────────────────────

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      if (!isShortsActive()) {
        const hud = document.getElementById(HUD_ID);
        if (hud) hud.style.opacity = "0";
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

})();
