// ==================== ESTADO INICIAL Y PERSISTENCIA ====================
const DEFAULT_TASKS = [
  { id: 1, text: "Lavarme los dientes", icon: "🪥", completed: false },
  { id: 2, text: "Preparar la mochila", icon: "🎒", completed: false },
  { id: 3, text: "Hacer la tarea", icon: "📚", completed: false }
];

const BADGES_CATALOG = [
  { stars: 5, label: "🌱 Primer Paso" },
  { stars: 10, label: "⚡ Enfoque Activo" },
  { stars: 20, label: "🌟 Constancia Brillante" },
  { stars: 35, label: "🏆 Maestro de Rutinas" }
];

const BREATHING_TIPS = [
  "🌬️ Inhala 4 seg → Sostén 2 seg → Exhala 4 seg. ¡Sin prisa!",
  "🐾 Suelta los hombros y relaja la mandíbula. Estás haciéndolo muy bien.",
  "🌿 Mira un punto calmado durante 10 segundos y vuelve a tu ritmo."
];
let breathTipIndex = 0;

let appState = JSON.parse(localStorage.getItem("calmaAppState")) || {
  stars: 0,
  tasks: DEFAULT_TASKS
};

let selectedIcon = "🪥";

function saveState() {
  localStorage.setItem("calmaAppState", JSON.stringify(appState));
}

// ==================== NOTIFICACIONES ====================
function showToast(message) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ==================== NAVEGACIÓN PRINCIPAL ====================
const navButtons = document.querySelectorAll(".nav-btn[data-tab]");
const tabSections = document.querySelectorAll(".tab-section");

function switchTab(tabId) {
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  tabSections.forEach(sec => {
    sec.classList.toggle("active", sec.id === tabId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navButtons.forEach(btn => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

// ==================== GAMIFICACIÓN Y TAREAS ====================
function updateStatsUI() {
  const starCountEl = document.getElementById("star-count");
  const levelCountEl = document.getElementById("level-count");
  const nextBadgeEl = document.getElementById("next-badge-text");
  const progressFillEl = document.getElementById("level-progress");
  const badgesContainer = document.getElementById("badges-container");

  starCountEl.textContent = appState.stars;

  const currentLevel = Math.floor(appState.stars / 5) + 1;
  const starsInCurrentLevel = appState.stars % 5;
  const starsNeeded = 5 - starsInCurrentLevel;
  const progressPercent = (starsInCurrentLevel / 5) * 100;

  levelCountEl.textContent = currentLevel;
  nextBadgeEl.textContent = `${starsNeeded} estrella${starsNeeded === 1 ? "" : "s"} para subir de nivel`;
  progressFillEl.style.width = `${progressPercent}%`;

  const unlockedBadges = BADGES_CATALOG.filter(b => appState.stars >= b.stars);
  if (unlockedBadges.length === 0) {
    badgesContainer.innerHTML = `<span class="empty-badge">5 ⭐ para tu primera insignia</span>`;
  } else {
    badgesContainer.innerHTML = unlockedBadges
      .map(b => `<span class="badge-pill">${b.label}</span>`)
      .join("");
  }
}

function renderTasks() {
  const taskListEl = document.getElementById("task-list");
  const completedCountEl = document.getElementById("completed-count");
  const totalCountEl = document.getElementById("total-count");

  taskListEl.innerHTML = "";

  appState.tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = `task-item ${task.completed ? "completed" : ""}`;

    li.innerHTML = `
      <div class="task-left">
        <div class="custom-checkbox">${task.completed ? "✓" : ""}</div>
        <span class="task-icon">${task.icon}</span>
        <span class="task-text">${escapeHTML(task.text)}</span>
      </div>
      <button type="button" class="delete-task-btn" title="Eliminar tarea" aria-label="Eliminar tarea">✕</button>
    `;

    li.querySelector(".task-left").addEventListener("click", () => toggleTask(task.id));
    li.querySelector(".delete-task-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    });

    taskListEl.appendChild(li);
  });

  const completedCount = appState.tasks.filter(t => t.completed).length;
  completedCountEl.textContent = completedCount;
  totalCountEl.textContent = appState.tasks.length;

  updateStatsUI();
}

function toggleTask(id) {
  const task = appState.tasks.find(t => t.id === id);
  if (!task) return;

  task.completed = !task.completed;

  if (task.completed) {
    appState.stars += 1;
    animateStar();
    showToast("⭐ ¡Excelente! Ganaste +1 estrella");
  } else if (appState.stars > 0) {
    appState.stars -= 1;
  }

  saveState();
  renderTasks();
}

function deleteTask(id) {
  appState.tasks = appState.tasks.filter(t => t.id !== id);
  saveState();
  renderTasks();
}

function animateStar() {
  const star = document.querySelector(".star-bounce");
  if (!star) return;
  star.style.transform = "scale(1.45) rotate(15deg)";
  setTimeout(() => {
    star.style.transform = "scale(1) rotate(0deg)";
  }, 350);
}

document.querySelectorAll(".icon-option").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".icon-option").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedIcon = btn.dataset.icon;
  });
});

document.getElementById("add-task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("new-task-input");
  const text = input.value.trim();
  if (!text) return;

  appState.tasks.push({
    id: Date.now(),
    text: text,
    icon: selectedIcon,
    completed: false
  });

  input.value = "";
  saveState();
  renderTasks();
  showToast("✨ Nueva tarea agregada a tu día");
});

document.getElementById("reset-day-btn").addEventListener("click", () => {
  appState.tasks.forEach(t => (t.completed = false));
  saveState();
  renderTasks();
  showToast("🔄 Tareas listas para un nuevo día");
});

const breathBtn = document.getElementById("shuffle-breath-btn");
if (breathBtn) {
  breathBtn.addEventListener("click", () => {
    showToast(BREATHING_TIPS[breathTipIndex]);
    breathTipIndex = (breathTipIndex + 1) % BREATHING_TIPS.length;
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ==================== TEMPORIZADOR POMODORO ====================
let timerSeconds = 15 * 60;
let timerInterval = null;
let isRunning = false;

const timerDisplay = document.getElementById("timer-display");
const timerStartBtn = document.getElementById("timer-start-btn");
const timerResetBtn = document.getElementById("timer-reset-btn");

function updateTimerText() {
  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, "0");
  const secs = (timerSeconds % 60).toString().padStart(2, "0");
  timerDisplay.textContent = `${mins}:${secs}`;
}

timerStartBtn.addEventListener("click", () => {
  if (isRunning) {
    clearInterval(timerInterval);
    isRunning = false;
    timerStartBtn.textContent = "Continuar";
  } else {
    isRunning = true;
    timerStartBtn.textContent = "Pausar";
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerText();
      } else {
        clearInterval(timerInterval);
        isRunning = false;
        timerStartBtn.textContent = "Iniciar";
        appState.stars += 2;
        saveState();
        updateStatsUI();
        showToast("🎉 ¡Tiempo cumplido! Ganaste +2 estrellas de enfoque");
        timerSeconds = 15 * 60;
        updateTimerText();
      }
    }, 1000);
  }
});

timerResetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isRunning = false;
  timerSeconds = 15 * 60;
  timerStartBtn.textContent = "Iniciar";
  updateTimerText();
});

// ==================== FILTROS Y SUB-PESTAÑAS ====================
document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");

    const filter = chip.dataset.filter;
    document.querySelectorAll(".game-card").forEach(card => {
      const categories = card.dataset.category;
      if (filter === "all" || categories.includes(filter)) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });
  });
});

document.querySelectorAll(".subtab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".subtab-content").forEach(c => c.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.subtab).classList.add("active");
  });
});

// ==================== SWITCH ESTILO IPHONE (NORMAL / DARK MODE) ====================
const themeCheckbox = document.getElementById("theme-checkbox");
const themeStatusText = document.getElementById("theme-status-text");
const THEME_STORAGE_KEY = "calmaThemePreference";

function applyTheme(theme) {
  const isDark = theme === "dark";
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  if (themeCheckbox) {
    themeCheckbox.checked = isDark;
    themeCheckbox.setAttribute("aria-checked", String(isDark));
  }
  if (themeStatusText) {
    themeStatusText.textContent = isDark ? "Modo Dark" : "Modo Normal";
  }
}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
const systemPrefersDark =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
applyTheme(savedTheme || (systemPrefersDark ? "dark" : "light"));

if (themeCheckbox) {
  themeCheckbox.addEventListener("change", () => {
    const nextTheme = themeCheckbox.checked ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    showToast(
      nextTheme === "dark"
        ? "🌙 Modo oscuro activado"
        : "☀️ Modo normal activado"
    );
  });
}

// Inicializar aplicación
renderTasks();
