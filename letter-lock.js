/* ============================================================
   letter-lock.js
   ------------------------------------------------------------
   Adds a password gate to the "A Letter For You" envelope,
   WITHOUT modifying index.html or script.js.

   HOW TO INSTALL:
   1. Add this file to your repo (same folder as script.js works fine).
   2. In index.html, add ONE line right after your existing
      <script src="script.js"></script> tag:

        <script src="letter-lock.js"></script>

   That's it — no other changes needed. This file finds the existing
   #envelope element and the existing #replayBtn element at runtime
   and hooks into them; it doesn't require any IDs or markup to change.

   HOW IT WORKS:
   - It listens for clicks/taps on the envelope in the "capture" phase,
     which runs BEFORE your existing open-the-letter click handler.
   - If the letter hasn't been unlocked yet, it stops that original
     handler from running and shows a password popup instead.
   - Once the correct password is entered, it marks the letter as
     unlocked and re-triggers a click on the envelope so your existing
     open animation / typewriter runs exactly as before.
   - A "Skip" button in the popup jumps straight to the next page
     (the cake page) via the site's existing goToPage() function.
   - Replaying the story (via #replayBtn) re-locks the letter.

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
    if (!envelope) return; // letter section not found — do nothing

    var unlocked = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- build the popup (markup + styles), injected at runtime ---------- */
    var style = document.createElement('style');
    style.textContent = [
      '.pw-modal-overlay{position:fixed;inset:0;z-index:500;background:rgba(10,5,18,0.75);',
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:flex;align-items:center;',
      'justify-content:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .3s ease;}',
      '.pw-modal-overlay.show{opacity:1;pointer-events:auto;}',
      '.pw-modal{max-width:340px;width:100%;padding:34px 26px;text-align:center;',
      'transform:scale(.92);transition:transform .35s cubic-bezier(.34,1.56,.64,1);',
      'font-family:var(--font-body,-apple-system,sans-serif);}',
      '.pw-modal-overlay.show .pw-modal{transform:scale(1);}',
      '.pw-modal-icon{font-size:2rem;margin-bottom:12px;}',
      '.pw-modal-text{font-size:.92rem;line-height:1.65;color:var(--white,#fdf6ff);font-weight:300;margin:0 0 20px;}',
      '.pw-modal-input{width:100%;box-sizing:border-box;padding:12px 18px;border-radius:100px;',
      'border:1.5px solid var(--glass-border,rgba(255,255,255,.3));background:rgba(255,255,255,.08);',
      'color:var(--white,#fdf6ff);font-size:.95rem;text-align:center;outline:none;',
      'font-family:var(--font-body,inherit);}',
      '.pw-modal-input:focus{border-color:var(--rose,#ff6fa5);}',
      '.pw-modal-error{color:#ff9cb0;font-size:.8rem;margin:10px 0 0;min-height:1.2em;}',
      '.pw-modal-error.shake{animation:pwShake .4s ease;}',
      '@keyframes pwShake{0%,100%{transform:translateX(0);}25%{transform:translateX(-6px);}75%{transform:translateX(6px);}}',
      '.pw-modal-actions{display:flex;flex-direction:column;gap:12px;margin-top:22px;}'
    ].join('');
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'pw-modal-overlay';
    overlay.id = 'pwModalOverlay';
    overlay.innerHTML =
      '<div class="pw-modal glass">' +
        '<div class="pw-modal-icon">🔒</div>' +
        '<p class="pw-modal-text">On the demand of Daroga Ji this letter has been password protected. Enter the password to read it.</p>' +
        '<input type="password" id="pwModalInput" class="pw-modal-input" placeholder="Enter password" autocomplete="off" inputmode="text">' +
        '<p class="pw-modal-error" id="pwModalError"></p>' +
        '<div class="pw-modal-actions">' +
          '<button class="btn tap" id="pwModalUnlockBtn" type="button">Unlock 🔓</button>' +
          '<button class="btn btn-ghost tap" id="pwModalSkipBtn" type="button">Skip, continue to next page ➜</button>' +
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

    /* ---------- intercept the envelope BEFORE the site's own handler ---------- */
    function guard(e) {
      if (unlocked) return; // already unlocked — let the real handler run normally
      e.stopImmediatePropagation();
      e.preventDefault();
      openModal();
    }
    envelope.addEventListener('click', guard, true);
    envelope.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') guard(e);
    }, true);

    /* ---------- re-lock the letter whenever the story is replayed ---------- */
    var replayBtn = document.getElementById('replayBtn');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () { unlocked = false; });
    }
  });
})();
