(function () {
  var R = window.FormRules; if (!R) return;
  var t0 = Date.now();
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function openFromHash() {
    var id = location.hash.slice(1), el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', openFromHash); openFromHash();
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#apply-"]');
    if (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) el.open = true; }
  });
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    var type = form.getAttribute('data-form'), rules = R.FORMS[type];
    var sum = form.querySelector('.errsum'), btn = form.querySelector('button[type=submit]'), label = btn.textContent;
    function clear() {
      sum.hidden = true; sum.innerHTML = '';
      form.querySelectorAll('.ferr').forEach(function (n) { n.remove(); });
      form.querySelectorAll('[aria-invalid]').forEach(function (n) {
        n.removeAttribute('aria-invalid');
        var d = (n.getAttribute('aria-describedby') || '').split(' ').filter(function (x) { return x && x.indexOf('-err') < 0; }).join(' ');
        if (d) n.setAttribute('aria-describedby', d); else n.removeAttribute('aria-describedby');
      });
    }
    function show(errors, general) {
      clear(); var items = [];
      Object.keys(errors).forEach(function (k) {
        var el = form.elements[k]; if (!el) return;
        var eid = el.id + '-err', p = document.createElement('p');
        p.className = 'ferr'; p.id = eid; p.textContent = 'Error: ' + errors[k];
        el.closest('.fld').appendChild(p);
        el.setAttribute('aria-invalid', 'true');
        el.setAttribute('aria-describedby', ((el.getAttribute('aria-describedby') || '') + ' ' + eid).trim());
        items.push('<li><a href="#' + el.id + '">' + esc(errors[k]) + '</a></li>');
      });
      var msg = general || errors._form || '';
      sum.innerHTML = '<h3>' + (items.length ? 'Please fix ' + items.length + (items.length > 1 ? ' problems' : ' problem') + ' before sending' : 'We could not send your form') + '</h3>'
        + (msg ? '<p>' + esc(msg) + '</p>' : '') + (items.length ? '<ul>' + items.join('') + '</ul>' : '');
      sum.hidden = false; sum.focus();
    }
    function resetBtn() { btn.disabled = false; btn.textContent = label; }
    sum.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (!a) return;
      e.preventDefault(); var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) el.focus();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); clear();
      var data = { type: type, consent: form.elements.consent.checked, website: form.elements.website.value, elapsed: Date.now() - t0 };
      Object.keys(rules.fields).forEach(function (k) { data[k] = form.elements[k].value; });
      var v = R.validate(type, data);
      if (!v.ok) { show(v.errors); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, j: j }; }); })
        .then(function (x) {
          if (x.ok) {
            var ok = form.parentNode.querySelector('.fok'); form.hidden = true; ok.hidden = false; ok.focus();
          } else {
            resetBtn();
            if (x.j && x.j.errors) show(x.j.errors);
            else show({}, (x.j && x.j.error) || 'Something went wrong. Please try again or email us.');
          }
        })
        .catch(function () { resetBtn(); show({}, 'We could not reach the server. Please check your connection and try again.'); });
    });
  });
})();
