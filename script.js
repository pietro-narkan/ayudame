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
const fireworksCanvas = document.getElementById("fireworksCanvas");
const fireworksMessage = document.getElementById("fireworksMessage");
const audioNote = document.getElementById("audioNote");
const championsAudio = document.getElementById("championsAudio");

const assetsFolderPath = "assets/";
const defaultTrackPath = championsAudio?.querySelector("source")?.getAttribute("src") || "";

const panels = [splash, invite, accepted];

const dodgeLines = [
  "Uy... ese No trae rueditas.",
  "No se deja tocar ni por casualidad.",
  "Modo escurridizo activado.",
  "Ese boton esta en cardio full time.",
  "Tranqui, el Si esta quietito y feliz."
];

const confettiColors = ["#ff5a34", "#ffd454", "#31c8aa", "#1ea5ff", "#ff5c8a"];

const fireworksCtx = fireworksCanvas ? fireworksCanvas.getContext("2d") : null;
const rockets = [];
const sparks = [];

let dodgeCount = 0;
let fireworksFrameId = 0;
let fireworksWaveId = 0;
let fireworksStopId = 0;
let fireworksOn = false;
let messageHideId = 0;
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let audioTrackSelection = Promise.resolve();

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

  if (hint) {
    hint.hidden = false;
    hint.textContent = dodgeLines[(dodgeCount - 1) % dodgeLines.length];
  }

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

function showFireworksMessage() {
  if (!fireworksMessage) {
    return;
  }

  if (messageHideId) {
    clearTimeout(messageHideId);
    messageHideId = 0;
  }

  fireworksMessage.hidden = false;
  requestAnimationFrame(() => {
    fireworksMessage.classList.add("active");
  });
}

function hideFireworksMessage() {
  if (!fireworksMessage) {
    return;
  }

  fireworksMessage.classList.remove("active");

  if (messageHideId) {
    clearTimeout(messageHideId);
  }

  messageHideId = setTimeout(() => {
    fireworksMessage.hidden = true;
  }, 320);
}

function sizeFireworksCanvas() {
  if (!fireworksCanvas || !fireworksCtx) {
    return;
  }

  const ratio = Math.max(1, window.devicePixelRatio || 1);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  fireworksCanvas.width = Math.round(canvasWidth * ratio);
  fireworksCanvas.height = Math.round(canvasHeight * ratio);
  fireworksCanvas.style.width = `${canvasWidth}px`;
  fireworksCanvas.style.height = `${canvasHeight}px`;

  fireworksCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchRocket() {
  rockets.push({
    x: randomRange(canvasWidth * 0.08, canvasWidth * 0.92),
    y: canvasHeight + randomRange(12, 95),
    targetY: randomRange(canvasHeight * 0.12, canvasHeight * 0.55),
    speed: randomRange(6.8, 9.6),
    hue: randomRange(0, 360),
    trail: []
  });
}

function explode(x, y, baseHue) {
  const count = Math.floor(randomRange(50, 90));

  for (let index = 0; index < count; index += 1) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(1.6, 6.8);
    const life = randomRange(36, 68);

    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: randomRange(0.03, 0.06),
      drag: randomRange(0.965, 0.99),
      life,
      ttl: life,
      size: randomRange(1.2, 2.8),
      hue: (baseHue + randomRange(-30, 30) + 360) % 360
    });
  }
}

function drawFireworks() {
  if (!fireworksOn || !fireworksCtx) {
    return;
  }

  fireworksCtx.globalCompositeOperation = "source-over";
  fireworksCtx.fillStyle = "rgba(7, 10, 24, 0.22)";
  fireworksCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  fireworksCtx.globalCompositeOperation = "lighter";

  for (let index = rockets.length - 1; index >= 0; index -= 1) {
    const rocket = rockets[index];
    rocket.trail.push({ x: rocket.x, y: rocket.y });
    if (rocket.trail.length > 5) {
      rocket.trail.shift();
    }

    rocket.y -= rocket.speed;
    rocket.speed *= 0.994;

    fireworksCtx.strokeStyle = `hsl(${rocket.hue.toFixed(0)} 100% 64%)`;
    fireworksCtx.lineWidth = 2;
    fireworksCtx.beginPath();
    fireworksCtx.moveTo(rocket.x, rocket.y);

    rocket.trail.forEach((point) => {
      fireworksCtx.lineTo(point.x, point.y);
    });

    fireworksCtx.stroke();

    if (rocket.y <= rocket.targetY) {
      explode(rocket.x, rocket.y, rocket.hue);
      rockets.splice(index, 1);
    }
  }

  for (let index = sparks.length - 1; index >= 0; index -= 1) {
    const spark = sparks[index];
    spark.vx *= spark.drag;
    spark.vy *= spark.drag;
    spark.vy += spark.gravity;
    spark.x += spark.vx;
    spark.y += spark.vy;
    spark.life -= 1;

    if (spark.life <= 0) {
      sparks.splice(index, 1);
      continue;
    }

    const alpha = spark.life / spark.ttl;
    fireworksCtx.fillStyle = `hsla(${spark.hue.toFixed(0)} 100% 62% / ${alpha.toFixed(3)})`;
    fireworksCtx.beginPath();
    fireworksCtx.arc(spark.x, spark.y, Math.max(0.6, spark.size * alpha + 0.35), 0, Math.PI * 2);
    fireworksCtx.fill();
  }

  fireworksFrameId = requestAnimationFrame(drawFireworks);
}

function stopFireworksShow() {
  fireworksOn = false;

  if (fireworksWaveId) {
    clearInterval(fireworksWaveId);
    fireworksWaveId = 0;
  }

  if (fireworksStopId) {
    clearTimeout(fireworksStopId);
    fireworksStopId = 0;
  }

  if (fireworksFrameId) {
    cancelAnimationFrame(fireworksFrameId);
    fireworksFrameId = 0;
  }

  rockets.length = 0;
  sparks.length = 0;

  if (fireworksCtx) {
    fireworksCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  }

  if (fireworksCanvas) {
    fireworksCanvas.classList.remove("active");
  }

  hideFireworksMessage();
}

function startFireworksShow(durationMs = 13000) {
  if (!fireworksCanvas || !fireworksCtx) {
    return;
  }

  stopFireworksShow();
  sizeFireworksCanvas();
  fireworksOn = true;
  fireworksCanvas.classList.add("active");
  showFireworksMessage();

  for (let wave = 0; wave < 5; wave += 1) {
    setTimeout(() => {
      if (fireworksOn) {
        launchRocket();
      }
    }, wave * 170);
  }

  fireworksWaveId = setInterval(() => {
    const rocketsInWave = Math.random() > 0.48 ? 2 : 1;

    for (let wave = 0; wave < rocketsInWave; wave += 1) {
      setTimeout(() => {
        if (fireworksOn) {
          launchRocket();
        }
      }, wave * 120);
    }
  }, 320);

  fireworksStopId = setTimeout(() => {
    stopFireworksShow();
  }, durationMs);

  drawFireworks();
}

function setAudioTrack(trackPath) {
  if (!championsAudio) {
    return;
  }

  const nextTrack = new URL(trackPath, window.location.href).href;
  const currentTrack = championsAudio.currentSrc || championsAudio.src;

  if (currentTrack === nextTrack) {
    return;
  }

  championsAudio.src = nextTrack;
  championsAudio.load();
}

function getTrackFileName(trackPath) {
  const withoutHash = trackPath.split("#")[0];
  const withoutQuery = withoutHash.split("?")[0];
  const segments = withoutQuery.split("/");
  const encodedName = segments[segments.length - 1] || "";

  try {
    return decodeURIComponent(encodedName).toLowerCase();
  } catch {
    return encodedName.toLowerCase();
  }
}

function parseMp3TracksFromListing(listingHtml, listingUrl) {
  const documentFragment = new DOMParser().parseFromString(listingHtml, "text/html");
  const trackUrls = [];
  const seen = new Set();

  documentFragment.querySelectorAll("a[href]").forEach((anchor) => {
    const href = anchor.getAttribute("href");

    if (!href) {
      return;
    }

    let candidateUrl;

    try {
      candidateUrl = new URL(href, listingUrl);
    } catch {
      return;
    }

    if (!candidateUrl.pathname.toLowerCase().endsWith(".mp3")) {
      return;
    }

    if (seen.has(candidateUrl.href)) {
      return;
    }

    seen.add(candidateUrl.href);
    trackUrls.push(candidateUrl);
  });

  return trackUrls;
}

function pickPreferredTrack(trackUrls) {
  if (!trackUrls.length) {
    return null;
  }

  const sortedTracks = [...trackUrls].sort((left, right) =>
    left.pathname.localeCompare(right.pathname, "es", { sensitivity: "base" })
  );

  const fallbackTrackName = getTrackFileName(defaultTrackPath);
  const customTrack = sortedTracks.find(
    (track) => getTrackFileName(track.pathname) !== fallbackTrackName
  );

  return customTrack || sortedTracks[0];
}

async function requestAssetsListing() {
  try {
    const response = await fetch(assetsFolderPath, { cache: "no-store" });

    if (response.ok) {
      return {
        listingHtml: await response.text(),
        listingUrl: response.url || window.location.href
      };
    }
  } catch {
    // Continue with XHR fallback.
  }

  return new Promise((resolve) => {
    try {
      const request = new XMLHttpRequest();
      request.open("GET", assetsFolderPath, true);

      request.onload = () => {
        const hasValidHttpStatus = request.status >= 200 && request.status < 400;
        const hasLocalFileResponse = request.status === 0 && !!request.responseText;

        if (hasValidHttpStatus || hasLocalFileResponse) {
          resolve({
            listingHtml: request.responseText,
            listingUrl: request.responseURL || window.location.href
          });
          return;
        }

        resolve(null);
      };

      request.onerror = () => resolve(null);
      request.send();
    } catch {
      resolve(null);
    }
  });
}

async function selectTrackFromAssets() {
  if (!championsAudio) {
    return;
  }

  try {
    const listing = await requestAssetsListing();

    if (!listing) {
      return;
    }

    const trackUrls = parseMp3TracksFromListing(listing.listingHtml, listing.listingUrl);
    const preferredTrack = pickPreferredTrack(trackUrls);

    if (preferredTrack) {
      setAudioTrack(preferredTrack.href);
    }
  } catch {
    // Keep default track when the server does not expose directory listings.
  }
}

function initializeAudioTrack() {
  if (!championsAudio) {
    return;
  }

  if (defaultTrackPath) {
    setAudioTrack(defaultTrackPath);
  }

  audioTrackSelection = selectTrackFromAssets();
}

async function playChampions() {
  if (!championsAudio) {
    return;
  }

  if (audioNote) {
    audioNote.hidden = true;
  }

  championsAudio.currentTime = 0;
  try {
    await championsAudio.play();
    return;
  } catch {
    // Try one more time after track detection finishes.
  }

  try {
    await audioTrackSelection;
    championsAudio.currentTime = 0;
    await championsAudio.play();
    return;
  } catch {
    // Keep note visible below.
  }

  if (audioNote) {
    audioNote.hidden = false;
  }
}

function stopChampions() {
  if (!championsAudio) {
    return;
  }

  championsAudio.pause();
  championsAudio.currentTime = 0;
}

function resetInvite() {
  dodgeCount = 0;

  if (hint) {
    hint.hidden = true;
    hint.textContent = "";
  }

  noBtn.style.removeProperty("left");
  noBtn.style.removeProperty("top");

  if (audioNote) {
    audioNote.hidden = true;
  }
}

startBtn.addEventListener("click", () => {
  stopFireworksShow();
  stopChampions();
  setPanel(invite);
  burstConfetti(55);
  requestAnimationFrame(moveNoButton);
});

yesBtn.addEventListener("click", () => {
  setPanel(accepted);
  burstConfetti(220);
  startFireworksShow();
  void playChampions();
});

replayBtn.addEventListener("click", () => {
  stopFireworksShow();
  stopChampions();
  resetInvite();
  setPanel(splash);
});

["pointerenter", "pointerdown", "click", "focus"].forEach((eventName) => {
  noBtn.addEventListener(eventName, dodge);
});

window.addEventListener("resize", () => {
  sizeFireworksCanvas();

  if (invite.classList.contains("panel-active")) {
    moveNoButton();
  }
});

if (championsAudio) {
  championsAudio.addEventListener("error", () => {
    if (audioNote) {
      audioNote.hidden = false;
    }

    audioTrackSelection = selectTrackFromAssets();
  });
}

initializeAudioTrack();
sizeFireworksCanvas();
