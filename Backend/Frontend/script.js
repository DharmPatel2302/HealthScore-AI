// /* =====================================================
//    MINDSCORE AI — SCRIPT.JS
//    Handles: theme toggle, slider interactions, form validation,
//    API call to FastAPI backend, gauge + counter animation.
//    ===================================================== */

// // -----------------------------------------------------
// // CONFIG
// // -----------------------------------------------------
// // Change this if your FastAPI server runs on a different host/port.
// const API_URL = "/predict";

// // The model's score scale (0 = lowest wellness, 10 = highest wellness).
// // Adjust SCORE_MAX if your model outputs a different range.
// const SCORE_MAX = 10;

// // Circle math constants used for the SVG gauge & mini rings.
// const GAUGE_RADIUS = 92;
// const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS; // ~578
// const MINI_RING_RADIUS = 24;
// const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS; // ~151

// // -----------------------------------------------------
// // THEME TOGGLE (Light / Dark)
// // -----------------------------------------------------
// const themeToggleBtn = document.getElementById("themeToggle");
// const iconSun = document.getElementById("iconSun");
// const iconMoon = document.getElementById("iconMoon");

// function applyTheme(theme) {
//   document.documentElement.setAttribute("data-theme", theme);
//   // Swap the sun/moon icon to reflect the CURRENT theme.
//   if (theme === "dark") {
//     iconSun.style.display = "none";
//     iconMoon.style.display = "block";
//   } else {
//     iconSun.style.display = "block";
//     iconMoon.style.display = "none";
//   }
// }

// // Restore theme choice; default to the user's OS preference on first visit.
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
// // SLIDER INTERACTIONS
// // Each slider updates its own value bubble AND the matching
// // summary card on the right-hand dashboard, live as the user drags.
// // -----------------------------------------------------

// /**
//  * Wires up a range input so that moving it:
//  *  1. Updates a small text bubble showing the current value.
//  *  2. Optionally updates a dashboard stat + mini progress ring.
//  */
// function setupSlider({ sliderId, bubbleId, formatFn, statId, ringId, ringMax }) {
//   const slider = document.getElementById(sliderId);
//   const bubble = document.getElementById(bubbleId);
//   const stat = statId ? document.getElementById(statId) : null;
//   const ring = ringId ? document.getElementById(ringId) : null;

//   function update() {
//     const value = parseFloat(slider.value);
//     const formatted = formatFn(value);

//     bubble.textContent = formatted;
//     // tiny "pop" animation on the bubble for tactile feedback
//     bubble.style.transform = "scale(1.12)";
//     setTimeout(() => (bubble.style.transform = "scale(1)"), 120);

//     if (stat) stat.textContent = formatted;

//     if (ring && ringMax) {
//       const ratio = Math.min(value / ringMax, 1);
//       const offset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
//       ring.style.strokeDashoffset = offset;
//     }
//   }

//   slider.addEventListener("input", update);
//   update(); // initialize on page load
// }

// setupSlider({
//   sliderId: "avg_daily_usage_hours",
//   bubbleId: "usageValue",
//   formatFn: (v) => `${v.toFixed(1)} hrs`,
//   statId: "statUsage",
//   ringId: "ringUsage",
//   ringMax: 12,
// });

// setupSlider({
//   sliderId: "daily_unlocks",
//   bubbleId: "unlocksValue",
//   formatFn: (v) => `${Math.round(v)}/day`,
// });

// setupSlider({
//   sliderId: "study_hours",
//   bubbleId: "studyValue",
//   formatFn: (v) => `${v.toFixed(1)} hrs`,
//   statId: "statStudy",
//   ringId: "ringStudy",
//   ringMax: 12,
// });

// setupSlider({
//   sliderId: "sleep_hours_per_night",
//   bubbleId: "sleepValue",
//   formatFn: (v) => `${v.toFixed(1)} hrs`,
//   statId: "statSleep",
//   ringId: "ringSleep",
//   ringMax: 10,
// });

// setupSlider({
//   sliderId: "physical_activity_hours",
//   bubbleId: "activityValue",
//   formatFn: (v) => `${v.toFixed(1)} hrs`,
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
//   ringStress.style.strokeDashoffset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
// });

// // -----------------------------------------------------
// // TODAY'S DATE (shown in the meta card)
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

//   // Basic HTML5 validation check before calling the API.
//   if (!predictForm.checkValidity()) {
//     predictForm.reportValidity();
//     return;
//   }

//   // Build the JSON payload expected by the /predict endpoint.
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

//     // The FastAPI backend returns { "predicted_mental_health_score": number }
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

// /**
//  * Toggles the button's loading/disabled visual state.
//  */
// function setLoadingState(isLoading) {
//   predictBtn.disabled = isLoading;
//   predictBtn.classList.toggle("loading", isLoading);
// }

// // -----------------------------------------------------
// // RENDER PREDICTION: gauge fill, animated counter, badge, copy
// // -----------------------------------------------------
// // const gaugeProgress = document.getElementById("gaugeProgress");
// // const gaugeProgress = document.getElementById("arcProgress");
// // const scoreCounter = document.getElementById("scoreCounter");
// // const statusBadge = document.getElementById("statusBadge");
// // const interpretationText = document.getElementById("interpretationText");
// // // const gaugeCard = document.querySelector(".gauge-card");
// // const gaugeCard = document.querySelector(".arc-meter-card");

// const gaugeProgress = document.getElementById("arcProgress");
// const arcNeedle = document.getElementById("arcNeedle");
// const arcNeedleInner = document.getElementById("arcNeedleInner");

// const scoreCounter = document.getElementById("scoreCounter");
// const statusBadge = document.getElementById("statusBadge");
// const interpretationText = document.getElementById("interpretationText");

// const gaugeCard = document.querySelector(".arc-meter-card");


// // Prepare the gauge circle stroke for animation (starts empty).
// gaugeProgress.style.strokeDasharray = GAUGE_CIRCUMFERENCE;
// gaugeProgress.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;

// /**
//  * Maps a 0-10 score to a status label, CSS class, color and message,
//  * matching the 5-tier system from the design brief.
//  */
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

// /**
//  * Animates the gauge ring, the numeric counter, and updates the
//  * status badge + interpretation text once a prediction is received.
//  */
// function renderPrediction(rawScore) {
//   const score = Math.max(0, Math.min(SCORE_MAX, rawScore));
//   const band = getScoreBand(score);

//   // --- Fill the gauge ring ---
//   const ratio = score / SCORE_MAX;
//   const offset = GAUGE_CIRCUMFERENCE * (1 - ratio);
//   gaugeProgress.style.stroke = band.color;
//   gaugeProgress.style.strokeDashoffset = offset;
//   gaugeProgress.style.color = band.color; // used by drop-shadow "breathing" glow

//   // --- Animate the numeric counter from 0 to the final score ---
//   animateCounter(scoreCounter, score);

//   // --- Update status badge ---
//   statusBadge.textContent = band.label;
//   statusBadge.className = `status-badge ${band.statusClass}`;

//   // --- Update interpretation copy ---
//   interpretationText.textContent = band.message;

//   // --- Record prediction time in the meta card ---
//   document.getElementById("predictionTime").textContent = new Date().toLocaleTimeString(
//     undefined,
//     { hour: "2-digit", minute: "2-digit" }
//   );

//   // --- Small "pop" animation to draw attention to the result ---
//   gaugeCard.classList.remove("result-pop");
//   void gaugeCard.offsetWidth; // force reflow so the animation can replay
//   gaugeCard.classList.add("result-pop");

//   // Scroll the dashboard into view on smaller screens where it isn't sticky.
//   if (window.innerWidth <= 1024) {
//     document.querySelector(".dashboard-column").scrollIntoView({
//       behavior: "smooth",
//       block: "start",
//     });
//   }
// }

// /**
//  * Counts up a number smoothly over ~900ms using requestAnimationFrame.
//  */
// function animateCounter(el, target) {
//   const duration = 900;
//   const start = performance.now();
//   const startValue = 0;

//   function step(now) {
//     const elapsed = now - start;
//     const progress = Math.min(elapsed / duration, 1);
//     // ease-out for a natural deceleration
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
   API call to FastAPI backend, gauge + counter animation.
   ===================================================== */

// -----------------------------------------------------
// CONFIG
// -----------------------------------------------------
const API_URL = "/predict";
const SCORE_MAX = 10;

// --- Arc geometry (must match the SVG <path> in index.html) ---
// Path: M 24 148 A 116 116 0 0 1 256 148  → semicircle, radius 116, center (140,148)
const ARC_RADIUS = 116;
const ARC_CENTER_X = 140;
const ARC_CENTER_Y = 148;
// Length of a HALF circle (this arc), NOT a full circle:
const GAUGE_CIRCUMFERENCE = Math.PI * ARC_RADIUS; // ≈ 364.4

// Mini progress rings on the stat cards (these ARE full circles)
const MINI_RING_RADIUS = 24;
const MINI_RING_CIRCUMFERENCE = 2 * Math.PI * MINI_RING_RADIUS; // ≈ 150.8

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
// SLIDER INTERACTIONS
// -----------------------------------------------------
function setupSlider({ sliderId, bubbleId, formatFn, statId, ringId, ringMax }) {
  const slider = document.getElementById(sliderId);
  const bubble = document.getElementById(bubbleId);
  const stat = statId ? document.getElementById(statId) : null;
  const ring = ringId ? document.getElementById(ringId) : null;

  function update() {
    const value = parseFloat(slider.value);
    const formatted = formatFn(value);

    bubble.textContent = formatted;
    bubble.style.transform = "scale(1.12)";
    setTimeout(() => (bubble.style.transform = "scale(1)"), 120);

    if (stat) stat.textContent = formatted;

    if (ring && ringMax) {
      const ratio = Math.min(value / ringMax, 1);
      const offset = MINI_RING_CIRCUMFERENCE * (1 - ratio);
      ring.style.strokeDasharray = MINI_RING_CIRCUMFERENCE;
      ring.style.strokeDashoffset = offset;
    }
  }

  slider.addEventListener("input", update);
  update();
}

setupSlider({
  sliderId: "avg_daily_usage_hours",
  bubbleId: "usageValue",
  formatFn: (v) => `${v.toFixed(1)} hrs`,
  statId: "statUsage",
  ringId: "ringUsage",
  ringMax: 12,
});

setupSlider({
  sliderId: "daily_unlocks",
  bubbleId: "unlocksValue",
  formatFn: (v) => `${Math.round(v)}/day`,
});

setupSlider({
  sliderId: "study_hours",
  bubbleId: "studyValue",
  formatFn: (v) => `${v.toFixed(1)} hrs`,
  statId: "statStudy",
  ringId: "ringStudy",
  ringMax: 12,
});

setupSlider({
  sliderId: "sleep_hours_per_night",
  bubbleId: "sleepValue",
  formatFn: (v) => `${v.toFixed(1)} hrs`,
  statId: "statSleep",
  ringId: "ringSleep",
  ringMax: 10,
});

setupSlider({
  sliderId: "physical_activity_hours",
  bubbleId: "activityValue",
  formatFn: (v) => `${v.toFixed(1)} hrs`,
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
// RENDER PREDICTION: arc fill, needle, counter, badge, copy
// -----------------------------------------------------
const gaugeProgress = document.getElementById("arcProgress");
const arcNeedle = document.getElementById("arcNeedle");
const arcNeedleInner = document.getElementById("arcNeedleInner");
const scoreCounter = document.getElementById("scoreCounter");
const statusBadge = document.getElementById("statusBadge");
const interpretationText = document.getElementById("interpretationText");
const gaugeCard = document.querySelector(".arc-meter-card");

// Prepare the arc stroke for animation (starts empty).
gaugeProgress.style.strokeDasharray = GAUGE_CIRCUMFERENCE;
gaugeProgress.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;

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
 * Given a 0..1 ratio along the semicircle (0 = left end, 1 = right end),
 * returns the {x, y} point on the arc — used to place the needle dot.
 */
function pointOnArc(ratio) {
  const theta = Math.PI * (1 - ratio); // π (180°) at ratio 0 → 0 at ratio 1
  const x = ARC_CENTER_X + ARC_RADIUS * Math.cos(theta);
  const y = ARC_CENTER_Y - ARC_RADIUS * Math.sin(theta);
  return { x, y };
}

function renderPrediction(rawScore) {
  const score = Math.max(0, Math.min(SCORE_MAX, rawScore));
  const band = getScoreBand(score);
  const ratio = score / SCORE_MAX;

  // --- Fill the arc ---
  const offset = GAUGE_CIRCUMFERENCE * (1 - ratio);
  gaugeProgress.style.stroke = band.color;
  gaugeProgress.style.strokeDashoffset = offset;
  gaugeProgress.style.color = band.color;

  // --- Move the needle along the arc ---
  const { x, y } = pointOnArc(ratio);
  arcNeedle.setAttribute("cx", x);
  arcNeedle.setAttribute("cy", y);
  arcNeedleInner.setAttribute("cx", x);
  arcNeedleInner.setAttribute("cy", y);
  arcNeedle.style.fill = band.color;

  // --- Animate the numeric counter ---
  animateCounter(scoreCounter, score);

  // --- Update status badge ---
  statusBadge.textContent = band.label;
  statusBadge.className = `status-badge ${band.statusClass}`;

  // --- Update interpretation copy ---
  interpretationText.textContent = band.message;

  // --- Record prediction time ---
  document.getElementById("predictionTime").textContent = new Date().toLocaleTimeString(
    undefined,
    { hour: "2-digit", minute: "2-digit" }
  );

  // --- Small "pop" animation ---
  gaugeCard.classList.remove("result-pop");
  void gaugeCard.offsetWidth;
  gaugeCard.classList.add("result-pop");

  if (window.innerWidth <= 1024) {
    document.querySelector(".dashboard-column").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}

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