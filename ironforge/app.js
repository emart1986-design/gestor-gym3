'use strict';

/* =========================================================================
   IRONFORGE - Placa de Entrenamiento
   App independiente (PWA) para registrar entrenamientos, ver la rutina del
   dia, calcular discos de barra, cronometrar descansos y ver progreso/PRs.
   Todo el estado se guarda en localStorage bajo STORAGE_KEY.
   ========================================================================= */

const STORAGE_KEY = 'ironforge_data_v1';
const DIAS_CORTOS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PLANNED_SESSIONS_PER_WEEK = 5;

const REST_PRESETS = [
  { id: 'fuerza', label: 'FUERZA / COMP.', sub: 'RPE 8-10 · Rapido SNC', seconds: 180 },
  { id: 'hipertrofia', label: 'HIPERTROFIA', sub: 'Tension mecanica ideal', seconds: 120 },
  { id: 'aislamiento', label: 'AISLAMIENTO', sub: 'Brazos, deltoides, gemelos', seconds: 90 },
  { id: 'biseries', label: 'BISERIES / SUPER', sub: 'Densidad y bombeo', seconds: 45 }
];

const PYRAMID_REPS = [6, 8, 10, 12];

function pyramidRepsFor(setCount) {
  return Array.from({ length: setCount }, (_, i) => PYRAMID_REPS[Math.min(i, PYRAMID_REPS.length - 1)]);
}

const SOUND_PRESETS = [
  { id: 'beep', label: 'Beep Progr.' },
  { id: 'campana', label: 'Campana Box' },
  { id: 'chime', label: 'Chime Digital' }
];

const PLATE_COLORS = {
  25: { bg: 'bg-[#4d1010]', border: 'border-red-500', text: 'text-red-300', height: 'h-32', width: 'w-7' },
  20: { bg: 'bg-[#19324d]', border: 'border-[#0099ff]', text: 'text-sky-200', height: 'h-28', width: 'w-6' },
  15: { bg: 'bg-[#4d3d10]', border: 'border-amber-400', text: 'text-amber-200', height: 'h-24', width: 'w-5' },
  10: { bg: 'bg-[#0f3823]', border: 'border-[#10b981]', text: 'text-emerald-200', height: 'h-22', width: 'w-5' },
  5: { bg: 'bg-[#3c3d47]', border: 'border-[#e4e1ea]', text: 'text-white', height: 'h-16', width: 'w-4' },
  2.5: { bg: 'bg-[#4d1417]', border: 'border-[#ef4444]', text: 'text-red-200', height: 'h-12', width: 'w-3.5' },
  1.25: { bg: 'bg-[#153e47]', border: 'border-cyan-400', text: 'text-cyan-200', height: 'h-10', width: 'w-3' },
  0.5: { bg: 'bg-[#2b2b36]', border: 'border-slate-400', text: 'text-slate-300', height: 'h-8', width: 'w-2.5' }
};

function defaultRoutine() {
  return {
    name: 'Empuje (Pecho, Hombro, Triceps)',
    intensity: 'INTENSO',
    durationLabel: '45-60 min',
    exercises: [
      { id: 'ex1', name: 'Press Plano', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '8', note: 'Retraccion escapular compacta; barra baja a la linea del pecho.', tag: '', restPresetId: 'hipertrofia' },
      { id: 'ex2', name: 'Press Inclinado', sets: 4, repMin: 6, repMax: 12, target: 40, unit: 'kg', suffix: '', rpe: '8', note: 'Banco a 30-45°; descenso controlado hasta el pecho alto.', tag: '', restPresetId: 'hipertrofia' },
      { id: 'ex3', name: 'Pec Deck', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '9', note: 'Tension constante en el estiramiento maximo; codos con leve flexion fija, sin golpear las placas.', tag: '', restPresetId: 'aislamiento' },
      { id: 'ex4', name: 'Press de Hombro Sentado', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '8', note: 'Core firme; evitar arquear la zona lumbar al empujar.', tag: '', restPresetId: 'hipertrofia' },
      { id: 'ex5', name: 'Vuelos Laterales', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '9', note: 'Elevar hasta la altura del hombro, sin balanceo de cadera.', tag: '', restPresetId: 'aislamiento' },
      { id: 'ex6', name: 'Triceps tras Nuca', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '9', note: 'Codos fijos apuntando al techo, sin abrirlos hacia los lados.', tag: '', restPresetId: 'aislamiento' }
    ]
  };
}

function defaultRoutinePull() {
  return {
    name: 'Tiron (Espalda, Biceps)',
    intensity: 'INTENSO',
    durationLabel: '45-60 min',
    exercises: [
      { id: 'ey1', name: 'Jalon al Pecho (agarre ancho)', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '8', note: 'Maxima activacion de dorsal ancho (EMG); tirar con los codos hacia abajo y atras, sin impulso.', tag: 'ANCHO DE ESPALDA', restPresetId: 'hipertrofia' },
      { id: 'ey2', name: 'Remo en Polea Sentado', sets: 4, repMin: 6, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '8', note: 'Tension constante en toda la carrera; espalda recta, tirar hasta el abdomen sin balancear el torso.', tag: 'GROSOR DE ESPALDA', restPresetId: 'hipertrofia' },
      { id: 'ey3', name: 'Pull-Over en Polea', sets: 3, repMin: 10, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '9', note: 'Aisla el dorsal sin pre-fatigar el biceps antes de los curls; brazos casi extendidos.', tag: 'AISLAMIENTO DORSAL', restPresetId: 'aislamiento' },
      { id: 'ey4', name: 'Vuelo de Pajaro (Deltoide Posterior)', sets: 3, repMin: 12, repMax: 15, target: 0, unit: 'kg', suffix: ' c/u', rpe: '9', note: 'Codos con leve flexion fija; apretar omoplatos al final, sin usar impulso ni trapecio.', tag: 'DELTOIDE POSTERIOR', restPresetId: 'aislamiento' },
      { id: 'ey5', name: 'Curl con Barra', sets: 4, repMin: 8, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '9', note: 'Mayor activacion EMG de biceps braquial entre los curls; codos fijos, sin balanceo de cadera.', tag: 'MASA DE BICEPS', restPresetId: 'aislamiento' },
      { id: 'ey6', name: 'Curl Martillo', sets: 3, repMin: 10, repMax: 12, target: 0, unit: 'kg', suffix: '', rpe: '9', note: 'Agarre neutro; enfasis en braquial y braquiorradial para grosor de brazo, no solo pico de biceps.', tag: 'BRAQUIAL/ANTEBRAZO', restPresetId: 'aislamiento' }
    ]
  };
}

function seedSessions() {
  const today = new Date();
  const days = [42, 35, 28, 21, 14, 7];
  const benchProgression = [87.5, 90, 92.5, 95, 100, 105];
  const repsProgression = [7, 6, 6, 5, 5, 3];
  return days.map((daysAgo, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    const w = benchProgression[i];
    const r = repsProgression[i];
    return {
      date: d.toISOString(),
      durationSec: 3000 + i * 120,
      volume: Math.round(w * r * 4 + 1800),
      exercises: [
        { name: 'Press de Banca con Barra', sets: [{ weight: w, reps: r }, { weight: w, reps: r }] }
      ]
    };
  });
}

function seedPRs() {
  return {
    'Press Banca': { weight: 105, reps: 3, estOneRM: 115.5, date: daysAgoISO(3), method: '1RM Verificada', isNew: true, diff: 5 },
    'Sentadilla Trasera': { weight: 140, reps: 1, estOneRM: 140, date: daysAgoISO(56), method: '1RM estimada' },
    'Peso Muerto': { weight: 175, reps: 1, estOneRM: 175, date: daysAgoISO(70), method: 'Convencional' },
    'Press Militar': { weight: 67.5, reps: 1, estOneRM: 67.5, date: daysAgoISO(7), method: 'De pie estricto', diff: 2.5 }
  };
}

function daysAgoISO(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function defaultState() {
  const push = defaultRoutine();
  push.id = 'r1';
  push.day = null;
  const pull = defaultRoutinePull();
  pull.id = 'r2';
  pull.day = null;
  return {
    routines: [push, pull],
    activeRoutineId: push.id,
    session: null,
    sessions: seedSessions(),
    prs: seedPRs(),
    rest: {
      running: false,
      activePresetId: 'hipertrofia',
      remaining: REST_PRESETS[1].seconds,
      total: REST_PRESETS[1].seconds,
      returnHint: null
    },
    settings: {
      soundEnabled: true,
      soundPreset: 'beep',
      volume: 85,
      vibrationEnabled: true,
      backgroundAlert: true,
      availablePlates: [20, 15, 10, 5, 2.5, 1.25]
    },
    calc: {
      barWeight: 20,
      barLabel: 'Barra Olimpica 20 kg',
      targetWeight: 95
    }
  };
}

let state = loadState();
let currentView = null;
let restTimerInterval = null;
let audioCtx = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (parsed.routine && !parsed.routines) {
      const migrated = Object.assign({ id: 'r1', day: null }, parsed.routine);
      parsed.routines = [migrated];
      parsed.activeRoutineId = migrated.id;
      delete parsed.routine;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
    const base = defaultState();
    return Object.assign(base, parsed, {
      routines: (parsed.routines && parsed.routines.length) ? parsed.routines : base.routines,
      activeRoutineId: parsed.activeRoutineId || base.activeRoutineId,
      settings: Object.assign(base.settings, parsed.settings || {}),
      rest: Object.assign(base.rest, parsed.rest || {}),
      calc: Object.assign(base.calc, parsed.calc || {})
    });
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getActiveRoutine() {
  return state.routines.find(r => r.id === state.activeRoutineId) || state.routines[0];
}

const DAY_OPTIONS = [
  { id: '', label: 'Sin asignar' },
  { id: '1', label: 'Lunes' },
  { id: '2', label: 'Martes' },
  { id: '3', label: 'Miercoles' },
  { id: '4', label: 'Jueves' },
  { id: '5', label: 'Viernes' },
  { id: '6', label: 'Sabado' },
  { id: '0', label: 'Domingo' }
];

/* ------------------------------- UTILS ---------------------------------- */

function fmt(n, decimals) {
  const d = decimals === undefined ? 1 : decimals;
  const v = Number(n) || 0;
  return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(/\.0+$/, m => (d === 0 ? '' : m));
}

function fmtKg(n) {
  const v = Number(n) || 0;
  return v % 1 === 0 ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function epley(weight, reps) {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

function brzycki(weight, reps) {
  if (reps <= 1) return weight;
  if (reps >= 37) return null;
  return weight * (36 / (37 - reps));
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
}

function relativeDate(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 14) return 'Hace 1 semana';
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return formatDateShort(iso);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
}

function openModal(innerHTML) {
  document.getElementById('modal-sheet').innerHTML = innerHTML;
  document.getElementById('modal-overlay').hidden = false;
}

function closeModal() {
  document.getElementById('modal-overlay').hidden = true;
  document.getElementById('modal-sheet').innerHTML = '';
}

document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target.id === 'modal-overlay') closeModal();
});

/* ------------------------------ NAVIGATION ------------------------------- */

function switchView(view) {
  currentView = view;
  ['entrenar', 'rutina', 'progreso', 'calculadora'].forEach(v => {
    document.getElementById('view-' + v).hidden = v !== view;
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const active = btn.dataset.view === view;
    btn.className = 'nav-btn flex flex-col items-center justify-center px-space-sm py-space-xs active:scale-[0.98] transition-all duration-100 ease-out rounded-xl ' +
      (active ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface');
  });
  location.hash = view;
  renderCurrentView();
  window.scrollTo(0, 0);
}

function renderCurrentView() {
  if (currentView === 'entrenar') renderEntrenar();
  else if (currentView === 'rutina') renderRutina();
  else if (currentView === 'progreso') renderProgreso();
  else if (currentView === 'calculadora') renderCalculadora();
  renderHeader();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

/* -------------------------------- HEADER --------------------------------- */

function renderHeader() {
  const actions = document.getElementById('header-actions');
  if (state.session) {
    const elapsed = sessionElapsedSeconds();
    actions.innerHTML = `
      <button id="btn-header-timer" class="flex items-center gap-1 bg-surface-container-high px-space-xs py-1 rounded-xl animate-pulse-subtle">
        <span class="material-symbols-outlined text-primary-container text-[18px]">timer</span>
        <span class="font-label-caps text-label-caps text-primary-container tracking-wider">${formatClock(elapsed)}</span>
      </button>
      <button id="btn-end-session" class="bg-secondary-container text-on-secondary font-headline-sm text-label-caps px-space-sm py-space-xs rounded-xl active:scale-[0.98] transition-transform duration-100 ease-out" type="button">Finalizar Sesion</button>
    `;
    document.getElementById('btn-header-timer').onclick = () => switchView('entrenar');
    document.getElementById('btn-end-session').onclick = () => confirmEndSession();
  } else {
    actions.innerHTML = `
      <button id="btn-reset-data" class="text-on-surface-variant hover:text-on-surface p-1 transition-colors" type="button" title="Reiniciar datos">
        <span class="material-symbols-outlined text-[22px]">more_vert</span>
      </button>
    `;
    document.getElementById('btn-reset-data').onclick = () => openResetMenu();
  }
}

function openResetMenu() {
  openModal(`
    <h2 class="font-headline-sm text-headline-sm text-primary font-bold mb-space-md">Ajustes</h2>
    <button id="btn-do-reset" class="w-full h-tap-min bg-surface-container-high rounded-xl text-error font-headline-sm active:scale-[0.98] transition-transform">Reiniciar todos los datos</button>
    <button id="btn-close-modal" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-on-surface-variant font-headline-sm active:scale-[0.98] transition-transform">Cerrar</button>
  `);
  document.getElementById('btn-close-modal').onclick = closeModal;
  document.getElementById('btn-do-reset').onclick = () => {
    if (confirm('Esto borra todo el historial, PRs y la sesion en curso. ¿Continuar?')) {
      localStorage.removeItem(STORAGE_KEY);
      state = defaultState();
      saveState();
      closeModal();
      renderCurrentView();
      showToast('Datos reiniciados');
    }
  };
}

setInterval(() => { if (state.session) renderHeader(); }, 1000);

/* ================================ RUTINA ================================= */

function estimateRoutineVolume(routine) {
  return routine.exercises.reduce((sum, ex) => {
    const avgReps = (ex.repMin + ex.repMax) / 2;
    return sum + ex.sets * avgReps * ex.target;
  }, 0);
}

function lastLoggedSet(exerciseName) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const s = state.sessions[i];
    const ex = s.exercises.find(e => e.name === exerciseName);
    if (ex && ex.sets.length) {
      const best = ex.sets[ex.sets.length - 1];
      return { weight: best.weight, reps: best.reps, date: s.date };
    }
  }
  return null;
}

function renderRutina() {
  const container = document.getElementById('view-rutina');
  const routine = getActiveRoutine();
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  let weekStrip = '<section class="bg-surface-container-low rounded-xl p-space-xs flex justify-between items-center gap-space-xxs border border-outline-variant">';
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const isToday = d.toDateString() === today.toDateString();
    const assigned = state.routines.find(r => r.day === String(d.getDay()));
    weekStrip += `
      <button data-day="${d.getDay()}" class="flex-1 py-space-xs flex flex-col items-center justify-center rounded-lg transition-all ${isToday ? 'bg-primary-container text-on-primary-container font-bold shadow-[0_0_12px_rgba(195,244,0,0.35)]' : 'text-on-surface-variant hover:bg-surface-container-high'}">
        <span class="font-label-caps text-label-caps">${DIAS_CORTOS[d.getDay()]}</span>
        <span class="font-data-metric-md text-[13px] ${isToday ? 'font-bold' : ''}">${d.getDate()}</span>
        <span class="w-1 h-1 rounded-full mt-0.5 ${assigned ? (isToday ? 'bg-on-primary-container' : 'bg-primary-container') : 'bg-transparent'}"></span>
      </button>`;
  }
  weekStrip += '</section>';

  const routineChips = `
    <div class="flex items-center gap-space-xs overflow-x-auto pb-1" style="scrollbar-width:none;">
      ${state.routines.map(r => `
        <button data-routine="${r.id}" class="shrink-0 px-space-sm py-space-xs rounded-xl font-label-caps text-label-caps whitespace-nowrap transition-all ${r.id === routine.id ? 'bg-primary-container text-on-primary-container font-bold' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}">${r.name}</button>
      `).join('')}
      <button id="btn-new-routine" class="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined text-[18px]">add</span></button>
    </div>`;

  const volumeEst = Math.round(estimateRoutineVolume(routine));

  const hero = `
    <section class="bg-surface-container rounded-xl p-space-md border border-outline-variant relative overflow-hidden">
      <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-primary-container opacity-5 blur-2xl pointer-events-none rounded-full"></div>
      <div class="flex justify-between items-start mb-space-xs">
        <div>
          <span class="font-label-caps text-label-caps text-primary-container flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-primary-container inline-block"></span> SESION ASIGNADA
          </span>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight mt-space-xxs">${routine.name}</h1>
        </div>
        <div class="flex items-center gap-space-xs">
          <span class="px-space-xs py-space-xxs rounded bg-secondary-container/20 border border-secondary-container text-secondary font-label-caps text-label-caps">${routine.intensity}</span>
          <button id="btn-edit-routine" aria-label="Editar rutina" class="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface active:scale-[0.98] transition-all"><span class="material-symbols-outlined text-[18px]">edit</span></button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-space-xs pt-space-xs mt-space-xs border-t border-surface-container-highest">
        <div class="flex items-center gap-space-xs bg-surface-container-lowest/60 rounded-lg p-space-xs">
          <span class="material-symbols-outlined text-[18px] text-on-surface-variant">schedule</span>
          <div><div class="font-label-caps text-[10px] text-on-surface-variant">DURACION</div><div class="font-data-metric-md text-[13px] text-on-surface">${routine.durationLabel}</div></div>
        </div>
        <div class="flex items-center gap-space-xs bg-surface-container-lowest/60 rounded-lg p-space-xs">
          <span class="material-symbols-outlined text-[18px] text-on-surface-variant">format_list_numbered</span>
          <div><div class="font-label-caps text-[10px] text-on-surface-variant">BLOQUES</div><div class="font-data-metric-md text-[13px] text-on-surface">${routine.exercises.length} Ejercicios</div></div>
        </div>
        <div class="flex items-center gap-space-xs bg-surface-container-lowest/60 rounded-lg p-space-xs">
          <span class="material-symbols-outlined text-[18px] text-primary-container">fitness_center</span>
          <div><div class="font-label-caps text-[10px] text-on-surface-variant">VOLUMEN EST.</div><div class="font-data-metric-md text-[13px] text-primary-container">${volumeEst.toLocaleString('es-AR')} kg</div></div>
        </div>
      </div>
    </section>`;

  const sectionTitle = `
    <div class="flex justify-between items-center px-space-xxs pt-space-xs">
      <h2 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-space-xs">
        <span>Plan de Ejecucion</span>
        <span class="font-label-caps text-label-caps bg-surface-container-highest text-on-surface-variant px-space-xs py-0.5 rounded">${routine.exercises.length} TOTAL</span>
      </h2>
    </div>`;

  const exerciseCards = routine.exercises.map((ex, idx) => {
    const prev = lastLoggedSet(ex.name);
    const prevLabel = prev ? `Previo: ${fmtKg(prev.weight)}${ex.suffix} kg${ex.prefix ? '' : ''} × ${prev.reps} reps` : 'Sin registros previos';
    const targetLabel = `${ex.prefix || ''}${fmtKg(ex.target)}${ex.suffix} kg`;
    const isFirst = idx === 0;
    return `
      <article class="bg-surface-container rounded-xl p-space-md border ${isFirst ? 'border-primary-container/40 shadow-[0_0_16px_rgba(195,244,0,0.06)]' : 'border-outline-variant'} relative overflow-hidden">
        ${isFirst ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary-container"></div>' : ''}
        <div class="flex justify-between items-start gap-space-sm ${isFirst ? 'pl-space-xs' : ''}">
          <div class="flex-1">
            <div class="flex items-center gap-space-xs">
              <span class="font-label-caps text-label-caps ${isFirst ? 'bg-primary-container/10 border border-primary-container/30 text-primary-container' : 'bg-surface-container-high text-on-surface-variant'} px-space-xs py-0.5 rounded">EJERCICIO ${String(idx + 1).padStart(2, '0')}</span>
              <span class="font-label-caps text-label-caps text-on-surface-variant">RPE ${ex.rpe}</span>
            </div>
            <h3 class="font-headline-sm text-headline-sm text-on-surface mt-space-xxs">${ex.name}</h3>
            <p class="font-body-md text-body-md text-on-surface-variant mt-0.5">${ex.sets} series × ${ex.repMin}${ex.repMax !== ex.repMin ? '-' + ex.repMax : ''} reps <span class="text-on-surface mx-1">|</span> Objetivo: <strong class="text-primary-container font-data-metric-md text-[15px]">${targetLabel}</strong></p>
          </div>
          <button data-edit-ex="${ex.id}" aria-label="Editar ejercicio" class="w-tap-min h-tap-min flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors"><span class="material-symbols-outlined text-[20px]">edit</span></button>
        </div>
        <div class="mt-space-sm pt-space-xs border-t border-surface-container-high flex flex-col gap-space-xs">
          <div class="flex items-center justify-between text-label-sm font-label-sm bg-surface-container-lowest/80 p-space-xs rounded-lg">
            <span class="text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-outline">history</span> ${prevLabel}</span>
            <span class="text-primary-container font-label-caps text-[10px]">${ex.tag}</span>
          </div>
          <div class="flex items-start gap-1.5 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-low/50 px-space-xs py-1 rounded">
            <span class="material-symbols-outlined text-[14px] text-outline mt-0.5">info</span>
            <span>${ex.note}</span>
          </div>
        </div>
      </article>`;
  }).join('');

  const addExerciseBtn = `
    <button id="btn-add-exercise" class="w-full py-space-sm rounded-xl border border-dashed border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-outline font-headline-sm text-body-md flex items-center justify-center gap-space-xs transition-colors">
      <span class="material-symbols-outlined text-[20px]">add</span><span>Agregar Ejercicio</span>
    </button>`;

  const ctaLabel = state.session ? 'Continuar Entrenamiento' : 'Iniciar Entrenamiento Hoy';

  container.innerHTML = weekStrip + routineChips + hero + sectionTitle +
    `<div class="flex flex-col gap-space-sm">${exerciseCards}${addExerciseBtn}</div>` +
    `<div class="pt-space-sm pb-space-xs">
      <button id="btn-start-session" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm text-headline-sm font-bold flex items-center justify-center gap-space-xs shadow-[0_4px_24px_rgba(195,244,0,0.3)] active:scale-[0.98] transition-transform duration-100 ease-out">
        <span class="material-symbols-outlined text-[26px]">play_arrow</span>
        <span>${ctaLabel}</span>
      </button>
    </div>`;

  document.getElementById('btn-start-session').onclick = () => {
    if (!state.session) startSession();
    switchView('entrenar');
  };
  document.getElementById('btn-edit-routine').onclick = openEditRoutineModal;
  document.getElementById('btn-add-exercise').onclick = () => openEditExerciseModal(null);
  container.querySelectorAll('[data-edit-ex]').forEach(btn => {
    btn.onclick = () => openEditExerciseModal(btn.dataset.editEx);
  });
  container.querySelectorAll('[data-routine]').forEach(btn => {
    btn.onclick = () => { state.activeRoutineId = btn.dataset.routine; saveState(); renderRutina(); };
  });
  container.querySelectorAll('[data-day]').forEach(btn => {
    btn.onclick = () => {
      const match = state.routines.find(r => r.day === btn.dataset.day);
      if (match) { state.activeRoutineId = match.id; saveState(); renderRutina(); }
      else showToast('Ese dia no tiene rutina asignada todavia');
    };
  });
  document.getElementById('btn-new-routine').onclick = createRoutine;
}

function createRoutine() {
  const newRoutine = {
    id: 'r' + Date.now(),
    name: 'Nueva Rutina',
    intensity: 'MODERADO',
    durationLabel: '45-60 min',
    day: null,
    exercises: []
  };
  state.routines.push(newRoutine);
  state.activeRoutineId = newRoutine.id;
  saveState();
  renderRutina();
  openEditRoutineModal();
}

function openEditRoutineModal() {
  const r = getActiveRoutine();
  openModal(`
    <h2 class="font-headline-sm text-headline-sm text-primary font-bold mb-space-md">Editar rutina</h2>
    <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Nombre</label>
    <input id="edit-r-name" value="${r.name}" class="w-full mt-1 mb-space-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" />
    <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Intensidad</label>
    <input id="edit-r-intensity" value="${r.intensity}" class="w-full mt-1 mb-space-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" />
    <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Duracion (texto)</label>
    <input id="edit-r-duration" value="${r.durationLabel}" class="w-full mt-1 mb-space-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" />
    <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Dia de la semana</label>
    <select id="edit-r-day" class="w-full mt-1 mb-space-md bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface">
      ${DAY_OPTIONS.map(d => `<option value="${d.id}" ${(r.day || '') === d.id ? 'selected' : ''}>${d.label}</option>`).join('')}
    </select>
    <button id="btn-save-routine" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold active:scale-[0.98] transition-transform">Guardar</button>
    ${state.routines.length > 1 ? '<button id="btn-delete-routine" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-error font-headline-sm active:scale-[0.98] transition-transform">Eliminar rutina</button>' : ''}
    <button id="btn-cancel-routine" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-on-surface-variant font-headline-sm active:scale-[0.98] transition-transform">Cancelar</button>
  `);
  document.getElementById('btn-cancel-routine').onclick = closeModal;
  const deleteRoutineBtn = document.getElementById('btn-delete-routine');
  if (deleteRoutineBtn) {
    deleteRoutineBtn.onclick = () => {
      if (confirm(`¿Eliminar la rutina "${r.name}"? Esto no borra tu historial de entrenamientos.`)) {
        state.routines = state.routines.filter(x => x.id !== r.id);
        state.activeRoutineId = state.routines[0].id;
        saveState();
        closeModal();
        renderRutina();
      }
    };
  }
  document.getElementById('btn-save-routine').onclick = () => {
    r.name = document.getElementById('edit-r-name').value.trim() || r.name;
    r.intensity = document.getElementById('edit-r-intensity').value.trim() || r.intensity;
    r.durationLabel = document.getElementById('edit-r-duration').value.trim() || r.durationLabel;
    r.day = document.getElementById('edit-r-day').value || null;
    saveState();
    closeModal();
    renderRutina();
  };
}

function openEditExerciseModal(exId) {
  const r = getActiveRoutine();
  const isNew = !exId;
  const ex = isNew
    ? { id: 'ex' + Date.now(), name: '', sets: 3, repMin: 8, repMax: 8, target: 20, unit: 'kg', suffix: '', prefix: '', rpe: '8', note: '', tag: '', restPresetId: 'hipertrofia' }
    : r.exercises.find(e => e.id === exId);

  openModal(`
    <h2 class="font-headline-sm text-headline-sm text-primary font-bold mb-space-md">${isNew ? 'Agregar ejercicio' : 'Editar ejercicio'}</h2>
    <div class="max-h-[60vh] overflow-y-auto flex flex-col gap-space-sm pr-1">
      <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Nombre</label><input id="edit-ex-name" value="${ex.name}" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
      <div class="grid grid-cols-3 gap-space-sm">
        <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Series</label><input id="edit-ex-sets" type="number" min="1" value="${ex.sets}" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
        <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Reps min</label><input id="edit-ex-repmin" type="number" min="1" value="${ex.repMin}" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
        <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Reps max</label><input id="edit-ex-repmax" type="number" min="1" value="${ex.repMax}" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
      </div>
      <div class="grid grid-cols-2 gap-space-sm">
        <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Peso objetivo (kg)</label><input id="edit-ex-target" type="number" min="0" step="0.5" value="${ex.target}" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
        <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">RPE</label><input id="edit-ex-rpe" value="${ex.rpe}" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
      </div>
      <div>
        <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Descanso entre series</label>
        <select id="edit-ex-rest" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface">
          ${REST_PRESETS.map(p => `<option value="${p.id}" ${(ex.restPresetId || 'hipertrofia') === p.id ? 'selected' : ''}>${p.label} · ${formatClock(p.seconds)}</option>`).join('')}
        </select>
      </div>
      <div class="flex items-center gap-space-md">
        <label class="flex items-center gap-2 text-on-surface"><input id="edit-ex-percu" type="checkbox" ${ex.suffix === ' c/u' ? 'checked' : ''} class="w-5 h-5 accent-[#c3f400]"> Peso por lado (c/u)</label>
        <label class="flex items-center gap-2 text-on-surface"><input id="edit-ex-added" type="checkbox" ${ex.prefix === '+' ? 'checked' : ''} class="w-5 h-5 accent-[#c3f400]"> Peso agregado (+)</label>
      </div>
      <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Etiqueta corta</label><input id="edit-ex-tag" value="${ex.tag || ''}" placeholder="Ej: PROGRESIVO" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" /></div>
      <div><label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Nota tecnica</label><textarea id="edit-ex-note" rows="2" class="w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface">${ex.note || ''}</textarea></div>
    </div>
    <button id="btn-save-ex" class="w-full h-tap-comfortable mt-space-md bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold active:scale-[0.98] transition-transform">Guardar</button>
    ${!isNew ? '<button id="btn-delete-ex" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-error font-headline-sm active:scale-[0.98] transition-transform">Eliminar ejercicio</button>' : ''}
    <button id="btn-cancel-ex" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-on-surface-variant font-headline-sm active:scale-[0.98] transition-transform">Cancelar</button>
  `);

  document.getElementById('btn-cancel-ex').onclick = closeModal;
  const deleteBtn = document.getElementById('btn-delete-ex');
  if (deleteBtn) {
    deleteBtn.onclick = () => {
      if (confirm('¿Eliminar este ejercicio de la rutina?')) {
        r.exercises = r.exercises.filter(e => e.id !== exId);
        saveState();
        closeModal();
        renderRutina();
      }
    };
  }
  document.getElementById('btn-save-ex').onclick = () => {
    const name = document.getElementById('edit-ex-name').value.trim();
    if (!name) { showToast('Ponele un nombre al ejercicio'); return; }
    const repMin = parseInt(document.getElementById('edit-ex-repmin').value, 10) || 1;
    const repMax = parseInt(document.getElementById('edit-ex-repmax').value, 10) || repMin;
    const updated = {
      id: ex.id,
      name,
      sets: parseInt(document.getElementById('edit-ex-sets').value, 10) || 1,
      repMin,
      repMax: Math.max(repMin, repMax),
      target: parseFloat(document.getElementById('edit-ex-target').value) || 0,
      unit: 'kg',
      suffix: document.getElementById('edit-ex-percu').checked ? ' c/u' : '',
      prefix: document.getElementById('edit-ex-added').checked ? '+' : '',
      rpe: document.getElementById('edit-ex-rpe').value.trim() || '8',
      restPresetId: document.getElementById('edit-ex-rest').value,
      tag: document.getElementById('edit-ex-tag').value.trim(),
      note: document.getElementById('edit-ex-note').value.trim()
    };
    if (isNew) {
      r.exercises.push(updated);
    } else {
      const idx = r.exercises.findIndex(e => e.id === exId);
      r.exercises[idx] = updated;
    }
    saveState();
    closeModal();
    renderRutina();
  };
}

/* =============================== ENTRENAR ================================ */

function startSession() {
  const routine = getActiveRoutine();
  state.session = {
    startedAt: new Date().toISOString(),
    routineName: routine.name,
    currentExerciseIndex: 0,
    exercises: routine.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      rpe: ex.rpe,
      unit: ex.unit,
      suffix: ex.suffix || '',
      prefix: ex.prefix || '',
      note: ex.note,
      restPresetId: ex.restPresetId || 'hipertrofia',
      sets: pyramidRepsFor(ex.sets).map(reps => ({
        weight: ex.target,
        reps,
        completed: false
      }))
    }))
  };
  saveState();
  showToast('Entrenamiento iniciado');
}

function sessionElapsedSeconds() {
  if (!state.session) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(state.session.startedAt).getTime()) / 1000));
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function sessionVolume() {
  if (!state.session) return 0;
  return state.session.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s2, set) => s2 + (set.completed ? set.weight * set.reps : 0), 0), 0);
}

function renderEntrenar() {
  const container = document.getElementById('view-entrenar');

  if (!state.session) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-center gap-space-md py-space-3xl">
        <span class="material-symbols-outlined text-primary-container" style="font-size:56px;">fitness_center</span>
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Sin entrenamiento en curso</h1>
        <p class="text-on-surface-variant max-w-xs">Iniciá el entrenamiento de hoy desde la pestaña Rutina para empezar a registrar tus series.</p>
        <button id="btn-go-rutina" class="mt-space-sm h-tap-comfortable px-space-xl bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold active:scale-[0.98] transition-transform">Ir a la Rutina</button>
      </div>`;
    document.getElementById('btn-go-rutina').onclick = () => switchView('rutina');
    return;
  }

  const session = state.session;
  const exIdx = session.currentExerciseIndex;
  const ex = session.exercises[exIdx];
  const completedCount = ex.sets.filter(s => s.completed).length;
  const activeIndex = ex.sets.findIndex(s => !s.completed);
  const volume = sessionVolume();
  const elapsedMin = Math.floor(sessionElapsedSeconds() / 60);

  const header = `
    <section class="bg-surface-container rounded-xl p-space-md shadow-sm mb-space-md">
      <div class="flex items-center justify-between mb-space-xxs">
        <span class="text-primary-container font-label-caps text-label-caps tracking-widest uppercase flex items-center gap-1">
          <span class="inline-block w-2 h-2 rounded-full bg-primary-container animate-ping"></span> EN CURSO • ${elapsedMin} MIN
        </span>
        <span class="text-on-surface-variant font-label-sm text-label-sm">VOLUMEN: ${Math.round(volume).toLocaleString('es-AR')} KG</span>
      </div>
      <h1 class="text-headline-lg-mobile font-headline-lg-mobile text-primary tracking-tight">${session.routineName}</h1>
    </section>`;

  const rows = ex.sets.map((set, i) => {
    const prevLog = lastLoggedSet(ex.name);
    const prevLabel = prevLog ? `${fmtKg(prevLog.weight)} kg × ${prevLog.reps}` : '—';
    if (set.completed) {
      return `
        <div class="grid grid-cols-12 gap-2 items-center bg-surface-container-high rounded-lg p-space-xs transition-colors">
          <div class="col-span-2 flex items-center"><span class="w-6 h-6 rounded-lg bg-surface-container-highest text-on-surface-variant font-data-metric-md text-label-sm flex items-center justify-center font-bold">${i + 1}</span></div>
          <div class="col-span-3 text-on-surface-variant font-label-sm text-label-sm">${prevLabel}</div>
          <div class="col-span-3 text-center font-data-metric-md text-body-lg font-bold text-on-surface-variant">${fmtKg(set.weight)}</div>
          <div class="col-span-2 text-center font-data-metric-md text-body-lg font-bold text-on-surface-variant">${set.reps}</div>
          <div class="col-span-2 flex justify-end">
            <button data-action="undo-set" data-set="${i}" aria-label="Deshacer serie ${i + 1}" class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm active:scale-[0.98]" type="button">
              <span class="material-symbols-outlined text-[20px] font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
            </button>
          </div>
        </div>`;
    }
    if (i === activeIndex) {
      return `
        <div class="rounded-xl bg-surface-container-lowest p-space-xs shadow-md space-y-space-xs">
          <div class="grid grid-cols-12 gap-2 items-center">
            <div class="col-span-2 flex items-center gap-1">
              <span class="w-6 h-6 rounded-lg bg-primary-container text-on-primary-container font-data-metric-md text-label-sm flex items-center justify-center font-bold">${i + 1}</span>
              <span class="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
            </div>
            <div class="col-span-3 text-on-surface-variant font-label-sm text-label-sm">${prevLabel}</div>
            <div class="col-span-3 flex items-center justify-center bg-surface-container-high rounded-xl py-1 px-1">
              <input data-role="active-weight" inputmode="decimal" class="w-full bg-transparent border-0 text-center font-data-metric-md text-data-metric-md text-primary font-bold p-0 focus:ring-0" type="text" value="${fmtKg(set.weight)}"/>
            </div>
            <div class="col-span-2 flex items-center justify-center bg-surface-container-high rounded-xl py-1 px-1">
              <input data-role="active-reps" inputmode="numeric" class="w-full bg-transparent border-0 text-center font-data-metric-md text-data-metric-md text-primary font-bold p-0 focus:ring-0" type="text" value="${set.reps}"/>
            </div>
            <div class="col-span-2 flex justify-end">
              <button id="btn-check-active" data-set="${i}" aria-label="Confirmar serie ${i + 1}" class="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform" type="button">
                <span class="material-symbols-outlined text-[22px] font-bold" style="font-variation-settings: 'FILL' 1;">check</span>
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between gap-space-xs pt-space-xxs">
            <span class="text-on-surface-variant font-label-caps text-label-caps">AJUSTE RAPIDO:</span>
            <div class="flex items-center gap-space-xs">
              <button data-adjust="1.25" class="bg-surface-container-high text-primary font-data-metric-md text-label-caps px-space-xs py-space-xxs rounded-lg active:scale-[0.98] transition-all hover:bg-surface-bright" type="button">+1.25 kg</button>
              <button data-adjust="2.5" class="bg-surface-container-high text-primary font-data-metric-md text-label-caps px-space-xs py-space-xxs rounded-lg active:scale-[0.98] transition-all hover:bg-surface-bright" type="button">+2.5 kg</button>
              <button data-adjust="5" class="bg-surface-container-high text-primary-container font-data-metric-md text-label-caps px-space-xs py-space-xxs rounded-lg active:scale-[0.98] transition-all hover:bg-surface-bright" type="button">+5 kg</button>
            </div>
          </div>
        </div>`;
    }
    return `
      <div class="grid grid-cols-12 gap-2 items-center bg-surface-container-low rounded-lg p-space-xs opacity-70">
        <div class="col-span-2 flex items-center"><span class="w-6 h-6 rounded-lg bg-surface-container-high text-on-surface-variant font-data-metric-md text-label-sm flex items-center justify-center font-bold">${i + 1}</span></div>
        <div class="col-span-3 text-on-surface-variant font-label-sm text-label-sm">${fmtKg(set.weight)} kg × ${set.reps}</div>
        <div class="col-span-3 text-center font-data-metric-md text-body-lg text-on-surface-variant">${fmtKg(set.weight)}</div>
        <div class="col-span-2 text-center font-data-metric-md text-body-lg text-on-surface-variant">—</div>
        <div class="col-span-2 flex justify-end"><button disabled aria-label="Serie ${i + 1} pendiente" class="w-10 h-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center" type="button"><span class="material-symbols-outlined text-[18px]">check</span></button></div>
      </div>`;
  }).join('');

  const exerciseCard = `
    <section class="bg-surface-container rounded-xl p-space-md shadow-md space-y-space-md mb-space-md">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-space-xs">
            <span class="bg-primary-container/10 text-primary-container font-label-caps text-label-caps px-space-xs py-space-xxs rounded-lg">${completedCount}/${ex.sets.length} series completadas</span>
            <span class="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps px-space-xs py-space-xxs rounded-lg">RPE ${ex.rpe}</span>
          </div>
          <h2 class="text-headline-sm font-headline-sm text-primary mt-space-xs">${ex.name}</h2>
        </div>
      </div>
      <div class="space-y-space-xs">
        <div class="grid grid-cols-12 gap-2 text-on-surface-variant font-label-caps text-label-caps px-space-xs py-space-xxs uppercase tracking-wider">
          <div class="col-span-2 text-left">SERIE</div>
          <div class="col-span-3 text-left">ANTERIOR</div>
          <div class="col-span-3 text-center">KG</div>
          <div class="col-span-2 text-center">REPS</div>
          <div class="col-span-2 text-right">CHECK</div>
        </div>
        ${rows}
      </div>
      <button id="btn-add-set" class="w-full bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-body-md py-space-xs rounded-xl flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform duration-100 ease-out" type="button">
        <span class="material-symbols-outlined text-[20px]">add</span><span>Añadir Serie</span>
      </button>
    </section>`;

  const isLastExercise = exIdx === session.exercises.length - 1;
  const allSetsDone = ex.sets.every(s => s.completed);
  let footer;
  if (isLastExercise && allSetsDone) {
    footer = `
      <section class="bg-surface-container rounded-xl p-space-md shadow-sm">
        <button id="btn-finish-session" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container font-headline-sm text-headline-sm rounded-xl font-bold flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform shadow-md" type="button">
          <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">flag</span>
          <span>Finalizar Sesion</span>
        </button>
      </section>`;
  } else {
    const nextEx = session.exercises[exIdx + 1];
    footer = `
      <section class="bg-surface-container rounded-xl p-space-md shadow-sm flex flex-col gap-space-xs">
        <div class="flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps">
          <span>A CONTINUACION</span><span>EJERCICIO ${Math.min(exIdx + 2, session.exercises.length)} DE ${session.exercises.length}</span>
        </div>
        <button id="btn-next-exercise" ${nextEx ? '' : 'disabled'} class="w-full h-tap-comfortable bg-primary-container text-on-primary-container font-headline-sm text-headline-sm rounded-xl font-bold flex items-center justify-between px-space-md active:scale-[0.98] transition-transform shadow-md disabled:opacity-40" type="button">
          <div class="flex items-center gap-space-xs"><span class="material-symbols-outlined text-[24px]">fast_forward</span><span>Siguiente: ${nextEx ? nextEx.name : '—'}</span></div>
          <span class="material-symbols-outlined text-[24px]">arrow_forward</span>
        </button>
      </section>`;
  }

  container.innerHTML = header + exerciseCard + footer;

  container.querySelectorAll('[data-action="undo-set"]').forEach(btn => {
    btn.onclick = () => {
      const i = Number(btn.dataset.set);
      ex.sets[i].completed = false;
      saveState();
      renderEntrenar();
    };
  });

  const weightInput = container.querySelector('[data-role="active-weight"]');
  const repsInput = container.querySelector('[data-role="active-reps"]');
  container.querySelectorAll('[data-adjust]').forEach(btn => {
    btn.onclick = () => {
      const amount = parseFloat(btn.dataset.adjust);
      const cur = parseFloat(weightInput.value) || 0;
      weightInput.value = fmtKg(cur + amount);
    };
  });

  const checkBtn = document.getElementById('btn-check-active');
  if (checkBtn) {
    checkBtn.onclick = () => {
      const i = Number(checkBtn.dataset.set);
      const w = parseFloat(weightInput.value) || 0;
      const r = parseInt(repsInput.value, 10) || 0;
      ex.sets[i].weight = w;
      ex.sets[i].reps = r;
      ex.sets[i].completed = true;
      registerSetForPR(ex.name, w, r);
      saveState();

      const hasMoreAfter = ex.sets.some(s => !s.completed) || exIdx < session.exercises.length - 1;
      if (hasMoreAfter) {
        openRestTimer(nextSetHint(), ex.restPresetId);
      } else {
        renderEntrenar();
      }
    };
  }

  document.getElementById('btn-add-set').onclick = () => {
    const last = ex.sets[ex.sets.length - 1];
    ex.sets.push({ weight: last ? last.weight : 0, reps: last ? last.reps : 0, completed: false });
    saveState();
    renderEntrenar();
  };

  const nextBtn = document.getElementById('btn-next-exercise');
  if (nextBtn) {
    nextBtn.onclick = () => {
      session.currentExerciseIndex = Math.min(session.currentExerciseIndex + 1, session.exercises.length - 1);
      saveState();
      renderEntrenar();
    };
  }

  const finishBtn = document.getElementById('btn-finish-session');
  if (finishBtn) finishBtn.onclick = () => confirmEndSession();
}

function nextSetHint() {
  const session = state.session;
  const ex = session.exercises[session.currentExerciseIndex];
  const stillPending = ex.sets.some(s => !s.completed);
  if (stillPending) return `Serie siguiente · ${ex.name}`;
  const next = session.exercises[session.currentExerciseIndex + 1];
  return next ? `Siguiente ejercicio: ${next.name}` : null;
}

function confirmEndSession() {
  openModal(`
    <h2 class="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">¿Finalizar entrenamiento?</h2>
    <p class="text-on-surface-variant text-body-md mb-space-md">Se guardará el resumen de esta sesión en tu historial y progreso.</p>
    <button id="btn-confirm-end" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold active:scale-[0.98] transition-transform">Finalizar y guardar</button>
    <button id="btn-cancel-end" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-on-surface-variant font-headline-sm active:scale-[0.98] transition-transform">Seguir entrenando</button>
  `);
  document.getElementById('btn-cancel-end').onclick = closeModal;
  document.getElementById('btn-confirm-end').onclick = () => {
    closeModal();
    finishSession();
  };
}

function finishSession() {
  const session = state.session;
  const durationSec = sessionElapsedSeconds();
  const volume = sessionVolume();
  state.sessions.push({
    date: session.startedAt,
    durationSec,
    volume,
    exercises: session.exercises.map(ex => ({
      name: ex.name,
      sets: ex.sets.filter(s => s.completed).map(s => ({ weight: s.weight, reps: s.reps }))
    }))
  });
  state.session = null;
  saveState();
  showToast('Entrenamiento guardado');
  switchView('progreso');
}

function registerSetForPR(exerciseName, weight, reps) {
  if (weight <= 0 || reps <= 0) return;
  const est = epley(weight, reps);
  const label = shortLiftName(exerciseName);
  const current = state.prs[label];
  if (!current || est > current.estOneRM) {
    const diff = current ? Math.round((est - current.estOneRM) * 10) / 10 : null;
    state.prs[label] = {
      weight, reps, estOneRM: Math.round(est * 10) / 10,
      date: new Date().toISOString(),
      method: reps === 1 ? '1RM Verificada' : '1RM estimada',
      isNew: true,
      diff
    };
  }
}

function shortLiftName(name) {
  const map = {
    'Press de Banca con Barra': 'Press Banca',
    'Press Inclinado con Mancuernas': 'Press Inclinado',
    'Fondos en Paralelas (Lastrados)': 'Fondos Lastrados',
    'Elevaciones Laterales': 'Elevaciones Laterales',
    'Extension de Triceps en Polea': 'Triceps Polea'
  };
  return map[name] || name;
}

/* ============================ CRONOMETRO DESCANSO ========================= */

function openRestTimer(returnHint, presetId) {
  if (presetId && REST_PRESETS.some(p => p.id === presetId)) {
    state.rest.activePresetId = presetId;
  }
  const preset = REST_PRESETS.find(p => p.id === state.rest.activePresetId) || REST_PRESETS[1];
  state.rest.running = true;
  state.rest.total = preset.seconds;
  state.rest.remaining = preset.seconds;
  state.rest.returnHint = returnHint;
  saveState();
  document.getElementById('view-rest').hidden = false;
  renderRest();
  startRestInterval();
}

function closeRestTimer() {
  stopRestInterval();
  state.rest.running = false;
  saveState();
  document.getElementById('view-rest').hidden = true;
  renderEntrenar();
}

function startRestInterval() {
  stopRestInterval();
  restTimerInterval = setInterval(() => {
    if (state.rest.remaining > 0) {
      state.rest.remaining -= 1;
      if (state.rest.remaining === 0) onRestComplete();
      renderRest();
    }
  }, 1000);
}

function stopRestInterval() {
  if (restTimerInterval) clearInterval(restTimerInterval);
  restTimerInterval = null;
}

function onRestComplete() {
  stopRestInterval();
  state.rest.running = false;
  if (state.settings.soundEnabled) playBeep();
  if (state.settings.vibrationEnabled && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
}

function playBeep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const gain = audioCtx.createGain();
    gain.gain.value = (state.settings.volume / 100) * 0.2;
    gain.connect(audioCtx.destination);
    [0, 0.18, 0.36].forEach(offset => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = state.settings.soundPreset === 'campana' ? 660 : (state.settings.soundPreset === 'chime' ? 880 : 990);
      osc.connect(gain);
      osc.start(audioCtx.currentTime + offset);
      osc.stop(audioCtx.currentTime + offset + 0.15);
    });
  } catch (e) { /* audio no disponible */ }
}

function renderRest() {
  const view = document.getElementById('view-rest');
  const r = state.rest;
  const pct = r.total ? r.remaining / r.total : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct);
  const activeSetLabel = currentActiveSetLabel();

  view.innerHTML = `
    <div class="max-w-lg mx-auto px-container-padding-mobile pt-space-md pb-space-3xl flex flex-col gap-space-md">
      <div class="flex items-center justify-between">
        <button id="btn-back-training" class="font-label-caps text-label-caps text-primary-container flex items-center gap-1"><span class="material-symbols-outlined text-[18px]">arrow_back</span> VOLVER AL ENTRENAMIENTO</button>
      </div>
      <div>
        <p class="font-label-caps text-label-caps text-on-surface-variant uppercase">Modulo de Recuperacion</p>
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface font-bold">Cronometro de Descanso</h1>
      </div>
      <div class="flex flex-col items-center justify-center py-space-md">
        <div class="relative w-64 h-64 flex items-center justify-center">
          <svg class="absolute inset-0" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#2a2930" stroke-width="8"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="#c3f400" stroke-width="8" stroke-linecap="round"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 60 60)"
              style="transition: stroke-dashoffset 1s linear; filter: drop-shadow(0 0 6px rgba(195,244,0,0.5));"/>
          </svg>
          <div class="flex flex-col items-center">
            <span class="font-label-caps text-label-caps text-primary-container uppercase">Tiempo Restante</span>
            <span class="font-data-metric-lg text-display-xl-mobile text-on-surface tracking-tight">${formatClock(r.remaining)}</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Meta ${formatClock(r.total)}</span>
            <span class="font-label-caps text-label-caps ${r.running ? 'text-primary-container' : 'text-on-surface-variant'} flex items-center gap-1 mt-1">
              <span class="w-1.5 h-1.5 rounded-full ${r.running ? 'bg-primary-container animate-pulse' : 'bg-on-surface-variant'}"></span> ${r.running ? 'EN CURSO' : (r.remaining === 0 ? 'COMPLETADO' : 'PAUSADO')}
            </span>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-space-sm">
        <button id="btn-rest-plus30" class="h-tap-comfortable bg-surface-container-high rounded-xl font-headline-sm text-on-surface active:scale-[0.98] transition-transform">+30<br><span class="text-label-caps font-label-caps">SEG</span></button>
        <button id="btn-rest-toggle" class="h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold flex items-center justify-center gap-1 active:scale-[0.98] transition-transform">
          <span class="material-symbols-outlined">${r.running ? 'pause' : 'play_arrow'}</span> ${r.running ? 'PAUSAR' : 'CONTINUAR'}
        </button>
        <button id="btn-rest-reset" class="h-tap-comfortable bg-surface-container-high rounded-xl font-headline-sm text-on-surface flex flex-col items-center justify-center active:scale-[0.98] transition-transform">
          <span class="material-symbols-outlined">restart_alt</span><span class="text-label-caps font-label-caps">RESET</span>
        </button>
      </div>
      <button id="btn-skip-rest" class="text-center font-label-caps text-label-caps text-on-surface-variant hover:text-primary-container">SALTAR DESCANSO AHORA »</button>

      <div>
        <div class="flex items-center justify-between mb-space-xs">
          <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Preajustes de Entrenamiento</span>
          <span class="font-label-caps text-label-caps text-primary-container">Ajuste Activo: ${formatClock((REST_PRESETS.find(p => p.id === state.rest.activePresetId) || REST_PRESETS[1]).seconds)}</span>
        </div>
        <div class="grid grid-cols-2 gap-space-sm">
          ${REST_PRESETS.map(p => `
            <button data-preset="${p.id}" class="preset-btn text-left p-space-sm rounded-xl border ${p.id === state.rest.activePresetId ? 'border-primary-container bg-surface-container-high' : 'border-outline-variant bg-surface-container'} relative">
              ${p.id === state.rest.activePresetId ? '<span class="absolute top-2 right-2 font-label-caps text-[9px] bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded">ACTIVO</span>' : ''}
              <div class="font-label-caps text-label-caps text-on-surface-variant">${p.label}</div>
              <div class="font-headline-sm text-headline-sm text-primary-container">${formatClock(p.seconds)}</div>
              <div class="font-label-sm text-label-sm text-on-surface-variant">${p.sub}</div>
            </button>`).join('')}
        </div>
      </div>

      ${activeSetLabel ? `
      <div class="bg-surface-container-high rounded-xl p-space-sm border-l-4 border-l-primary-container flex items-center justify-between gap-space-sm">
        <div>
          <div class="font-label-caps text-label-caps text-primary-container flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">bolt</span> A CONTINUACION EN TU SESION</div>
          <div class="font-headline-sm text-headline-sm text-on-surface mt-0.5">${activeSetLabel}</div>
        </div>
      </div>` : ''}

      <div class="bg-surface-container rounded-xl p-space-md border border-outline-variant flex flex-col gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="material-symbols-outlined text-primary-container">notifications</span>
          <span class="font-headline-sm text-headline-sm text-on-surface">Alertas de Descanso</span>
        </div>
        <label class="flex items-center justify-between py-space-xs border-t border-surface-container-high">
          <span>
            <span class="block font-body-md text-on-surface">Alerta Sonora</span>
            <span class="block font-label-sm text-label-sm text-on-surface-variant">Avisar al completar el tiempo</span>
          </span>
          <input id="toggle-sound" type="checkbox" ${state.settings.soundEnabled ? 'checked' : ''} class="w-11 h-6 accent-[#c3f400]">
        </label>
        <div class="flex items-center gap-space-xs">
          ${SOUND_PRESETS.map(sp => `<button data-sound="${sp.id}" class="sound-btn px-space-sm py-space-xs rounded-lg font-label-caps text-label-caps border ${state.settings.soundPreset === sp.id ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-surface-container-high text-on-surface-variant border-outline-variant'}">${sp.label}</button>`).join('')}
        </div>
        <div class="flex items-center gap-space-sm">
          <span class="material-symbols-outlined text-on-surface-variant text-[18px]">volume_down</span>
          <input id="range-volume" type="range" min="0" max="100" value="${state.settings.volume}" class="w-full accent-[#c3f400]">
          <span class="font-label-sm text-label-sm text-on-surface-variant w-10 text-right">${state.settings.volume}%</span>
        </div>
        <label class="flex items-center justify-between py-space-xs border-t border-surface-container-high">
          <span>
            <span class="block font-body-md text-on-surface">Vibracion / Haptica</span>
            <span class="block font-label-sm text-label-sm text-on-surface-variant">Cuenta regresiva tactil ultimos 5s</span>
          </span>
          <input id="toggle-vibration" type="checkbox" ${state.settings.vibrationEnabled ? 'checked' : ''} class="w-11 h-6 accent-[#c3f400]">
        </label>
        <label class="flex items-center justify-between py-space-xs border-t border-surface-container-high">
          <span>
            <span class="block font-body-md text-on-surface">Segundo Plano y PiP</span>
            <span class="block font-label-sm text-label-sm text-on-surface-variant">Alerta activa al bloquear o cambiar de app</span>
          </span>
          <input id="toggle-bg" type="checkbox" ${state.settings.backgroundAlert ? 'checked' : ''} class="w-11 h-6 accent-[#c3f400]">
        </label>
      </div>

      <button id="btn-finish-rest" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm text-headline-sm font-bold active:scale-[0.98] transition-transform">TERMINAR DESCANSO Y COMENZAR SERIE</button>
    </div>`;

  document.getElementById('btn-back-training').onclick = closeRestTimer;
  document.getElementById('btn-finish-rest').onclick = closeRestTimer;
  document.getElementById('btn-skip-rest').onclick = () => { state.rest.remaining = 0; onRestComplete(); renderRest(); };
  document.getElementById('btn-rest-plus30').onclick = () => { state.rest.remaining += 30; state.rest.total += 30; saveState(); renderRest(); };
  document.getElementById('btn-rest-reset').onclick = () => {
    const preset = REST_PRESETS.find(p => p.id === state.rest.activePresetId) || REST_PRESETS[1];
    state.rest.total = preset.seconds;
    state.rest.remaining = preset.seconds;
    saveState();
    renderRest();
  };
  document.getElementById('btn-rest-toggle').onclick = () => {
    if (state.rest.remaining === 0) return;
    r.running = !r.running;
    if (r.running) startRestInterval(); else stopRestInterval();
    saveState();
    renderRest();
  };
  view.querySelectorAll('[data-preset]').forEach(btn => {
    btn.onclick = () => {
      const preset = REST_PRESETS.find(p => p.id === btn.dataset.preset);
      state.rest.activePresetId = preset.id;
      state.rest.total = preset.seconds;
      state.rest.remaining = preset.seconds;
      state.rest.running = true;
      saveState();
      startRestInterval();
      renderRest();
    };
  });
  view.querySelectorAll('[data-sound]').forEach(btn => {
    btn.onclick = () => { state.settings.soundPreset = btn.dataset.sound; saveState(); renderRest(); };
  });
  document.getElementById('toggle-sound').onchange = (e) => { state.settings.soundEnabled = e.target.checked; saveState(); };
  document.getElementById('toggle-vibration').onchange = (e) => { state.settings.vibrationEnabled = e.target.checked; saveState(); };
  document.getElementById('toggle-bg').onchange = (e) => { state.settings.backgroundAlert = e.target.checked; saveState(); };
  document.getElementById('range-volume').oninput = (e) => { state.settings.volume = Number(e.target.value); saveState(); renderRest(); };
}

function currentActiveSetLabel() {
  if (!state.session) return null;
  const ex = state.session.exercises[state.session.currentExerciseIndex];
  const idx = ex.sets.findIndex(s => !s.completed);
  if (idx === -1) return null;
  return `${ex.name} · Serie ${idx + 1} de ${ex.sets.length}`;
}

/* ============================== CALCULADORA =============================== */

function renderCalculadora() {
  const container = document.getElementById('view-calculadora');
  const c = state.calc;

  container.innerHTML = `
    <div class="flex justify-between items-center pt-space-xxs">
      <div>
        <h1 class="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">CALCULADORA DE DISCOS</h1>
        <p class="font-label-sm text-label-sm text-on-surface-variant">Carga precisa para series efectivas</p>
      </div>
      <div class="flex items-center gap-1 bg-surface-container-high px-space-xs py-1 rounded-full border border-outline-variant">
        <span class="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
        <span class="font-label-caps text-label-caps text-primary-container uppercase">Modo Libre</span>
      </div>
    </div>

    <div class="bg-surface-container-low p-space-xxs rounded-xl border border-outline-variant grid grid-cols-3 gap-1">
      <button data-bar="20" data-label="Barra Olimpica 20 kg" class="bar-btn py-space-xs px-space-xxs rounded-lg text-center flex flex-col items-center justify-center transition-all"><span class="font-headline-sm text-headline-sm leading-none">20<span class="text-xs font-normal">kg</span></span><span class="font-label-caps text-[9px] uppercase tracking-tighter mt-1">Olimpica</span></button>
      <button data-bar="15" data-label="Barra Tecnica 15 kg" class="bar-btn py-space-xs px-space-xxs rounded-lg text-center flex flex-col items-center justify-center transition-all"><span class="font-headline-sm text-headline-sm leading-none">15<span class="text-xs font-normal">kg</span></span><span class="font-label-caps text-[9px] uppercase tracking-tighter mt-1">Tecnica</span></button>
      <button data-bar="10" data-label="Barra EZ 10 kg" class="bar-btn py-space-xs px-space-xxs rounded-lg text-center flex flex-col items-center justify-center transition-all"><span class="font-headline-sm text-headline-sm leading-none">10<span class="text-xs font-normal">kg</span></span><span class="font-label-caps text-[9px] uppercase tracking-tighter mt-1">Barra EZ</span></button>
    </div>

    <div class="bg-surface-container p-space-md rounded-xl border border-outline-variant flex flex-col gap-space-sm relative overflow-hidden shadow-lg">
      <div class="flex justify-between items-center">
        <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Peso Total Objetivo</span>
        <span class="font-label-caps text-label-caps text-primary-container" id="active-bar-label">${c.barLabel}</span>
      </div>
      <div class="flex items-center justify-between gap-space-sm">
        <button id="btn-minus" aria-label="Restar 2.5 kg" class="h-tap-comfortable w-tap-comfortable rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary active:scale-[0.96] active:bg-surface-bright transition-all"><span class="material-symbols-outlined text-3xl font-bold">remove</span></button>
        <div class="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest py-space-xs px-space-md rounded-xl border border-outline-variant">
          <div class="flex items-baseline gap-1"><span class="font-data-metric-lg text-display-xl-mobile text-primary tracking-tighter" id="target-weight">${fmtKg(c.targetWeight)}</span><span class="font-headline-sm text-headline-sm text-primary-container font-bold">KG</span></div>
          <span class="font-label-sm text-label-sm text-on-surface-variant -mt-1">±2.5 kg paso</span>
        </div>
        <button id="btn-plus" aria-label="Sumar 2.5 kg" class="h-tap-comfortable w-tap-comfortable rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary active:scale-[0.96] active:bg-surface-bright transition-all"><span class="material-symbols-outlined text-3xl font-bold text-primary-container">add</span></button>
      </div>
      <div class="pt-space-xxs flex items-center justify-between gap-space-xs">
        <span class="font-label-caps text-label-caps text-outline uppercase shrink-0">Atajos:</span>
        <div class="grid grid-cols-4 gap-1.5 w-full">
          <button data-quick="60" class="quick-btn py-1 px-space-xxs rounded bg-surface-container-low border border-outline-variant text-center font-data-metric-md text-body-md text-on-surface hover:border-primary-container active:scale-95 transition-all">60k</button>
          <button data-quick="80" class="quick-btn py-1 px-space-xxs rounded bg-surface-container-low border border-outline-variant text-center font-data-metric-md text-body-md text-on-surface hover:border-primary-container active:scale-95 transition-all">80k</button>
          <button data-quick="100" class="quick-btn py-1 px-space-xxs rounded bg-surface-container-low border border-outline-variant text-center font-data-metric-md text-body-md text-on-surface hover:border-primary-container active:scale-95 transition-all">100k</button>
          <button data-quick="120" class="quick-btn py-1 px-space-xxs rounded bg-surface-container-low border border-outline-variant text-center font-data-metric-md text-body-md text-on-surface hover:border-primary-container active:scale-95 transition-all">120k</button>
        </div>
      </div>
    </div>

    <div class="bg-surface-container p-space-md rounded-xl border border-primary-container/30 relative overflow-hidden shadow-md">
      <div class="absolute top-0 left-0 right-0 h-[2px] bg-primary-container"></div>
      <div class="flex justify-between items-center mb-space-sm">
        <div class="flex items-center gap-space-xs"><span class="material-symbols-outlined text-primary-container">tune</span><span class="font-headline-sm text-headline-sm text-on-surface font-bold">ESQUEMA DE CARGA</span></div>
        <span class="font-label-caps text-label-caps px-2 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/40">1 LADO</span>
      </div>
      <div class="w-full bg-surface-container-lowest rounded-xl p-space-sm border border-outline-variant flex items-center justify-center min-h-[140px] overflow-x-auto">
        <div class="flex items-center relative py-2">
          <div class="h-6 w-12 bg-surface-container-highest border-y border-outline-variant relative flex items-center justify-center">
            <div class="w-full h-2 bg-outline/20"></div>
            <span class="absolute text-[8px] font-label-caps text-outline uppercase tracking-wider">BARRA</span>
          </div>
          <div class="bar-collar w-4 h-24 rounded-sm border-r border-l border-outline/50 shadow-md"></div>
          <div class="relative flex items-center pl-1 pr-4">
            <div class="absolute left-0 right-0 h-5 bar-sleeve -z-0"></div>
            <div class="relative z-10 flex items-center gap-1.5" id="plates-visual-container"></div>
          </div>
          <div class="w-3 h-5 bg-[#3a3a4c] rounded-r-sm border-y border-r border-outline-variant"></div>
        </div>
      </div>
      <div class="mt-space-sm bg-surface-container-high p-space-sm rounded-lg border-l-4 border-l-primary-container flex flex-col gap-1">
        <div class="flex items-baseline justify-between"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Cargar por cada lado:</span><span class="font-data-metric-md text-headline-sm text-primary-container font-bold" id="weight-per-side">0 KG</span></div>
        <p class="font-body-md text-body-md text-on-surface leading-tight" id="calc-formula"></p>
        <div class="flex flex-wrap items-center gap-1.5 pt-1" id="plates-breakdown-tags"></div>
      </div>
    </div>

    <div class="bg-surface-container p-space-md rounded-xl border border-outline-variant flex flex-col gap-space-xs">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-space-xs"><span class="material-symbols-outlined text-outline text-lg">inventory_2</span><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Discos Disponibles en Gimnasio</span></div>
        <button id="btn-reset-inventory" class="font-label-caps text-label-caps text-primary-container hover:underline">Todos</button>
      </div>
      <p class="font-label-sm text-label-sm text-outline">Desactiva discos si no estan disponibles en tu soporte:</p>
      <div class="grid grid-cols-4 gap-2 pt-1" id="plate-toggle-grid"></div>
    </div>

    <div class="pb-space-xs">
      <button id="btn-apply-set" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold uppercase tracking-wide flex items-center justify-center gap-space-xs active:scale-[0.98] transition-transform shadow-lg shadow-primary-container/10">
        <span class="material-symbols-outlined text-2xl font-bold">check_circle</span><span>Aplicar a Serie Actual</span>
      </button>
    </div>`;

  renderPlateToggleGrid();
  refreshBarButtons();
  calculatePlates();

  container.querySelectorAll('[data-bar]').forEach(btn => {
    btn.onclick = () => {
      c.barWeight = Number(btn.dataset.bar);
      c.barLabel = btn.dataset.label;
      c.targetWeight = Math.max(c.barWeight, c.targetWeight);
      saveState();
      refreshBarButtons();
      document.getElementById('active-bar-label').textContent = c.barLabel;
      document.getElementById('target-weight').textContent = fmtKg(c.targetWeight);
      calculatePlates();
    };
  });
  document.getElementById('btn-minus').onclick = () => adjustCalcWeight(-2.5);
  document.getElementById('btn-plus').onclick = () => adjustCalcWeight(2.5);
  container.querySelectorAll('[data-quick]').forEach(btn => {
    btn.onclick = () => setCalcWeight(Number(btn.dataset.quick));
  });
  document.getElementById('btn-reset-inventory').onclick = () => {
    state.settings.availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
    saveState();
    renderPlateToggleGrid();
    calculatePlates();
  };
  document.getElementById('btn-apply-set').onclick = applyCalcToActiveSet;

  function refreshBarButtons() {
    container.querySelectorAll('[data-bar]').forEach(btn => {
      const active = Number(btn.dataset.bar) === c.barWeight;
      btn.className = 'bar-btn py-space-xs px-space-xxs rounded-lg text-center flex flex-col items-center justify-center transition-all ' +
        (active ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface');
    });
  }
}

function adjustCalcWeight(delta) {
  const c = state.calc;
  setCalcWeight(Math.max(c.barWeight, c.targetWeight + delta));
}

function setCalcWeight(val) {
  const c = state.calc;
  c.targetWeight = Math.max(c.barWeight, val);
  document.getElementById('target-weight').textContent = fmtKg(c.targetWeight);
  saveState();
  calculatePlates();
}

function renderPlateToggleGrid() {
  const grid = document.getElementById('plate-toggle-grid');
  const allPlates = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
  const plateTextColor = { 25: 'text-red-400', 20: 'text-sky-400', 15: 'text-amber-400', 10: 'text-emerald-400', 5: 'text-zinc-100', 2.5: 'text-rose-400', 1.25: 'text-cyan-300', 0.5: 'text-outline' };
  grid.innerHTML = allPlates.map(p => {
    const active = state.settings.availablePlates.includes(p);
    return `
      <button data-plate="${p}" class="plate-toggle py-2 px-1 rounded-lg border ${active ? 'border-primary-container bg-surface-container-high text-primary' : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-outline'} flex flex-col items-center justify-center transition-all">
        <span class="font-data-metric-md text-body-md font-bold leading-none ${plateTextColor[p]}">${p}k</span>
        <span class="text-[9px] font-label-caps ${active ? 'text-primary-container' : 'text-outline'} mt-1">${active ? 'ACTIVO' : 'OFF'}</span>
      </button>`;
  }).join('');
  grid.querySelectorAll('[data-plate]').forEach(btn => {
    btn.onclick = () => {
      const p = Number(btn.dataset.plate);
      const idx = state.settings.availablePlates.indexOf(p);
      if (idx === -1) state.settings.availablePlates.push(p);
      else state.settings.availablePlates.splice(idx, 1);
      saveState();
      renderPlateToggleGrid();
      calculatePlates();
    };
  });
}

function calculatePlates() {
  const c = state.calc;
  let remainingPerSide = (c.targetWeight - c.barWeight) / 2;
  if (remainingPerSide < 0) remainingPerSide = 0;

  const sortedAvailable = [...state.settings.availablePlates].sort((a, b) => b - a);
  const platesLoaded = [];
  const platesCounts = {};
  let currentRemainder = remainingPerSide;
  for (const plate of sortedAvailable) {
    while (currentRemainder >= plate - 0.001) {
      platesLoaded.push(plate);
      platesCounts[plate] = (platesCounts[plate] || 0) + 1;
      currentRemainder -= plate;
    }
  }

  document.getElementById('weight-per-side').textContent = fmtKg(remainingPerSide) + ' KG';
  document.getElementById('calc-formula').innerHTML =
    `Barra <strong class="text-primary font-bold">${fmtKg(c.barWeight)} kg</strong> + <strong class="text-primary font-bold">${fmtKg(c.targetWeight - c.barWeight)} kg</strong> en discos`;

  const visualContainer = document.getElementById('plates-visual-container');
  visualContainer.innerHTML = '';
  platesLoaded.forEach(plate => {
    const config = PLATE_COLORS[plate] || { bg: 'bg-surface-variant', border: 'border-outline', text: 'text-white', height: 'h-16', width: 'w-4' };
    const plateEl = document.createElement('div');
    plateEl.className = `flex flex-col items-center justify-between ${config.width} ${config.height} rounded-md ${config.bg} border-2 ${config.border} shadow-md text-white transition-all`;
    plateEl.innerHTML = `<span class="font-label-caps text-[8px] font-bold ${config.text} mt-0.5">${plate}</span><div class="w-1 h-3 ${config.border} bg-white/20 rounded-xs"></div><span class="font-label-caps text-[6px] font-bold ${config.text} mb-0.5">KG</span>`;
    visualContainer.appendChild(plateEl);
  });
  const clampEl = document.createElement('div');
  clampEl.className = 'w-3.5 h-10 rounded-sm bg-primary-container border border-on-primary-container flex flex-col items-center justify-center shadow-md';
  clampEl.innerHTML = '<div class="w-1 h-3 bg-on-primary-container rounded-xs"></div>';
  visualContainer.appendChild(clampEl);

  const tagsContainer = document.getElementById('plates-breakdown-tags');
  tagsContainer.innerHTML = '';
  if (Object.keys(platesCounts).length === 0) {
    tagsContainer.innerHTML = '<span class="text-label-sm font-label-sm text-outline">Solo la barra (sin discos)</span>';
  } else {
    for (const [plate, count] of Object.entries(platesCounts)) {
      const tag = document.createElement('span');
      tag.className = 'px-2 py-0.5 rounded bg-surface-container-lowest text-primary border border-outline-variant font-label-caps text-label-caps';
      tag.textContent = `${count}x ${plate} kg`;
      tagsContainer.appendChild(tag);
    }
  }
}

function applyCalcToActiveSet() {
  const btn = document.getElementById('btn-apply-set');
  if (!state.session) {
    showToast('No hay un entrenamiento activo');
    return;
  }
  const ex = state.session.exercises[state.session.currentExerciseIndex];
  const idx = ex.sets.findIndex(s => !s.completed);
  if (idx === -1) {
    showToast('No hay una serie pendiente para aplicar');
    return;
  }
  ex.sets[idx].weight = state.calc.targetWeight;
  saveState();
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="material-symbols-outlined text-2xl font-bold">done_all</span><span>¡Carga Aplicada!</span>';
  setTimeout(() => { btn.innerHTML = original; }, 1200);
  showToast(`${fmtKg(state.calc.targetWeight)} kg aplicado a ${ex.name}`);
}

/* ================================ PROGRESO ================================ */

let progresoFilter = '3M';

function sessionsInPeriod(filterKey) {
  const days = { '1M': 30, '3M': 90, '6M': 180, '1A': 365, 'Todo': Infinity }[filterKey];
  const cutoff = Date.now() - days * 86400000;
  return state.sessions.filter(s => new Date(s.date).getTime() >= cutoff);
}

function weeklyVolumeStats() {
  const now = Date.now();
  const weekMs = 7 * 86400000;
  const thisWeek = state.sessions.filter(s => now - new Date(s.date).getTime() <= weekMs);
  const lastWeek = state.sessions.filter(s => {
    const age = now - new Date(s.date).getTime();
    return age > weekMs && age <= 2 * weekMs;
  });
  const sum = arr => arr.reduce((a, s) => a + s.volume, 0);
  const cur = sum(thisWeek);
  const prev = sum(lastWeek);
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : (cur > 0 ? 100 : 0);
  const trend = [6, 5, 4, 3, 2, 1, 0].map(w => {
    const start = now - (w + 1) * weekMs;
    const end = now - w * weekMs;
    return sum(state.sessions.filter(s => { const t = new Date(s.date).getTime(); return t > start && t <= end; }));
  });
  return { cur, pct, trend };
}

function renderProgreso() {
  const container = document.getElementById('view-progreso');
  const periodSessions = sessionsInPeriod(progresoFilter);
  const vol = weeklyVolumeStats();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prsThisMonth = Object.values(state.prs).filter(pr => new Date(pr.date) >= monthStart).length;

  const days = { '1M': 30, '3M': 90, '6M': 180, '1A': 365, 'Todo': 3650 }[progresoFilter];
  const weeks = Math.max(1, days / 7);
  const consistency = periodSessions.length / weeks;
  const adherence = Math.min(100, Math.round((consistency / PLANNED_SESSIONS_PER_WEEK) * 100));

  const maxTrend = Math.max(1, ...vol.trend);
  const trendBars = vol.trend.map((v, i) => {
    const h = Math.max(8, Math.round((v / maxTrend) * 100));
    const isLast = i === vol.trend.length - 1;
    return `<div class="flex-1 ${isLast ? 'bg-primary-container' : 'bg-surface-container-highest'} rounded-t-sm" style="height:${h}%"></div>`;
  }).join('');

  const header = `
    <div class="pt-space-xxs">
      <div class="flex items-center justify-between mb-space-sm">
        <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold tracking-tight">PROGRESO &amp; RECORDS</h1>
        <span class="font-label-caps text-label-caps text-primary-container bg-surface-container-highest px-space-xs py-space-xxs rounded border border-outline-variant">ACTUALIZADO</span>
      </div>
      <div class="grid grid-cols-5 gap-space-xxs bg-surface-container-lowest p-1 rounded-xl border border-outline-variant" id="filter-row">
        ${['1M', '3M', '6M', '1A', 'Todo'].map(f => `<button data-filter="${f}" class="time-filter py-space-xs text-center font-label-caps text-label-caps rounded-lg transition-colors ${f === progresoFilter ? 'bg-primary-container text-on-primary-container font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}">${f}</button>`).join('')}
      </div>
    </div>`;

  const bento = `
    <section class="grid grid-cols-2 gap-space-sm">
      <div class="col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-space-md relative overflow-hidden">
        <div class="flex justify-between items-start">
          <div class="flex flex-col">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Volumen Semanal</span>
            <div class="flex items-baseline gap-space-xs mt-space-xxs"><span class="font-data-metric-lg text-data-metric-lg text-primary tracking-tight">${Math.round(vol.cur).toLocaleString('es-AR')}</span><span class="font-label-sm text-label-sm text-on-surface-variant">kg</span></div>
          </div>
          <div class="flex items-center gap-1 bg-surface-container px-space-xs py-1 rounded border border-outline-variant">
            <span class="material-symbols-outlined ${vol.pct >= 0 ? 'text-primary-container' : 'text-error'} text-sm">${vol.pct >= 0 ? 'trending_up' : 'trending_down'}</span>
            <span class="font-label-caps text-label-caps ${vol.pct >= 0 ? 'text-primary-container' : 'text-error'} font-bold">${vol.pct >= 0 ? '+' : ''}${vol.pct}% vs anterior</span>
          </div>
        </div>
        <div class="mt-space-md flex items-end gap-1.5 h-7">${trendBars}</div>
      </div>
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-space-md flex flex-col justify-between">
        <div class="flex items-center justify-between"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Records este mes</span><span class="material-symbols-outlined text-primary-container text-base">emoji_events</span></div>
        <div class="mt-space-xs"><span class="font-data-metric-lg text-data-metric-lg text-primary">${prsThisMonth}</span><span class="font-body-md text-body-md text-primary-container ml-1">nuevos PRs</span></div>
        <div class="mt-space-xs text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1"><span class="inline-block w-1.5 h-1.5 rounded-full bg-primary-container"></span><span>Sobre ${periodSessions.length} sesiones en el periodo</span></div>
      </div>
      <div class="bg-surface-container-low border border-outline-variant rounded-xl p-space-md flex flex-col justify-between">
        <div class="flex items-center justify-between"><span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Consistencia</span><span class="material-symbols-outlined text-secondary-container text-base">event_repeat</span></div>
        <div class="mt-space-xs"><span class="font-data-metric-lg text-data-metric-lg text-primary">${consistency.toFixed(1)}</span><span class="font-body-md text-body-md text-on-surface-variant ml-1">dias/sem</span></div>
        <div class="mt-space-xs text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1"><span class="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container"></span><span>${adherence}% adherencia plan</span></div>
      </div>
    </section>`;

  const chartData = buildBenchChartData(periodSessions);
  const chartSection = renderChartSection(chartData);

  const prCards = Object.entries(state.prs)
    .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
    .map(([name, pr], i) => {
      const icons = ['military_tech', 'workspace_premium', 'stars', 'shield'];
      const icon = icons[i % icons.length];
      const badge = pr.diff ? `<span class="font-label-caps text-label-caps bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded font-bold mt-1">+${fmtKg(pr.diff)} kg PR</span>`
        : `<span class="font-label-caps text-label-caps text-on-surface-variant mt-1">${pr.method}</span>`;
      return `
        <div class="bg-surface-container-low border border-outline-variant rounded-xl p-space-sm ${i === 0 ? 'pr-glow-active' : 'hover:border-primary-container/40'} transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-space-sm">
              <div class="w-10 h-10 rounded-lg ${i === 0 ? 'bg-primary-container/20 border border-primary-container text-primary-container' : 'bg-surface-container border border-outline-variant text-primary'} flex items-center justify-center"><span class="material-symbols-outlined">${icon}</span></div>
              <div>
                <h3 class="font-headline-sm text-headline-sm text-primary">${name}</h3>
                <div class="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant"><span>Fecha: ${relativeDate(pr.date)}</span><span>•</span><span>${pr.method}</span></div>
              </div>
            </div>
            <div class="text-right flex flex-col items-end">
              <span class="font-data-metric-md text-data-metric-md text-primary font-bold">${fmtKg(pr.weight)} kg</span>
              ${badge}
            </div>
          </div>
        </div>`;
    }).join('') || '<p class="text-on-surface-variant text-body-md px-space-xxs">Todavia no hay records registrados. ¡Completa series en Entrenar para empezar a sumarlos!</p>';

  const prSection = `
    <section class="flex flex-col gap-space-sm">
      <div class="flex justify-between items-center">
        <h2 class="font-headline-sm text-headline-sm text-primary flex items-center gap-space-xs"><span>Records Personales</span><span class="font-label-caps text-label-caps bg-surface-container px-2 py-0.5 rounded text-on-surface-variant border border-outline-variant">LIFTS 1RM</span></h2>
      </div>
      <div class="flex flex-col gap-space-xs">${prCards}</div>
    </section>`;

  const calcSection = `
    <section class="bg-surface-container-low border border-outline-variant rounded-xl p-space-md mb-space-md">
      <div class="flex items-center justify-between mb-space-sm">
        <div class="flex items-center gap-space-xs"><span class="material-symbols-outlined text-primary-container">calculate</span><h2 class="font-headline-sm text-headline-sm text-primary">Calculadora 1RM Rapida</h2></div>
        <span class="font-label-caps text-label-caps text-on-surface-variant bg-surface-container px-2 py-0.5 rounded border border-outline-variant">EPLEY / BRZYCKI</span>
      </div>
      <div class="grid grid-cols-2 gap-space-sm">
        <div class="flex flex-col gap-space-xxs">
          <label class="font-label-caps text-label-caps text-on-surface-variant uppercase" for="weightInput">Peso (kg)</label>
          <div class="relative flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg focus-within:border-primary-container">
            <input class="w-full bg-transparent border-0 text-center font-data-metric-md text-data-metric-md text-primary focus:ring-0 p-space-xs py-space-sm" id="weightInput" min="1" step="0.5" type="number" value="95"/>
          </div>
        </div>
        <div class="flex flex-col gap-space-xxs">
          <label class="font-label-caps text-label-caps text-on-surface-variant uppercase" for="repsInput">Reps</label>
          <div class="relative flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg focus-within:border-primary-container">
            <input class="w-full bg-transparent border-0 text-center font-data-metric-md text-data-metric-md text-primary focus:ring-0 p-space-xs py-space-sm" id="repsInput" min="1" max="30" type="number" value="5"/>
          </div>
        </div>
      </div>
      <div class="mt-space-md p-space-sm bg-surface-container rounded-lg border border-outline-variant flex items-center justify-between">
        <div><span class="font-label-caps text-label-caps text-on-surface-variant block">1RM ESTIMADA (EPLEY)</span><div class="flex items-baseline gap-1 mt-0.5"><span class="font-data-metric-lg text-data-metric-lg text-primary-container" id="epleyResult">0.0</span><span class="font-label-sm text-label-sm text-primary-container">kg</span></div></div>
        <div class="text-right border-l border-outline-variant pl-space-md"><span class="font-label-caps text-label-caps text-on-surface-variant block">FORMULA BRZYCKI</span><div class="flex items-baseline gap-1 mt-0.5 justify-end"><span class="font-data-metric-md text-data-metric-md text-on-surface" id="brzyckiResult">0.0</span><span class="font-label-sm text-label-sm text-on-surface-variant">kg</span></div></div>
      </div>
      <button id="btn-save-pr" class="w-full mt-space-sm h-tap-min bg-surface-container-high hover:bg-surface-bright border border-outline-variant rounded-lg flex items-center justify-center gap-space-xs text-primary font-headline-sm text-sm active:scale-[0.98] transition-transform"><span class="material-symbols-outlined text-base text-primary-container">add_circle</span><span>Guardar como nuevo Record</span></button>
    </section>`;

  container.innerHTML = header + bento + chartSection + prSection + calcSection;

  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.onclick = () => { progresoFilter = btn.dataset.filter; renderProgreso(); };
  });

  const weightInput = document.getElementById('weightInput');
  const repsInput = document.getElementById('repsInput');
  function calc1RM() {
    const w = parseFloat(weightInput.value) || 0;
    const r = parseFloat(repsInput.value) || 0;
    if (w > 0 && r > 0) {
      document.getElementById('epleyResult').textContent = fmt(epley(w, r), 1);
      const b = brzycki(w, r);
      document.getElementById('brzyckiResult').textContent = b === null ? '-' : fmt(b, 1);
    } else {
      document.getElementById('epleyResult').textContent = '0.0';
      document.getElementById('brzyckiResult').textContent = '0.0';
    }
  }
  weightInput.oninput = calc1RM;
  repsInput.oninput = calc1RM;
  calc1RM();

  document.getElementById('btn-save-pr').onclick = () => {
    const w = parseFloat(weightInput.value) || 0;
    const r = parseFloat(repsInput.value) || 0;
    if (w <= 0 || r <= 0) return;
    openSavePRModal(w, r, epley(w, r));
  };
}

function openSavePRModal(weight, reps, est) {
  const names = Array.from(new Set([...Object.keys(state.prs), ...getActiveRoutine().exercises.map(e => shortLiftName(e.name))]));
  openModal(`
    <h2 class="font-headline-sm text-headline-sm text-primary font-bold mb-space-md">Guardar nuevo record</h2>
    <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Ejercicio</label>
    <select id="pr-exercise-select" class="w-full mt-1 mb-space-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface">
      ${names.map(n => `<option value="${n}">${n}</option>`).join('')}
      <option value="__other">Otro...</option>
    </select>
    <input id="pr-exercise-custom" hidden placeholder="Nombre del ejercicio" class="w-full mb-space-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm text-on-surface" />
    <p class="text-on-surface-variant text-body-md mb-space-md">${fmtKg(weight)} kg × ${reps} reps · 1RM estimada ${fmt(est, 1)} kg</p>
    <button id="btn-confirm-pr" class="w-full h-tap-comfortable bg-primary-container text-on-primary-container rounded-xl font-headline-sm font-bold active:scale-[0.98] transition-transform">Guardar</button>
    <button id="btn-cancel-pr" class="w-full h-tap-min mt-space-sm bg-surface-container-high rounded-xl text-on-surface-variant font-headline-sm active:scale-[0.98] transition-transform">Cancelar</button>
  `);
  const select = document.getElementById('pr-exercise-select');
  const custom = document.getElementById('pr-exercise-custom');
  select.onchange = () => { custom.hidden = select.value !== '__other'; };
  document.getElementById('btn-cancel-pr').onclick = closeModal;
  document.getElementById('btn-confirm-pr').onclick = () => {
    const name = select.value === '__other' ? (custom.value.trim() || 'Ejercicio') : select.value;
    const current = state.prs[name];
    const diff = current ? Math.round((est - current.estOneRM) * 10) / 10 : null;
    state.prs[name] = {
      weight, reps, estOneRM: Math.round(est * 10) / 10,
      date: new Date().toISOString(),
      method: reps === 1 ? '1RM Verificada' : '1RM estimada',
      isNew: true,
      diff: diff && diff > 0 ? diff : null
    };
    saveState();
    closeModal();
    showToast('Record guardado');
    renderProgreso();
  };
}

function buildBenchChartData(periodSessions) {
  const points = [];
  periodSessions.forEach(s => {
    const ex = s.exercises.find(e => e.name === 'Press de Banca con Barra');
    if (ex && ex.sets.length) {
      const best = Math.max(...ex.sets.map(set => epley(set.weight, set.reps)));
      points.push({ date: s.date, value: best });
    }
  });
  return points.slice(-6);
}

function renderChartSection(points) {
  const prBanca = state.prs['Press Banca'];
  if (points.length < 2) {
    return `
      <section class="bg-surface-container-low border border-outline-variant rounded-xl p-space-md relative">
        <div class="flex items-start justify-between mb-space-sm">
          <div><h2 class="font-headline-sm text-headline-sm text-primary">Evolucion de Carga</h2><p class="font-body-md text-body-md text-on-surface-variant mt-0.5">Press de Banca (Progresion 1RM)</p></div>
          ${prBanca ? `<div class="text-right"><span class="font-data-metric-md text-data-metric-md text-primary-container block">${fmtKg(prBanca.weight)} kg</span><span class="font-label-sm text-label-sm text-on-surface-variant">Record Actual</span></div>` : ''}
        </div>
        <div class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-space-md text-center text-on-surface-variant font-body-md">
          Registra al menos 2 sesiones con Press de Banca en este periodo para ver la curva de evolucion.
        </div>
      </section>`;
  }

  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = 290 / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = 10 + i * stepX;
    const y = 110 - ((p.value - min) / range) * 90;
    return { x, y };
  });
  const linePath = coords.map((c, i) => (i === 0 ? 'M' : 'L') + ` ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} 115 L ${coords[0].x.toFixed(1)} 115 Z`;
  const last = coords[coords.length - 1];
  const isPR = prBanca && Math.round(points[points.length - 1].value * 10) / 10 >= prBanca.estOneRM;

  const circles = coords.slice(0, -1).map(c => `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" fill="#131319" r="4" stroke="#c3f400" stroke-width="2"></circle>`).join('');

  return `
    <section class="bg-surface-container-low border border-outline-variant rounded-xl p-space-md relative">
      <div class="flex items-start justify-between mb-space-sm">
        <div>
          <div class="flex items-center gap-space-xs"><h2 class="font-headline-sm text-headline-sm text-primary">Evolucion de Carga</h2>${isPR ? '<span class="font-label-caps text-label-caps bg-primary-container/10 border border-primary-container text-primary-container px-space-xs py-0.5 rounded">PR VIGENTE</span>' : ''}</div>
          <p class="font-body-md text-body-md text-on-surface-variant mt-0.5">Press de Banca (Progresion 1RM)</p>
        </div>
        <div class="text-right"><span class="font-data-metric-md text-data-metric-md text-primary-container block">${fmtKg(prBanca ? prBanca.weight : max)} kg</span><span class="font-label-sm text-label-sm text-on-surface-variant">Record Actual</span></div>
      </div>
      <div class="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-space-sm relative">
        <div class="flex justify-between font-label-sm text-label-sm text-on-surface-variant mb-space-xs"><span>${fmt(max, 0)} kg</span><span>Historial ${points.length} Sesiones</span></div>
        <div class="relative w-full h-36">
          <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div class="w-full border-b border-outline"></div><div class="w-full border-b border-outline"></div><div class="w-full border-b border-outline"></div><div class="w-full border-b border-outline"></div>
          </div>
          <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 320 120">
            <defs><linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#c3f400" stop-opacity="0.35"></stop><stop offset="100%" stop-color="#c3f400" stop-opacity="0.0"></stop></linearGradient></defs>
            <path d="${areaPath}" fill="url(#chartGradient)"></path>
            <path d="${linePath}" fill="none" stroke="#c3f400" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></path>
            ${circles}
            <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" fill="#c3f400" r="6" stroke="#131319" stroke-width="2"></circle>
          </svg>
          <div class="absolute" style="right:${(320 - last.x) / 320 * 100}%; top:${last.y / 120 * 100}%; transform: translate(50%, -140%);">
            <div class="bg-primary-container text-on-primary-container text-label-caps font-label-caps font-bold px-1.5 py-0.5 rounded shadow">${fmt(points[points.length - 1].value, 0)} KG ${isPR ? '★' : ''}</div>
          </div>
        </div>
        <div class="flex justify-between font-label-caps text-label-caps text-on-surface-variant mt-space-sm pt-1 border-t border-outline-variant">
          ${points.map((p, i) => `<span class="${i === points.length - 1 ? 'text-primary-container font-bold' : ''}">${i === points.length - 1 ? 'Actual' : formatDateShort(p.date)}</span>`).join('')}
        </div>
      </div>
      <div class="flex items-center justify-between mt-space-sm text-body-md">
        <span class="text-on-surface-variant font-label-sm text-label-sm">Ganancia neta: <strong class="text-primary">${values[values.length - 1] >= values[0] ? '+' : ''}${fmt(values[values.length - 1] - values[0], 1)} kg en el periodo</strong></span>
      </div>
    </section>`;
}

/* ================================== INIT =================================== */

function init() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js', { scope: './' }).catch(() => {});
  }
  const hashView = location.hash.replace('#', '');
  const initial = ['entrenar', 'rutina', 'progreso', 'calculadora'].includes(hashView)
    ? hashView
    : (state.session ? 'entrenar' : 'rutina');
  switchView(initial);
}

init();
