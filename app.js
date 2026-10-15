/* =============================================================
   Tiqmo · Streak Journey Reward — 12-card mystery game
   ============================================================= */
(() => {
  'use strict';

  const TOTAL_CARDS = 12;

  // Per-level reward metadata (Option 2 card content)
  const REWARD_TIERS = [
    { name: 'Daily Reward',   min: 5,   max: 5000 },
    { name: 'Daily Reward',   min: 10,  max: 10000 },
    { name: 'Mega Reward',    min: 5,   max: 20000 },
    { name: 'Bonus Reward',   min: 5,   max: 12 },
    { name: 'Lucky Reward',   min: 8,   max: 18 },
    { name: 'Lucky Reward',   min: 12,  max: 25 },
    { name: 'Big Reward',     min: 18,  max: 35 },
    { name: 'Big Reward',     min: 25,  max: 50 },
    { name: 'Premium Reward', min: 35,  max: 70 },
    { name: 'Premium Reward', min: 50,  max: 100 },
    { name: 'Mega Reward',    min: 75,  max: 150 },
    { name: 'Mega Reward',    min: 100, max: 250 },
  ];
  // Display progress per level (lower levels are closer to unlock)
  const LEVEL_PROGRESS = [92, 78, 65, 55, 45, 38, 30, 24, 18, 14, 10, 7];

  // Inline Saudi Riyal symbol — fill via currentColor so it inherits parent text color
  const RIYAL_ICON = '<svg class="riyal-icon" viewBox="0 0 67 75" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="SAR"><path d="M39.0264 10.8058C41.8394 7.64808 43.5682 6.23042 46.9637 4.43809V57.0198L39.0264 58.66V10.8058Z"/><path d="M64.387 37.2414C66.0325 33.7681 66.2261 32.2244 66.6667 28.6613L5.82523 41.8724C4.38244 45.0862 3.91802 46.8827 3.69568 50.0733L64.387 37.2414Z"/><path d="M64.387 53.3469C66.0325 49.8736 66.2261 48.33 66.6667 44.7668L39.3168 50.5557C39.1232 53.7395 39.3455 55.3729 39.1232 58.5635L64.387 53.3469Z"/><path d="M64.387 69.4502C66.0325 65.9769 66.2261 64.4332 66.6667 60.8701L41.7367 66.2819C40.4783 68.0186 39.7039 70.913 39.1232 74.6668L64.387 69.4502Z"/><path d="M24.7973 63.9664C27.2172 60.9755 29.7339 57.2128 31.4762 54.1255L2.12954 60.4864C0.686757 63.7002 0.222341 65.4967 0 68.6872L24.7973 63.9664Z"/><path d="M23.539 6.3677C26.352 3.20999 28.0808 1.79233 31.4763 0V54.3184L23.539 55.9585V6.3677Z"/></svg>';

  // ---------- Game state ----------
  const state = {
    cards: Array.from({ length: TOTAL_CARDS }, (_, i) => ({
      level: i + 1,
      revealed: false,
      amountCents: null,   // amount won in cents (only set when revealed)
    })),
    plays: 3,         // each play lets the user flip one card
    streak: 15,       // day streak, ambient context
    rolling: false,
    activeCardIdx: null,
    feature: 'default',
    option: '1',      // card design variant: '1' (gift box / dark) or '2' (gold coin / light)
  };

  // ---------- DOM refs ----------
  const $ = (id) => document.getElementById(id);
  const grid       = $('grid');
  const overlay    = $('overlay');
  const overlayCl  = $('overlayClose');
  const overlayCta = $('overlayCta');
  const overlayCtaText = $('overlayCtaText');
  const reelDigits = $('reelDigits');
  const reel = $('reel');
  const celebrationBadgeText = $('celebrationBadgeText');
  const celebrationBadgeTextV1 = $('celebrationBadgeTextV1');

  const heroLevel    = $('heroLevel');
  const heroProgress = $('heroProgress');
  const heroRevealed = $('heroRevealed');
  const heroEarned   = $('heroEarned');
  const heroSub      = $('heroSub');
  const streakNum    = $('streakNum');
  const playsCount   = $('playsCount');
  const earnBtn      = $('earnBtn');
  const stateTags    = $('stateTags');
  const resetBtn     = $('resetBtn');
  const gameFooter   = $('gameFooter');

  const completeOverlay = $('complete');
  const completeTotal   = $('completeTotal');
  const completeCta     = $('completeCta');

  const confetti = $('confetti');
  const completeConfetti = $('completeConfetti');

  // Option 3 (Dice Quest) refs
  const gameEl         = document.querySelector('.game');
  const diceGame       = $('diceGame');
  const diceBoard      = $('diceBoard');
  const diceHopper     = $('diceHopper');
  const diceHopperInner= $('diceHopperInner');
  const diceRollBtn    = $('diceRollBtn');
  const diceRollText   = $('diceRollText');
  const diceHint       = $('diceHint');
  const diceAttempt    = $('diceAttempt');
  const diceTotal      = $('diceTotal');
  const emptyToast     = $('emptyToast');

  // ---------- Card front templates ----------
  function renderFrontOption1(card){
    const tier = REWARD_TIERS[card.level - 1];
    return `
      <div class="card__face card__front card__front--1">
        <div class="card__lvl">Lv ${card.level}</div>
        <div class="card__icon">
          <img src="./assets/mystery-gift.svg" alt="" class="card__icon-img" draggable="false"/>
        </div>
        <div class="card__range">${RIYAL_ICON}${tier.min}-${tier.max}</div>
      </div>
    `;
  }

  function renderFrontOption2(card){
    const tier = REWARD_TIERS[card.level - 1];
    const progress = LEVEL_PROGRESS[card.level - 1];
    return `
      <div class="card__face card__front card__front--2">
        <div class="opt2__pattern"></div>

        <div class="opt2__lock" aria-hidden="true">
          <svg viewBox="0 0 29 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.3333 25.1663V21.833" stroke="#FC4F00" stroke-width="3.75" stroke-linecap="round"/>
            <path d="M1.44635 29.0744C1.82115 31.8581 4.12688 34.039 6.93276 34.168C9.29379 34.2766 11.6922 34.3332 14.3333 34.3332C16.9745 34.3332 19.3729 34.2766 21.7339 34.168C24.5398 34.039 26.8455 31.8581 27.2203 29.0744C27.4649 27.2576 27.6667 25.3959 27.6667 23.4998C27.6667 21.6038 27.4649 19.742 27.2203 17.9253C26.8455 15.1415 24.5398 12.9607 21.7339 12.8317C19.3729 12.7231 16.9745 12.6665 14.3333 12.6665C11.6922 12.6665 9.29379 12.7231 6.93276 12.8317C4.12688 12.9607 1.82115 15.1415 1.44635 17.9253C1.20174 19.742 0.999997 21.6038 0.999997 23.4998C0.999997 25.3959 1.20174 27.2576 1.44635 29.0744Z" stroke="#FC4F00" stroke-width="2"/>
            <path d="M6.83325 12.6667V8.5C6.83325 4.35786 10.1911 1 14.3333 1C18.4754 1 21.8333 4.35786 21.8333 8.5V12.6667" stroke="#FC4F00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div class="opt2__body">
          <div class="opt2__title">${tier.name}</div>
          <div class="opt2__range">${RIYAL_ICON}${tier.min}-${tier.max}</div>
        </div>

        <div class="opt2__pill opt2__pill--bottom">
          <div class="opt2__progress">
            <div class="opt2__progress-fill" style="width:${progress}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------- Build the 12-card grid ----------
  function buildGrid(){
    grid.innerHTML = '';
    state.cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'card';
      el.dataset.idx = idx;
      const frontHTML = state.option === '2'
        ? renderFrontOption2(card)
        : renderFrontOption1(card);
      el.innerHTML = `
        <div class="card__inner">
          ${frontHTML}
          <div class="card__face card__back">
            <img src="./assets/back-card.svg" alt="" class="back-bg" draggable="false"/>
            <div class="back-overlay-lvl">
              <span class="card__lvl">Lv ${card.level}</span>
            </div>
            <div class="back-overlay-amount">
              <span class="card__amount">—</span>
            </div>
          </div>
        </div>
      `;
      attachCardEvents(el, idx);
      grid.appendChild(el);
    });
    refreshGrid();
  }

  // The next playable card index = lowest non-revealed index
  function getCurrentCardIdx(){
    return state.cards.findIndex(c => !c.revealed);
  }

  function attachCardEvents(el, idx){
    const isPlayable = () => {
      const c = state.cards[idx];
      if (c.revealed || state.rolling || state.plays <= 0) return false;
      // Only the current card (next in line) is playable
      return idx === getCurrentCardIdx();
    };
    const press = () => {
      if (!isPlayable()) return;
      el.classList.add('is-pressed');
      setFeatureState('pressed');
    };
    const release = (open) => {
      el.classList.remove('is-pressed');
      if (open) openCard(idx);
    };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup',   () => {
      if (!isPlayable()){
        release(false);
        return;
      }
      release(true);
    });
    el.addEventListener('pointerleave', () => release(false));
    el.addEventListener('pointercancel', () => release(false));
  }

  function refreshGrid(){
    const currentIdx = getCurrentCardIdx();
    [...grid.children].forEach((el, idx) => {
      const c = state.cards[idx];
      const isCurrent = !c.revealed && idx === currentIdx;
      const isLocked  = !c.revealed && idx !== currentIdx;
      el.classList.toggle('is-flipped', c.revealed);
      el.classList.toggle('is-current', isCurrent);
      el.classList.toggle('is-locked',  isLocked);
      el.classList.toggle('is-disabled', isCurrent && state.plays <= 0);
      if (c.revealed && c.amountCents != null){
        el.querySelector('.card__amount').textContent = formatCents(c.amountCents);
      }
    });
  }

  // ---------- Update hero meta ----------
  function refreshHero(){
    const revealedCount = state.cards.filter(c => c.revealed).length;
    const totalCents = state.cards.reduce((s, c) => s + (c.amountCents || 0), 0);
    const level = Math.max(1, revealedCount); // current level = number revealed (min 1 visually)
    state.level = level;

    heroLevel.textContent = level;
    heroRevealed.textContent = revealedCount;
    heroEarned.innerHTML = `${RIYAL_ICON}${formatCents(totalCents)}`;
    heroProgress.style.width = `${(revealedCount / TOTAL_CARDS) * 100}%`;
    if (streakNum) streakNum.textContent = state.streak;
    playsCount.textContent = state.plays;

    if (state.option === '3'){
      heroSub.textContent = state.plays <= 0
        ? 'Earn more plays to roll again'
        : 'Roll the dice to open a mystery box';
      gameFooter.classList.toggle('is-hidden', state.plays > 0);
    } else {
      // Option 1 & 2: keep the hero copy stable so layout never shifts
      heroSub.textContent = 'Tap a mystery card to reveal your cashback';
      gameFooter.classList.add('is-hidden');
    }
  }

  // ---------- Reward generation ----------
  function generateRewardCents(level){
    // Pull min/max from REWARD_TIERS so the actual reward matches the range shown on the card
    const tier = REWARD_TIERS[Math.min(Math.max(level, 1), REWARD_TIERS.length) - 1];
    const minSar = tier ? tier.min : 1;
    const maxSar = tier ? tier.max : 10;
    const range = maxSar - minSar;
    // Lv 3 is the lucky card — bias heavily toward the max payout
    const bias = level === 3
      ? Math.pow(Math.random(), 0.25)
      : Math.pow(Math.random(), 1.4);
    const sar  = minSar + Math.floor(bias * (range + 1));
    return Math.min(maxSar, Math.max(minSar, sar)) * 100;
  }

  function formatCents(cents){
    return String(Math.round(cents / 100)); // whole number, no decimals
  }

  // ---------- Slot reel ----------
  function buildReel(digitCount = 3){
    reelDigits.innerHTML = '';
    // Whole SAR display, dynamic digit count (max reward can be 20,000 → 5 digits)
    for (let i = 0; i < digitCount; i++){
      const cell = document.createElement('div');
      cell.className = 'reel__digit';
      const strip = document.createElement('div');
      strip.className = 'reel__digit-strip';
      for (let n = 0; n <= 30; n++){
        const sp = document.createElement('span');
        sp.textContent = n % 10;
        strip.appendChild(sp);
      }
      cell.appendChild(strip);
      reelDigits.appendChild(cell);
    }
  }

  // Row height matches CSS .reel--big .reel__digit-strip span height
  // Wide mode (4+ digits) uses a shorter row so the reel fits the phone frame
  function rowHeight(){ return reel && reel.classList.contains('reel--wide') ? 50 : 62; }
  const ROW_H = 62;

  function setReelInstant(value){
    const cells = reelDigits.querySelectorAll('.reel__digit:not(.is-dot)');
    const digitChars = String(value).padStart(cells.length, '0').split('');
    const rh = rowHeight();
    cells.forEach((cell, i) => {
      const strip = cell.querySelector('.reel__digit-strip');
      const target = parseInt(digitChars[i], 10) || 0;
      strip.style.transition = 'none';
      strip.style.transform = `translateY(-${target * rh}px)`;
    });
  }

  function rollReel(targetCents, onDone){
    const sar = Math.round(targetCents / 100);
    const digitCount = String(sar).length;
    // Rebuild reel so it matches the target's digit count (e.g. 5 digits for 16,801)
    buildReel(digitCount);
    if (reel) reel.classList.toggle('reel--wide', digitCount >= 4);
    const rh = rowHeight();
    const cells = reelDigits.querySelectorAll('.reel__digit:not(.is-dot)');
    const padded = String(sar).padStart(cells.length, '0').split('').map(Number);

    // Each digit settles a bit later than the previous → premium "left-to-right land"
    // Spin/duration scale with digit position so longer numbers still feel premium
    const baseSpins = cells.length <= 3
      ? [20, 17, 14]
      : Array.from({ length: cells.length }, (_, i) => 22 - i * 2);
    const baseDur = cells.length <= 3
      ? [1500, 1900, 2400]
      : Array.from({ length: cells.length }, (_, i) => 1300 + i * 280);

    let finished = 0;
    cells.forEach((cell, i) => {
      const strip = cell.querySelector('.reel__digit-strip');
      const finalDigit = padded[i];
      const totalY = (baseSpins[i] * 10 + finalDigit) * rh;

      ensureStripLength(strip, baseSpins[i] * 10 + finalDigit + 1);

      strip.style.transition = 'none';
      strip.style.transform = 'translateY(0)';
      void strip.offsetHeight;

      strip.style.transition = `transform ${baseDur[i]}ms cubic-bezier(.18,.65,.18,1)`;
      strip.style.transform = `translateY(-${totalY}px)`;

      const onEnd = () => {
        strip.removeEventListener('transitionend', onEnd);
        // Subtle bounce-snap
        strip.animate([
          { transform: `translateY(-${totalY}px)` },
          { transform: `translateY(-${totalY - 4}px)` },
          { transform: `translateY(-${totalY}px)` },
        ], { duration: 220, easing: 'ease-out' });

        finished++;
        if (finished === cells.length && typeof onDone === 'function') onDone();
      };
      strip.addEventListener('transitionend', onEnd);
    });

    // Subtle "tick" pulse on the reel
    let ticks = 0, maxTicks = 24;
    const tickInterval = setInterval(() => {
      reel.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.005)' },
        { transform: 'scale(1)' },
      ], { duration: 80, easing: 'ease-out' });
      ticks++;
      if (ticks >= maxTicks) clearInterval(tickInterval);
    }, 90);
  }

  function ensureStripLength(strip, minCount){
    const have = strip.children.length;
    if (have >= minCount + 1) return;
    for (let n = have; n <= minCount; n++){
      const sp = document.createElement('span');
      sp.textContent = n % 10;
      strip.appendChild(sp);
    }
  }

  // ---------- Open card → flip + roll ----------
  function openCard(idx){
    const card = state.cards[idx];
    if (card.revealed || state.rolling || state.plays <= 0) return;

    state.rolling = true;
    state.activeCardIdx = idx;
    setFeatureState('rolling');

    const cents = generateRewardCents(card.level);

    // For Option 1: low-tier cards (Lv 1 & Lv 2) get the simple bottom sheet
    // Lv 3 and above get the full MEGA CASHBACK celebration
    if (state.option === '1' && card.level <= 2){
      setTimeout(() => openSmallPrize(idx, cents), 220);
      return;
    }

    celebrationBadgeText.textContent = 'Revealing…';
    if (celebrationBadgeTextV1) celebrationBadgeTextV1.textContent = 'Unwrapping…';
    setReelInstant('000');

    // Apply variant class to overlay based on which card option is active
    overlay.classList.remove('overlay--v1', 'overlay--v2');
    overlay.classList.add(state.option === '2' ? 'overlay--v2' : 'overlay--v1');

    overlay.classList.add('is-open', 'is-rolling');
    overlay.classList.remove('is-revealed');
    overlay.setAttribute('aria-hidden', 'false');
    overlayCta.disabled = true;
    overlayCtaText.textContent = 'Revealing…';

    // Slight delay so the takeover settles before the reel starts spinning
    setTimeout(() => {
      rollReel(cents, () => onReelDone(idx, cents));
    }, 300);
  }

  function onReelDone(idx, cents){
    overlay.classList.add('is-revealed');
    celebrationBadgeText.textContent = 'BIG WIN!';
    if (celebrationBadgeTextV1) celebrationBadgeTextV1.textContent = 'MEGA CASHBACK!';
    overlayCta.disabled = false;
    overlayCtaText.innerHTML = `Claim ${formatCents(cents)} ${RIYAL_ICON}`;
    setFeatureState('reveal');

    // v1 gets a stronger, multi-wave celebration; v2 stays as before
    const isV1 = state.option === '1';
    fireConfetti(confetti, isV1);
    setTimeout(() => fireConfetti(confetti, isV1), 280);
    if (isV1){
      setTimeout(() => fireConfetti(confetti, true), 600);
      setTimeout(() => fireConfetti(confetti, true), 1100);
    }
  }

  function closeOverlay(commit=true){
    if (commit && state.activeCardIdx != null){
      // commit the win
      const idx = state.activeCardIdx;
      const card = state.cards[idx];
      if (!card.revealed && overlay.classList.contains('is-revealed')){
        // Use the same cents shown in the reel: re-extract from formatted state
        const totalY = parseInt(getCurrentReelCents(), 10);
        card.revealed = true;
        card.amountCents = totalY;
        state.plays = Math.max(0, state.plays - 1);
        refreshGrid();
        refreshHero();

        // Level up celebration if a new highest level was just unlocked
        const revealedCount = state.cards.filter(c => c.revealed).length;
        if (revealedCount === TOTAL_CARDS){
          setTimeout(showCompletion, 350);
        } else {
          setFeatureState('celebrate');
          setTimeout(() => setFeatureState('default'), 900);
        }
      }
    }
    overlay.classList.remove('is-open', 'is-rolling', 'is-revealed');
    overlay.setAttribute('aria-hidden', 'true');
    state.rolling = false;
    state.activeCardIdx = null;
  }

  // Reads cents back from the reel positions (so we always commit exactly what was shown)
  function getCurrentReelCents(){
    const cells = reelDigits.querySelectorAll('.reel__digit:not(.is-dot)');
    const digits = [];
    const rh = rowHeight();
    cells.forEach(cell => {
      const strip = cell.querySelector('.reel__digit-strip');
      const tr = strip.style.transform || '';
      const match = tr.match(/-?(\d+(?:\.\d+)?)px/);
      const y = match ? parseFloat(match[1]) : 0;
      const idx = Math.round(y / rh) % 10;
      digits.push(idx);
    });
    // 3 digits represent whole SAR; convert back to cents (× 100)
    return parseInt(digits.join(''), 10) * 100;
  }

  // ---------- Completion ----------
  function showCompletion(){
    const total = state.cards.reduce((s, c) => s + (c.amountCents || 0), 0);
    completeTotal.innerHTML = `${RIYAL_ICON}${formatCents(total)}`;
    completeOverlay.classList.add('is-open');
    completeOverlay.setAttribute('aria-hidden', 'false');
    setFeatureState('celebrate');
    fireConfetti(completeConfetti, true);
    fireConfetti(completeConfetti, true);
  }
  function hideCompletion(){
    completeOverlay.classList.remove('is-open');
    completeOverlay.setAttribute('aria-hidden', 'true');
  }

  // ---------- State tag indicator ----------
  function setFeatureState(name){
    state.feature = name;
    if (!stateTags) return;
    [...stateTags.children].forEach(el => {
      el.classList.toggle('active', el.dataset.state === name);
    });
  }

  // ---------- Confetti (canvas) ----------
  const confettiState = new WeakMap();

  function getCtx(canvas){
    let s = confettiState.get(canvas);
    if (!s){
      s = { ctx: canvas.getContext('2d'), particles: [], running: false };
      confettiState.set(canvas, s);
    }
    return s;
  }
  function resizeCanvas(canvas){
    const r = canvas.getBoundingClientRect();
    canvas.width  = r.width  * window.devicePixelRatio;
    canvas.height = r.height * window.devicePixelRatio;
    const s = getCtx(canvas);
    s.ctx.setTransform(1, 0, 0, 1, 0, 0);
    s.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  function fireConfetti(canvas, big=false){
    resizeCanvas(canvas);
    const s = getCtx(canvas);
    const r = canvas.getBoundingClientRect();
    const palette = ['#FC4F00', '#FF7A3D', '#FFFFFF', '#FFB58F', '#1A3AAE'];
    const count = big ? 80 : 50;
    for (let i = 0; i < count; i++){
      s.particles.push({
        x: r.width / 2 + (Math.random() - 0.5) * 60,
        y: r.height * 0.35 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 - Math.random() * 4,
        g: 0.12 + Math.random() * 0.05,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: palette[(Math.random() * palette.length) | 0],
        life: 0,
        maxLife: 90 + Math.random() * 50,
        shape: Math.random() < 0.5 ? 'rect' : 'circle',
      });
    }
    if (!s.running){
      s.running = true;
      stepConfetti(canvas);
    }
  }
  function stepConfetti(canvas){
    const s = getCtx(canvas);
    const ctx = s.ctx;
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    s.particles.forEach(p => {
      p.life++;
      p.vy += p.g;
      p.x  += p.vx;
      p.y  += p.vy;
      p.rot += p.vr;
      const alpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'rect') ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size/2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    });
    s.particles = s.particles.filter(p => p.life < p.maxLife && p.y < r.height + 30);
    if (s.particles.length){
      requestAnimationFrame(() => stepConfetti(canvas));
    } else {
      s.running = false;
      ctx.clearRect(0, 0, r.width, r.height);
    }
  }

  // ---------- Option 3: Dice Quest (perimeter board) ----------
  // Played like a real board game: the die is the player piece. It rolls in place
  // on its tile, then walks that many tiles clockwise from wherever it is.
  const diceState = { rolling: false, attemptsTotal: 3, tileIdx: 0 };
  const diceSteps   = $('diceSteps');
  const diceCaption = $('diceCaption');

  // 16 tiles around the perimeter (clockwise from top-left). Tile 0 is Start.
  const DICE_PRIZES = [
    { emoji: '🏁', label: 'Start',     cents: 0,      start: true   }, // 0  top-left corner
    { emoji: '💵', label: 'SAR 10',    cents: 1000                  }, // 1
    { emoji: '🎟️', label: '20% OFF',   cents: 0,      special: true }, // 2
    { emoji: '🪙', label: '500 Pts',   cents: 500                   }, // 3
    { emoji: '🏆', label: 'Trophy',    cents: 0,      special: true }, // 4  top-right corner
    { emoji: '🎁', label: 'Mystery',   cents: 1500                  }, // 5
    { emoji: '💵', label: 'SAR 2',     cents: 200                   }, // 6
    { emoji: '🎧', label: 'Earbuds',   cents: 0,      special: true }, // 7
    { emoji: '💰', label: 'SAR 1,000', cents: 100000, jackpot: true }, // 8  bottom-right corner
    { emoji: '🎟️', label: '10% OFF',   cents: 0,      special: true }, // 9
    { emoji: '💵', label: 'SAR 5',     cents: 500                   }, // 10
    { emoji: '💳', label: 'SAR 25',    cents: 2500                  }, // 11
    { emoji: '📱', label: 'iPhone',    cents: 0,      special: true, jackpot: true }, // 12 bottom-left corner
    { emoji: '🎁', label: 'Gift',      cents: 0,      special: true }, // 13
    { emoji: '🪙', label: '100 Pts',   cents: 100                   }, // 14
    { emoji: '💳', label: 'SAR 10',    cents: 1000                  }, // 15
  ];
  // Grid positions [row, col] for each tile in clockwise order
  const TILE_POSITIONS = [
    [1,1],[1,2],[1,3],[1,4],[1,5],   // top row L→R
    [2,5],[3,5],[4,5],                // right side T→B
    [5,5],[5,4],[5,3],[5,2],[5,1],   // bottom row R→L
    [4,1],[3,1],[2,1],                // left side B→T
  ];

  // Landing weights: jackpots rare, small SAR common, Start is never a landing spot
  const TILE_WEIGHTS = [
    0, 16, 4, 12, 1,   // top row (Start excluded, Trophy rare)
    8, 18, 1,           // right (Earbuds rare)
    1, 5, 16, 10, 1,   // bottom (1000 SAR & iPhone rare)
    2, 12, 14,          // left (Gift slightly rare)
  ];

  // Pick the die value; each face is weighted by the tile the die would land on
  function pickRoll(from){
    const weights = [1, 2, 3, 4, 5, 6].map(v => TILE_WEIGHTS[(from + v) % 16]);
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < 6; i++){
      r -= weights[i];
      if (r < 0) return i + 1;
    }
    return 6;
  }

  function buildDiceBoard(){
    // Clear existing tiles (keep the .dice-center button)
    diceBoard.querySelectorAll('.tile').forEach(t => t.remove());

    DICE_PRIZES.forEach((prize, idx) => {
      const [row, col] = TILE_POSITIONS[idx];
      const tile = document.createElement('div');
      tile.className = prize.start ? 'tile is-start' : prize.jackpot ? 'tile is-jackpot' : 'tile';
      tile.dataset.idx = idx;
      tile.style.gridRow = row;
      tile.style.gridColumn = col;
      // Cash prizes read "10 ⃁" (number, then the riyal icon) instead of "SAR 10"
      const labelHtml = prize.label.startsWith('SAR ')
        ? `${prize.label.slice(4)}${RIYAL_ICON}`
        : prize.label;
      tile.innerHTML = `
        <div class="tile__icon">${prize.emoji}</div>
        <div class="tile__label">${labelHtml}</div>
      `;
      diceBoard.appendChild(tile);
    });
  }

  function resetDiceTiles(){
    diceGame.classList.remove('is-rolling', 'is-revealed');
    document.querySelectorAll('.tile').forEach(t => t.classList.remove('is-active','is-won'));
    emptyToast.classList.remove('is-open');
  }

  function refreshDiceHint(){
    const used = diceState.attemptsTotal - state.plays;
    const current = Math.min(used + 1, diceState.attemptsTotal);
    if (diceAttempt) diceAttempt.textContent = current;
    if (diceTotal)   diceTotal.textContent   = diceState.attemptsTotal;
    // Attempts card at the top: "X of 3 attempts left"
    $('dqAttemptsLeft').textContent  = Math.max(0, state.plays);
    $('dqAttemptsTotal').textContent = diceState.attemptsTotal;
    if (state.plays <= 0){
      diceRollText.textContent = 'No attempts left';
    } else {
      diceRollText.textContent = 'Roll the dice';
    }
  }

  // Compute pixel position of each tile's center, relative to the board
  function getTileCenters(){
    const board = diceBoard.getBoundingClientRect();
    const tiles = [...diceBoard.querySelectorAll('.tile')]
      .sort((a,b) => Number(a.dataset.idx) - Number(b.dataset.idx));
    return tiles.map(t => {
      const r = t.getBoundingClientRect();
      return {
        x: r.left - board.left + r.width / 2,
        y: r.top  - board.top  + r.height / 2,
        h: r.height,
        el: t,
      };
    });
  }

  // Put the die on a tile's center
  function placeDie(idx){
    const t = getTileCenters()[idx];
    diceHopper.style.left = `${t.x}px`;
    diceHopper.style.top  = `${t.y}px`;
  }

  // Idle / rolling icon for the center counter (same die as the attempts card)
  const DIE_ICON = '<svg class="dice-center__icon" viewBox="0 0 32 32" aria-hidden="true">'
    + '<rect x="3" y="3" width="26" height="26" rx="7" fill="#fff" stroke="#DCE1F2" stroke-width="1.5"/>'
    + '<circle cx="10" cy="10" r="2.6" fill="#061F6F"/><circle cx="16" cy="16" r="2.6" fill="#059FF4"/>'
    + '<circle cx="22" cy="22" r="2.6" fill="#061F6F"/></svg>';

  // Center counter: big value + caption, with a little pop on every change
  function setDiceDisplay(big, caption){
    diceSteps.innerHTML = big;
    diceCaption.innerHTML = caption;
    diceSteps.animate([
      { transform: 'scale(.7)', opacity: .4 },
      { transform: 'scale(1.08)', opacity: 1, offset: .6 },
      { transform: 'scale(1)' },
    ], { duration: 320, easing: 'cubic-bezier(.2,.9,.25,1.4)' });
  }

  // Die back on Start, showing its resting face
  function resetDiceStage(){
    dieRot = { x: -18, y: 28 };
    diceHopperInner.style.transition = 'none';
    diceHopperInner.style.transform = `rotateX(${dieRot.x}deg) rotateY(${dieRot.y}deg)`;
    diceState.tileIdx = 0;
    placeDie(0);
    setDiceDisplay(DIE_ICON, 'Roll to move around the board');
  }

  // Rotation that turns each value's face toward the viewer (see the .dice2__face markup)
  const FACE_ROTATIONS = {
    1: { x: 0,   y: 0   },  // front
    2: { x: 0,   y: -90 },  // right
    3: { x: -90, y: 0   },  // top
    4: { x: 90,  y: 0   },  // bottom
    5: { x: 0,   y: 90  },  // left
    6: { x: 0,   y: 180 },  // back
  };
  const DIE_TILT = { x: -14, y: 18 }; // keeps a little 3D angle on the result
  let dieRot = { x: -18, y: 28 };

  // Throw the die up off its tile; it tumbles and lands back on it showing `value`
  function throwDie(value, onLanded){
    // Snap to the same angle mod 360 (no visual change) so every throw spins the same amount
    dieRot = { x: dieRot.x % 360, y: dieRot.y % 360 };
    diceHopperInner.style.transition = 'none';
    diceHopperInner.style.transform = `rotateX(${dieRot.x}deg) rotateY(${dieRot.y}deg)`;
    void diceHopperInner.offsetWidth;

    const face = FACE_ROTATIONS[value];
    dieRot = { x: 720 + face.x + DIE_TILT.x, y: 1080 + face.y + DIE_TILT.y };
    diceHopperInner.style.transition = 'transform 1.15s cubic-bezier(.15,.65,.25,1)';
    diceHopperInner.style.transform = `rotateX(${dieRot.x}deg) rotateY(${dieRot.y}deg)`;

    // Up, back down onto its tile, one small bounce
    diceHopper.animate([
      { transform: 'translateY(0)',     easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translateY(-40px)', offset: .38, easing: 'cubic-bezier(.6,0,.9,.5)' },
      { transform: 'translateY(0)',     offset: .72, easing: 'cubic-bezier(.2,.7,.4,1)' },
      { transform: 'translateY(-10px)', offset: .86, easing: 'cubic-bezier(.6,0,.9,.5)' },
      { transform: 'translateY(0)' },
    ], { duration: 1200 });
    setTimeout(onLanded, 1250);
  }

  // Walk the die `steps` tiles clockwise, one hop per tile, keeping its rolled face up
  function walkDie(steps, onDone){
    let step = 0;
    const hopNext = () => {
      if (step >= steps){ onDone(); return; }
      step++;
      const last = step === steps;
      const dur = last ? 460 : 360;
      const tiles = getTileCenters();
      const a = tiles[diceState.tileIdx];
      diceState.tileIdx = (diceState.tileIdx + 1) % 16;
      const b = tiles[diceState.tileIdx];
      // Move to the next tile, then animate from the old spot with an arc (FLIP)
      placeDie(diceState.tileIdx);
      const dx = a.x - b.x, dy = a.y - b.y;
      diceHopper.animate([
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx / 2}px, ${dy / 2 - 20}px) rotate(${dx > 0 ? -8 : 8}deg)`, offset: .5 },
        { transform: 'translate(0, 3px) scale(1.06, .92)', offset: .85 },
        { transform: 'translate(0, 0)' },
      ], { duration: dur, easing: 'ease-in-out' });

      const left = steps - step;
      setTimeout(() => {
        if (!last) setDiceDisplay(left, left === 1 ? 'step to go' : 'steps to go');
      }, dur * .5);

      // Each tile lights up as the die touches it
      const tileEl = b.el;
      setTimeout(() => {
        diceBoard.querySelectorAll('.tile.is-active').forEach(t => t.classList.remove('is-active'));
        if (!last) tileEl.classList.add('is-active');
      }, dur * .8);
      setTimeout(hopNext, last ? dur : dur + 40);
    };
    hopNext();
  }

  function rollDice(){
    if (diceState.rolling) return;
    if (state.plays <= 0){
      diceRollBtn.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
      ], { duration: 260 });
      return;
    }

    diceState.rolling = true;
    resetDiceTiles();
    diceGame.classList.add('is-rolling');
    diceRollBtn.disabled = true;
    diceRollText.textContent = 'Rolling…';

    setDiceDisplay(DIE_ICON, 'Rolling…');
    const value = pickRoll(diceState.tileIdx);
    throwDie(value, () => {
      // Show the number, then walk it out
      setDiceDisplay(value, `You rolled <b>${value}</b>`);
      diceRollText.textContent = 'Moving…';

      setTimeout(() => {
        walkDie(value, () => {
          const idx = diceState.tileIdx;
          const prize = DICE_PRIZES[idx];
          const prizeLabel = prize.label.startsWith('SAR ')
            ? `${prize.label.slice(4)}${RIYAL_ICON}`
            : prize.label;
          setDiceDisplay(prize.emoji, `You landed on <b>${prizeLabel}</b>`);
          getTileCenters()[idx].el.classList.add('is-won');
          state.plays = Math.max(0, state.plays - 1);
          refreshHero();
          refreshDiceHint();

          setTimeout(() => {
            if (prize.cents > 0){
              openDiceCelebration(prize.cents);
            } else {
              showSpecialPrize(prize);
            }
            diceState.rolling = false;
            diceGame.classList.remove('is-rolling');
            diceGame.classList.add('is-revealed');
            diceRollBtn.disabled = state.plays <= 0;
            diceRollText.textContent = state.plays > 0 ? 'Roll the dice' : 'No attempts left';
          }, 650);
        });
      }, 350);
    });
  }

  function showSpecialPrize(prize){
    // Use the empty toast component but for a special non-cashback win
    const panel = emptyToast.querySelector('.empty-toast__panel');
    panel.innerHTML = `
      <div class="empty-toast__emoji">${prize.emoji}</div>
      <div class="empty-toast__title">You won ${prize.label}!</div>
      <div class="empty-toast__sub">Check your inbox for redemption details</div>
    `;
    emptyToast.classList.add('is-open');
    setTimeout(() => emptyToast.classList.remove('is-open'), 2800);
  }

  function openDiceCelebration(cents){
    // Reuse the v1 (CASHBACK BURST) celebration overlay
    celebrationBadgeText.textContent = 'Revealing…';
    if (celebrationBadgeTextV1) celebrationBadgeTextV1.textContent = 'Unwrapping…';
    setReelInstant('000');

    overlay.classList.remove('overlay--v1', 'overlay--v2');
    overlay.classList.add('overlay--v1');
    overlay.classList.add('is-open', 'is-rolling');
    overlay.classList.remove('is-revealed');
    overlay.setAttribute('aria-hidden', 'false');
    overlayCta.disabled = true;
    overlayCtaText.textContent = 'Revealing…';

    state.activeCardIdx = null; // dice game has no card index

    setTimeout(() => {
      rollReel(cents, () => {
        overlay.classList.add('is-revealed');
        celebrationBadgeText.textContent = 'BIG WIN!';
        if (celebrationBadgeTextV1) celebrationBadgeTextV1.textContent = 'MEGA CASHBACK!';
        overlayCta.disabled = false;
        overlayCtaText.innerHTML = `Claim ${formatCents(cents)} ${RIYAL_ICON}`;
        fireConfetti(confetti, true);
        setTimeout(() => fireConfetti(confetti, true), 280);
        setTimeout(() => fireConfetti(confetti, true), 600);
      });
    }, 300);
  }

  // ---------- Option 4: Plinko (same space theme as Option 3) ----------
  const plinkoGame    = $('plinkoGame');
  const plinkoBoard   = $('plinkoBoard');
  const pkBall        = $('pkBall');
  const pkDropper     = $('pkDropper');
  const plinkoBtn     = $('plinkoBtn');
  const plinkoBtnText = $('plinkoBtnText');

  // 5 prize boxes under the pegs, left to right. The edges are the jackpots.
  const PLINKO_SLOTS = [
    { emoji: '💰', label: 'SAR 1,000', cents: 100000, jackpot: true },
    { emoji: '💳', label: 'SAR 25',    cents: 2500   },
    { emoji: '💵', label: 'SAR 5',     cents: 500    },
    { emoji: '💳', label: 'SAR 25',    cents: 2500   },
    { emoji: '💰', label: 'SAR 1,000', cents: 100000, jackpot: true },
  ];
  const PLINKO_WEIGHTS = [1, 12, 30, 12, 1];
  const PEG_ROWS = 4;      // 3, 4, 5, 6 pegs; the 6 pegs of the last row frame the 5 boxes
  const PEG_R = 7;
  const BALL_R = 11;
  const plinkoState = { dropping: false, geom: null, pegs: [] };

  function pickWeighted(weights){
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++){
      r -= weights[i];
      if (r < 0) return i;
    }
    return weights.length - 1;
  }

  function placeBall(x, y){
    pkBall.style.transform = `translate(${x - BALL_R}px, ${y - BALL_R}px)`;
  }

  // Lay out pegs, boxes and the ship from the board's real size
  function layoutPlinko(){
    plinkoBoard.querySelectorAll('.pk-peg, .pk-slot').forEach(el => el.remove());
    const W = plinkoBoard.clientWidth;
    const H = plinkoBoard.clientHeight;
    const S = Math.min(60, (W - 64) / 5);   // peg spacing = box pitch; keeps edge pegs inside the glass stage
    const cx = W / 2;
    const slotH = 66;
    const slotTop = H - slotH - 14;
    const lastRowY = slotTop - 34;
    const rowGap = Math.min(64, (lastRowY - 140) / (PEG_ROWS - 1));
    const rowY = Array.from({ length: PEG_ROWS }, (_, r) => lastRowY - (PEG_ROWS - 1 - r) * rowGap);
    // The ball hangs under the ship; keep the ship clear of the live-wins ticker at the top
    const startY = Math.max(rowY[0] - rowGap - 6, 112);
    pkDropper.style.top = `${startY - BALL_R - 48}px`;

    plinkoState.pegs = rowY.map((y, r) => {
      const count = r + 3;
      return Array.from({ length: count }, (_, i) => {
        const x = cx + (i - (count - 1) / 2) * S;
        const peg = document.createElement('div');
        peg.className = 'pk-peg';
        peg.style.left = `${x}px`;
        peg.style.top  = `${y}px`;
        plinkoBoard.appendChild(peg);
        return { x, y, el: peg };
      });
    });

    // Box i sits under the gap between pegs i and i+1 of the last row
    PLINKO_SLOTS.forEach((slot, i) => {
      const el = document.createElement('div');
      el.className = 'pk-slot' + (i % 2 ? ' pk-slot--alt' : '') + (slot.jackpot ? ' pk-slot--jackpot' : '');
      el.dataset.idx = i;
      el.style.left   = `${cx + (i - 2) * S - (S - 8) / 2}px`;
      el.style.width  = `${S - 8}px`;
      el.style.top    = `${slotTop}px`;
      el.style.height = `${slotH}px`;
      const label = slot.label.startsWith('SAR ') ? `${slot.label.slice(4)}${RIYAL_ICON}` : slot.label;
      el.innerHTML = `
        <div class="pk-slot__icon">${slot.emoji}</div>
        <div class="pk-slot__label">${label}</div>
      `;
      plinkoBoard.appendChild(el);
    });

    plinkoState.geom = { S, cx, rowY, startY, slotTop };
  }

  function refreshPlinkoBtn(){
    plinkoBtn.disabled = state.plays <= 0;
    plinkoBtnText.textContent = state.plays > 0 ? 'Drop the ball' : 'No attempts left';
  }

  function resetPlinko(){
    plinkoState.dropping = false;
    plinkoGame.classList.remove('is-dropping');
    plinkoBoard.querySelectorAll('.pk-slot').forEach(s => s.classList.remove('is-won', 'is-target'));
    if (plinkoState.geom) placeBall(plinkoState.geom.cx, plinkoState.geom.startY);
    pkBall.classList.remove('is-hidden');
    plinkoGame.classList.add('is-ready');
    refreshPlinkoBtn();
  }

  // Play motion segments back to back; each maps t (0..1) to a ball position
  function runBallPath(segments, onDone){
    let i = 0;
    let lastTrail = 0;
    const next = () => {
      if (i >= segments.length){ onDone(); return; }
      const seg = segments[i++];
      if (seg.onStart) seg.onStart();
      const t0 = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - t0) / seg.dur);
        const p = seg.at(t);
        placeBall(p.x, p.y);
        if (!seg.noTrail && now - lastTrail > 32){
          lastTrail = now;
          spawnTrail(p.x, p.y);
        }
        if (t < 1) requestAnimationFrame(frame);
        else next();
      };
      requestAnimationFrame(frame);
    };
    next();
  }

  // A bounce: x moves evenly while y follows a projectile arc that rises by `lift` before falling to y1
  function hop(x0, y0, x1, y1, lift, dur, onStart){
    return {
      dur, onStart,
      at: t => ({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t - lift * 4 * t * (1 - t) }),
    };
  }

  function hitPeg(row, x){
    const g = plinkoState.geom;
    const pegs = plinkoState.pegs[row];
    const peg = pegs[Math.round((x - g.cx) / g.S + (pegs.length - 1) / 2)];
    if (!peg) return;
    peg.el.classList.remove('is-hit');
    void peg.el.offsetWidth; // restart the flash
    peg.el.classList.add('is-hit');
    // A few sparks fly off the peg
    for (let i = 0; i < 4; i++){
      const a = Math.random() * Math.PI * 2;
      const d = 10 + Math.random() * 8;
      const spark = document.createElement('span');
      spark.className = 'pk-spark-dot';
      plinkoBoard.appendChild(spark);
      spark.animate([
        { transform: `translate(${peg.x}px, ${peg.y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${peg.x + Math.cos(a) * d}px, ${peg.y + Math.sin(a) * d}px) scale(.4)`, opacity: 0 },
      ], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => spark.remove();
    }
    pkBall.firstElementChild.animate([
      { transform: 'scale(1.14, .86)' },
      { transform: 'scale(1)' },
    ], { duration: 160, easing: 'ease-out' });
  }

  // Fading blue dots behind the falling ball
  function spawnTrail(x, y){
    const dot = document.createElement('span');
    dot.className = 'pk-trail';
    plinkoBoard.appendChild(dot);
    dot.animate([
      { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: .55 },
      { transform: `translate(${x}px, ${y}px) scale(.3)`, opacity: 0 },
    ], { duration: 380, easing: 'ease-out' }).onfinish = () => dot.remove();
  }

  // "+25 ⃁" rises out of the box and a few coins pop out of it
  function celebrateSlot(slotEl, idx){
    const slot = PLINKO_SLOTS[idx];
    const x = parseFloat(slotEl.style.left) + parseFloat(slotEl.style.width) / 2;
    const y = plinkoState.geom.slotTop;

    const plus = document.createElement('div');
    plus.className = 'pk-plus' + (slot.jackpot ? ' pk-plus--jackpot' : '');
    plus.innerHTML = `+${slot.label.slice(4)}${RIYAL_ICON}`;
    plus.style.left = `${x}px`;
    plus.style.top  = `${y}px`;
    plinkoBoard.appendChild(plus);
    plus.animate([
      { transform: 'translate(-50%, 0) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -34px) scale(1.08)', opacity: 1, offset: .35 },
      { transform: 'translate(-50%, -52px) scale(1)', opacity: 1, offset: .75 },
      { transform: 'translate(-50%, -64px) scale(1)', opacity: 0 },
    ], { duration: 1200, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => plus.remove();

    for (let i = 0; i < 6; i++){
      const coin = document.createElement('span');
      coin.className = 'pk-burst-coin';
      plinkoBoard.appendChild(coin);
      const dx = (i - 2.5) * 14 + (Math.random() * 8 - 4);
      const up = 40 + Math.random() * 26;
      coin.animate([
        { transform: `translate(${x}px, ${y}px) scale(.4) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${x + dx * .6}px, ${y - up}px) scale(1) rotate(${dx * 6}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(${x + dx}px, ${y - up * .55}px) scale(.85) rotate(${dx * 10}deg)`, opacity: 0 },
      ], { duration: 900, delay: i * 30, fill: 'backwards', easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => coin.remove();
    }
  }

  // Live wins ticker at the top of the stage (prototype social proof)
  const pkTickerText = $('pkTickerText');
  const TICKER_WINS = [
    ['Sara A.',   'SAR 25'],
    ['Khalid M.', 'SAR 1,000'],
    ['Noura S.',  'SAR 5'],
    ['Faisal R.', 'SAR 25'],
    ['Reem T.',   'SAR 5'],
  ];
  let tickerIdx = 0;
  function renderTicker(){
    const [name, prize] = TICKER_WINS[tickerIdx];
    pkTickerText.innerHTML = `<span class="pk-ticker__name">${name}</span> just won <b>${prize.slice(4)}${RIYAL_ICON}</b>`;
  }
  renderTicker();
  setInterval(() => {
    if (state.option !== '4') return;
    pkTickerText.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-6px)' },
    ], { duration: 220, easing: 'ease-in' }).onfinish = () => {
      tickerIdx = (tickerIdx + 1) % TICKER_WINS.length;
      renderTicker();
      pkTickerText.animate([
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 260, easing: 'ease-out' });
    };
  }, 3200);

  function dropBall(){
    if (plinkoState.dropping) return;
    if (state.plays <= 0){
      plinkoBtn.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
      ], { duration: 260 });
      return;
    }
    const g = plinkoState.geom;
    plinkoState.dropping = true;
    plinkoGame.classList.remove('is-ready');
    plinkoGame.classList.add('is-dropping');
    plinkoBoard.querySelectorAll('.pk-slot').forEach(s => s.classList.remove('is-won', 'is-target'));
    plinkoBtn.disabled = true;
    plinkoBtnText.textContent = 'Dropping…';

    // Pick the box first, then shuffle a left/right bounce for each peg row so the ball ends in it:
    // the box index equals the number of rightward bounces
    const target = pickWeighted(PLINKO_WEIGHTS);
    const moves = Array.from({ length: PEG_ROWS }, (_, j) => (j < target ? 1 : -1));
    for (let j = moves.length - 1; j > 0; j--){
      const k = Math.floor(Math.random() * (j + 1));
      [moves[j], moves[k]] = [moves[k], moves[j]];
    }

    const contactY = row => g.rowY[row] - PEG_R - BALL_R;
    const restY = g.slotTop - BALL_R + 2;
    const slotEl = plinkoBoard.querySelector(`.pk-slot[data-idx="${target}"]`);
    const segs = [];
    // Released from the ship: falls straight onto the top peg, speeding up
    segs.push({ dur: 420, at: t => ({ x: g.cx, y: g.startY + (contactY(0) - g.startY) * t * t }) });
    let x = g.cx;
    for (let row = 0; row < PEG_ROWS; row++){
      const nx = x + moves[row] * g.S / 2;
      const last = row === PEG_ROWS - 1;
      const pegX = x;
      segs.push(hop(x, contactY(row), nx, last ? restY : contactY(row + 1), 16 - row * 2, last ? 380 : 330, () => {
        hitPeg(row, pegX);
        // Off the last peg: the box it is heading for lights up in anticipation
        if (last) slotEl.classList.add('is-target');
      }));
      x = nx;
    }
    // Settles on the box with two small bounces
    const landing = hop(x, restY, x, restY, 9, 220, () => {
      slotEl.classList.remove('is-target');
      slotEl.classList.add('is-won');
      celebrateSlot(slotEl, target);
    });
    const settle = hop(x, restY, x, restY, 3.5, 150);
    landing.noTrail = settle.noTrail = true;
    segs.push(landing, settle);

    runBallPath(segs, () => {
      state.plays = Math.max(0, state.plays - 1);
      refreshHero();
      refreshDiceHint();
      setTimeout(() => {
        openDiceCelebration(PLINKO_SLOTS[target].cents);
        plinkoState.dropping = false;
        plinkoGame.classList.remove('is-dropping');
        refreshPlinkoBtn();
        // Load a fresh ball into the ship behind the overlay
        if (state.plays > 0){
          setTimeout(() => {
            pkBall.classList.add('is-hidden');
            setTimeout(() => {
              placeBall(g.cx, g.startY);
              pkBall.classList.remove('is-hidden');
              plinkoGame.classList.add('is-ready');
            }, 320);
          }, 900);
        }
      }, 1000); // lets the "+amount" pop play before the overlay
    });
  }

  function applyOption(opt){
    state.option = opt;
    document.querySelectorAll('.option-btn').forEach(b => {
      const isActive = b.dataset.option === opt;
      b.classList.toggle('is-active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    // Options 3 and 4 run on the dark space theme, which covers the status bar too
    const isSpace = opt === '3' || opt === '4';
    document.getElementById('screen').classList.toggle('is-dq', isSpace);
    gameEl.classList.toggle('is-space', isSpace);
    gameEl.classList.toggle('is-option-4', opt === '4');
    if (opt === '3'){
      // Reset plays to fit the 3-attempt model
      diceState.attemptsTotal = 3;
      state.plays = 3;
      gameEl.classList.add('is-option-3');
      buildDiceBoard();
      resetDiceTiles();
      refreshDiceHint();
      resetDiceStage();
    } else if (opt === '4'){
      // Same 3-attempt model as the dice game
      diceState.attemptsTotal = 3;
      state.plays = 3;
      gameEl.classList.remove('is-option-3');
      layoutPlinko();
      resetPlinko();
      refreshDiceHint();
    } else {
      gameEl.classList.remove('is-option-3');
      heroSub.textContent = 'Tap a mystery card to win your cashback';
      buildGrid();
    }
    refreshHero();
  }

  // ---------- Wire up ----------
  overlayCl.addEventListener('click', () => closeOverlay(true));
  overlayCta.addEventListener('click', () => {
    overlayCtaText.textContent = 'Added ✓';
    setTimeout(() => closeOverlay(true), 500);
  });
  diceRollBtn.addEventListener('click', rollDice);
  plinkoBtn.addEventListener('click', dropBall);
  window.addEventListener('resize', () => {
    if (state.option === '4' && !plinkoState.dropping){ layoutPlinko(); resetPlinko(); }
    if (state.option === '3' && !diceState.rolling){ placeDie(diceState.tileIdx); }
  });

  // Small prize sheet (Option 1, low amounts) — partial bottom sheet
  const smallSheet           = $('smallSheet');
  const smallBackdrop        = $('smallBackdrop');
  const smallSheetClose      = $('smallSheetClose');
  const smallSheetCta        = $('smallSheetCta');
  const smallSheetAmount     = $('smallSheetAmount');
  const smallSheetBigAmount  = $('smallSheetBigAmount');
  const smallSheetSteps      = $('smallSheetSteps');

  // Threshold (in cents) — below this triggers the simple small-prize sheet
  const SMALL_PRIZE_THRESHOLD_CENTS = 500; // ≤ 5 SAR = small

  // Build the 4-step tier indicator: shows Lv 1-4, marking all levels ≤ currentLevel as done
  function buildSmallSheetSteps(currentLevel){
    if (!smallSheetSteps) return; // steps element removed from HTML — skip
    smallSheetSteps.innerHTML = '';
    for (let i = 0; i < 4; i++){
      const lvl = i + 1;
      if (lvl > REWARD_TIERS.length) break;
      const tier = REWARD_TIERS[lvl - 1];
      const done = lvl <= currentLevel;
      const step = document.createElement('div');
      step.className = `sm-step ${done ? 'sm-step--done' : ''}`;
      step.innerHTML = `
        <div class="sm-step__num">${lvl}</div>
        <div class="sm-step__circle">
          ${done
            ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'}
        </div>
        <div class="sm-step__amount">${RIYAL_ICON}${tier.max}</div>
      `;
      smallSheetSteps.appendChild(step);
    }
  }

  function openSmallPrize(idx, cents){
    state.activeCardIdx = idx;
    state.pendingCents  = cents;
    smallSheetAmount.textContent = formatCents(cents);
    if (smallSheetBigAmount) smallSheetBigAmount.textContent = formatCents(cents);

    // Reset CTA state (in case it was left as "Added ✓" from a previous claim)
    const label = document.getElementById('smallSheetLabel');
    const amountWrap = smallSheetCta && smallSheetCta.querySelector('.ss-cta-amount-wrap');
    if (label) label.textContent = 'Claim';
    if (amountWrap) amountWrap.style.display = '';

    const card = state.cards[idx];
    buildSmallSheetSteps(card.level);
    smallSheet.classList.add('is-open');
    smallSheet.setAttribute('aria-hidden', 'false');
    setFeatureState('reveal');
  }

  function closeSmallSheet(commit){
    if (commit && state.activeCardIdx != null && state.pendingCents != null){
      const card = state.cards[state.activeCardIdx];
      if (!card.revealed){
        card.revealed = true;
        card.amountCents = state.pendingCents;
        state.plays = Math.max(0, state.plays - 1);
        refreshGrid();
        refreshHero();
        // Check completion
        const revealedCount = state.cards.filter(c => c.revealed).length;
        if (revealedCount === TOTAL_CARDS){
          setTimeout(showCompletion, 350);
        }
      }
    }
    smallSheet.classList.remove('is-open');
    smallSheet.setAttribute('aria-hidden', 'true');
    state.activeCardIdx = null;
    state.pendingCents  = null;
    state.rolling       = false;
    setFeatureState('default');
  }

  if (smallBackdrop)   smallBackdrop.addEventListener('click', () => closeSmallSheet(true));
  if (smallSheetClose) smallSheetClose.addEventListener('click', () => closeSmallSheet(true));
  if (smallSheetCta)   smallSheetCta.addEventListener('click', () => {
    const label = document.getElementById('smallSheetLabel');
    const amountWrap = smallSheetCta.querySelector('.ss-cta-amount-wrap');
    if (label) label.textContent = 'Added ✓';
    if (amountWrap) amountWrap.style.display = 'none';
    setTimeout(() => closeSmallSheet(true), 500);
  });

  // Info sheet (only active for Option 1 right now)
  const infoBtn        = $('infoBtn');
  const infoSheet      = $('infoSheet');
  const infoBackdrop   = $('infoBackdrop');
  const infoSheetClose = $('infoSheetClose');
  const infoSheetCta   = $('infoSheetCta');

  function openInfoSheet(){
    if (state.option !== '1') return; // currently only enabled for Option 1
    infoSheet.classList.add('is-open');
    infoSheet.setAttribute('aria-hidden', 'false');
  }
  function closeInfoSheet(){
    infoSheet.classList.remove('is-open');
    infoSheet.setAttribute('aria-hidden', 'true');
  }
  if (infoBtn)         infoBtn.addEventListener('click', openInfoSheet);
  if (infoBackdrop)    infoBackdrop.addEventListener('click', closeInfoSheet);
  if (infoSheetClose)  infoSheetClose.addEventListener('click', closeInfoSheet);
  if (infoSheetCta)    infoSheetCta.addEventListener('click', closeInfoSheet);

  // Option toggle
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const opt = btn.dataset.option;
      if (opt === state.option) return;
      applyOption(opt);
    });
  });

  earnBtn.addEventListener('click', () => {
    state.plays += 1;
    state.streak += 1;
    refreshHero();
    refreshGrid();
    earnBtn.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' },
    ], { duration: 250, easing: 'cubic-bezier(.2,.9,.25,1.4)' });
  });

  completeCta.addEventListener('click', () => {
    hideCompletion();
    resetGame();
  });

  resetBtn.addEventListener('click', resetGame);

  function resetGame(){
    state.cards.forEach(c => { c.revealed = false; c.amountCents = null; });
    state.plays = 3;
    state.streak = 15;
    state.rolling = false;
    state.activeCardIdx = null;
    overlay.classList.remove('is-open','is-rolling','is-revealed');
    overlay.setAttribute('aria-hidden','true');
    completeOverlay.classList.remove('is-open');
    setReelInstant('000');
    // Reset dice game state too
    diceState.rolling = false;
    resetDiceTiles();
    if (state.option === '3') resetDiceStage();
    if (diceRollBtn){
      diceRollBtn.disabled = false;
      diceRollText.textContent = 'Roll the dice';
    }
    refreshDiceHint();
    resetPlinko();
    refreshGrid();
    refreshHero();
    setFeatureState('default');
  }

  // Allow clicking the state tags to scrub through visual states
  if (stateTags) stateTags.addEventListener('click', (e) => {
    const target = e.target.closest('span[data-state]');
    if (!target) return;
    const s = target.dataset.state;
    if (s === 'default'){ closeOverlay(true); }
    if (s === 'pressed'){
      const firstAvail = state.cards.findIndex(c => !c.revealed);
      if (firstAvail >= 0){
        const el = grid.children[firstAvail];
        el.classList.add('is-pressed');
        setFeatureState('pressed');
        setTimeout(() => el.classList.remove('is-pressed'), 600);
      }
    }
    if (s === 'rolling' || s === 'reveal' || s === 'celebrate'){
      const firstAvail = state.cards.findIndex(c => !c.revealed);
      if (firstAvail >= 0 && state.plays > 0) openCard(firstAvail);
    }
  });

  // ---------- Init ----------
  buildReel();
  setReelInstant('000');
  buildGrid();
  refreshHero();
  setFeatureState('default');
  document.querySelectorAll('.streak-info__amt').forEach(el => { el.innerHTML = RIYAL_ICON; });
})();
