/* =====================================================
   MINDSCORE AI — SCRIPT.JS
   Handles: theme toggle, slider interactions, form validation,
   API call to FastAPI backend, gauge + counter animation.
   ===================================================== */

// -----------------------------------------------------
// CONFIG
// -----------------------------------------------------
// Change this if your FastAPI server runs on a different host/port.
const API_URL = "http://127.0.0.1:8000/predict";

// The model's score scale (0 = lowest wellness, 10 = highest wellness).
// Adjust SCORE_MAX if your model outputs a different range.
const SCORE_MAX = 10;

// Circle math constants used for mini rings only.
const MINI_RING_RADIUS = 24;
const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS; // ~151

// -----------------------------------------------------
// THEME TOGGLE (Light / Dark)
// -----------------------------------------------------
const themeToggleBtn = document.getElementById("themeToggle");
const iconSun = document.getElementById("iconSun");
const iconMoon = document.getElementById("iconMoon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // Swap the sun/moon icon to reflect the CURRENT theme.
  if (theme === "dark") {
    iconSun.style.display = "none";
    iconMoon.style.display = "block";
  } else {
    iconSun.style.display = "block";
    iconMoon.style.display = "none";
  }
}

// Restore theme choice; default to the user's OS preference on first visit.
const savedTheme =
  window.__mindscoreTheme ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
applyTheme(savedTheme);
window.__mindscoreTheme = savedTheme;

themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  window.__mindscoreTheme = next;
});

// -----------------------------------------------------
// SLIDER INTERACTIONS
// Each slider syncs two-way with an editable number input bubble.
// Dragging the slider updates the input; typing in the input moves the slider.
// -----------------------------------------------------

/**
 * Wires up a range slider ↔ editable number input (two-way sync).
 * Also optionally updates a dashboard stat text + mini progress ring.
 *
 * @param {object} opts
 *   sliderId  — id of the <input type="range">
 *   bubbleId  — id of the <input type="number"> bubble
 *   isHours   — true → bubble shows plain number (e.g. "6.5"), false → formatFn used for stat only
 *   isCount   — true → integer, no decimal (for unlocks)
 *   statId    — optional dashboard stat element id
 *   ringId    — optional SVG ring element id
 *   ringMax   — value that represents 100% fill on the ring
 */
function setupSlider({ sliderId, bubbleId, isHours = true, isCount = false, statId, ringId, ringMax }) {
  const slider = document.getElementById(sliderId);
  const bubble = document.getElementById(bubbleId);
  const stat   = statId ? document.getElementById(statId) : null;
  const ring   = ringId ? document.getElementById(ringId) : null;

  const decimals = isCount ? 0 : 1;

  /** Format the stat card text (includes unit suffix). */
  function formatStat(v) {
    if (isCount) return `${Math.round(v)}/day`;
    return `${v.toFixed(1)} hrs`;
  }

  /** Sync everything from the current slider value. */
  function syncFromSlider() {
    const value = parseFloat(slider.value);

    // Update the editable bubble to match
    bubble.value = isCount ? Math.round(value) : value.toFixed(decimals);

    // Subtle scale pop on the bubble
    bubble.style.transform = "scale(1.12)";
    setTimeout(() => (bubble.style.transform = "scale(1)"), 120);

    // Update dashboard stat card text
    if (stat) stat.textContent = formatStat(value);

    // Update mini progress ring
    if (ring && ringMax) {
      const ratio  = Math.min(value / ringMax, 1);
      const offset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
      ring.style.strokeDashoffset = offset;
    }
  }

  /** Sync slider (and stat/ring) from the number input the user typed. */
  function syncFromBubble() {
    let value = parseFloat(bubble.value);
    if (isNaN(value)) return;

    // Clamp to slider's own min/max
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    value = Math.min(Math.max(value, min), max);

    // Write back clamped value so the bubble shows the real clamped number
    bubble.value = isCount ? Math.round(value) : value.toFixed(decimals);

    // Move the slider thumb
    slider.value = value;

    // Update stat + ring
    if (stat) stat.textContent = formatStat(value);

    if (ring && ringMax) {
      const ratio  = Math.min(value / ringMax, 1);
      const offset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
      ring.style.strokeDashoffset = offset;
    }
  }

  // Slider drag → update bubble
  slider.addEventListener("input", syncFromSlider);

  // Select all text when user clicks into the bubble so typing immediately
  // replaces the old value rather than appending to it
  bubble.addEventListener("focus", () => bubble.select());

  // User types in the bubble → sync only when they finish typing
  // (on blur or pressing Enter) so mid-type keystrokes don't jump the slider.
  bubble.addEventListener("change", syncFromBubble);
  bubble.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); syncFromBubble(); bubble.blur(); }
  });

  // Prevent scroll-wheel from accidentally changing value while scrolling the page
  bubble.addEventListener("wheel", (e) => { e.preventDefault(); }, { passive: false });

  // Initialise both on page load
  syncFromSlider();
}

setupSlider({
  sliderId: "avg_daily_usage_hours",
  bubbleId: "usageValue",
  isHours:  true,
  statId:   "statUsage",
  ringId:   "ringUsage",
  ringMax:  24,
});

setupSlider({
  sliderId: "daily_unlocks",
  bubbleId: "unlocksValue",
  isHours:  false,
  isCount:  true,
});

setupSlider({
  sliderId: "study_hours",
  bubbleId: "studyValue",
  isHours:  true,
  statId:   "statStudy",
  ringId:   "ringStudy",
  ringMax:  24,
});

setupSlider({
  sliderId: "sleep_hours_per_night",
  bubbleId: "sleepValue",
  isHours:  true,
  statId:   "statSleep",
  ringId:   "ringSleep",
  ringMax:  24,
});

setupSlider({
  sliderId: "physical_activity_hours",
  bubbleId: "activityValue",
  isHours:  true,
});

// Stress level select also drives its own dashboard card + ring.
const stressSelect = document.getElementById("stress_level");
const statStress = document.getElementById("statStress");
const ringStress = document.getElementById("ringStress");
const stressLevelToRatio = { Low: 0.25, Medium: 0.5, High: 0.75, "Very High": 1 };

stressSelect.addEventListener("change", () => {
  const level = stressSelect.value;
  if (!level) return;
  statStress.textContent = level;
  const ratio = stressLevelToRatio[level] ?? 0.5;
  ringStress.style.strokeDashoffset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
});

// -----------------------------------------------------
// TODAY'S DATE (shown in the meta card)
// -----------------------------------------------------
const todayDateEl = document.getElementById("todayDate");
todayDateEl.textContent = new Date().toLocaleDateString(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

// -----------------------------------------------------
// RIPPLE EFFECT ON PREDICT BUTTON
// -----------------------------------------------------
const predictBtn = document.getElementById("predictBtn");

predictBtn.addEventListener("click", (e) => {
  const rect = predictBtn.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);

  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

  predictBtn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
});

// -----------------------------------------------------
// FORM SUBMISSION -> CALL FASTAPI BACKEND
// -----------------------------------------------------
const predictForm = document.getElementById("predictForm");
const formError = document.getElementById("formError");

predictForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  // Basic HTML5 validation check before calling the API.
  if (!predictForm.checkValidity()) {
    predictForm.reportValidity();
    return;
  }

  // Build the JSON payload expected by the /predict endpoint.
  const payload = {
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value,
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: Number(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: Number(document.getElementById("daily_unlocks").value),
    study_hours: Number(document.getElementById("study_hours").value),
    physical_activity_hours: Number(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: Number(document.getElementById("sleep_hours_per_night").value),
    stress_level: document.getElementById("stress_level").value,
  };

  setLoadingState(true);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const data = await response.json();

    // The FastAPI backend returns { "predicted_mental_health_score": number }
    const score = data.predicted_mental_health_score;

    if (typeof score !== "number" || Number.isNaN(score)) {
      throw new Error("Unexpected response shape from the API.");
    }

    renderPrediction(score);
  } catch (err) {
    console.error("Prediction request failed:", err);
    formError.textContent =
      "Couldn't reach the prediction API. Make sure the FastAPI server is running at " +
      API_URL;
  } finally {
    setLoadingState(false);
  }
});

/**
 * Toggles the button's loading/disabled visual state.
 */
function setLoadingState(isLoading) {
  predictBtn.disabled = isLoading;
  predictBtn.classList.toggle("loading", isLoading);
}

// -----------------------------------------------------
// RENDER PREDICTION: arc fill, needle, animated counter, badge, copy
// -----------------------------------------------------
const arcProgress    = document.getElementById("arcProgress");
const arcNeedle      = document.getElementById("arcNeedle");
const arcNeedleInner = document.getElementById("arcNeedleInner");
const scoreCounter   = document.getElementById("scoreCounter");
const statusBadge    = document.getElementById("statusBadge");
const interpretationText = document.getElementById("interpretationText");
const arcMeterCard   = document.querySelector(".arc-meter-card");
const retestBtn      = document.getElementById("retestBtn");

// Arc math constants for the SVG path "M 24 148 A 116 116 0 0 1 256 148"
// Centre of the circle: (140, 148), radius: 116
// Arc sweeps 180° from left (angle=180°) to right (angle=0°)
const ARC_CX = 140, ARC_CY = 148, ARC_R = 116;
const ARC_LENGTH = Math.PI * ARC_R; // ≈ 364.4

// Initialise: arc starts fully hidden
arcProgress.style.strokeDasharray  = ARC_LENGTH;
arcProgress.style.strokeDashoffset = ARC_LENGTH;

/**
 * Given a score ratio (0–1), return the (x, y) of the corresponding
 * point on the semicircle. At ratio=0 → left end, ratio=1 → right end.
 */
function arcPoint(ratio) {
  // Angle goes from 180° (left) to 0° (right) as ratio increases
  const angleDeg = 180 - ratio * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: ARC_CX + ARC_R * Math.cos(angleRad),
    y: ARC_CY - ARC_R * Math.sin(angleRad), // SVG y is inverted
  };
}

/**
 * Maps a 0-10 score to a status label, CSS class, color and message,
 * matching the 5-tier system from the design brief.
 */
function getScoreBand(score) {
  if (score >= 8) {
    return {
      label: "Excellent",
      statusClass: "status-excellent",
      color: "var(--status-excellent)",
      message:
        "Your lifestyle habits indicate excellent mental wellness. Continue maintaining balanced sleep, study and physical activity.",
    };
  }
  if (score >= 6) {
    return {
      label: "Good",
      statusClass: "status-good",
      color: "var(--status-good)",
      message:
        "Your habits reflect good mental wellness overall. A few small tweaks to sleep or screen time could push you even higher.",
    };
  }
  if (score >= 4) {
    return {
      label: "Moderate",
      statusClass: "status-moderate",
      color: "var(--status-moderate)",
      message:
        "Your lifestyle indicates moderate mental wellness. Small improvements in sleep and reduced social media usage may improve your score.",
    };
  }
  if (score >= 2) {
    return {
      label: "Needs Attention",
      statusClass: "status-attention",
      color: "var(--status-attention)",
      message:
        "Your current routine shows signs that may affect your wellbeing. Prioritizing consistent sleep and lowering stress could help.",
    };
  }
  return {
    label: "Poor",
    statusClass: "status-poor",
    color: "var(--status-poor)",
    message:
      "Your current habits may negatively impact mental wellness. Increasing sleep, reducing stress and maintaining regular physical activity are recommended.",
  };
}

/**
 * Animates the arc, needle, counter, status badge and interpretation text
 * once a prediction is received.
 */
function renderPrediction(rawScore) {
  const score = Math.max(0, Math.min(SCORE_MAX, rawScore));
  const band  = getScoreBand(score);
  const ratio = score / SCORE_MAX;

  // --- Fill the arc ---
  arcProgress.style.strokeDashoffset = ARC_LENGTH * (1 - ratio);

  // --- Move the needle dot to the correct position on the arc ---
  const pt = arcPoint(ratio);
  arcNeedle.setAttribute("cx", pt.x);
  arcNeedle.setAttribute("cy", pt.y);
  arcNeedle.style.stroke = band.color;
  arcNeedleInner.setAttribute("cx", pt.x);
  arcNeedleInner.setAttribute("cy", pt.y);

  // --- Animate the numeric counter (SVG text element) ---
  animateCounter(scoreCounter, score);

  // --- Update score text color to match band ---
  scoreCounter.style.fill = band.color;

  // --- Update status badge ---
  statusBadge.textContent = band.label;
  statusBadge.className   = `status-badge ${band.statusClass}`;

  // --- Update interpretation copy ---
  interpretationText.textContent = band.message;

  // --- Record prediction time ---
  document.getElementById("predictionTime").textContent = new Date().toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" }
  );

  // --- Pop animation ---
  arcMeterCard.classList.remove("result-pop");
  void arcMeterCard.offsetWidth;
  arcMeterCard.classList.add("result-pop");

  // --- Highlight border ---
  arcMeterCard.classList.add("has-result");

  // --- Show the Try Again button ---
  retestBtn.style.display = "inline-flex";

  // --- Scroll into view ---
  arcMeterCard.scrollIntoView({ behavior: "smooth", block: "center" });

  // --- Show floating banner ---
  showResultBanner(score, band);
}

// -----------------------------------------------------
// RETEST — reset arc meter and form back to blank state
// -----------------------------------------------------
retestBtn.addEventListener("click", () => {
  // Reset arc
  arcProgress.style.strokeDashoffset = ARC_LENGTH;
  arcNeedle.setAttribute("cx", 24);
  arcNeedle.setAttribute("cy", 148);
  arcNeedle.style.stroke = "var(--sky-blue)";
  arcNeedleInner.setAttribute("cx", 24);
  arcNeedleInner.setAttribute("cy", 148);

  // Reset score text
  scoreCounter.textContent = "--";
  scoreCounter.style.fill = "var(--text-primary)";

  // Reset badge + message
  statusBadge.textContent = "Awaiting input";
  statusBadge.className = "status-badge status-idle";
  interpretationText.innerHTML = 'Fill in the form and press <strong>Predict My Score</strong> to see your personalized mental wellness insight here.';

  // Hide retest button, remove highlight
  retestBtn.style.display = "none";
  arcMeterCard.classList.remove("has-result", "result-pop");

  // Reset prediction time
  document.getElementById("predictionTime").textContent = "—";

  // Clear form error
  formError.textContent = "";

  // Scroll to top of form and focus first field
  document.getElementById("predictForm").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => document.getElementById("age").focus(), 600);
});

/**
 * Counts up a number smoothly over ~900ms using requestAnimationFrame.
 */
function animateCounter(el, target) {
  const duration = 900;
  const start = performance.now();
  const startValue = 0;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // ease-out for a natural deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = startValue + (target - startValue) * eased;

    el.textContent = current.toFixed(1);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target.toFixed(1);
    }
  }

  requestAnimationFrame(step);
}

// -----------------------------------------------------
// FLOATING RESULT BANNER
// Shows a prominent score card that slides in from the
// bottom so the result is impossible to miss.
// -----------------------------------------------------

let resultBannerEl = null;

function showResultBanner(score, band) {
  // Remove any existing banner first
  if (resultBannerEl) {
    resultBannerEl.remove();
    resultBannerEl = null;
  }

  const banner = document.createElement("div");
  banner.id = "resultBanner";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.innerHTML = `
    <div class="result-banner-inner">
      <div class="result-banner-score-wrap">
        <span class="result-banner-score">${score.toFixed(1)}</span>
        <span class="result-banner-max">&nbsp;/ 10</span>
      </div>
      <div class="result-banner-info">
        <span class="result-banner-label" style="color:${band.color}">${band.label}</span>
        <span class="result-banner-msg">${band.message}</span>
      </div>
      <button class="result-banner-close" aria-label="Dismiss result banner" title="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(banner);
  resultBannerEl = banner;

  // Trigger entrance animation
  requestAnimationFrame(() => banner.classList.add("result-banner-visible"));

  // Close button
  banner.querySelector(".result-banner-close").addEventListener("click", () => {
    banner.classList.remove("result-banner-visible");
    setTimeout(() => banner.remove(), 400);
    resultBannerEl = null;
  });

  // Auto-dismiss after 12 seconds
  setTimeout(() => {
    if (resultBannerEl === banner) {
      banner.classList.remove("result-banner-visible");
      setTimeout(() => banner.remove(), 400);
      resultBannerEl = null;
    }
  }, 12000);
}