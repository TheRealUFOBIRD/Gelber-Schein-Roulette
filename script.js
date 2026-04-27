const outcomes = [
  {
    word: "KRANK",
    rarity: "Legendaer",
    chance: 12,
    color: "#ffd54a",
    glow: "rgba(255, 213, 74, 0.6)",
    tint: "rgba(255, 213, 74, 0.24)",
    edge: "rgba(255, 232, 167, 0.3)",
    icon: "?",
  },
  {
    word: "HOME OFFICE",
    rarity: "Selten",
    chance: 33,
    color: "#ff4fa7",
    glow: "rgba(255, 79, 167, 0.55)",
    tint: "rgba(255, 79, 167, 0.24)",
    edge: "rgba(255, 189, 221, 0.3)",
    icon: "x",
  },
  {
    word: "ARBEITEN",
    rarity: "Ungewoehnlich",
    chance: 55,
    color: "#8d5bff",
    glow: "rgba(141, 91, 255, 0.56)",
    tint: "rgba(141, 91, 255, 0.24)",
    edge: "rgba(207, 189, 255, 0.3)",
    icon: "!",
  },
];

const openButton = document.getElementById("openButton");
const reelTrack = document.getElementById("reelTrack");
const reelViewport = document.getElementById("reelViewport");
const centerLine = document.querySelector(".center-line");
const roulettePanel = document.querySelector(".roulette-panel");

const TOTAL_CARDS = 56;
const WINNING_INDEX = 42;
const SPIN_DURATION_MS = 6200;

let spinning = false;
let currentResult = null;
let spinTimeoutId = null;
let revealedCard = null;
let buttonAnimationTimeoutId = null;
let spinRunId = 0;
let rerollEffectTimeoutId = null;
let krankCelebrationTimeoutId = null;

function weightedPick() {
  const totalWeight = outcomes.reduce((sum, item) => sum + item.chance, 0);
  const roll = Math.random() * totalWeight;
  let cursor = 0;

  for (const item of outcomes) {
    cursor += item.chance;
    if (roll <= cursor) {
      return item;
    }
  }

  return outcomes[outcomes.length - 1];
}

function createCard(item, isWinningCard = false) {
  return `
    <article
      class="reel-card${isWinningCard ? " is-winning" : ""}"
      style="--rarity-color:${item.color}; --rarity-glow:${item.glow}; --rarity-tint:${item.tint}; --rarity-edge:${item.edge}"
    >
      <h2 class="card-word">${item.word}</h2>
    </article>
  `;
}

function buildSpinSequence(result) {
  const sequence = [];

  for (let index = 0; index < TOTAL_CARDS; index += 1) {
    if (index === WINNING_INDEX) {
      sequence.push(result);
      continue;
    }

    sequence.push(weightedPick());
  }

  return sequence;
}

function renderIdleStrip() {
  const idleSequence = Array.from({ length: 14 }, () => weightedPick());

  reelTrack.innerHTML = idleSequence.map((item) => createCard(item)).join("");
  reelTrack.style.transition = "none";

  const middleIndex = Math.floor(idleSequence.length / 2) - 1;
  const middleCard = reelTrack.children[middleIndex];
  const offset =
    reelViewport.clientWidth / 2 - (middleCard.offsetLeft + middleCard.offsetWidth / 2);

  reelTrack.style.transform = `translate3d(${offset}px, 0, 0)`;
}

function clearKrankCelebration() {
  if (krankCelebrationTimeoutId) {
    window.clearTimeout(krankCelebrationTimeoutId);
    krankCelebrationTimeoutId = null;
  }

  document.body.classList.remove("is-krank-celebrating");
}

function triggerKrankCelebration() {
  clearKrankCelebration();
  document.body.classList.add("is-krank-celebrating");

  krankCelebrationTimeoutId = window.setTimeout(() => {
    document.body.classList.remove("is-krank-celebrating");
    krankCelebrationTimeoutId = null;
  }, 2400);
}

function resetSpinState() {
  if (spinTimeoutId) {
    window.clearTimeout(spinTimeoutId);
    spinTimeoutId = null;
  }

  if (revealedCard) {
    revealedCard.classList.remove("is-revealed");
    revealedCard = null;
  }

  clearKrankCelebration();
  centerLine.classList.add("is-hidden");
  reelTrack.classList.remove("is-fast-spinning");
  reelTrack.style.transition = "none";
  reelTrack.style.transform = "translate3d(0, 0, 0)";
}

function triggerRerollEffect() {
  if (rerollEffectTimeoutId) {
    window.clearTimeout(rerollEffectTimeoutId);
  }

  roulettePanel.classList.remove("is-rerolling");
  void roulettePanel.offsetWidth;
  roulettePanel.classList.add("is-rerolling");

  rerollEffectTimeoutId = window.setTimeout(() => {
    roulettePanel.classList.remove("is-rerolling");
    rerollEffectTimeoutId = null;
  }, 560);
}

function startSpin() {
  spinRunId += 1;
  const currentSpinRunId = spinRunId;
  spinning = true;

  if (buttonAnimationTimeoutId) {
    window.clearTimeout(buttonAnimationTimeoutId);
  }

  openButton.classList.remove("is-spinning");
  void openButton.offsetWidth;
  openButton.classList.add("is-spinning");
  buttonAnimationTimeoutId = window.setTimeout(() => {
    openButton.classList.remove("is-spinning");
    buttonAnimationTimeoutId = null;
  }, 520);

  triggerRerollEffect();
  resetSpinState();
  centerLine.classList.remove("is-hidden");

  currentResult = weightedPick();
  const sequence = buildSpinSequence(currentResult);

  reelTrack.innerHTML = sequence
    .map((item, index) => createCard(item, index === WINNING_INDEX))
    .join("");

  const winningCard = reelTrack.children[WINNING_INDEX];
  const targetOffset =
    reelViewport.clientWidth / 2 - (winningCard.offsetLeft + winningCard.offsetWidth / 2);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (currentSpinRunId !== spinRunId) {
        return;
      }

      reelTrack.classList.remove("is-fast-spinning");
      void reelTrack.offsetWidth;
      reelTrack.classList.add("is-fast-spinning");
      reelTrack.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.7, 0.14, 1)`;
      reelTrack.style.transform = `translate3d(${targetOffset}px, 0, 0)`;
    });
  });

  spinTimeoutId = window.setTimeout(() => {
    if (currentSpinRunId !== spinRunId) {
      return;
    }

    spinning = false;
    revealedCard = winningCard;
    revealedCard.classList.add("is-revealed");
    centerLine.classList.add("is-hidden");

    if (currentResult.word === "KRANK") {
      triggerKrankCelebration();
    }
  }, SPIN_DURATION_MS + 120);
}

window.requestAnimationFrame(renderIdleStrip);
openButton.addEventListener("click", startSpin);
window.addEventListener("resize", () => {
  if (!spinning && !revealedCard) {
    renderIdleStrip();
  }
});
