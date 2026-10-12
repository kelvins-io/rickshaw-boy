/**
 * 拉车配音：浏览器中文语音合成（SpeechSynthesis）
 */

const LINES = {
  start: [
    "得儿驾，客人坐稳了。",
    "走啊，这趟一定到。",
    "哎，拉稳了！",
  ],
  push: [
    "嘿哟！",
    "加把劲！",
    "前面让一让！",
  ],
  hit: [
    "当心！",
    "哎哟！",
    "路真难走。",
  ],
  success: [
    "到了，谢您赏钱。",
    "这一程算跑下来了。",
    "铃一响，心里就踏实。",
  ],
  fail: [
    "这腿……跑不动了。",
    "先歇口气吧。",
    "今天的风太大了。",
  ],
};

let preferredVoice = null;
let lastSpeakAt = 0;
let unlocked = false;

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function resolveVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  preferredVoice =
    voices.find((v) => /zh[-_]?CN/i.test(v.lang) && /male|男|Yunxi|Yunyang|Kangkang|Xiaoyu/i.test(v.name)) ||
    voices.find((v) => /zh[-_]?CN/i.test(v.lang)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    null;
  return preferredVoice;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    resolveVoice();
  });
  resolveVoice();
}

/** 用户手势后调用一次，解锁部分浏览器的语音策略 */
export function unlockVoice() {
  if (unlocked || !window.speechSynthesis) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
  resolveVoice();
}

export function stopVoice() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

/**
 * @param {keyof typeof LINES} kind
 * @param {{ force?: boolean, rate?: number, pitch?: number }} [opts]
 */
export function speak(kind, opts = {}) {
  if (!window.speechSynthesis) return;
  const lines = LINES[kind];
  if (!lines) return;

  const now = performance.now();
  if (!opts.force && now - lastSpeakAt < 2200) return;
  lastSpeakAt = now;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(pick(lines));
  const voice = preferredVoice || resolveVoice();
  if (voice) u.voice = voice;
  u.lang = "zh-CN";
  u.rate = opts.rate ?? 1.05;
  u.pitch = opts.pitch ?? 0.95;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

export function speakPullEvent(event) {
  if (event === "start") speak("start", { force: true, rate: 1.02 });
  else if (event === "push") speak("push", { rate: 1.15, pitch: 1 });
  else if (event === "hit") speak("hit", { force: true, rate: 1.1 });
  else if (event === "success") speak("success", { force: true, rate: 0.98 });
  else if (event === "fail") speak("fail", { force: true, rate: 0.92, pitch: 0.85 });
}
