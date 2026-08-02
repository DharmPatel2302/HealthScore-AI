
// const API_URL = "/predict";

// const SCORE_MAX = 10;

// // Mini progress rings (Sleep / Study / Usage / Stress cards) — full circles.
// const MINI_RING_RADIUS = 24;
// const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS; // ~150.8

// // -----------------------------------------------------
// // THEME TOGGLE (Light / Dark)
// // -----------------------------------------------------
// const themeToggleBtn = document.getElementById("themeToggle");
// const iconSun = document.getElementById("iconSun");
// const iconMoon = document.getElementById("iconMoon");

// function applyTheme(theme) {
//   document.documentElement.setAttribute("data-theme", theme);
//   if (theme === "dark") {
//     iconSun.style.display = "none";
//     iconMoon.style.display = "block";
//   } else {
//     iconSun.style.display = "block";
//     iconMoon.style.display = "none";
//   }
// }

// const savedTheme =
//   window.__mindscoreTheme ||
//   (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
// applyTheme(savedTheme);
// window.__mindscoreTheme = savedTheme;

// themeToggleBtn.addEventListener("click", () => {
//   const current = document.documentElement.getAttribute("data-theme");
//   const next = current === "dark" ? "light" : "dark";
//   applyTheme(next);
//   window.__mindscoreTheme = next;
// });

// // -----------------------------------------------------
// // SLIDER <-> NUMBER BUBBLE TWO-WAY SYNC
// // Dragging the slider updates the number bubble; typing in the bubble
// // (on blur / Enter) moves the slider. Both update dashboard stat + ring.
// // -----------------------------------------------------
// function setupSlider({ sliderId, bubbleId, isCount = false, statId, ringId, ringMax }) {
//   const slider = document.getElementById(sliderId);
//   const bubble = document.getElementById(bubbleId);
//   const stat   = statId ? document.getElementById(statId) : null;
//   const ring   = ringId ? document.getElementById(ringId) : null;
//   const decimals = isCount ? 0 : 1;

//   function formatStat(v) {
//     return isCount ? `${Math.round(v)}/day` : `${v.toFixed(1)} hrs`;
//   }

//   function applyValue(value) {
//     const min = parseFloat(slider.min);
//     const max = parseFloat(slider.max);
//     value = Math.min(Math.max(value, min), max);

//     slider.value = value;
//     bubble.value = isCount ? Math.round(value) : value.toFixed(decimals);

//     if (stat) stat.textContent = formatStat(value);

//     if (ring && ringMax) {
//       const ratio = Math.min(value / ringMax, 1);
//       ring.style.strokeDasharray = MINI_RING_CIRCUMFERENCE;
//       ring.style.strokeDashoffset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
//     }

//     return value;
//   }

//   // Slider drag -> sync bubble
//   slider.addEventListener("input", () => {
//     applyValue(parseFloat(slider.value));
//     bubble.style.transform = "scale(1.12)";
//     setTimeout(() => (bubble.style.transform = "scale(1)"), 120);
//   });

//   // Typing in bubble -> sync slider (select all on focus so typing replaces, not appends)
//   bubble.addEventListener("focus", () => bubble.select());
//   bubble.addEventListener("change", () => {
//     const v = parseFloat(bubble.value);
//     if (!Number.isNaN(v)) applyValue(v);
//   });
//   bubble.addEventListener("keydown", (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       const v = parseFloat(bubble.value);
//       if (!Number.isNaN(v)) applyValue(v);
//       bubble.blur();
//     }
//   });
//   // Prevent accidental value change while scrolling the page over the bubble
//   bubble.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

//   applyValue(parseFloat(slider.value)); // initialise on load
// }

// setupSlider({
//   sliderId: "avg_daily_usage_hours",
//   bubbleId: "usageValue",
//   statId: "statUsage",
//   ringId: "ringUsage",
//   ringMax: 12,
// });

// setupSlider({
//   sliderId: "daily_unlocks",
//   bubbleId: "unlocksValue",
//   isCount: true,
// });

// setupSlider({
//   sliderId: "study_hours",
//   bubbleId: "studyValue",
//   statId: "statStudy",
//   ringId: "ringStudy",
//   ringMax: 12,
// });

// setupSlider({
//   sliderId: "sleep_hours_per_night",
//   bubbleId: "sleepValue",
//   statId: "statSleep",
//   ringId: "ringSleep",
//   ringMax: 10,
// });

// setupSlider({
//   sliderId: "physical_activity_hours",
//   bubbleId: "activityValue",
// });

// // Stress level select also drives its own dashboard card + ring.
// const stressSelect = document.getElementById("stress_level");
// const statStress = document.getElementById("statStress");
// const ringStress = document.getElementById("ringStress");
// const stressLevelToRatio = { Low: 0.25, Medium: 0.5, High: 0.75, "Very High": 1 };

// stressSelect.addEventListener("change", () => {
//   const level = stressSelect.value;
//   if (!level) return;
//   statStress.textContent = level;
//   const ratio = stressLevelToRatio[level] ?? 0.5;
//   ringStress.style.strokeDasharray = MINI_RING_CIRCUMFERENCE;
//   ringStress.style.strokeDashoffset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
// });

// // -----------------------------------------------------
// // TODAY'S DATE
// // -----------------------------------------------------
// const todayDateEl = document.getElementById("todayDate");
// todayDateEl.textContent = new Date().toLocaleDateString(undefined, {
//   year: "numeric",
//   month: "short",
//   day: "numeric",
// });

// // -----------------------------------------------------
// // RIPPLE EFFECT ON PREDICT BUTTON
// // -----------------------------------------------------
// const predictBtn = document.getElementById("predictBtn");

// predictBtn.addEventListener("click", (e) => {
//   const rect = predictBtn.getBoundingClientRect();
//   const ripple = document.createElement("span");
//   const size = Math.max(rect.width, rect.height);

//   ripple.className = "ripple";
//   ripple.style.width = ripple.style.height = `${size}px`;
//   ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
//   ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

//   predictBtn.appendChild(ripple);
//   setTimeout(() => ripple.remove(), 650);
// });

// // -----------------------------------------------------
// // FORM SUBMISSION -> CALL FASTAPI BACKEND
// // -----------------------------------------------------
// const predictForm = document.getElementById("predictForm");
// const formError = document.getElementById("formError");

// predictForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   formError.textContent = "";

//   if (!predictForm.checkValidity()) {
//     predictForm.reportValidity();
//     return;
//   }

//   const payload = {
//     age: Number(document.getElementById("age").value),
//     gender: document.getElementById("gender").value,
//     country: document.getElementById("country").value,
//     academic_level: document.getElementById("academic_level").value,
//     most_used_platform: document.getElementById("most_used_platform").value,
//     purpose_of_use: document.getElementById("purpose_of_use").value,
//     avg_daily_usage_hours: Number(document.getElementById("avg_daily_usage_hours").value),
//     daily_unlocks: Number(document.getElementById("daily_unlocks").value),
//     study_hours: Number(document.getElementById("study_hours").value),
//     physical_activity_hours: Number(document.getElementById("physical_activity_hours").value),
//     sleep_hours_per_night: Number(document.getElementById("sleep_hours_per_night").value),
//     stress_level: document.getElementById("stress_level").value,
//   };

//   setLoadingState(true);

//   try {
//     const response = await fetch(API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       throw new Error(`Server responded with status ${response.status}`);
//     }

//     const data = await response.json();
//     const score = data.predicted_mental_health_score;

//     if (typeof score !== "number" || Number.isNaN(score)) {
//       throw new Error("Unexpected response shape from the API.");
//     }

//     renderPrediction(score);
//   } catch (err) {
//     console.error("Prediction request failed:", err);
//     formError.textContent =
//       "Couldn't reach the prediction API. Make sure the FastAPI server is running at " +
//       API_URL;
//   } finally {
//     setLoadingState(false);
//   }
// });

// function setLoadingState(isLoading) {
//   predictBtn.disabled = isLoading;
//   predictBtn.classList.toggle("loading", isLoading);
// }

// // -----------------------------------------------------
// // RENDER PREDICTION: arc fill, needle, counter, badge, copy, retest button
// // -----------------------------------------------------
// const arcProgress = document.getElementById("arcProgress");
// const arcNeedle = document.getElementById("arcNeedle");
// const arcNeedleInner = document.getElementById("arcNeedleInner");
// const scoreCounter = document.getElementById("scoreCounter");
// const statusBadge = document.getElementById("statusBadge");
// const interpretationText = document.getElementById("interpretationText");
// const arcMeterCard = document.querySelector(".arc-meter-card");
// const retestBtn = document.getElementById("retestBtn");

// // Arc geometry — MUST match the SVG <path> in index.html:
// // "M 24 148 A 116 116 0 0 1 256 148" → semicircle, radius 116, center (140,148)
// const ARC_CX = 140, ARC_CY = 148, ARC_R = 116;
// const ARC_LENGTH = Math.PI * ARC_R; // ≈ 364.4 — HALF circle, not full circle

// arcProgress.style.strokeDasharray = ARC_LENGTH;
// arcProgress.style.strokeDashoffset = ARC_LENGTH;

// /** Point on the semicircle for a given 0..1 score ratio (0=left, 1=right). */
// function arcPoint(ratio) {
//   const angleDeg = 180 - ratio * 180;
//   const angleRad = (angleDeg * Math.PI) / 180;
//   return {
//     x: ARC_CX + ARC_R * Math.cos(angleRad),
//     y: ARC_CY - ARC_R * Math.sin(angleRad),
//   };
// }

// function getScoreBand(score) {
//   if (score >= 8) {
//     return {
//       label: "Excellent",
//       statusClass: "status-excellent",
//       color: "var(--status-excellent)",
//       message:
//         "Your lifestyle habits indicate excellent mental wellness. Continue maintaining balanced sleep, study and physical activity.",
//     };
//   }
//   if (score >= 6) {
//     return {
//       label: "Good",
//       statusClass: "status-good",
//       color: "var(--status-good)",
//       message:
//         "Your habits reflect good mental wellness overall. A few small tweaks to sleep or screen time could push you even higher.",
//     };
//   }
//   if (score >= 4) {
//     return {
//       label: "Moderate",
//       statusClass: "status-moderate",
//       color: "var(--status-moderate)",
//       message:
//         "Your lifestyle indicates moderate mental wellness. Small improvements in sleep and reduced social media usage may improve your score.",
//     };
//   }
//   if (score >= 2) {
//     return {
//       label: "Needs Attention",
//       statusClass: "status-attention",
//       color: "var(--status-attention)",
//       message:
//         "Your current routine shows signs that may affect your wellbeing. Prioritizing consistent sleep and lowering stress could help.",
//     };
//   }
//   return {
//     label: "Poor",
//     statusClass: "status-poor",
//     color: "var(--status-poor)",
//     message:
//       "Your current habits may negatively impact mental wellness. Increasing sleep, reducing stress and maintaining regular physical activity are recommended.",
//   };
// }

// function renderPrediction(rawScore) {
//   const score = Math.max(0, Math.min(SCORE_MAX, rawScore));
//   const band = getScoreBand(score);
//   const ratio = score / SCORE_MAX;

//   // --- Fill the arc ---
//   arcProgress.style.strokeDashoffset = ARC_LENGTH * (1 - ratio);

//   // --- Move the needle along the arc ---
//   const pt = arcPoint(ratio);
//   arcNeedle.setAttribute("cx", pt.x);
//   arcNeedle.setAttribute("cy", pt.y);
//   arcNeedle.style.fill = band.color;
//   arcNeedleInner.setAttribute("cx", pt.x);
//   arcNeedleInner.setAttribute("cy", pt.y);

//   // --- Animate the numeric counter ---
//   animateCounter(scoreCounter, score);
//   scoreCounter.style.fill = band.color;

//   // --- Status badge + interpretation ---
//   statusBadge.textContent = band.label;
//   statusBadge.className = `status-badge ${band.statusClass}`;
//   interpretationText.textContent = band.message;

//   // --- Prediction time ---
//   document.getElementById("predictionTime").textContent = new Date().toLocaleTimeString(
//     undefined,
//     { hour: "2-digit", minute: "2-digit" }
//   );

//   // --- Pop animation ---
//   arcMeterCard.classList.remove("result-pop");
//   void arcMeterCard.offsetWidth;
//   arcMeterCard.classList.add("result-pop");

//   // --- Show the Try Again button ---
//   retestBtn.style.display = "inline-flex";

//   if (window.innerWidth <= 1024) {
//     document.querySelector(".dashboard-column").scrollIntoView({
//       behavior: "smooth",
//       block: "start",
//     });
//   }
// }

// // -----------------------------------------------------
// // RETEST — reset arc meter + result panel back to idle state
// // (Does NOT clear the form inputs, so the user can tweak values and re-run.)
// // -----------------------------------------------------
// retestBtn.addEventListener("click", () => {
//   arcProgress.style.strokeDashoffset = ARC_LENGTH;

//   arcNeedle.setAttribute("cx", 24);
//   arcNeedle.setAttribute("cy", 148);
//   arcNeedle.style.fill = "";
//   arcNeedleInner.setAttribute("cx", 24);
//   arcNeedleInner.setAttribute("cy", 148);

//   scoreCounter.textContent = "--";
//   scoreCounter.style.fill = "";

//   statusBadge.textContent = "Awaiting input";
//   statusBadge.className = "status-badge status-idle";
//   interpretationText.innerHTML =
//     'Fill in the form and press <strong>Predict My Score</strong> to see your personalized mental wellness insight here.';

//   document.getElementById("predictionTime").textContent = "—";
//   formError.textContent = "";

//   retestBtn.style.display = "none";
// });

// function animateCounter(el, target) {
//   const duration = 900;
//   const start = performance.now();
//   const startValue = 0;

//   function step(now) {
//     const elapsed = now - start;
//     const progress = Math.min(elapsed / duration, 1);
//     const eased = 1 - Math.pow(1 - progress, 3);
//     const current = startValue + (target - startValue) * eased;

//     el.textContent = current.toFixed(1);

//     if (progress < 1) {
//       requestAnimationFrame(step);
//     } else {
//       el.textContent = target.toFixed(1);
//     }
//   }

//   requestAnimationFrame(step);
// }

/* =====================================================
   MINDSCORE AI — SCRIPT.JS
   Handles: theme toggle, slider interactions, form validation,
   API call to FastAPI backend, arc gauge + counter animation,
   scroll-to-result, and a floating result popup.
   ===================================================== */

// -----------------------------------------------------
// CONFIG
// -----------------------------------------------------
// Relative path — works both locally (same-origin dev server) and on Railway.
// Do NOT hardcode http://127.0.0.1:8000 here, it will break in production.
const API_URL = "/predict";

const SCORE_MAX = 10;

// Mini progress rings (Sleep / Study / Usage / Stress cards) — full circles.
const MINI_RING_RADIUS = 24;
const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS; // ~150.8

// -----------------------------------------------------
// THEME TOGGLE (Light / Dark)
// -----------------------------------------------------
const themeToggleBtn = document.getElementById("themeToggle");
const iconSun = document.getElementById("iconSun");
const iconMoon = document.getElementById("iconMoon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "dark") {
    iconSun.style.display = "none";
    iconMoon.style.display = "block";
  } else {
    iconSun.style.display = "block";
    iconMoon.style.display = "none";
  }
}

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
// SLIDER <-> NUMBER BUBBLE TWO-WAY SYNC
// -----------------------------------------------------
function setupSlider({ sliderId, bubbleId, isCount = false, statId, ringId, ringMax }) {
  const slider = document.getElementById(sliderId);
  const bubble = document.getElementById(bubbleId);
  const stat   = statId ? document.getElementById(statId) : null;
  const ring   = ringId ? document.getElementById(ringId) : null;
  const decimals = isCount ? 0 : 1;

  function formatStat(v) {
    return isCount ? `${Math.round(v)}/day` : `${v.toFixed(1)} hrs`;
  }

  function applyValue(value) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    value = Math.min(Math.max(value, min), max);

    slider.value = value;
    bubble.value = isCount ? Math.round(value) : value.toFixed(decimals);

    if (stat) stat.textContent = formatStat(value);

    if (ring && ringMax) {
      const ratio = Math.min(value / ringMax, 1);
      ring.style.strokeDasharray = MINI_RING_CIRCUMFERENCE;
      ring.style.strokeDashoffset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
    }

    return value;
  }

  slider.addEventListener("input", () => {
    applyValue(parseFloat(slider.value));
    bubble.style.transform = "scale(1.12)";
    setTimeout(() => (bubble.style.transform = "scale(1)"), 120);
  });

  bubble.addEventListener("focus", () => bubble.select());
  bubble.addEventListener("change", () => {
    const v = parseFloat(bubble.value);
    if (!Number.isNaN(v)) applyValue(v);
  });
  bubble.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const v = parseFloat(bubble.value);
      if (!Number.isNaN(v)) applyValue(v);
      bubble.blur();
    }
  });
  bubble.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });

  applyValue(parseFloat(slider.value));
}

setupSlider({
  sliderId: "avg_daily_usage_hours",
  bubbleId: "usageValue",
  statId: "statUsage",
  ringId: "ringUsage",
  ringMax: 12,
});

setupSlider({
  sliderId: "daily_unlocks",
  bubbleId: "unlocksValue",
  isCount: true,
});

setupSlider({
  sliderId: "study_hours",
  bubbleId: "studyValue",
  statId: "statStudy",
  ringId: "ringStudy",
  ringMax: 12,
});

setupSlider({
  sliderId: "sleep_hours_per_night",
  bubbleId: "sleepValue",
  statId: "statSleep",
  ringId: "ringSleep",
  ringMax: 10,
});

setupSlider({
  sliderId: "physical_activity_hours",
  bubbleId: "activityValue",
});

const stressSelect = document.getElementById("stress_level");
const statStress = document.getElementById("statStress");
const ringStress = document.getElementById("ringStress");
const stressLevelToRatio = { Low: 0.25, Medium: 0.5, High: 0.75, "Very High": 1 };

stressSelect.addEventListener("change", () => {
  const level = stressSelect.value;
  if (!level) return;
  statStress.textContent = level;
  const ratio = stressLevelToRatio[level] ?? 0.5;
  ringStress.style.strokeDasharray = MINI_RING_CIRCUMFERENCE;
  ringStress.style.strokeDashoffset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
});

// -----------------------------------------------------
// TODAY'S DATE
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

  if (!predictForm.checkValidity()) {
    predictForm.reportValidity();
    return;
  }

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

function setLoadingState(isLoading) {
  predictBtn.disabled = isLoading;
  predictBtn.classList.toggle("loading", isLoading);
}

// -----------------------------------------------------
// RENDER PREDICTION: arc fill, needle, counter, badge, copy, retest button
// -----------------------------------------------------
const arcProgress = document.getElementById("arcProgress");
const arcNeedle = document.getElementById("arcNeedle");
const arcNeedleInner = document.getElementById("arcNeedleInner");
const scoreCounter = document.getElementById("scoreCounter");
const statusBadge = document.getElementById("statusBadge");
const interpretationText = document.getElementById("interpretationText");
const arcMeterCard = document.querySelector(".arc-meter-card");
const retestBtn = document.getElementById("retestBtn");

// Arc geometry — MUST match the SVG <path> in index.html:
// "M 24 148 A 116 116 0 0 1 256 148" → semicircle, radius 116, center (140,148)
const ARC_CX = 140, ARC_CY = 148, ARC_R = 116;
const ARC_LENGTH = Math.PI * ARC_R; // ≈ 364.4 — HALF circle, not full circle

arcProgress.style.strokeDasharray = ARC_LENGTH;
arcProgress.style.strokeDashoffset = ARC_LENGTH;

function arcPoint(ratio) {
  const angleDeg = 180 - ratio * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: ARC_CX + ARC_R * Math.cos(angleRad),
    y: ARC_CY - ARC_R * Math.sin(angleRad),
  };
}

function getScoreBand(score) {
  if (score >= 8) {
    return {
      label: "Excellent",
      statusClass: "status-excellent",
      color: "#2FB88A",
      message:
        "Your lifestyle habits indicate excellent mental wellness. Continue maintaining balanced sleep, study and physical activity.",
    };
  }
  if (score >= 6) {
    return {
      label: "Good",
      statusClass: "status-good",
      color: "#4A90D9",
      message:
        "Your habits reflect good mental wellness overall. A few small tweaks to sleep or screen time could push you even higher.",
    };
  }
  if (score >= 4) {
    return {
      label: "Moderate",
      statusClass: "status-moderate",
      color: "#E8A33D",
      message:
        "Your lifestyle indicates moderate mental wellness. Small improvements in sleep and reduced social media usage may improve your score.",
    };
  }
  if (score >= 2) {
    return {
      label: "Needs Attention",
      statusClass: "status-attention",
      color: "#E8813D",
      message:
        "Your current routine shows signs that may affect your wellbeing. Prioritizing consistent sleep and lowering stress could help.",
    };
  }
  return {
    label: "Poor",
    statusClass: "status-poor",
    color: "#E85D5D",
    message:
      "Your current habits may negatively impact mental wellness. Increasing sleep, reducing stress and maintaining regular physical activity are recommended.",
  };
}

function renderPrediction(rawScore) {
  const score = Math.max(0, Math.min(SCORE_MAX, rawScore));
  const band = getScoreBand(score);
  const ratio = score / SCORE_MAX;

  // --- Fill the arc ---
  arcProgress.style.strokeDashoffset = ARC_LENGTH * (1 - ratio);

  // --- Move the needle along the arc ---
  const pt = arcPoint(ratio);
  arcNeedle.setAttribute("cx", pt.x);
  arcNeedle.setAttribute("cy", pt.y);
  arcNeedle.style.fill = band.color;
  arcNeedleInner.setAttribute("cx", pt.x);
  arcNeedleInner.setAttribute("cy", pt.y);

  // --- Animate the numeric counter ---
  animateCounter(scoreCounter, score);
  scoreCounter.style.fill = band.color;

  // --- Status badge + interpretation ---
  statusBadge.textContent = band.label;
  statusBadge.className = `status-badge ${band.statusClass}`;
  interpretationText.textContent = band.message;

  // --- Prediction time ---
  document.getElementById("predictionTime").textContent = new Date().toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" }
  );

  // --- Pop animation ---
  arcMeterCard.classList.remove("result-pop");
  void arcMeterCard.offsetWidth;
  arcMeterCard.classList.add("result-pop");

  // --- Show the Try Again button ---
  retestBtn.style.display = "inline-flex";

  // --- Always scroll the result card into view (desktop + mobile) ---
  arcMeterCard.scrollIntoView({ behavior: "smooth", block: "center" });

  // --- Floating popup with the score ---
  showResultBanner(score, band);
}

// -----------------------------------------------------
// RETEST — reset arc meter + result panel back to idle state
// -----------------------------------------------------
retestBtn.addEventListener("click", () => {
  arcProgress.style.strokeDashoffset = ARC_LENGTH;

  arcNeedle.setAttribute("cx", 24);
  arcNeedle.setAttribute("cy", 148);
  arcNeedle.style.fill = "";
  arcNeedleInner.setAttribute("cx", 24);
  arcNeedleInner.setAttribute("cy", 148);

  scoreCounter.textContent = "--";
  scoreCounter.style.fill = "";

  statusBadge.textContent = "Awaiting input";
  statusBadge.className = "status-badge status-idle";
  interpretationText.innerHTML =
    'Fill in the form and press <strong>Predict My Score</strong> to see your personalized mental wellness insight here.';

  document.getElementById("predictionTime").textContent = "—";
  formError.textContent = "";

  retestBtn.style.display = "none";
});

function animateCounter(el, target) {
  const duration = 900;
  const start = performance.now();
  const startValue = 0;

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
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
// FLOATING RESULT POPUP
// Self-contained: all styling is inline, so it doesn't depend on
// anything in style.css and can't silently fail to render.
// -----------------------------------------------------
let resultBannerEl = null;

function showResultBanner(score, band) {
  if (resultBannerEl) {
    resultBannerEl.remove();
    resultBannerEl = null;
  }

  const banner = document.createElement("div");
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");

  Object.assign(banner.style, {
    position: "fixed",
    left: "24px",
    bottom: "24px",
    zIndex: "9999",
    maxWidth: "420px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "18px 20px",
    borderRadius: "16px",
    background: "#12161FEE",
    border: "1px solid #2A2F3C",
    boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
    backdropFilter: "blur(8px)",
    fontFamily: "Inter, sans-serif",
    color: "#F5F6F8",
    transform: "translateY(24px)",
    opacity: "0",
    transition: "transform 0.35s ease, opacity 0.35s ease",
  });

  banner.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;min-width:64px;">
      <span style="font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:${band.color};line-height:1;">${score.toFixed(1)}</span>
      <span style="font-size:12px;color:#9AA1AF;margin-top:2px;">/ 10</span>
    </div>
    <div style="flex:1;">
      <div style="font-weight:700;font-size:14px;color:${band.color};margin-bottom:4px;">${band.label}</div>
      <div style="font-size:13px;line-height:1.4;color:#C7CBD4;">${band.message}</div>
    </div>
    <button aria-label="Dismiss" title="Dismiss" style="
      background:none;border:none;cursor:pointer;color:#9AA1AF;
      padding:2px;line-height:0;flex-shrink:0;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  document.body.appendChild(banner);
  resultBannerEl = banner;

  requestAnimationFrame(() => {
    banner.style.transform = "translateY(0)";
    banner.style.opacity = "1";
  });

  function dismiss() {
    if (!resultBannerEl) return;
    banner.style.transform = "translateY(24px)";
    banner.style.opacity = "0";
    setTimeout(() => banner.remove(), 350);
    resultBannerEl = null;
  }

  banner.querySelector("button").addEventListener("click", dismiss);
  setTimeout(dismiss, 10000);
}