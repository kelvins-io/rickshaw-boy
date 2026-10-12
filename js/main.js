import {
  createState,
  applyDelta,
  saveState,
  loadState,
  clearSave,
  hasSave,
  STAT_MAX,
} from "./state.js";
import { getNode, resolveBody } from "./story.js";
import { resolveEnding, formatEndingStats } from "./endings.js";
import { createPullGame } from "./minigame.js";
import { unlockVoice, stopVoice } from "./voice.js";

const $ = (sel) => document.querySelector(sel);

const els = {
  hud: $("#hud"),
  valMoney: $("#val-money"),
  valStamina: $("#val-stamina"),
  valDignity: $("#val-dignity"),
  barMoney: $("#bar-money"),
  barStamina: $("#bar-stamina"),
  barDignity: $("#bar-dignity"),
  intro: $("#screen-intro"),
  story: $("#screen-story"),
  game: $("#screen-game"),
  ending: $("#screen-ending"),
  chapter: $("#story-chapter"),
  title: $("#story-title"),
  body: $("#story-body"),
  choices: $("#story-choices"),
  btnStart: $("#btn-start"),
  btnContinue: $("#btn-continue"),
  btnRestart: $("#btn-restart"),
  gameOverlay: $("#game-overlay"),
  gameBrief: $("#game-brief"),
  btnGameStart: $("#btn-game-start"),
  canvas: $("#pull-canvas"),
  gameDist: $("#game-dist"),
  gameEarn: $("#game-earn"),
  endingLabel: $("#ending-label"),
  endingTitle: $("#ending-title"),
  endingBody: $("#ending-body"),
  endingStats: $("#ending-stats"),
};

let state = createState();
let activeGame = null;
let pendingMinigame = null;

function showScreen(name) {
  const map = {
    intro: els.intro,
    story: els.story,
    game: els.game,
    ending: els.ending,
  };
  Object.entries(map).forEach(([key, el]) => {
    const on = key === name;
    el.classList.toggle("hidden", !on);
    el.classList.toggle("is-active", on);
    el.setAttribute("aria-hidden", on ? "false" : "true");
  });
  const showHud = name === "story" || name === "game";
  els.hud.classList.toggle("hidden", !showHud);
  els.hud.setAttribute("aria-hidden", showHud ? "false" : "true");
}

function renderHud() {
  const set = (bar, val, key) => {
    const max = STAT_MAX[key];
    const n = state[key];
    val.textContent = String(Math.round(n));
    bar.style.width = `${Math.round((n / max) * 100)}%`;
  };
  set(els.barMoney, els.valMoney, "money");
  set(els.barStamina, els.valStamina, "stamina");
  set(els.barDignity, els.valDignity, "dignity");
}

function toast(msg) {
  if (!msg) return;
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.style.cssText =
      "position:fixed;left:50%;bottom:2rem;transform:translateX(-50%);z-index:50;background:rgba(26,23,20,.92);color:#e8dfd0;padding:.7rem 1.1rem;font-size:.85rem;letter-spacing:.06em;border:1px solid rgba(232,160,74,.35);max-width:90vw;text-align:center;pointer-events:none;opacity:0;transition:opacity .25s";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  requestAnimationFrame(() => {
    el.style.opacity = "1";
  });
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.style.opacity = "0";
  }, 2600);
}

function goToNode(nodeId) {
  if (nodeId === "__ENDING__") {
    showEnding();
    return;
  }
  const node = getNode(nodeId);
  if (!node) {
    console.error("missing node", nodeId);
    showEnding();
    return;
  }
  state = applyDelta(state, { nodeId });
  saveState(state);
  renderHud();

  if (node.minigame) {
    pendingMinigame = node;
    prepareMinigame(node);
    return;
  }

  renderStory(node);
}

function renderStory(node) {
  showScreen("story");
  els.chapter.textContent = node.chapter || "";
  els.title.textContent = node.title || "";
  const paragraphs = resolveBody(node, state);
  els.body.innerHTML = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("");

  els.choices.innerHTML = "";
  (node.choices || []).forEach((choice) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-choice";
    const blocked = typeof choice.require === "function" && !choice.require(state);
    btn.disabled = blocked;
    btn.innerHTML = `${escapeHtml(choice.text)}<span class="choice-effect">${escapeHtml(
      blocked && choice.requireHint ? choice.requireHint : choice.effect || ""
    )}</span>`;
    btn.addEventListener("click", () => {
      if (blocked) return;
      state = applyDelta(state, choice.delta || {});
      renderHud();
      saveState(state);
      const next =
        typeof choice.next === "function" ? choice.next(state) : choice.next;
      goToNode(next);
    });
    els.choices.appendChild(btn);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prepareMinigame(node) {
  showScreen("game");
  const mg = node.minigame;
  els.gameBrief.textContent = mg.brief || "按住加速，躲开障碍。";
  els.gameOverlay.classList.remove("hidden");
  els.gameDist.textContent = "路程 0%";
  els.gameEarn.textContent = "本局 +0";
  if (activeGame) {
    activeGame.destroy();
    activeGame = null;
  }

  els.btnGameStart.onclick = async () => {
    unlockVoice();
    els.gameOverlay.classList.add("hidden");
    await runMinigameRounds(node);
  };
}

async function runMinigameRounds(node) {
  const mg = node.minigame;
  const rounds = mg.rounds || 1;
  const results = [];
  let stam = state.stamina;

  for (let i = 0; i < rounds; i++) {
    if (rounds > 1 && i > 0) {
      els.gameOverlay.classList.remove("hidden");
      els.gameBrief.textContent = `第 ${i + 1}/${rounds} 程，准备好了再上。`;
      await waitClick(els.btnGameStart);
      els.gameOverlay.classList.add("hidden");
    }

    if (activeGame) activeGame.destroy();
    activeGame = createPullGame(els.canvas, {
      difficulty: mg.difficulty || 1,
      stamina: stam,
      onFrame: ({ distance, earnPreview, stamina }) => {
        els.gameDist.textContent = `路程 ${Math.round(distance * 100)}%`;
        els.gameEarn.textContent = `预估 +${earnPreview}`;
        els.valStamina.textContent = String(Math.round(stamina));
        els.barStamina.style.width = `${Math.round((stamina / STAT_MAX.stamina) * 100)}%`;
      },
    });

    const result = await activeGame.start();
    results.push(result);
    stam = Math.max(0, Math.min(STAT_MAX.stamina, result.staminaLeft));
    state = { ...state, stamina: stam, flags: { ...state.flags } };
    renderHud();

    if (stam <= 0) break;
  }

  if (activeGame) {
    activeGame.destroy();
    activeGame = null;
  }

  const outcome = mg.after(state, results);
  state = applyDelta(state, outcome.delta || {});
  state = applyDelta(state, {
    pullSessionsDone: (state.pullSessionsDone || 0) + results.length,
  });
  renderHud();
  saveState(state);
  toast(outcome.toast);
  pendingMinigame = null;
  goToNode(outcome.next);
}

function waitClick(btn) {
  return new Promise((resolve) => {
    const handler = () => {
      btn.removeEventListener("click", handler);
      resolve();
    };
    btn.addEventListener("click", handler);
  });
}

function showEnding() {
  stopVoice();
  const ending = resolveEnding(state);
  showScreen("ending");
  els.endingLabel.textContent = ending.label;
  els.endingTitle.textContent = ending.title;
  els.endingBody.innerHTML = ending.paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  els.endingStats.innerHTML = formatEndingStats(state)
    .map((s) => `<span>${escapeHtml(s)}</span>`)
    .join("");
  clearSave();
}

function startNew() {
  state = createState();
  clearSave();
  renderHud();
  goToNode("n1_enter");
}

function continueGame() {
  const saved = loadState();
  if (!saved) {
    startNew();
    return;
  }
  state = saved;
  renderHud();
  goToNode(state.nodeId);
}

function init() {
  els.btnContinue.disabled = !hasSave();
  els.btnStart.addEventListener("click", startNew);
  els.btnContinue.addEventListener("click", continueGame);
  els.btnRestart.addEventListener("click", () => {
    clearSave();
    showScreen("intro");
    els.btnContinue.disabled = true;
  });
  showScreen("intro");
}

init();
