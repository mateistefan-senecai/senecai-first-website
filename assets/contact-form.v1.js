/* Contact form in the "Ready to get compliant?" band: sends to /api/contact without leaving
   the page and shows the success / error line. Works without JavaScript too (plain POST,
   the function redirects back with ?contact=sent|error). */
(function () {
  function show(form, which) {
    [].forEach.call(form.querySelectorAll("[data-cf-status]"), function (el) {
      el.hidden = el.getAttribute("data-cf-status") !== which;
    });
  }

  function init() {
    var forms = document.querySelectorAll("[data-contact-form]");
    var fromRedirect = (location.search.match(/[?&]contact=(sent|error)/) || [])[1];
    [].forEach.call(forms, function (form) {
      var t = form.querySelector('input[name="t"]');
      if (t) t.value = String(Date.now());
      if (fromRedirect) show(form, fromRedirect === "sent" ? "ok" : "error");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        var button = form.querySelector('button[type="submit"]');
        var data = {};
        new FormData(form).forEach(function (v, k) { data[k] = v; });
        button.disabled = true;
        show(form, "sending");
        fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(data)
        }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
          .then(function (res) {
            if (res && res.ok) { form.reset(); if (t) t.value = String(Date.now()); show(form, "ok"); }
            else show(form, "error");
          })
          .catch(function () { show(form, "error"); })
          .then(function () { button.disabled = false; });
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
