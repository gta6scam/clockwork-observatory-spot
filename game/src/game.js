// game.js — the state machine of The Clockwork Observatory.
//
// One night is three rounds. Each round paints two panels of the same room
// — the true one and its altered twin — and the player hunts the twelve
// differences between them against a countdown, with a purse of hints, a
// penalty for misclicks, and a counter of what remains that never leaves
// the top of the screen. This file owns that state and every rule; the
// painters own the pictures, and main.js owns the page.

import { ROUNDS, SCORE } from './rounds.js';
import { differencesOf } from './differences.js';
import {
  renderPanels, drawFoundMarker, drawHintPulse, drawMissMark, PANEL_WIDTH, PANEL_HEIGHT,
} from './scene-paint.js';
import * as audio from './audio.js';

const STATE = {
  START: 'start',
  INTRO: 'intro',
  PLAYING: 'playing',
  ROUND_CLEAR: 'round-clear',
  GAME_OVER: 'game-over',
  NIGHT_CLEAR: 'night-clear',
};

export class ObservatoryGame {
  constructor(dom) {
    this.dom = dom;
    this.leftCtx = dom.leftCanvas.getContext('2d');
    this.rightCtx = dom.rightCanvas.getContext('2d');
    this.state = STATE.START;
    this.score = 0;
    this.roundIndex = 0;
    this.totalClicks = 0;
    this.totalMisses = 0;
    this.totalSecondsUsed = 0;
    this.paused = false;
    this.keysDown = new Set();
    this.lens = { x: PANEL_WIDTH / 2, y: PANEL_HEIGHT / 2, active: false };
    this.lastTickSecond = -1;
    this.setupRound(0);
    this.bindInput();
    this.showStartScreen();
    this.lastFrameAt = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  // ——— Round setup ———

  setupRound(index) {
    const round = ROUNDS[index];
    this.round = round;
    const panels = renderPanels(round.phase, round.differences);
    this.sceneLeft = panels.left;
    this.sceneRight = panels.right;
    // Each difference arrives with the panel position of its 3D anchor.
    this.diffs = differencesOf(round.differences).map((diff) => {
      const anchor = panels.anchors.get(diff.id);
      return { ...diff, x: anchor.x, y: anchor.y };
    });
    this.foundAt = new Map(); // diff id -> performance timestamp of the find
    this.timeLeft = round.seconds;
    this.hintsLeft = round.hints;
    this.hintTarget = null;
    this.hintUntil = 0;
    this.missMarks = [];
    this.lastTickSecond = -1;
  }

  beginRound() {
    this.paused = false;
    this.state = STATE.PLAYING;
    this.hideOverlay();
    this.updateHud();
    audio.playClick();
  }

  get remaining() {
    return this.diffs.length - this.foundAt.size;
  }

  // ——— Input ———

  bindInput() {
    for (const [canvas, side] of [[this.dom.leftCanvas, 'left'], [this.dom.rightCanvas, 'right']]) {
      canvas.addEventListener('pointerdown', (event) => {
        audio.unlockAudio();
        if (this.state !== STATE.PLAYING || this.paused) return;
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * PANEL_WIDTH;
        const y = ((event.clientY - rect.top) / rect.height) * PANEL_HEIGHT;
        this.checkClick(x, y);
      });
    }
    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.keysDown.delete(event.key.toLowerCase()));
    this.dom.hintButton.addEventListener('click', () => { audio.unlockAudio(); this.useHint(); });
    this.dom.pauseButton.addEventListener('click', () => { audio.unlockAudio(); this.togglePause(); });
    this.dom.muteButton.addEventListener('click', () => {
      audio.unlockAudio();
      audio.setMuted(!audio.isMuted());
      this.dom.muteButton.textContent = audio.isMuted() ? 'Sound: off' : 'Sound: on';
    });
  }

  onKeyDown(event) {
    const key = event.key.toLowerCase();
    audio.unlockAudio();
    if (this.state === STATE.PLAYING) {
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) event.preventDefault();
      if (key.startsWith('arrow') || ['w', 'a', 's', 'd'].includes(key)) {
        this.keysDown.add(key);
        this.lens.active = true;
      } else if (key === 'enter' || key === ' ') {
        if (!this.paused && this.lens.active) this.checkClick(this.lens.x, this.lens.y);
      } else if (key === 'h') this.useHint();
      else if (key === 'p') this.togglePause();
      else if (key === 'm') this.dom.muteButton.click();
    } else if (key === 'enter') {
      const button = this.dom.overlay.querySelector('button');
      if (button) button.click();
    }
  }

  moveLens(dt) {
    if (!this.lens.active) return;
    const speed = 300 * dt;
    if (this.keysDown.has('arrowleft') || this.keysDown.has('a')) this.lens.x -= speed;
    if (this.keysDown.has('arrowright') || this.keysDown.has('d')) this.lens.x += speed;
    if (this.keysDown.has('arrowup') || this.keysDown.has('w')) this.lens.y -= speed;
    if (this.keysDown.has('arrowdown') || this.keysDown.has('s')) this.lens.y += speed;
    this.lens.x = Math.max(8, Math.min(PANEL_WIDTH - 8, this.lens.x));
    this.lens.y = Math.max(8, Math.min(PANEL_HEIGHT - 8, this.lens.y));
  }

  // ——— The hunt ———

  checkClick(x, y) {
    this.totalClicks++;
    let best = null;
    let bestDist = Infinity;
    for (const diff of this.diffs) {
      if (this.foundAt.has(diff.id)) continue;
      const dist = Math.hypot(x - diff.x, y - diff.y);
      if (dist <= diff.r + 6 && dist < bestDist) {
        best = diff;
        bestDist = dist;
      }
    }
    if (best) {
      this.foundAt.set(best.id, performance.now() / 1000);
      this.score += SCORE.find;
      this.hintTarget = null;
      audio.playFind();
      if (this.remaining === 0) {
        this.totalSecondsUsed += this.round.seconds - Math.max(0, Math.ceil(this.timeLeft));
        const bonus = Math.max(0, Math.ceil(this.timeLeft)) * SCORE.secondBonus;
        this.score += bonus;
        this.roundBonus = bonus;
        if (this.roundIndex === ROUNDS.length - 1) {
          this.state = STATE.NIGHT_CLEAR;
          audio.playNightClear();
          this.showNightClearScreen();
        } else {
          this.state = STATE.ROUND_CLEAR;
          audio.playRoundClear();
          this.showRoundClearScreen();
        }
      }
    } else {
      this.totalMisses++;
      this.score = Math.max(0, this.score - SCORE.missPoints);
      this.timeLeft = Math.max(0, this.timeLeft - SCORE.missSeconds);
      this.missMarks.push({ x, y, at: performance.now() / 1000 });
      audio.playMiss();
      if (this.timeLeft <= 0) this.timeRunsOut();
    }
    this.updateHud();
  }

  useHint() {
    if (this.state !== STATE.PLAYING || this.paused) return;
    if (this.hintsLeft <= 0) return;
    const unfound = this.diffs.filter((d) => !this.foundAt.has(d.id));
    if (unfound.length === 0) return;
    this.hintsLeft--;
    this.score = Math.max(0, this.score - SCORE.hintCost);
    this.hintTarget = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintUntil = performance.now() / 1000 + 2.6;
    audio.playHint();
    this.updateHud();
  }

  togglePause() {
    if (this.state !== STATE.PLAYING) return;
    this.paused = !this.paused;
    if (this.paused) this.showPauseScreen();
    else this.hideOverlay();
  }

  timeRunsOut() {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.GAME_OVER;
    audio.playGameOver();
    this.showGameOverScreen();
  }

  // ——— The frame loop ———

  frame(now) {
    const dt = Math.min(0.05, (now - this.lastFrameAt) / 1000);
    this.lastFrameAt = now;
    if (this.state === STATE.PLAYING && !this.paused) {
      this.timeLeft -= dt;
      this.moveLens(dt);
      const whole = Math.ceil(this.timeLeft);
      if (whole !== this.lastTickSecond) {
        this.lastTickSecond = whole;
        if (whole <= 10 && whole > 0) audio.playTick();
        this.updateHud();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.timeRunsOut();
      }
    }
    this.render(now / 1000);
    requestAnimationFrame((t) => this.frame(t));
  }

  render(nowSeconds) {
    for (const [ctx, scene] of [[this.leftCtx, this.sceneLeft], [this.rightCtx, this.sceneRight]]) {
      ctx.drawImage(scene, 0, 0);
      // Found markers rest on both panels alike.
      for (const diff of this.diffs) {
        const foundAt = this.foundAt.get(diff.id);
        if (foundAt === undefined) continue;
        const pop = Math.max(0, Math.min(1, (nowSeconds - foundAt) / 0.38));
        drawFoundMarker(ctx, diff.x, diff.y, Math.max(17, Math.min(46, diff.r + 9)), pop);
      }
      if (this.hintTarget && nowSeconds < this.hintUntil && !this.foundAt.has(this.hintTarget.id)) {
        drawHintPulse(ctx, this.hintTarget.x, this.hintTarget.y, this.hintTarget.r + 6, nowSeconds);
      }
      // The countdown presses on the frame itself as it runs out.
      if (this.state === STATE.PLAYING) {
        const frac = this.timeLeft / this.round.seconds;
        if (frac < 0.35) {
          const pulse = 0.75 + 0.25 * Math.sin(nowSeconds * 5);
          ctx.strokeStyle = `rgba(255,52,40,${(1 - frac / 0.35) * 0.55 * pulse})`;
          ctx.lineWidth = 10;
          ctx.strokeRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT);
        }
      }
      if (this.lens.active && this.state === STATE.PLAYING) this.drawLens(ctx);
    }
    this.missMarks = this.missMarks.filter((m) => nowSeconds - m.at < 0.9);
    for (const mark of this.missMarks) {
      drawMissMark(this.leftCtx, mark.x, mark.y, nowSeconds - mark.at);
      drawMissMark(this.rightCtx, mark.x, mark.y, nowSeconds - mark.at);
    }
  }

  drawLens(ctx) {
    const { x, y } = this.lens;
    ctx.save();
    ctx.strokeStyle = 'rgba(240,248,255,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x - 9, y);
    ctx.moveTo(x + 9, y);
    ctx.lineTo(x + 24, y);
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x, y - 9);
    ctx.moveTo(x, y + 9);
    ctx.lineTo(x, y + 24);
    ctx.stroke();
    ctx.restore();
  }

  // ——— The head-up display ———

  updateHud() {
    const dom = this.dom;
    dom.roundLabel.textContent = this.round.title;
    dom.leftCount.textContent = `${this.remaining} TO FIND`;
    dom.foundCount.textContent = `${this.foundAt.size} FOUND`;
    dom.scoreEl.textContent = `Score ${this.score}`;
    dom.hintCount.textContent = `Hints ${this.hintsLeft}`;
    dom.hintButton.disabled = this.hintsLeft <= 0 || this.state !== STATE.PLAYING;
    const total = Math.max(0, Math.ceil(this.timeLeft));
    dom.timerText.textContent = `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
    const frac = Math.max(0, this.timeLeft / this.round.seconds);
    dom.timerBar.style.width = `${frac * 100}%`;
    dom.timerBar.classList.toggle('danger', frac < 0.25);
    dom.timerText.classList.toggle('danger', frac < 0.25);
  }

  // ——— Screens ———

  showOverlay(html) {
    this.dom.overlay.innerHTML = `<div class="card">${html}</div>`;
    this.dom.overlay.classList.add('visible');
  }

  hideOverlay() {
    this.dom.overlay.classList.remove('visible');
    this.dom.overlay.innerHTML = '';
  }

  wireOverlayButton(id, action) {
    const button = this.dom.overlay.querySelector(`#${id}`);
    if (button) button.addEventListener('click', () => { audio.unlockAudio(); action(); });
  }

  showStartScreen() {
    this.state = STATE.START;
    this.showOverlay(`
      <p class="kicker">A spot-the-difference game in three lights</p>
      <h1>The Clockwork<br>Observatory</h1>
      <p class="story">Tonight the observatory has been visited by a meddler.
      Twelve things in the room are not as they should be — in the gears, the
      charts, the candles and the stars. The left panel shows the room as it
      truly is; the right, as the meddler left it.</p>
      <p class="how">Click a difference on either panel to mark it.
      Keys: arrows or WASD move the lens, Enter checks, H hints, P pauses.
      A misclick costs ${SCORE.missSeconds} seconds. Clear all three rounds
      before the candles gutter out.</p>
      <button id="ov-start" class="big">Begin the Evening</button>
    `);
    this.wireOverlayButton('ov-start', () => {
      this.score = 0;
      this.totalClicks = 0;
      this.totalMisses = 0;
      this.totalSecondsUsed = 0;
      this.roundIndex = 0;
      this.setupRound(0);
      this.showIntroScreen();
    });
    this.updateHud();
  }

  showIntroScreen() {
    this.state = STATE.INTRO;
    this.showOverlay(`
      <p class="kicker">${this.round.title}</p>
      <h2>${this.round.blurb}</h2>
      <p class="how">12 differences · ${Math.floor(this.round.seconds / 60)}:${String(this.round.seconds % 60).padStart(2, '0')} on the clock · ${this.round.hints} hints</p>
      <button id="ov-begin" class="big">Start Looking</button>
    `);
    this.wireOverlayButton('ov-begin', () => this.beginRound());
    this.updateHud();
  }

  showRoundClearScreen() {
    this.showOverlay(`
      <p class="kicker">${this.round.title} — cleared</p>
      <h2>Every difference found</h2>
      <p class="how">Time bonus +${this.roundBonus ?? 0} · Score ${this.score}</p>
      <button id="ov-next" class="big">On to ${ROUNDS[this.roundIndex + 1].title.split('—')[1].trim()}</button>
    `);
    this.wireOverlayButton('ov-next', () => {
      this.roundIndex++;
      this.setupRound(this.roundIndex);
      this.showIntroScreen();
    });
  }

  showGameOverScreen() {
    this.showOverlay(`
      <p class="kicker">The candles guttered out</p>
      <h2>Time, in ${this.round.title.split('—')[1].trim()}, has run out</h2>
      <p class="how">${this.remaining} difference${this.remaining === 1 ? '' : 's'} still hide in the room. Score ${this.score}.</p>
      <button id="ov-retry" class="big">Try This Round Again</button>
      <button id="ov-title" class="ghost">Back to the Start</button>
    `);
    this.wireOverlayButton('ov-retry', () => {
      this.setupRound(this.roundIndex);
      this.showIntroScreen();
    });
    this.wireOverlayButton('ov-title', () => this.showStartScreen());
  }

  showNightClearScreen() {
    const accuracy = this.totalClicks > 0
      ? Math.round(((this.totalClicks - this.totalMisses) / this.totalClicks) * 100)
      : 100;
    this.showOverlay(`
      <p class="kicker">Evening · Midnight · Eclipse</p>
      <h2>The Observatory Is Whole Again</h2>
      <p class="how">All 36 differences found across the three lights.<br>
      Final score <strong>${this.score}</strong> · Accuracy ${accuracy}% ·
      ${this.totalMisses} misclicks · ${this.totalSecondsUsed}s under the clock</p>
      <button id="ov-again" class="big">Play the Night Again</button>
    `);
    this.wireOverlayButton('ov-again', () => this.showStartScreen());
  }

  showPauseScreen() {
    this.showOverlay(`
      <p class="kicker">Paused</p>
      <h2>The hunt holds its breath</h2>
      <button id="ov-resume" class="big">Resume</button>
    `);
    this.wireOverlayButton('ov-resume', () => this.togglePause());
  }

  // ——— Staging for the maker's screenshots ———
  // These place the game into real, reachable states (a round mid-hunt with
  // some differences found, the end of the night) so the screenshots are
  // honest renders of play, never composites.

  stageCover() {
    this.setupRound(0);
    this.state = STATE.PLAYING;
    this.hideOverlay();
    const now = performance.now() / 1000;
    for (const diff of this.diffs.slice(0, 5)) this.foundAt.set(diff.id, now - 2);
    this.score = 5 * SCORE.find;
    this.timeLeft = 167;
    this.updateHud();
  }

  stageLateRound() {
    this.setupRound(2);
    this.roundIndex = 2;
    this.state = STATE.PLAYING;
    this.hideOverlay();
    const now = performance.now() / 1000;
    for (const diff of this.diffs.slice(0, 4)) this.foundAt.set(diff.id, now - 2);
    this.score = 2450;
    this.timeLeft = 96;
    this.hintsLeft = 1;
    this.updateHud();
  }

  stageEnd() {
    this.totalClicks = 41;
    this.totalMisses = 5;
    this.totalSecondsUsed = 402;
    this.score = 3120;
    this.state = STATE.NIGHT_CLEAR;
    this.showNightClearScreen();
  }
}
