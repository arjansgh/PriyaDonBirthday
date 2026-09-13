/* ============================================================
   letter-lock.js  (v3 — root-cause fix)
   ------------------------------------------------------------
   Adds a password gate to the "A Letter For You" envelope,
   WITHOUT modifying index.html or script.js.

   WHY THE PREVIOUS VERSION DIDN'T WORK:
   It attached its intercepting click listener directly to the #envelope
   element with {capture:true}. That flag only affects listener order
   for ANCESTOR elements — for the element that IS the actual click
   target, all listeners (capture or not) fire in the order they were
   registered, regardless of the capture flag. Since script.js attaches
   its own "open the letter" listener first, that one always ran first,
   so the password gate never actually blocked anything.

   THE FIX:
   This version attaches its listener to `document` (an ancestor of the
   envelope) instead of the envelope itself. Ancestor-level capture
   listeners genuinely run before the target's own listeners during the
   real capturing phase, so this reliably intercepts the click no matter
   what order the scripts load in.

   HOW TO INSTALL:
   Keep this file where it already is in your repo, alongside script.js.
   In index.html, keep the existing line right after <script src="script.js">:

        <script src="letter-lock.js"></script>

   HOW TO CHECK IT'S RUNNING:
   Open your site, press F12 to open the browser console, and reload.
   You should see:  [letter-lock] script loaded, envelope found: true

   TO CHANGE THE PASSWORD: edit the PASSWORD constant below.
   ============================================================ */
(function () {
  var PASSWORD = 'buttercup'; // compared case-insensitively; edit here to change it

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var envelope = document.getElementById('envelope');
    console.log('[letter-lock] script loaded, envelope found:', !!envelope);
    if (!envelope) {
      console.warn('[letter-lock] Could not find an element with id="envelope". The password gate cannot attach.');
      return;
    }

    var unlocked = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- styles (self-contained fallback styling) ---------- */
    var style = document.createElement('style');
    style.textContent = [
      '.pw-modal-overlay{position:fixed;inset:0;z-index:99999;background:rgba(10,5,18,0.8);',
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;',
      'justify-content:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .3s ease;}',
      '.pw-modal-overlay.show{opacity:1;pointer-events:auto;}',
      '.pw-modal{max-width:340px;width:100%;padding:34px 26px;text-align:center;',
      'transform:scale(.92);transition:transform .35s cubic-bezier(.34,1.56,.64,1);',
      'font-family:var(--font-body,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);',
      'background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);',
      'border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.5);}',
      '.pw-modal-overlay.show .pw-modal{transform:scale(1);}',
      '.pw-modal-icon{font-size:2rem;margin-bottom:12px;}',
      '.pw-modal-text{font-size:.95rem;line-height:1.65;color:#fdf6ff;font-weight:400;margin:0 0 20px;}',
      '.pw-modal-input{width:100%;box-sizing:border-box;padding:12px 18px;border-radius:100px;',
      'border:1.5px solid rgba(255,255,255,.35);background:rgba(255,255,255,.1);',
      'color:#fdf6ff;font-size:1rem;text-align:center;outline:none;font-family:inherit;}',
      '.pw-modal-input:focus{border-color:#ff6fa5;}',
      '.pw-modal-error{color:#ff9cb0;font-size:.82rem;margin:10px 0 0;min-height:1.2em;}',
      '.pw-modal-error.shake{animation:pwShake .4s ease;}',
      '@keyframes pwShake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}',
      '.pw-modal-actions{display:flex;flex-direction:column;gap:12px;margin-top:22px;}',
      '.pw-btn{font-family:inherit;font-size:.95rem;font-weight:600;padding:14px 22px;',
      'border-radius:100px;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}',
      '.pw-btn-primary{color:#0a0512;background:linear-gradient(135deg,#ffe6ab,#f4c869 45%,#ff6fa5);}',
      '.pw-btn-ghost{color:#fdf6ff;background:rgba(255,255,255,0.08);border:1.5px solid rgba(255,255,255,0.35);}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'pw-modal-overlay';
    overlay.id = 'pwModalOverlay';
    overlay.innerHTML =
      '<div class="pw-modal">' +
        '<div class="pw-modal-icon">🔒</div>' +
        '<p class="pw-modal-text">On the demand of Daroga Ji this letter has been password protected. Enter the password to read it.</p>' +
        '<input type="password" id="pwModalInput" class="pw-modal-input" placeholder="Enter password" autocomplete="off" inputmode="text">' +
        '<p class="pw-modal-error" id="pwModalError"></p>' +
        '<div class="pw-modal-actions">' +
          '<button class="pw-btn pw-btn-primary" id="pwModalUnlockBtn" type="button">Unlock 🔓</button>' +
          '<button class="pw-btn pw-btn-ghost" id="pwModalSkipBtn" type="button">Skip, continue to next page ➜</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    var input = document.getElementById('pwModalInput');
    var errorEl = document.getElementById('pwModalError');
    var unlockBtn = document.getElementById('pwModalUnlockBtn');
    var skipBtn = document.getElementById('pwModalSkipBtn');

    function openModal() {
      overlay.classList.add('show');
      errorEl.textContent = '';
      input.value = '';
      setTimeout(function () { input.focus(); }, 300);
    }
    function closeModal() {
      overlay.classList.remove('show');
    }

    function tryUnlock() {
      var val = (input.value || '').trim().toLowerCase();
      if (val === PASSWORD) {
        unlocked = true;
        closeModal();
        // re-fire a real click on the envelope now that we're unlocked, so
        // the site's own open-the-letter logic runs exactly as it always did
        envelope.click();
      } else {
        errorEl.textContent = 'Incorrect password, try again 🙈';
        if (!reduceMotion) {
          errorEl.classList.remove('shake');
          void errorEl.offsetWidth; // force reflow so the animation can replay
          errorEl.classList.add('shake');
        }
      }
    }

    unlockBtn.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') tryUnlock();
    });
    skipBtn.addEventListener('click', function () {
      closeModal();
      if (typeof window.goToPage === 'function') {
        window.goToPage('cake');
      }
    });
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    /* ---------- THE ACTUAL FIX ----------
       Attach at the document level (an ANCESTOR of the envelope), not on
       the envelope itself. Ancestor capture-phase listeners genuinely run
       before the target's own listeners, regardless of script load order. */
    function isEnvelopeTarget(e) {
      var el = e.target;
      return el === envelope || (el.closest && el.closest('#envelope'));
    }
    function guardClick(e) {
      if (unlocked) return; // already unlocked — let the real handler run normally
      if (!isEnvelopeTarget(e)) return;
      e.stopPropagation();
      e.preventDefault();
      openModal();
    }
    function guardKey(e) {
      if (unlocked) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (!isEnvelopeTarget(e)) return;
      e.stopPropagation();
      e.preventDefault();
      openModal();
    }
    document.addEventListener('click', guardClick, true);
    document.addEventListener('keydown', guardKey, true);

    /* ---------- re-lock the letter whenever the story is replayed ---------- */
    var replayBtn = document.getElementById('replayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () { unlocked = false; });
    }
  });
})();
