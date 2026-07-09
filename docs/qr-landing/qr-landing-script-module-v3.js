/*
  Jerry Can Spirits — QR landing page SCRIPT module v3 (2026-07-09)
  Paste this into the QR platform's CUSTOM SCRIPT module. It pairs with
  qr-landing-html-module-v3.html in the Custom HTML module; each is useless
  without the other.

  The platform injects Custom HTML client-side, where script tags never
  execute — so every behaviour lives here: Turnstile loading, batch config,
  the live Expedition Log feed, native share, Expand All, and the log form
  submit. Everything waits for the #jcs-acc markup to exist before wiring.

  PER-BATCH EDIT: change JCS_CFG below (one place). The HTML module carries
  Batch 001 fallbacks that this config overrides at runtime.
*/

var JCS_CFG = {
  batch: '001',
  batchId: 'batch-001',
  bottled: 'Bottled 09 March 2026',
  checkUrl: 'https://jerrycanspirits.co.uk/batch/001/'
};

/* Expand / collapse all top-level sections (inline onclick in the HTML). */
function jcsToggleAll() {
  var root = document.getElementById('jcs-acc');
  var btn = document.getElementById('jcs-expand-btn');
  if (!root || !btn) return;
  var tops = [];
  root.querySelectorAll('details').forEach(function (d) {
    if (!d.classList.contains('d-recipe')) tops.push(d);
  });
  var anyClosed = tops.some(function (d) { return !d.open; });
  tops.forEach(function (d) { d.open = anyClosed; });
  btn.textContent = anyClosed ? 'Collapse all' : 'Expand all';
}

/* Native share (inline onclick in the HTML; button revealed on init). */
function jcsNativeShare() {
  if (!navigator.share) return;
  navigator.share({
    title: 'Expedition Spiced Rum',
    text: 'Just opened my bottle of Expedition Spiced Rum. Veteran-made British spiced rum.',
    url: 'https://jerrycanspirits.co.uk/'
  }).catch(function () {});
}

/* Expedition Log submit (inline onsubmit in the HTML). Registers a bottle. */
function jcsLogSubmit(e) {
  e.preventDefault();
  var f = e.target, msg = document.getElementById('jcs-log-msg');
  var btn = f.querySelector('button[type=submit]');
  var fd = new FormData(f);
  var token = fd.get('cf-turnstile-response') || '';
  if (!token) {
    msg.className = 'd-log-msg d-log-err';
    msg.textContent = 'Please complete the security check.';
    msg.style.display = 'block';
    return;
  }
  var bottleNumber = parseInt(fd.get('bottle_number'), 10);
  if (!bottleNumber || bottleNumber < 1) {
    msg.className = 'd-log-msg d-log-err';
    msg.textContent = 'Enter the bottle number printed on your label.';
    msg.style.display = 'block';
    return;
  }
  btn.disabled = true; btn.textContent = 'Sending...';
  fetch('https://jerrycanspirits.co.uk/api/expedition-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: fd.get('name').trim(),
      batch_id: JCS_CFG.batchId,
      location: (fd.get('location') || '').trim() || undefined,
      bottles: [{ type: fd.get('bottle_type'), number: bottleNumber }],
      turnstileToken: token,
      website: fd.get('website')
    })
  }).then(function (r) {
    if (r.status === 201) {
      f.style.display = 'none';
      msg.className = 'd-log-msg d-log-ok';
      msg.textContent = "You're on the log. Welcome to the expedition.";
      msg.style.display = 'block';
    } else {
      return r.json().then(function (d) {
        msg.className = 'd-log-msg d-log-err';
        msg.textContent = d.error || 'Something went wrong. Please try again.';
        msg.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Join the Expedition Log';
      });
    }
  }).catch(function () {
    msg.className = 'd-log-msg d-log-err';
    msg.textContent = 'Something went wrong. Please try again.';
    msg.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Join the Expedition Log';
  });
}

/* One-time wiring, run once the injected HTML exists. */
function jcsInit() {
  var root = document.getElementById('jcs-acc');
  if (!root || root.dataset.jcsInit) return;
  root.dataset.jcsInit = '1';

  /* Optional ?b= batch override, then config → DOM (overrides the 001 fallbacks). */
  try {
    var b = new URLSearchParams(window.location.search).get('b');
    if (b && /^[A-Za-z0-9\-]{1,10}$/.test(b)) {
      JCS_CFG.batch = b;
      JCS_CFG.batchId = 'batch-' + b;
      JCS_CFG.checkUrl = 'https://jerrycanspirits.co.uk/batch/' + b + '/';
    }
    document.getElementById('jcs-bottled-line').textContent = JCS_CFG.bottled;
    document.getElementById('jcs-batch-chip').textContent = 'Batch ' + JCS_CFG.batch;
    document.getElementById('jcs-check-link').href = JCS_CFG.checkUrl;
    document.getElementById('jcs-make-batch').textContent =
      'Batch ' + JCS_CFG.batch + ', ' + JCS_CFG.bottled.replace(/^Bottled /, 'bottled ');
  } catch (e) {}

  /* Load Turnstile properly (a script tag inside the HTML module never runs). */
  try {
    if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
      var ts = document.createElement('script');
      ts.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      ts.async = true; ts.defer = true;
      document.head.appendChild(ts);
    }
  } catch (e) {}

  /* Reveal the native share button where supported. */
  try {
    if (navigator.share) {
      var sh = document.getElementById('jcs-share-native');
      if (sh) sh.style.display = 'flex';
    }
  } catch (e) {}

  /* Live log feed: fetch once, when the log section first opens. */
  try {
    var d = document.getElementById('jcs-log-details'), loaded = false;
    d.addEventListener('toggle', function () {
      if (!d.open || loaded) return; loaded = true;
      fetch('https://jerrycanspirits.co.uk/api/expedition-log/feed?batch=' +
            encodeURIComponent(JCS_CFG.batchId) + '&limit=5')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.count) return;
          document.getElementById('jcs-feed-count').textContent =
            data.count + (data.count === 1 ? ' bottle' : ' bottles') +
            ' from Batch ' + JCS_CFG.batch + ' on the log';
          var rows = document.getElementById('jcs-feed-rows');
          (data.entries || []).forEach(function (e) {
            var row = document.createElement('div'); row.className = 'd-feed-row';
            var n = document.createElement('span'); n.className = 'd-feed-name'; n.textContent = e.name;
            var l = document.createElement('span'); l.className = 'd-feed-loc'; l.textContent = e.location || '';
            row.appendChild(n); row.appendChild(l); rows.appendChild(row);
          });
          document.getElementById('jcs-feed').style.display = 'block';
        }).catch(function () {});
    });
  } catch (e) {}
}

/* The platform renders the HTML module client-side at an unknown moment, so
   poll briefly for the markup, then wire once. Cheap and idempotent. */
(function () {
  var tries = 0;
  var t = setInterval(function () {
    tries++;
    if (document.getElementById('jcs-acc')) { jcsInit(); clearInterval(t); }
    else if (tries > 100) { clearInterval(t); }
  }, 150);
  if (document.readyState !== 'loading') {
    if (document.getElementById('jcs-acc')) { jcsInit(); clearInterval(t); }
  }
})();
