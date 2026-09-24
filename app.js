// 99 Fléchettes — connexion directe au WebSocket local d'Autodarts.
// Aucun bridge / Node.js / extension n'est nécessaire.
// Le Board Manager Autodarts écoute normalement sur le port 3180.

const WS_URLS = [
  "ws://127.0.0.1:3180/api/events?type=state",
  "ws://localhost:3180/api/events?type=state"
];

const state = {
  target: null,
  darts: 0,
  score: 0,
  singles: 0,
  doubles: 0,
  triples: 0,
  misses: 0,
  running: false,
  connected: false,
  socket: null,
  urlIndex: 0,
  lastNumThrows: null,
  lastSignature: null
};

const $ = id => document.getElementById(id);

function buildTargets() {
  const box = $("targets");
  for (let n = 1; n <= 20; n++) {
    const b = document.createElement("button");
    b.className = "target";
    b.textContent = n;
    b.dataset.target = n;
    b.onclick = () => selectTarget(n);
    box.appendChild(b);
  }

  const bull = document.createElement("button");
  bull.className = "target bull";
  bull.textContent = "🎯 BULL";
  bull.dataset.target = 25;
  bull.onclick = () => selectTarget(25);
  box.appendChild(bull);
}

function selectTarget(n) {
  state.target = n;
  document.querySelectorAll(".target").forEach(b => {
    b.classList.toggle("selected", Number(b.dataset.target) === n);
  });
  $("startBtn").disabled = !state.connected;
  $("setupMessage").textContent = state.connected
    ? "Cible sélectionnée. Tu peux commencer."
    : "Autodarts n'est pas connecté.";
}

function setConnection(kind, text) {
  const el = $("connection");
  el.className = "connection " + kind;
  el.textContent = "● " + text;
}

function connect() {
  if (state.socket) {
    try { state.socket.close(); } catch (_) {}
  }

  setConnection("connecting", "Connexion à Autodarts…");

  const url = WS_URLS[state.urlIndex];
  console.log("Connexion WebSocket :", url);

  const ws = new WebSocket(url);
  state.socket = ws;

  ws.onopen = () => {
    state.connected = true;
    state.lastNumThrows = null;
    state.lastSignature = null;
    setConnection("online", "Autodarts connecté");
    $("startBtn").disabled = state.target === null;
    if (!state.running) {
      $("setupMessage").textContent =
        "Autodarts détecté. Choisis une cible puis commence.";
    }
  };

  ws.onmessage = event => {
    try {
      const msg = JSON.parse(event.data);
      handleAutodartsMessage(msg);
    } catch (err) {
      console.warn("Message Autodarts non JSON :", err);
    }
  };

  ws.onerror = () => {
    console.warn("WebSocket Autodarts en erreur");
  };

  ws.onclose = () => {
    state.connected = false;
    setConnection("offline", "Autodarts non connecté");
    $("startBtn").disabled = true;

    // Essaye l'autre nom local puis recommence.
    state.urlIndex = (state.urlIndex + 1) % WS_URLS.length;
    if (!state.running) {
      $("setupMessage").textContent =
        "Autodarts non détecté. Vérifie que le Board Manager est ouvert sur ce PC.";
    }
    setTimeout(connect, 2500);
  };
}

function handleAutodartsMessage(msg) {
  // Format local Autodarts :
  // { type: "state", data: { event: "Throw detected", numThrows, throws: [...] } }
  if (msg?.type !== "state" || !msg.data) return;

  const data = msg.data;
  if (data.event !== "Throw detected") return;
  if (!Array.isArray(data.throws) || data.throws.length === 0) return;

  const numThrows = Number(data.numThrows ?? 0);
  const segment = data.throws[data.throws.length - 1]?.segment;
  if (!segment) return;

  const number = Number(segment.number ?? 0);
  const multiplier = Number(segment.multiplier ?? 0);
  const name = segment.name || "MISS";
  const bed = segment.bed || "Outside";

  // Le même état peut être envoyé plusieurs fois par Autodarts.
  const signature = `${numThrows}|${name}|${number}|${multiplier}|${bed}`;
  if (numThrows === state.lastNumThrows || signature === state.lastSignature) return;

  state.lastNumThrows = numThrows;
  state.lastSignature = signature;

  if (!state.running || state.darts >= 99) return;

  const isBull = state.target === 25;
  const hitTarget = isBull ? number === 25 : number === state.target;
  const points = hitTarget ? multiplier : 0;

  state.darts++;
  state.score += points;

  if (hitTarget && multiplier === 1) state.singles++;
  else if (hitTarget && multiplier === 2) state.doubles++;
  else if (hitTarget && multiplier === 3) state.triples++;
  else state.misses++;

  addThrow(name, hitTarget, points);
  updateUI();

  if (state.darts >= 99) finishGame();
}

function addThrow(name, good, points) {
  const row = document.createElement("div");
  row.className = "throw " + (good ? "good" : "zero");
  row.innerHTML = `
    <div>
      <div class="throw-name">${escapeHtml(name)}</div>
      <div class="throw-detail">${good ? "Bonne cible" : "Autre cible / 0 point"}</div>
    </div>
    <div class="throw-points">${points > 0 ? "+" + points : "+0"}</div>
  `;
  $("throws").prepend(row);
  while ($("throws").children.length > 30) $("throws").lastChild.remove();
}

function updateUI() {
  $("score").textContent = state.score;
  $("dartCount").textContent = state.darts;
  const pct = Math.round((state.darts / 99) * 100);
  $("percent").textContent = pct + "%";
  $("progressBar").style.width = pct + "%";
  $("singleCount").textContent = state.singles;
  $("doubleCount").textContent = state.doubles;
  $("tripleCount").textContent = state.triples;
  $("missCount").textContent = state.misses;
  $("liveState").textContent = state.darts >= 99 ? "TERMINÉ" : "EN DIRECT";
}

function startGame() {
  if (!state.connected || state.target === null) return;

  state.darts = 0;
  state.score = 0;
  state.singles = 0;
  state.doubles = 0;
  state.triples = 0;
  state.misses = 0;
  state.running = true;

  // On mémorise le dernier compteur avant le départ pour éviter
  // de compter un ancien lancer présent dans l'état Autodarts.
  state.lastNumThrows = null;
  state.lastSignature = null;

  $("throws").innerHTML = "";
  $("targetName").textContent = state.target === 25 ? "BULL" : state.target;
  $("setup").classList.add("hidden");
  $("finish").classList.add("hidden");
  $("game").classList.remove("hidden");
  updateUI();
}

function finishGame() {
  state.running = false;
  $("finalScore").textContent = state.score;
  $("finalTarget").textContent =
    "Cible : " + (state.target === 25 ? "BULL" : state.target);
  $("game").classList.add("hidden");
  $("finish").classList.remove("hidden");
}

function resetToSetup() {
  state.running = false;
  $("game").classList.add("hidden");
  $("finish").classList.add("hidden");
  $("setup").classList.remove("hidden");
  $("startBtn").disabled = !state.connected || state.target === null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

$("startBtn").onclick = startGame;
$("againBtn").onclick = resetToSetup;
$("resetBtn").onclick = resetToSetup;

buildTargets();
connect();
