/* Do Si: contact form delivery.
   With APNOSH_SLUG set at build time, base.njk sets window.DOSI_FORMS_ENDPOINT and messages
   land in Do Si's inbox in the Apnosh portal (which also emails the owners). Without it, the
   form opens an email to the restaurant instead, so it never silently drops a message.

   Bot checks the portal uses: _gotcha must stay empty (people never see it), _ts is when the
   page opened (instant submits are treated as bots). */
(function () {
  var ENDPOINT = window.DOSI_FORMS_ENDPOINT || null;
  var openedAt = Date.now();
  var EMAIL = "dosikbbq@outlook.com";

  document.querySelectorAll("form[data-dosi-form]").forEach(function (form) {
    var trap = document.createElement("input");
    trap.type = "text"; trap.name = "_gotcha"; trap.tabIndex = -1; trap.autocomplete = "off";
    trap.setAttribute("aria-hidden", "true");
    trap.style.cssText = "position:absolute;left:-9999px;width:1px;height:1px;opacity:0;";
    form.appendChild(trap);

    /* no booking requests for a day that has passed */
    var today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    form.querySelectorAll('input[type="date"]').forEach(function (d) { d.min = today; });

    var status = form.querySelector(".form__status");
    var button = form.querySelector('button[type="submit"]');
    function say(text, ok) { if (!status) return; status.textContent = text; status.className = "form__status " + (ok ? "is-ok" : "is-err"); }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { say("Please fill in the highlighted fields.", false); form.reportValidity(); return; }
      var fields = {};
      new FormData(form).forEach(function (v, k) { if (k !== "_gotcha" && String(v).trim()) fields[k] = String(v).trim(); });
      var sel = form.querySelector("[data-kind-select]");
      var kind = form.getAttribute("data-kind") || (sel && sel.selectedOptions[0] ? sel.selectedOptions[0].getAttribute("data-kind") || "contact" : "contact");

      if (!ENDPOINT) {
        var body = Object.keys(fields).map(function (k) { return k.replace(/_/g, " ") + ": " + fields[k]; }).join("\n");
        window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent((fields.subject || "Website message") + " – " + (fields.name || "")) + "&body=" + encodeURIComponent(body);
        say("Opening your email app…", true);
        return;
      }

      var data = new URLSearchParams();
      Object.keys(fields).forEach(function (k) { data.append(k, fields[k]); });
      data.set("_gotcha", trap.value);
      data.set("_ts", String(openedAt));
      data.set("_source", window.location.href);
      if (button) button.disabled = true;
      say("Sending…", true);
      fetch(ENDPOINT + "?kind=" + encodeURIComponent(kind), { method: "POST", body: data })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (b) { return { ok: res.ok, b: b }; }); })
        .then(function (r) {
          if (r.ok) {
            /* a lead for Google Analytics (loaded by the Apnosh tag); mark generate_lead as a key event in GA */
            if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form_kind: kind, location: fields.location || "", page_path: window.location.pathname });
            form.reset(); say(form.getAttribute("data-success") || "Thanks! Your message is on its way. We’ll get back to you soon.", true);
          }
          else say(r.b.error || "Something went wrong. Please try again or call us.", false);
        })
        .catch(function () { say("We couldn’t send that. Check your connection, or call us.", false); })
        .then(function () { if (button) button.disabled = false; });
    });
  });
})();
