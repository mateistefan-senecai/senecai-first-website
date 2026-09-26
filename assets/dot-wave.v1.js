// SenecAI gold dot-wave background (ported from the design handoff's dot-wave.js; maths unchanged).
// Every .bg-gold section gets a <canvas data-dot-wave> as its first child, drawn behind the content.
// The file name is versioned because /assets/* is served with an immutable cache header.
(function () {
  var DEFAULTS = { speed: 0.9, density: 1.5, strength: 1.3, color: "#C9A22C" };

  function mount(canvas, opts) {
    var o = {};
    for (var k in DEFAULTS) o[k] = opts[k] !== undefined ? opts[k] : DEFAULTS[k];
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var ctx = canvas.getContext("2d");
    var raf = 0, visible = true, start = performance.now();

    function draw(now) {
      var dpr = window.devicePixelRatio || 1, W = canvas.clientWidth, H = canvas.clientHeight;
      if (!W || !H) return;
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var t = ((now - start) / 1000) * 0.5 * o.speed;
      // Lighter grid on small screens, as the handoff suggests for phones.
      var density = W < 768 ? Math.min(o.density, 1) : o.density;
      var COLS = Math.round(150 * density), ROWS = Math.round(70 * density);
      var S = H * 1.25, cx = W * 0.62, hor = H * -0.05, rot = -0.55, cr = Math.cos(rot), sr = Math.sin(rot);
      ctx.fillStyle = o.color;
      for (var r = 0; r < ROWS; r++) {
        var z0 = r / (ROWS - 1);
        for (var c = 0; c < COLS; c++) {
          var x0 = (c / (COLS - 1)) * 3.2 - 1.6;
          var y = 0.11 * Math.sin(2.6 * x0 + 3.2 * z0 + t)
                + 0.07 * Math.sin(4.1 * z0 - 1.7 * x0 + t * 0.7)
                + 0.04 * Math.sin(6 * x0 + t * 1.3);
          var x = x0 * cr - (z0 - 0.5) * sr, z = x0 * sr + (z0 - 0.5) * cr + 0.5;
          var d = 0.9 + z * 2.2; if (d <= 0.2) continue;
          var sx = cx + (x * S) / d, sy = hor + ((0.62 - y) * S) / d;
          if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
          var crest = Math.max(0, Math.min(1, (y + 0.2) / 0.4));
          var a = (0.12 + 0.55 * crest) * Math.min(1, (1.6 - Math.abs(x0)) * 2) * Math.min(1, z0 * 6) * o.strength;
          if (a <= 0.02) continue;
          var sz = (0.8 + 1.4 * crest) / Math.sqrt(d);
          ctx.globalAlpha = Math.min(1, a);
          ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
        }
      }
      ctx.globalAlpha = 1;
    }
    function loop(now) { if (visible) draw(now); raf = requestAnimationFrame(loop); }

    if (reduce) {
      draw(start + 4000);
      window.addEventListener("resize", function () { draw(start + 4000); });
    } else {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }).observe(canvas);
      }
      raf = requestAnimationFrame(loop);
    }
    return function () { cancelAnimationFrame(raf); };
  }

  function init() {
    [].slice.call(document.querySelectorAll(".bg-gold")).forEach(function (section) {
      if (section.querySelector(":scope > canvas[data-dot-wave]")) return;
      var canvas = document.createElement("canvas");
      canvas.setAttribute("data-dot-wave", "");
      canvas.setAttribute("aria-hidden", "true");
      section.insertBefore(canvas, section.firstChild);
      var ds = section.dataset;
      mount(canvas, {
        speed: ds.waveSpeed ? +ds.waveSpeed : undefined,
        density: ds.waveDensity ? +ds.waveDensity : undefined,
        strength: ds.waveStrength ? +ds.waveStrength : undefined,
        color: ds.waveColor || undefined
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
