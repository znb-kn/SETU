/* =========================================
   SETU — FINAL JAVASCRIPT
   ========================================= */

const WINDOW_MS = 5 * 60 * 1000;
const THRESHOLD = 2;

let requests = JSON.parse(
  localStorage.getItem("setuRequests") || "[]"
);

let alerts = JSON.parse(
  localStorage.getItem("setuAlerts") || "[]"
);

let patternCount = Number(
  localStorage.getItem("setuPatternCount") || 0
);

let soundEnabled =
  localStorage.getItem("setuSound") === "true";

let largeMode =
  localStorage.getItem("setuLargeMode") === "true";

let calmMode =
  localStorage.getItem("setuCalmMode") === "true";

let favorites = JSON.parse(
  localStorage.getItem("setuFavorites") || "[]"
);


/* =========================================
   SAVE DATA
   ========================================= */

function saveData() {
  localStorage.setItem(
    "setuRequests",
    JSON.stringify(requests)
  );

  localStorage.setItem(
    "setuAlerts",
    JSON.stringify(alerts)
  );

  localStorage.setItem(
    "setuPatternCount",
    String(patternCount)
  );

  localStorage.setItem(
    "setuSound",
    String(soundEnabled)
  );

  localStorage.setItem(
    "setuLargeMode",
    String(largeMode)
  );

  localStorage.setItem(
    "setuCalmMode",
    String(calmMode)
  );

  localStorage.setItem(
    "setuFavorites",
    JSON.stringify(favorites)
  );
}


/* =========================================
   COMMUNICATION REQUEST
   ========================================= */

function makeRequest(name, emoji) {

  const now = Date.now();

  const request = {
    name: name,
    emoji: emoji,
    time: now
  };

  requests.push(request);

  saveData();

  speak(name);

  showStatus(
    `${emoji} ${name} selected`
  );

  showToast(
    `${emoji} ${name}`
  );

  detectPattern(name, now);

  updateEverything();
}


/* =========================================
   AUDIO FEEDBACK
   ========================================= */

function speak(text) {

  if (!soundEnabled) {
    return;
  }

  /* Short confirmation tone */

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (AudioContext) {

      const audioContext =
        new AudioContext();

      const oscillator =
        audioContext.createOscillator();

      const gain =
        audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.value = 660;

      gain.gain.setValueAtTime(
        0.08,
        audioContext.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.12
      );

      oscillator.connect(gain);

      gain.connect(
        audioContext.destination
      );

      oscillator.start();

      oscillator.stop(
        audioContext.currentTime + 0.12
      );

      setTimeout(() => {
        audioContext.close();
      }, 250);
    }

  } catch (error) {

    console.log(
      "Audio feedback unavailable:",
      error
    );
  }


  /* Browser speech */

  if (
    "speechSynthesis" in window
  ) {

    try {

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      setTimeout(() => {

        window.speechSynthesis.speak(
          utterance
        );

      }, 100);

    } catch (error) {

      console.log(
        "Speech feedback unavailable:",
        error
      );
    }
  }
}


/* =========================================
   PATTERN DETECTION
   ========================================= */

function detectPattern(name, now) {

  const recentRequests =
    requests.filter(
      request =>
        request.name === name &&
        now - request.time <= WINDOW_MS
    );

  if (
    recentRequests.length >= THRESHOLD
  ) {

    const alreadyAlerted =
      alerts.some(
        alert =>
          alert.name === name &&
          now - alert.time <= WINDOW_MS
      );

    if (!alreadyAlerted) {

      patternCount++;

      createAlert(
        name,
        recentRequests.length,
        now
      );
    }
  }
}


/* =========================================
   CREATE ALERT
   ========================================= */

function createAlert(
  name,
  count,
  time
) {

  const emoji =
    getEmoji(name);

  const alert = {

    name: name,

    emoji: emoji,

    count: count,

    time: time,

    acknowledged: false
  };

  alerts.unshift(alert);

  saveData();

  showAlert(alert);

  showToast(
    `Pattern detected: ${name}`
  );

  updateEverything();
}


/* =========================================
   SHOW ALERT
   ========================================= */

function showAlert(alert) {

  const alertBox =
    document.getElementById(
      "alertBox"
    );

  const alertTitle =
    document.getElementById(
      "alertTitle"
    );

  const alertMessage =
    document.getElementById(
      "alertMessage"
    );

  const alertTime =
    document.getElementById(
      "alertTime"
    );

  if (!alertBox) {
    return;
  }

  alertTitle.textContent =
    `${alert.emoji} Repeated ${alert.name} request`;

  alertMessage.textContent =
    `SETU detected ${alert.count} "${alert.name}" requests within five minutes.`;

  alertTime.textContent =
    formatTime(alert.time);

  alertBox.classList.add("show");
}


/* =========================================
   ACKNOWLEDGE ALERT
   ========================================= */

function acknowledge() {

  const alertBox =
    document.getElementById(
      "alertBox"
    );

  if (alerts.length > 0) {

    alerts[0].acknowledged = true;

    saveData();
  }

  if (alertBox) {

    alertBox.classList.remove(
      "show"
    );
  }

  showToast(
    "Alert acknowledged"
  );

  renderAlertHistory();
}


/* =========================================
   DEMO BUTTON
   ========================================= */

function runDemo() {

  const now = Date.now();

  const demoAlert = {

    name: "Pain",

    emoji: "😣",

    count: 2,

    time: now,

    acknowledged: false
  };

  alerts.unshift(
    demoAlert
  );

  patternCount++;

  saveData();

  showAlert(
    demoAlert
  );

  updateEverything();

  showToast(
    "Demo alert triggered"
  );
}


/* =========================================
   HISTORY
   ========================================= */

function renderHistory() {

  const history =
    document.getElementById(
      "history"
    );

  if (!history) {
    return;
  }

  if (requests.length === 0) {

    history.innerHTML =
      `<p style="color:#64748b;">
        No requests yet.
      </p>`;

    return;
  }

  const latest =
    requests
      .slice()
      .reverse()
      .slice(0, 10);

  history.innerHTML =
    latest.map(request => {

      return `
        <div class="history-item">

          <div class="history-item-left">

            <span class="history-emoji">
              ${escapeHTML(request.emoji)}
            </span>

            <div>

              <div class="history-name">
                ${escapeHTML(request.name)}
              </div>

              <div class="history-time">
                ${formatTime(request.time)}
              </div>

            </div>

          </div>

        </div>
      `;

    }).join("");
}


/* =========================================
   CALCULATE COUNTS
   ========================================= */

function calculateCounts() {

  const counts = {};

  requests.forEach(
    request => {

      counts[request.name] =
        (counts[request.name] || 0) + 1;

    }
  );

  return counts;
}


/* =========================================
   ANALYTICS
   ========================================= */

function renderAnalytics() {

  const analytics =
    document.getElementById(
      "analytics"
    );

  if (!analytics) {
    return;
  }

  const counts =
    calculateCounts();

  const entries =
    Object.entries(counts)
      .sort(
        (a, b) => b[1] - a[1]
      );

  if (entries.length === 0) {

    analytics.innerHTML =
      `<p style="color:#64748b;">
        No communication data yet.
      </p>`;

    return;
  }

  const max =
    entries[0][1];

  analytics.innerHTML =
    entries.map(
      ([name, count]) => {

        const percentage =
          (count / max) * 100;

        return `
          <div class="analytics-row">

            <div class="analytics-name">
              ${escapeHTML(name)}
            </div>

            <div class="analytics-bar">

              <div
                class="analytics-fill"
                style="width:${percentage}%"
              ></div>

            </div>

            <div class="analytics-count">
              ${count}
            </div>

          </div>
        `;

      }
    ).join("");
}


/* =========================================
   UPDATE STATS
   ========================================= */

function updateStats() {

  const total =
    document.getElementById(
      "total"
    );

  const patterns =
    document.getElementById(
      "patterns"
    );

  const most =
    document.getElementById(
      "most"
    );

  const requestCount =
    document.getElementById(
      "requestCount"
    );

  const todayCount =
    document.getElementById(
      "todayCount"
    );

  const patientMost =
    document.getElementById(
      "patientMost"
    );


  const todayRequests =
    requests.filter(
      request =>
        sameDay(
          request.time,
          Date.now()
        )
    );


  const counts =
    calculateCounts();

  const sorted =
    Object.entries(counts)
      .sort(
        (a, b) => b[1] - a[1]
      );


  const mostRequested =
    sorted.length > 0
      ? sorted[0][0]
      : "—";


  if (total) {
    total.textContent =
      requests.length;
  }

  if (patterns) {
    patterns.textContent =
      patternCount;
  }

  if (most) {
    most.textContent =
      mostRequested;
  }

  if (requestCount) {
    requestCount.textContent =
      todayRequests.length;
  }

  if (todayCount) {
    todayCount.textContent =
      requests.length;
  }

  if (patientMost) {
    patientMost.textContent =
      mostRequested;
  }


  const patientPatterns =
    document.getElementById(
      "patientPatterns"
    );

  if (patientPatterns) {

    if (patternCount === 0) {

      patientPatterns.innerHTML =
        `<p style="color:#64748b;">
          No repeated communication patterns detected yet.
        </p>`;

    } else {

      patientPatterns.innerHTML =
        `<p>
          SETU has detected
          <strong>${patternCount}</strong>
          communication pattern${patternCount === 1 ? "" : "s"}.
        </p>`;
    }
  }
}


/* =========================================
   ALERT HISTORY
   ========================================= */

function renderAlertHistory() {

  const container =
    document.getElementById(
      "alertHistory"
    );

  if (!container) {
    return;
  }

  if (alerts.length === 0) {

    container.innerHTML =
      `<p style="color:#64748b;">
        No alerts yet.
      </p>`;

    return;
  }

  container.innerHTML =
    alerts
      .slice(0, 10)
      .map(
        alert => {

          return `
            <div class="alert-history-item">

              <div>

                <strong>
                  ${escapeHTML(alert.emoji)}
                  ${escapeHTML(alert.name)} pattern
                </strong>

                <span>
                  ${formatTime(alert.time)}
                </span>

              </div>

              <span>
                ${
                  alert.acknowledged
                    ? "Acknowledged"
                    : "Pending"
                }
              </span>

            </div>
          `;

        }
      )
      .join("");
}


/* =========================================
   SWITCH VIEWS
   ========================================= */

function switchView(
  view,
  clickedButton
) {

  const patientView =
    document.getElementById(
      "patientView"
    );

  const caregiverView =
    document.getElementById(
      "caregiverView"
    );

  const settingsView =
    document.getElementById(
      "settingsView"
    );


  const views = {

    patient: patientView,

    caregiver: caregiverView,

    settings: settingsView
  };


  Object.values(views)
    .forEach(
      section => {

        if (section) {

          section.classList.remove(
            "active"
          );

        }

      }
    );


  if (views[view]) {

    views[view].classList.add(
      "active"
    );

  }


  document
    .querySelectorAll(".nav-btn")
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

      }
    );


  if (clickedButton) {

    clickedButton.classList.add(
      "active"
    );

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================
   STATUS
   ========================================= */

function showStatus(message) {

  const status =
    document.getElementById(
      "statusText"
    );

  if (!status) {
    return;
  }

  status.textContent =
    message;

  clearTimeout(
    window.setuStatusTimer
  );

  window.setuStatusTimer =
    setTimeout(
      () => {

        status.textContent =
          "Waiting for communication";

      },
      2500
    );
}


/* =========================================
   TOAST
   ========================================= */

function showToast(message) {

  const toast =
    document.getElementById(
      "toast"
    );

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    window.setuToastTimer
  );

  window.setuToastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      1800
    );
}


/* =========================================
   SOUND TOGGLE
   ========================================= */

function toggleSound() {

  soundEnabled =
    !soundEnabled;

  saveData();

  updateSettingsUI();

  if (soundEnabled) {

    showToast(
      "Sound enabled"
    );

    speak("Sound on");

  } else {

    showToast(
      "Sound disabled"
    );
  }
}


/* =========================================
   LARGE MODE
   ========================================= */

function toggleLargeMode() {

  largeMode =
    !largeMode;

  document.body.classList.toggle(
    "large-mode",
    largeMode
  );

  saveData();

  updateSettingsUI();

  showToast(
    largeMode
      ? "Large mode enabled"
      : "Large mode disabled"
  );
}


/* =========================================
   CALM MODE
   ========================================= */

function toggleCalmMode() {

  calmMode =
    !calmMode;

  document.body.classList.toggle(
    "calm-mode",
    calmMode
  );

  saveData();

  updateSettingsUI();

  showToast(
    calmMode
      ? "Calm mode enabled"
      : "Calm mode disabled"
  );
}


/* =========================================
   THEMES
   ========================================= */

function setTheme(theme) {

  document.body.classList.remove(
    "dark-mode",
    "contrast-mode"
  );

  if (theme === "dark") {

    document.body.classList.add(
      "dark-mode"
    );

  }

  if (theme === "contrast") {

    document.body.classList.add(
      "contrast-mode"
    );

  }

  if (theme === "calm") {

    calmMode = true;

    document.body.classList.add(
      "calm-mode"
    );

  }

  if (theme !== "calm") {

    if (
      theme === "standard" &&
      calmMode
    ) {

      /* Keep user's Calm Mode
         preference */

    }

  }

  localStorage.setItem(
    "setuTheme",
    theme
  );

  saveData();

  updateSettingsUI();

  showToast(
    `${capitalize(theme)} theme selected`
  );
}


/* =========================================
   FAVORITES
   ========================================= */

function toggleFavorite(name) {

  const index =
    favorites.indexOf(name);

  if (index === -1) {

    favorites.push(name);

    showToast(
      `${name} added to favorites`
    );

  } else {

    favorites.splice(
      index,
      1
    );

    showToast(
      `${name} removed from favorites`
    );
  }

  saveData();

  updateFavoriteButtons();
}


function updateFavoriteButtons() {

  document
    .querySelectorAll(".symbol-btn")
    .forEach(
      button => {

        const label =
          button.querySelector(
            ".symbol-label"
          );

        const star =
          button.querySelector(
            ".favorite"
          );

        if (!label || !star) {
          return;
        }

        const name =
          label.textContent.trim();

        if (
          favorites.includes(name)
        ) {

          star.textContent = "★";

          star.classList.add(
            "active"
          );

        } else {

          star.textContent = "☆";

          star.classList.remove(
            "active"
          );
        }

      }
    );
}


/* =========================================
   SETTINGS UI
   ========================================= */

function updateSettingsUI() {

  const soundToggle =
    document.getElementById(
      "soundToggle"
    );

  const largeToggle =
    document.getElementById(
      "largeToggle"
    );

  const calmToggle =
    document.getElementById(
      "calmToggle"
    );


  if (soundToggle) {

    soundToggle.textContent =
      soundEnabled
        ? "Sound: ON"
        : "Sound: OFF";

    soundToggle.classList.toggle(
      "enabled",
      soundEnabled
    );
  }


  if (largeToggle) {

    largeToggle.textContent =
      largeMode
        ? "Large Mode: ON"
        : "Large Mode: OFF";

    largeToggle.classList.toggle(
      "enabled",
      largeMode
    );
  }


  if (calmToggle) {

    calmToggle.textContent =
      calmMode
        ? "Calm Mode: ON"
        : "Calm Mode: OFF";

    calmToggle.classList.toggle(
      "enabled",
      calmMode
    );
  }


  const theme =
    localStorage.getItem(
      "setuTheme"
    ) || "standard";


  document
    .querySelectorAll(".theme-btn")
    .forEach(
      button => {

        button.classList.remove(
          "active"
        );

      }
    );


  const activeTheme =
    document.getElementById(
      `theme${
        capitalize(theme)
      }`
    );


  if (activeTheme) {

    activeTheme.classList.add(
      "active"
    );
  }
}


/* =========================================
   RESTORE THEME
   ========================================= */

function restoreTheme() {

  const theme =
    localStorage.getItem(
      "setuTheme"
    ) || "standard";


  document.body.classList.remove(
    "dark-mode",
    "contrast-mode"
  );


  if (theme === "dark") {

    document.body.classList.add(
      "dark-mode"
    );

  }


  if (theme === "contrast") {

    document.body.classList.add(
      "contrast-mode"
    );

  }


  if (
    theme === "calm" ||
    calmMode
  ) {

    document.body.classList.add(
      "calm-mode"
    );

  }


  if (largeMode) {

    document.body.classList.add(
      "large-mode"
    );

  }
}


/* =========================================
   CLEAR ALERTS
   ========================================= */

function clearAlerts() {

  alerts = [];

  saveData();

  const alertBox =
    document.getElementById(
      "alertBox"
    );

  if (alertBox) {

    alertBox.classList.remove(
      "show"
    );
  }

  renderAlertHistory();

  showToast(
    "Alert history cleared"
  );
}


/* =========================================
   UPDATE EVERYTHING
   ========================================= */

function updateEverything() {

  renderHistory();

  renderAnalytics();

  renderAlertHistory();

  updateStats();

  updateFavoriteButtons();

  updateSettingsUI();
}


/* =========================================
   HELPERS
   ========================================= */

function formatTime(timestamp) {

  return new Date(
    timestamp
  ).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );
}


function sameDay(
  timestamp1,
  timestamp2
) {

  const first =
    new Date(timestamp1);

  const second =
    new Date(timestamp2);

  return (
    first.getFullYear() ===
      second.getFullYear() &&

    first.getMonth() ===
      second.getMonth() &&

    first.getDate() ===
      second.getDate()
  );
}


function getEmoji(name) {

  const emojis = {

    Water: "💧",

    Pain: "😣",

    Bathroom: "🚽",

    Distress: "⚠️",

    Company: "❤️",

    Food: "🍽️",

    Break: "🧘",

    Cold: "🥶",

    Hot: "🥵",

    Yes: "👍"
  };

  return emojis[name] || "💬";
}


function capitalize(text) {

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  );
}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================
   INITIALIZATION
   ========================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    restoreTheme();

    if (largeMode) {

      document.body.classList.add(
        "large-mode"
      );
    }

    if (calmMode) {

      document.body.classList.add(
        "calm-mode"
      );
    }

    updateEverything();

  }
);
