/**
 * FL VSL Fake-Seekbar Player
 * Zero deps. Modes: video | audio (+ 9:16 poster + waveform UX).
 * Seekbar display-only (hinge curve). Speed: 1x → 1.5x → 2x → 1x.
 * Start: manual | attempt | click-to-listen (muted teaser → Clique para ouvir).
 *
 * Volume note: browsers cannot read OS/device volume (Spotify/WhatsApp are native).
 * We control HTMLMediaElement.volume, enforce min on engage, and show a volume nudge.
 */
(function (global) {
  'use strict';

  var RATES = [1, 1.5, 2];
  var WAVE_BARS = 20;
  var DEFAULT_MIN_VOLUME = 0.4;
  var DEFAULT_ENGAGE_VOLUME = 1;

  var ICONS = {
    play: '<svg class="fl-vsl__icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg class="fl-vsl__icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>',
    volume: '<svg class="fl-vsl__icon-volume" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a3.5 3.5 0 0 0-1.8-3.1v6.2A3.5 3.5 0 0 0 16.5 12zM14 4.1v2.1a6.5 6.5 0 0 1 0 11.6v2.1a8.5 8.5 0 0 0 0-15.8z"/></svg>'
  };

  function clamp01(n) {
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  function parseFloatAttr(el, name, fallback) {
    var raw = el.getAttribute(name);
    if (raw == null || raw === '') return fallback;
    var n = parseFloat(raw);
    return isFinite(n) ? n : fallback;
  }

  function parseBoolAttr(el, name, fallback) {
    var raw = el.getAttribute(name);
    if (raw == null || raw === '') return fallback;
    raw = String(raw).toLowerCase();
    if (raw === '0' || raw === 'false' || raw === 'off' || raw === 'no') return false;
    if (raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes') return true;
    return fallback;
  }

  function escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  /** Piecewise hinge: fast until hingeReal, then slow to 100%. */
  function mapVisual(realRatio, hingeReal, hingeVisual) {
    var t = clamp01(realRatio);
    var hr = hingeReal > 0 && hingeReal < 1 ? hingeReal : 0.4;
    var hv = hingeVisual > 0 && hingeVisual < 1 ? hingeVisual : 0.68;
    if (t <= hr) return (t / hr) * hv;
    return hv + ((t - hr) / (1 - hr)) * (1 - hv);
  }

  function formatRate(rate) {
    if (rate === 1) return '1x';
    if (rate === 1.5) return '1.5x';
    if (rate === 2) return '2x';
    return rate + 'x';
  }

  function emit(root, name, detail) {
    try {
      root.dispatchEvent(new CustomEvent(name, { detail: detail || {}, bubbles: true }));
    } catch (e) { /* ignore */ }
  }

  function buildWaveHtml() {
    var html = '';
    var i;
    for (i = 0; i < WAVE_BARS; i++) html += '<span class="fl-vsl__wave-bar"></span>';
    return html;
  }

  /**
   * Resolve start mode.
   * Prefers data-start-mode; falls back to data-autoplay for backwards compat.
   * Values: manual | attempt | click-to-listen
   */
  function resolveStartMode(root) {
    var start = (root.getAttribute('data-start-mode') || '').toLowerCase();
    if (start === 'manual' || start === 'attempt' || start === 'click-to-listen') return start;

    var ap = (root.getAttribute('data-autoplay') || 'off').toLowerCase();
    if (ap === 'click-to-listen' || ap === 'muted' || ap === 'teaser') return 'click-to-listen';
    if (ap === 'attempt' || ap === 'true' || ap === '1' || ap === 'on') return 'attempt';
    return 'manual';
  }

  function buildMarkup(cfg) {
    var listenLabel = cfg.listenLabel;
    return [
      '<div class="fl-vsl__stage" data-fl-vsl-stage>',
      '  <video class="fl-vsl__teaser" data-fl-vsl-teaser playsinline webkit-playsinline muted loop preload="metadata" aria-hidden="true"></video>',
      '  <img class="fl-vsl__poster" data-fl-vsl-poster alt="" decoding="async"',
      cfg.poster ? ' src="' + escapeAttr(cfg.poster) + '"' : '',
      '>',
      cfg.mode === 'audio' ? '  <div class="fl-vsl__wave" data-fl-vsl-wave aria-hidden="true">' + buildWaveHtml() + '</div>' : '',
      '  <div class="fl-vsl__gate" data-fl-vsl-gate role="button" tabindex="0" aria-label="' + escapeAttr(listenLabel) + '">',
      '    <span class="fl-vsl__unlock-icon">' + ICONS.play + '</span>',
      '    <p class="fl-vsl__unlock-text" data-fl-vsl-gate-text>' + escapeAttr(listenLabel) + '</p>',
      '    <p class="fl-vsl__gate-hint" data-fl-vsl-gate-hint>Aumente o volume do aparelho</p>',
      '  </div>',
      '  <div class="fl-vsl__volume-nudge" data-fl-vsl-nudge hidden>',
      '    <span data-fl-vsl-nudge-text>Aumente o volume do celular para ouvir</span>',
      '    <button type="button" class="fl-vsl__nudge-dismiss" data-fl-vsl-nudge-dismiss aria-label="Fechar">×</button>',
      '  </div>',
      '  <div class="fl-vsl__chrome">',
      '    <div class="fl-vsl__controls">',
      '      <button type="button" class="fl-vsl__btn fl-vsl__btn--play" data-fl-vsl-play aria-label="Play">',
      ICONS.play + ICONS.pause,
      '      </button>',
      '      <button type="button" class="fl-vsl__rate" data-fl-vsl-rate aria-label="Velocidade de reprodução">1x</button>',
      '      <span class="fl-vsl__spacer"></span>',
      '      <div class="fl-vsl__vol" data-fl-vsl-vol>',
      '        <button type="button" class="fl-vsl__btn fl-vsl__btn--vol" data-fl-vsl-vol-btn aria-label="Volume">' + ICONS.volume + '</button>',
      '        <input type="range" class="fl-vsl__vol-range" data-fl-vsl-vol-range min="0" max="100" step="1" value="100" aria-label="Volume do player">',
      '      </div>',
      '    </div>',
      '    <div class="fl-vsl__seek" data-fl-vsl-seek aria-hidden="true">',
      '      <span class="fl-vsl__seek-fill" data-fl-vsl-seek-fill></span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function createMedia(cfg) {
    var el;
    if (cfg.mode === 'audio') {
      el = document.createElement('audio');
      el.className = 'fl-vsl__media fl-vsl__media--audio';
    } else {
      el = document.createElement('video');
      el.className = 'fl-vsl__media';
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      if (cfg.poster) el.setAttribute('poster', cfg.poster);
    }
    el.preload = 'auto';
    el.setAttribute('playsinline', '');
    el.src = cfg.src;
    el.setAttribute('title', cfg.title);
    el.volume = DEFAULT_ENGAGE_VOLUME;
    return el;
  }

  function readConfig(root) {
    var mode = (root.getAttribute('data-mode') || 'video').toLowerCase();
    if (mode !== 'audio' && mode !== 'video') mode = 'video';
    var startMode = resolveStartMode(root);
    var listenLabel = root.getAttribute('data-listen-label') || 'Clique para ouvir';
    return {
      mode: mode,
      src: root.getAttribute('data-src') || '',
      poster: root.getAttribute('data-poster') || '',
      teaserSrc: root.getAttribute('data-teaser-src') || '',
      title: root.getAttribute('data-title') || 'VSL',
      hingeReal: parseFloatAttr(root, 'data-hinge-real', 0.4),
      hingeVisual: parseFloatAttr(root, 'data-hinge-visual', 0.68),
      startMode: startMode,
      listenLabel: listenLabel,
      volumeNudge: parseBoolAttr(root, 'data-volume-nudge', true),
      minVolume: clamp01(parseFloatAttr(root, 'data-min-volume', DEFAULT_MIN_VOLUME)),
      engageVolume: clamp01(parseFloatAttr(root, 'data-engage-volume', DEFAULT_ENGAGE_VOLUME)),
      aspect: root.getAttribute('data-aspect') || '',
      accent: root.getAttribute('data-accent') || ''
    };
  }

  function Player(root) {
    this.root = root;
    this.cfg = readConfig(root);
    this.media = null;
    this.teaser = null;
    this.rateIndex = 0;
    this.started = false;
    this.engaged = false;
    this._destroyed = false;
    this._nudgeTimer = null;
    this._onTime = this._onTime.bind(this);
    this._onPlay = this._onPlay.bind(this);
    this._onPause = this._onPause.bind(this);
    this._onEnded = this._onEnded.bind(this);
    this._mount();
  }

  Player.prototype._mount = function () {
    var cfg = this.cfg;
    var root = this.root;

    if (!cfg.src) {
      console.warn('[FLVslPlayer] missing data-src');
      return;
    }

    root.classList.add('fl-vsl');
    root.setAttribute('data-mode', cfg.mode);
    root.setAttribute('data-start-mode', cfg.startMode);
    if (cfg.accent) root.style.setProperty('--fl-vsl-accent', cfg.accent);

    root.innerHTML = buildMarkup(cfg);

    var stage = root.querySelector('[data-fl-vsl-stage]');
    if (cfg.aspect) stage.style.aspectRatio = cfg.aspect;

    this.media = createMedia(cfg);
    stage.insertBefore(this.media, stage.firstChild);

    this.teaser = root.querySelector('[data-fl-vsl-teaser]');
    this.els = {
      stage: stage,
      poster: root.querySelector('[data-fl-vsl-poster]'),
      gate: root.querySelector('[data-fl-vsl-gate]'),
      gateHint: root.querySelector('[data-fl-vsl-gate-hint]'),
      nudge: root.querySelector('[data-fl-vsl-nudge]'),
      nudgeDismiss: root.querySelector('[data-fl-vsl-nudge-dismiss]'),
      playBtn: root.querySelector('[data-fl-vsl-play]'),
      rateBtn: root.querySelector('[data-fl-vsl-rate]'),
      volBtn: root.querySelector('[data-fl-vsl-vol-btn]'),
      volRange: root.querySelector('[data-fl-vsl-vol-range]'),
      fill: root.querySelector('[data-fl-vsl-seek-fill]')
    };

    if (!cfg.poster && this.els.poster) this.els.poster.style.display = 'none';
    if (!cfg.volumeNudge && this.els.gateHint) this.els.gateHint.hidden = true;

    this.media.addEventListener('timeupdate', this._onTime);
    this.media.addEventListener('play', this._onPlay);
    this.media.addEventListener('pause', this._onPause);
    this.media.addEventListener('ended', this._onEnded);

    var self = this;
    this.els.playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!self.engaged) {
        self.engage();
        return;
      }
      self.toggle();
    });
    this.els.rateBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!self.engaged) return;
      self.cycleRate();
    });
    this.els.volBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      root.classList.toggle('is-vol-open');
    });
    this.els.volRange.addEventListener('input', function (e) {
      e.stopPropagation();
      self.setVolume(parseInt(self.els.volRange.value, 10) / 100);
    });
    this.els.volRange.addEventListener('click', function (e) { e.stopPropagation(); });
    if (this.els.nudgeDismiss) {
      this.els.nudgeDismiss.addEventListener('click', function (e) {
        e.stopPropagation();
        self.hideVolumeNudge();
      });
    }

    this.els.stage.addEventListener('click', function (e) {
      if (e.target.closest('.fl-vsl__controls') || e.target.closest('.fl-vsl__vol')) return;
      if (e.target.closest('[data-fl-vsl-nudge-dismiss]')) return;
      if (!self.engaged) {
        self.engage();
        return;
      }
      if (root.classList.contains('is-blocked')) {
        self._clearBlocked();
        self.play();
        return;
      }
      self.toggle();
    });
    this.els.gate.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        self.engage();
      }
    });

    this.setRate(RATES[0], true);
    this.setVolume(cfg.engageVolume, true);
    this._applyStartMode();
  };

  Player.prototype._applyStartMode = function () {
    var mode = this.cfg.startMode;
    if (mode === 'click-to-listen') {
      this._enterTeaserGate();
      return;
    }
    if (mode === 'attempt') {
      this._hideGate();
      this._attemptAutoplay();
      return;
    }
    /* manual: show gate, no teaser unless teaser-src provided */
    this._showGate(false);
    if (this.cfg.teaserSrc) this._startTeaser(this.cfg.teaserSrc);
  };

  Player.prototype._showGate = function (withTeaserClass) {
    this.root.classList.add('is-gated');
    if (withTeaserClass) this.root.classList.add('is-teaser');
    else this.root.classList.remove('is-teaser');
    if (this.els.gate) this.els.gate.hidden = false;
  };

  Player.prototype._hideGate = function () {
    this.root.classList.remove('is-gated');
    this.root.classList.remove('is-teaser');
    if (this.els.gate) this.els.gate.hidden = true;
  };

  Player.prototype._enterTeaserGate = function () {
    this._showGate(true);
    var teaserUrl = this.cfg.teaserSrc;
    if (!teaserUrl && this.cfg.mode === 'video') teaserUrl = this.cfg.src;
    if (teaserUrl) this._startTeaser(teaserUrl);
    else if (this.teaser) this.teaser.style.display = 'none';
  };

  Player.prototype._startTeaser = function (url) {
    if (!this.teaser || !url) return;
    var self = this;
    this.teaser.src = url;
    this.teaser.muted = true;
    this.teaser.defaultMuted = true;
    this.teaser.setAttribute('muted', '');
    this.teaser.loop = true;
    this.teaser.playsInline = true;
    this.teaser.style.display = 'block';
    this.root.classList.add('is-teaser');
    var p = this.teaser.play();
    if (p && typeof p.then === 'function') {
      p.catch(function () {
        /* muted autoplay can still fail on some policies — gate still works */
        emit(self.root, 'flvsl:teaser-blocked', {});
      });
    }
  };

  Player.prototype._stopTeaser = function () {
    if (!this.teaser) return;
    try {
      this.teaser.pause();
      this.teaser.removeAttribute('src');
      this.teaser.load();
    } catch (e) { /* ignore */ }
    this.teaser.style.display = 'none';
    this.root.classList.remove('is-teaser');
  };

  /** User gesture: leave gate, start real media unmuted from 0. */
  Player.prototype.engage = function () {
    if (this._destroyed) return Promise.resolve(false);
    if (this.engaged && !this.root.classList.contains('is-blocked')) {
      return this.play();
    }

    this.engaged = true;
    this._stopTeaser();
    this._hideGate();
    this._clearBlocked();

    var media = this.media;
    if (!media) return Promise.resolve(false);

    media.muted = false;
    media.removeAttribute('muted');
    this.setVolume(Math.max(this.cfg.engageVolume, this.cfg.minVolume), true);
    try { media.currentTime = 0; } catch (e) { /* ignore */ }

    var self = this;
    return this.play().then(function (ok) {
      if (ok) {
        emit(self.root, 'flvsl:engage', {
          media: self.cfg.mode,
          volume: media.volume,
          minVolume: self.cfg.minVolume
        });
        if (self.cfg.volumeNudge) self.showVolumeNudge();
      } else {
        self._showBlocked();
      }
      return ok;
    });
  };

  Player.prototype._attemptAutoplay = function () {
    var self = this;
    var media = this.media;
    if (!media) return;
    media.muted = false;
    this.engaged = true;
    this.play().then(function (ok) {
      if (!ok) {
        self.engaged = false;
        self._showBlocked();
        return;
      }
      if (self.cfg.volumeNudge) self.showVolumeNudge();
    });
  };

  Player.prototype._showBlocked = function () {
    this.root.classList.add('is-blocked');
    this._showGate(false);
    if (this.els.gate) {
      var t = this.root.querySelector('[data-fl-vsl-gate-text]');
      if (t) t.textContent = this.cfg.listenLabel;
    }
    emit(this.root, 'flvsl:blocked', { media: this.cfg.mode });
    this._bindUnlockGestures();
  };

  Player.prototype._clearBlocked = function () {
    this.root.classList.remove('is-blocked');
  };

  Player.prototype._bindUnlockGestures = function () {
    if (this._unlockBound) return;
    this._unlockBound = true;
    var self = this;
    var events = ['pointerdown', 'touchstart', 'keydown'];
    function unlock(ev) {
      if (ev.target && ev.target.closest && ev.target.closest('.fl-vsl')) return;
      self.engage().then(function (ok) {
        if (!ok) return;
        events.forEach(function (name) {
          window.removeEventListener(name, unlock, true);
        });
      });
    }
    events.forEach(function (ev) {
      window.addEventListener(ev, unlock, { capture: true, passive: true });
    });
    this._unlockHandler = unlock;
    this._unlockEvents = events;
  };

  Player.prototype.showVolumeNudge = function (message) {
    if (!this.cfg.volumeNudge || !this.els.nudge) return;
    var text = this.root.querySelector('[data-fl-vsl-nudge-text]');
    if (text) {
      text.textContent = message || 'Aumente o volume do celular para ouvir bem';
    }
    this.els.nudge.hidden = false;
    this.root.classList.add('is-nudge');
    emit(this.root, 'flvsl:volume-nudge', { volume: this.media ? this.media.volume : 0 });
    var self = this;
    clearTimeout(this._nudgeTimer);
    this._nudgeTimer = setTimeout(function () {
      self.hideVolumeNudge();
    }, 5500);
  };

  Player.prototype.hideVolumeNudge = function () {
    clearTimeout(this._nudgeTimer);
    this._nudgeTimer = null;
    if (this.els.nudge) this.els.nudge.hidden = true;
    this.root.classList.remove('is-nudge');
  };

  Player.prototype.setVolume = function (vol, silent) {
    var v = clamp01(vol);
    if (this.media) {
      this.media.volume = v;
      this.media.muted = v === 0;
    }
    if (this.els.volRange) this.els.volRange.value = String(Math.round(v * 100));
    this.root.classList.toggle('is-low-volume', v > 0 && v < this.cfg.minVolume);
    if (!silent) {
      emit(this.root, 'flvsl:volumechange', { volume: v, belowMin: v < this.cfg.minVolume });
      if (v > 0 && v < this.cfg.minVolume && this.cfg.volumeNudge && this.engaged) {
        this.showVolumeNudge('Volume baixo — aumente acima de ' + Math.round(this.cfg.minVolume * 100) + '%');
      }
    }
  };

  Player.prototype._onTime = function () {
    if (!this.engaged) return;
    var media = this.media;
    if (!media || !media.duration || !isFinite(media.duration)) return;
    var real = clamp01(media.currentTime / media.duration);
    var visual = mapVisual(real, this.cfg.hingeReal, this.cfg.hingeVisual);
    if (this.els.fill) this.els.fill.style.width = (visual * 100).toFixed(2) + '%';
    emit(this.root, 'flvsl:progress', {
      realRatio: real,
      visualRatio: visual,
      currentTime: media.currentTime,
      duration: media.duration
    });
  };

  Player.prototype._onPlay = function () {
    if (!this.engaged) return;
    this.root.classList.add('is-playing');
    this.root.classList.remove('is-ended');
    this._clearBlocked();
    this.els.playBtn.setAttribute('aria-label', 'Pause');
    if (!this.started) {
      this.started = true;
      emit(this.root, 'flvsl:start', {
        media: this.cfg.mode,
        duration: this.media.duration || 0
      });
    }
    emit(this.root, 'flvsl:play', { media: this.cfg.mode });
  };

  Player.prototype._onPause = function () {
    if (!this.engaged) return;
    this.root.classList.remove('is-playing');
    this.els.playBtn.setAttribute('aria-label', 'Play');
    emit(this.root, 'flvsl:pause', { media: this.cfg.mode });
  };

  Player.prototype._onEnded = function () {
    this.root.classList.remove('is-playing');
    this.root.classList.add('is-ended');
    if (this.els.fill) this.els.fill.style.width = '100%';
    this.els.playBtn.setAttribute('aria-label', 'Play');
    emit(this.root, 'flvsl:ended', { media: this.cfg.mode });
  };

  Player.prototype.play = function () {
    var media = this.media;
    if (!media) return Promise.resolve(false);
    if (!this.engaged) return this.engage();
    var p = media.play();
    if (p && typeof p.then === 'function') {
      return p.then(function () { return true; }).catch(function () { return false; });
    }
    return Promise.resolve(true);
  };

  Player.prototype.pause = function () {
    if (this.media && this.engaged) this.media.pause();
  };

  Player.prototype.toggle = function () {
    if (!this.engaged) {
      this.engage();
      return;
    }
    if (!this.media) return;
    if (this.media.paused) this.play();
    else this.pause();
  };

  Player.prototype.setRate = function (rate, silent) {
    var idx = RATES.indexOf(rate);
    if (idx === -1) {
      if (rate >= 2) idx = 2;
      else if (rate >= 1.5) idx = 1;
      else idx = 0;
    }
    this.rateIndex = idx;
    var r = RATES[idx];
    if (this.media) this.media.playbackRate = r;
    if (this.els.rateBtn) this.els.rateBtn.textContent = formatRate(r);
    if (!silent) emit(this.root, 'flvsl:ratechange', { rate: r });
  };

  Player.prototype.cycleRate = function () {
    this.rateIndex = (this.rateIndex + 1) % RATES.length;
    this.setRate(RATES[this.rateIndex]);
  };

  Player.prototype.destroy = function () {
    if (this._destroyed) return;
    this._destroyed = true;
    clearTimeout(this._nudgeTimer);
    this._stopTeaser();
    if (this.media) {
      this.media.pause();
      this.media.removeEventListener('timeupdate', this._onTime);
      this.media.removeEventListener('play', this._onPlay);
      this.media.removeEventListener('pause', this._onPause);
      this.media.removeEventListener('ended', this._onEnded);
      this.media.removeAttribute('src');
      this.media.load();
    }
    if (this._unlockHandler && this._unlockEvents) {
      var h = this._unlockHandler;
      this._unlockEvents.forEach(function (ev) {
        window.removeEventListener(ev, h, true);
      });
    }
    this.root.innerHTML = '';
    this.root._flVslPlayer = null;
  };

  function init(root) {
    if (!root) return null;
    if (root._flVslPlayer) return root._flVslPlayer;
    var player = new Player(root);
    root._flVslPlayer = player;
    return player;
  }

  function initAll(scope) {
    var ctx = scope || document;
    var nodes = ctx.querySelectorAll('.fl-vsl[data-src], [data-fl-vsl][data-src]');
    var list = [];
    var i;
    for (i = 0; i < nodes.length; i++) {
      nodes[i].classList.add('fl-vsl');
      list.push(init(nodes[i]));
    }
    return list;
  }

  global.FLVslPlayer = {
    init: init,
    initAll: initAll,
    mapVisual: mapVisual,
    RATES: RATES.slice(),
    DEFAULT_MIN_VOLUME: DEFAULT_MIN_VOLUME
  };
})(typeof window !== 'undefined' ? window : this);
