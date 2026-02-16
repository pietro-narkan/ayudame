const splash = document.getElementById("splash");
const invite = document.getElementById("invite");
const accepted = document.getElementById("accepted");
const startBtn = document.getElementById("startBtn");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");
const replayBtn = document.getElementById("replayBtn");
const hint = document.getElementById("hint");
const choices = document.getElementById("choices");
const confettiLayer = document.getElementById("confettiLayer");

const panels = [splash, invite, accepted];

const dodgeLines = [
  "Uy... ese No trae rueditas.",
  "No se deja tocar ni por casualidad.",
  "Modo escurridizo activado.",
  "Ese boton esta en cardio full time.",
  "Tranqui, el Si esta quietito y feliz."
];

const confettiColors = ["#ff5a34", "#ffd454", "#31c8aa", "#1ea5ff", "#ff5c8a"];

let dodgeCount = 0;

function setPanel(nextPanel) {
  panels.forEach((panel) => {
    const isActive = panel === nextPanel;
    panel.classList.toggle("panel-active", isActive);
    panel.classList.toggle("panel-hidden", !isActive);
  });
}

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function moveNoButton() {
  const maxX = Math.max(8, choices.clientWidth - noBtn.offsetWidth - 8);
  const maxY = Math.max(8, choices.clientHeight - noBtn.offsetHeight - 8);
  const nextX = Math.round(randomRange(8, maxX));
  const nextY = Math.round(randomRange(8, maxY));
  noBtn.style.left = `${nextX}px`;
  noBtn.style.top = `${nextY}px`;
}

function dodge(event) {
  if (event) {
    event.preventDefault();
  }

  dodgeCount += 1;
  hint.textContent = dodgeLines[(dodgeCount - 1) % dodgeLines.length];
  moveNoButton();
}

function burstConfetti(amount) {
  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    const isRound = Math.random() > 0.72;
    const duration = randomRange(1.8, 3.4);
    const delay = randomRange(0, 0.28);
    const drift = `${randomRange(-20, 20).toFixed(1)}vw`;

    piece.className = isRound ? "confetti round" : "confetti";
    piece.style.left = `${randomRange(0, 100).toFixed(2)}vw`;
    piece.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    piece.style.animationDuration = `${duration.toFixed(2)}s`;
    piece.style.animationDelay = `${delay.toFixed(2)}s`;
    piece.style.setProperty("--x-end", drift);
    piece.style.transform = `translate3d(0, -20px, 0) rotate(${Math.round(randomRange(0, 180))}deg)`;

    confettiLayer.appendChild(piece);

    const removalDelay = Math.round((duration + delay + 0.4) * 1000);
    setTimeout(() => piece.remove(), removalDelay);
  }
}

function resetInvite() {
  dodgeCount = 0;
  hint.textContent = 'Tip: el boton "No" esta entrenando para ser ninja.';
  noBtn.style.left = "258px";
  noBtn.style.top = "108px";
}

startBtn.addEventListener("click", () => {
  setPanel(invite);
  burstConfetti(45);
  requestAnimationFrame(moveNoButton);
});

yesBtn.addEventListener("click", () => {
  setPanel(accepted);
  burstConfetti(170);
});

replayBtn.addEventListener("click", () => {
  resetInvite();
  setPanel(splash);
});

["pointerenter", "pointerdown", "click", "focus"].forEach((eventName) => {
  noBtn.addEventListener(eventName, dodge);
});

window.addEventListener("resize", () => {
  if (invite.classList.contains("panel-active")) {
    moveNoButton();
  }
});
