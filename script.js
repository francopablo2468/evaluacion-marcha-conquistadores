const individualGroups = [
  { title: "A. En firmes", moves: [
    "Derecha... dré", "Izquierda... izquier", "Media vuelta izquier",
    "Darse fren...te", "Vuelta fren...te"
  ]},
  { title: "B. En descanso", moves: [
    "Derecha... frente", "Izquierda... frente", "A retaguardia... frente"
  ]},
  { title: "C. En marcha", moves: [
    "De frente... mar", "Paso corto... mar", "Sin cadencia... mar", "Re...doblado",
    "En el lugar, paso corto... mar", "Oblicuo izquierdo... mar", "Oblicuo derecho... mar",
    "Cuadrado... mar", "Media vuelta... mar", "Sobre la marcha, media vuelta"
  ]},
  { title: "D. Conversiones y dirección", moves: [
    "Conversión individual derecha", "Conversión individual izquierda",
    "Conversión grupal derecha", "Conversión grupal izquierda",
    "Dirección al finalizar la conversión"
  ]},
  { title: "E. Otros movimientos", moves: [
    "Izquierda, izquier... mar", "Derecha, dré... mar", "Cambio de paso... mar"
  ]}
];
const groupCriteria = [
  "Sincronización con el grupo",
  "Alineación y mantenimiento de distancias",
  "Precisión de los movimientos",
  "Conversiones y mantenimiento de la formación",
  "Respuesta a las voces de mando"
];
const STORAGE_KEY = "evaluacionMarchaConquis_v1";
let state = loadState();
let selectedId = "";

function blankScores(length) { return Array(length).fill(null); }
function newParticipant(name) {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    individual: blankScores(26),
    group: blankScores(5),
    individualNotes: "",
    groupNotes: "",
    status: "En consideración"
  };
}
function defaultState() {
  return { clubName: "", eventDate: new Date().toISOString().slice(0, 10), evaluator: "", participants: [] };
}
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
  } catch { return defaultState(); }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function selectedParticipant() {
  return state.participants.find(p => p.id === selectedId);
}
function sumScores(scores) {
  return scores.reduce((sum, score) => sum + (score === null ? 0 : Number(score)), 0);
}
function individualTotal(p) { return sumScores(p.individual); }
function groupTotal(p) { return sumScores(p.group); }
function total(p) { return individualTotal(p) + groupTotal(p); }
function isEvaluated(p) {
  return p.individual.some(v => v !== null) || p.group.some(v => v !== null);
}
function renderParticipants() {
  const list = document.getElementById("participantList");
  document.getElementById("participantCount").textContent = `${state.participants.length} participante${state.participants.length === 1 ? "" : "s"}`;
  list.innerHTML = state.participants.length ? state.participants.map(p => `
    <span class="person-chip">${esc(p.name)}
      <button type="button" title="Eliminar ${esc(p.name)}" aria-label="Eliminar ${esc(p.name)}" data-delete="${p.id}">×</button>
    </span>`).join("") : '<p class="muted">Todavía no hay participantes. Agregá el primero arriba.</p>';
  const select = document.getElementById("participantSelect");
  const old = selectedId;
  select.innerHTML = '<option value="">Elegí un participante</option>' + state.participants.map(p =>
    `<option value="${p.id}">${esc(p.name)}</option>`).join("");
  if (state.participants.some(p => p.id === old)) select.value = old;
  else { selectedId = ""; select.value = ""; }
}
function renderIndividual() {
  const target = document.getElementById("individualSections");
  const p = selectedParticipant();
  if (!p) {
    target.innerHTML = '<p class="empty">Agregá y seleccioná un participante para cargar sus puntajes.</p>';
    document.getElementById("individualTotal").textContent = "0 / 52";
    document.getElementById("individualNotes").value = "";
    return;
  }
  let index = 0;
  target.innerHTML = individualGroups.map(group => {
    const rows = group.moves.map(move => {
      const i = index++;
      return `<div class="eval-item">
        <div class="move-name"><span class="move-number">${i + 1}.</span>${esc(move)}</div>
        <div class="score-options" role="group" aria-label="Puntaje para ${esc(move)}">
          ${[0,1,2].map(v => `<button type="button" class="score-option ${p.individual[i] === v ? "active" : ""}" data-kind="individual" data-index="${i}" data-score="${v}" aria-pressed="${p.individual[i] === v}">${v}</button>`).join("")}
        </div>
      </div>`;
    }).join("");
    return `<div class="eval-section"><h3>${esc(group.title)}</h3><div class="eval-list">${rows}</div></div>`;
  }).join("");
  document.getElementById("individualTotal").textContent = `${individualTotal(p)} / 52`;
  document.getElementById("individualNotes").value = p.individualNotes || "";
}
function renderGroup() {
  const p = selectedParticipant();
  const target = document.getElementById("groupCriteria");
  if (!p) {
    target.innerHTML = '<p class="empty">Seleccioná un participante para cargar la evaluación grupal.</p>';
    document.getElementById("groupTotal").textContent = "0 / 20";
    document.getElementById("groupNotes").value = "";
    return;
  }
  target.innerHTML = groupCriteria.map((criterion, i) => `
    <div class="group-row">
      <div><p>${i + 1}. ${esc(criterion)}</p><small>0 = Deficiente · 1 = En desarrollo · 2 = Bueno · 3 = Muy bueno · 4 = Excelente</small></div>
      <div class="score-options" role="group" aria-label="Puntaje para ${esc(criterion)}">
        ${[0,1,2,3,4].map(v => `<button type="button" class="score-option ${p.group[i] === v ? "active" : ""}" data-kind="group" data-index="${i}" data-score="${v}" aria-pressed="${p.group[i] === v}">${v}</button>`).join("")}
      </div>
    </div>`).join("");
  document.getElementById("groupTotal").textContent = `${groupTotal(p)} / 20`;
  document.getElementById("groupNotes").value = p.groupNotes || "";
}
function renderRanking() {
  const body = document.getElementById("rankingBody");
  const sorted = [...state.participants].sort((a,b) => total(b) - total(a) || a.name.localeCompare(b.name, "es"));
  const evaluatedCount = state.participants.filter(isEvaluated).length;
  document.getElementById("rankSummary").textContent = `${evaluatedCount} de ${state.participants.length} evaluados`;
  if (!sorted.length) {
    body.innerHTML = '<tr><td colspan="7" class="empty">Agregá participantes para comenzar.</td></tr>';
    return;
  }
  body.innerHTML = sorted.map((p, i) => `
    <tr>
      <td><span class="rank-number">${i + 1}</span></td>
      <td><strong>${esc(p.name)}</strong>${isEvaluated(p) ? "" : '<div class="muted">Sin puntajes cargados</div>'}</td>
      <td>${individualTotal(p)} / 52</td>
      <td>${groupTotal(p)} / 20</td>
      <td class="total-cell">${total(p)} / 72</td>
      <td><select class="status-select" data-status="${p.id}" aria-label="Estado de ${esc(p.name)}">
        ${["Seleccionado/a","En consideración","Requiere práctica"].map(s => `<option ${p.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select></td>
      <td><button class="table-action" type="button" data-edit="${p.id}">Evaluar</button></td>
    </tr>`).join("");
}
function renderAll() {
  document.getElementById("clubName").value = state.clubName || "";
  document.getElementById("eventDate").value = state.eventDate || "";
  document.getElementById("evaluator").value = state.evaluator || "";
  renderParticipants();
  renderIndividual();
  renderGroup();
  renderRanking();
}
function addParticipant(name) {
  const clean = name.trim();
  if (!clean) return;
  if (state.participants.some(p => p.name.toLocaleLowerCase("es") === clean.toLocaleLowerCase("es"))) {
    alert("Ya hay un participante con ese nombre.");
    return;
  }
  const p = newParticipant(clean);
  state.participants.push(p);
  selectedId = p.id;
  saveState();
}
document.getElementById("addForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = document.getElementById("participantName");
  addParticipant(input.value);
  input.value = "";
  input.focus();
});
document.getElementById("participantSelect").addEventListener("change", e => {
  selectedId = e.target.value;
  renderIndividual();
  renderGroup();
});
document.addEventListener("click", e => {
  const scoreButton = e.target.closest("[data-kind][data-score]");
  if (scoreButton) {
    const p = selectedParticipant();
    if (!p) return;
    const scores = scoreButton.dataset.kind === "individual" ? p.individual : p.group;
    const i = Number(scoreButton.dataset.index);
    const value = Number(scoreButton.dataset.score);
    scores[i] = scores[i] === value ? null : value;
    saveState();
    return;
  }
  const deleteButton = e.target.closest("[data-delete]");
  if (deleteButton) {
    const p = state.participants.find(x => x.id === deleteButton.dataset.delete);
    if (!p || !confirm(`¿Eliminar a ${p.name} y todos sus puntajes?`)) return;
    state.participants = state.participants.filter(x => x.id !== p.id);
    if (selectedId === p.id) selectedId = "";
    saveState();
    return;
  }
  const editButton = e.target.closest("[data-edit]");
  if (editButton) {
    selectedId = editButton.dataset.edit;
    document.getElementById("participantSelect").value = selectedId;
    renderIndividual();
    renderGroup();
    document.getElementById("evaluationPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
document.getElementById("individualNotes").addEventListener("input", e => {
  const p = selectedParticipant(); if (!p) return;
  p.individualNotes = e.target.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});
document.getElementById("groupNotes").addEventListener("input", e => {
  const p = selectedParticipant(); if (!p) return;
  p.groupNotes = e.target.value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
});
document.getElementById("clearIndividual").addEventListener("click", () => {
  const p = selectedParticipant(); if (!p) return;
  if (!confirm("¿Limpiar todos los puntajes individuales de este participante?")) return;
  p.individual = blankScores(26); saveState();
});
document.getElementById("clearGroup").addEventListener("click", () => {
  const p = selectedParticipant(); if (!p) return;
  if (!confirm("¿Limpiar todos los puntajes grupales de este participante?")) return;
  p.group = blankScores(5); saveState();
});
["clubName","eventDate","evaluator"].forEach(id => {
  document.getElementById(id).addEventListener("input", e => {
    const key = {clubName:"clubName",eventDate:"eventDate",evaluator:"evaluator"}[id];
    state[key] = e.target.value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  });
});
document.addEventListener("change", e => {
  if (e.target.matches("[data-status]")) {
    const p = state.participants.find(x => x.id === e.target.dataset.status);
    if (p) { p.status = e.target.value; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  }
});
document.getElementById("printBtn").addEventListener("click", () => window.print());
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "evaluacion-marcha-conquis.json"; a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("importFile").addEventListener("change", async e => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported.participants)) throw new Error("Formato no válido");
    if (!confirm("Importar reemplazará los datos actuales. ¿Continuar?")) return;
    state = { ...defaultState(), ...imported };
    selectedId = state.participants[0]?.id || "";
    saveState();
    alert("Copia importada correctamente.");
  } catch {
    alert("No se pudo importar el archivo. Elegí una copia JSON exportada desde esta página.");
  } finally { e.target.value = ""; }
});
document.getElementById("resetAll").addEventListener("click", () => {
  if (!confirm("Esto borrará todos los participantes y puntajes guardados en este navegador. ¿Querés continuar?")) return;
  state = defaultState(); selectedId = "";
  saveState();
});
renderAll();
