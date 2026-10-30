(function () {
  var h = document.documentElement;
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  var size = parseInt(get('wpai-size'), 10) || 0, hc = get('wpai-hc') === '1';
  function apply() {
    h.classList.remove('ts1', 'ts2', 'ts3'); if (size > 0) h.classList.add('ts' + size);
    h.classList.toggle('hc', hc);
  }
  apply();
  function build() {
    var live = document.createElement('div');
    live.id = 'a11y-live'; live.className = 'sr'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
    var bar = document.createElement('div');
    bar.className = 'a11y'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Accessibility options');
    bar.innerHTML = '<div class="wrap"><span>Text size</span>'
      + '<button type="button" data-a="dec" aria-label="Make text smaller">A&minus;</button>'
      + '<button type="button" data-a="reset" aria-label="Reset text size">A</button>'
      + '<button type="button" data-a="inc" aria-label="Make text larger">A+</button>'
      + '<button type="button" data-a="hc" aria-pressed="' + (hc ? 'true' : 'false') + '">High contrast</button></div>';
    var skip = document.querySelector('.skip');
    if (skip && skip.nextSibling) skip.parentNode.insertBefore(bar, skip.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
    document.body.appendChild(live);
    function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 50); }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var k = b.getAttribute('data-a');
      if (k === 'inc') { size = Math.min(3, size + 1); say('Text size increased'); }
      else if (k === 'dec') { size = Math.max(0, size - 1); say('Text size decreased'); }
      else if (k === 'reset') { size = 0; say('Text size reset'); }
      else if (k === 'hc') { hc = !hc; b.setAttribute('aria-pressed', hc ? 'true' : 'false'); say(hc ? 'High contrast on' : 'High contrast off'); }
      put('wpai-size', String(size)); put('wpai-hc', hc ? '1' : '0'); apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
