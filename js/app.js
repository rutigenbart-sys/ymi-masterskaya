/* Мастерская YMi — корзина, фильтры, формы, отправка заказов в Telegram */
(function () {
  "use strict";
  var R = window.YMI_ROOT || "";
  var CFG = window.YMI_CONFIG || {};
  var TG = CFG.TELEGRAM || {};
  var PRODUCTS = window.YMI_PRODUCTS || [];
  var BY = {}; PRODUCTS.forEach(function (p) { BY[p.id] = p; });
  var KEY = "ymi_cart_v1";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽"; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* ---------- корзина ---------- */
  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v.filter(function (x) { return BY[x.id] && x.qty > 0; }) : []; }
    catch (e) { return []; }
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var cart = load();
  var memCart = cart; // запасной вариант, если localStorage недоступен

  function total() { return cart.reduce(function (s, i) { return s + BY[i.id].price * i.qty; }, 0); }
  function count() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }

  function add(id, qty) {
    id = +id; qty = Math.max(1, Math.min(99, +qty || 1));
    var it = cart.filter(function (x) { return x.id === id; })[0];
    if (it) it.qty = Math.min(99, it.qty + qty); else cart.push({ id: id, qty: qty });
    commit();
  }
  function setQty(id, q) {
    cart = cart.map(function (x) { return x.id === id ? { id: id, qty: q } : x; }).filter(function (x) { return x.qty > 0; });
    commit();
  }
  function commit() { save(cart); render(); }

  function lineHTML(i, withControls) {
    var p = BY[i.id], u = R + "product/" + p.slug + "/";
    return '<div class="line"><a href="' + u + '"><img src="' + R + "img/" + p.img + '" alt="' + esc(p.name) + '" width="76" height="76" loading="lazy"></a>' +
      '<div><h4><a href="' + u + '">' + esc(p.name) + '</a></h4><div class="l-meta">Артикул ' + p.id + " · " + money(p.price) + " · " + esc(p.size) + "</div>" +
      '<div class="qty" data-line="' + p.id + '"><button type="button" data-d="-1" aria-label="Меньше">−</button><input type="number" min="1" max="99" value="' + i.qty + '" aria-label="Количество"><button type="button" data-d="1" aria-label="Больше">+</button></div></div>' +
      '<div><div class="l-price">' + money(p.price * i.qty) + '</div><button type="button" class="rm" data-rm="' + p.id + '">Удалить</button></div></div>';
  }
  function render() {
    var n = count();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; el.hidden = !n; });
    $$("[data-cart-total]").forEach(function (el) { el.textContent = money(total()); });
    $$("[data-cart-list]").forEach(function (el) {
      el.innerHTML = cart.length ? cart.map(function (i) { return lineHTML(i); }).join("") :
        (el.closest(".drawer") ? '<div class="empty-cart"><p>В корзине пока пусто.</p><a class="btn btn-ghost" href="' + R + 'catalog/">Выбрать в каталоге</a></div>' : "");
    });
    $$("[data-empty]").forEach(function (el) { el.hidden = !!cart.length; });
    var f = $("[data-order]"); if (f) $$("button[type=submit]", f).forEach(function (b) { b.disabled = !cart.length; });
  }

  /* ---------- дровер ---------- */
  var drawer = $("#cartDrawer"), back = $(".drawer-backdrop"), lastFocus;
  function openCart() {
    if (!drawer) return; lastFocus = document.activeElement;
    drawer.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); back.hidden = false;
    requestAnimationFrame(function () { back.classList.add("on"); });
    document.body.style.overflow = "hidden";
    var c = $(".x", drawer); if (c) c.focus();
  }
  function closeCart() {
    if (!drawer) return; drawer.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); back.classList.remove("on");
    setTimeout(function () { back.hidden = true; }, 300); document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  var toastT;
  function toast(msg) {
    var t = $("#toast"); if (!t) return; t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("on"); }, 2200);
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target;
    var a = t.closest("[data-add]");
    if (a) {
      var q = 1, sel = a.getAttribute("data-qty-from");
      if (sel) { var inp = $(sel); if (inp) q = +inp.value; }
      add(a.getAttribute("data-add"), q);
      if (a.classList.contains("btn-add")) { a.classList.add("done"); setTimeout(function () { a.classList.remove("done"); }, 900); }
      try { if (window.ym) ym(114134729, "reachGoal", "add_to_cart"); } catch (e) {}
      toast("Добавлено в корзину"); return;
    }
    var b = t.closest("[data-buy]");
    if (b) { var qq = 1, s2 = b.getAttribute("data-qty-from"); if (s2) { var i2 = $(s2); if (i2) qq = +i2.value; } add(b.getAttribute("data-buy"), qq); location.href = R + "cart/"; return; }
    if (t.closest("[data-open-cart]")) { openCart(); return; }
    if (t.closest("[data-close-cart]")) { closeCart(); return; }
    var rm = t.closest("[data-rm]"); if (rm) { setQty(+rm.getAttribute("data-rm"), 0); return; }
    var ln = t.closest("[data-line] [data-d]");
    if (ln) { var id = +ln.parentNode.getAttribute("data-line"); var it = cart.filter(function (x) { return x.id === id; })[0]; if (it) setQty(id, Math.min(99, it.qty + +ln.getAttribute("data-d"))); return; }
    var qb = t.closest("[data-qty] [data-q]");
    if (qb) { var inp2 = $("input", qb.parentNode); inp2.value = Math.max(1, Math.min(99, (+inp2.value || 1) + +qb.getAttribute("data-q"))); return; }
    var th = t.closest(".thumb");
    if (th) { var m = $("#mainImg"); if (m) { m.src = th.getAttribute("data-src"); } $$(".thumb").forEach(function (x) { x.classList.toggle("is-on", x === th); }); return; }
    var bg = t.closest(".burger");
    if (bg) { var on = $("#nav").classList.toggle("on"); bg.setAttribute("aria-expanded", on); return; }
    var nl = t.closest("#nav a"); if (nl) { $("#nav").classList.remove("on"); var bb = $(".burger"); if (bb) bb.setAttribute("aria-expanded", "false"); }
  });
  document.addEventListener("change", function (ev) {
    var i = ev.target.closest && ev.target.closest("[data-line] input");
    if (i) { setQty(+i.parentNode.getAttribute("data-line"), Math.max(0, Math.min(99, +i.value || 1))); }
  });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") closeCart(); });

  /* ---------- каталог: фильтры и сортировка ---------- */
  var grid = $("#catalogGrid");
  if (grid) {
    var cards = $$(".card", grid), cur = "all";
    var apply = function () {
      var s = $("#sort").value, shown = 0;
      cards.forEach(function (c) {
        var ok = cur === "all" || (cur.indexOf("cat:") === 0 && c.dataset.cat === cur.slice(4)) || (cur.indexOf("type:") === 0 && c.dataset.type === cur.slice(5));
        c.hidden = !ok; if (ok) shown++;
      });
      var arr = cards.slice();
      if (s !== "def") arr.sort(function (a, b) { return s === "asc" ? a.dataset.price - b.dataset.price : b.dataset.price - a.dataset.price; });
      else arr.sort(function (a, b) { return a.dataset.id - b.dataset.id; });
      arr.forEach(function (c) { grid.appendChild(c); });
      $("#emptyMsg").hidden = shown > 0;
    };
    $$(".chip").forEach(function (ch) {
      ch.addEventListener("click", function () {
        cur = ch.dataset.filter; $$(".chip").forEach(function (x) { x.classList.toggle("is-on", x === ch); });
        apply(); history.replaceState(null, "", cur === "all" ? location.pathname : "#" + cur.split(":")[1]);
      });
    });
    $("#sort").addEventListener("change", apply);
    var hash = location.hash.slice(1);
    if (hash) { var chip = $('.chip[data-filter$=":' + hash + '"]'); if (chip) chip.click(); }
  }

  /* ---------- отправка в Telegram ---------- */
  function sendTelegram(text, sync) {
    // 1) Cloudflare Worker / свой endpoint
    if (TG.ORDER_ENDPOINT) {
      return fetch(TG.ORDER_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return { sent: true }; });
    }
    // 2) прямая отправка через Bot API
    if (TG.BOT_TOKEN && TG.CHAT_ID) {
      return fetch("https://api.telegram.org/bot" + TG.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: TG.CHAT_ID, text: text }) })
        .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.description || "Telegram error"); return { sent: true }; });
    }
    // 3) запасной вариант — открыть Telegram с готовым текстом
    var link = (TG.FALLBACK_LINK || "https://t.me/millana_milman") + "?text=" + encodeURIComponent(text);
    try { if (navigator.clipboard) navigator.clipboard.writeText(text); } catch (e) {}
    var w = null; try { w = window.open(link, "_blank", "noopener"); } catch (e) {}
    return Promise.resolve({ sent: false, link: link, opened: !!w });
  }

  function validate(form) {
    var ok = true;
    $$(".field", form).forEach(function (f) { f.classList.remove("err"); });
    $$(".check", form).forEach(function (f) { f.classList.remove("err"); });
    $$("[required]", form).forEach(function (el) {
      var bad = el.type === "checkbox" ? !el.checked : !el.value.trim();
      if (el.name === "phone" && !bad) bad = el.value.replace(/[^\d@a-zA-Z_]/g, "").length < 5;
      if (bad) { ok = false; var w = el.closest(".field") || el.closest(".check"); if (w) w.classList.add("err"); }
    });
    return ok;
  }
  function bindForm(form, build) {
    var msg = $(".form-msg", form), btn = $("button[type=submit]", form);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      msg.className = "form-msg"; msg.textContent = "";
      if ($("[name=website]", form).value) return; // антиспам
      if (!validate(form)) { msg.classList.add("bad"); msg.textContent = "Проверьте обязательные поля и поставьте галочку согласия."; return; }
      var last = +(sessionStorage.getItem("ymi_last") || 0);
      if (Date.now() - last < 15000) { msg.classList.add("bad"); msg.textContent = "Подождите несколько секунд перед повторной отправкой."; return; }
      var text = build(form); if (!text) return;
      btn.disabled = true; var old = btn.textContent; btn.textContent = "Отправляем…";
      sendTelegram(text).then(function (res) {
        try { sessionStorage.setItem("ymi_last", Date.now()); } catch (e) {}
        try { if (window.ym) ym(114134729, "reachGoal", form.hasAttribute("data-order") ? "order" : "lead"); } catch (e) {}
        if (res.sent) {
          msg.classList.add("ok"); msg.textContent = "Спасибо! Заявка отправлена — мы скоро свяжемся с вами.";
          form.reset();
          if (form.hasAttribute("data-order")) { cart = []; commit(); }
        } else {
          msg.classList.add("ok");
          msg.innerHTML = "<b>Почти готово!</b> Открылся чат с мастером в Telegram — просто нажмите «Отправить». Если текста в поле нет, вставьте его: заказ скопирован. " +
            '<a href="' + esc(res.link) + '" target="_blank" rel="noopener">Открыть Telegram</a>';
          if (form.hasAttribute("data-order")) { cart = []; commit(); }
        }
      }).catch(function () {
        msg.classList.add("bad");
        msg.innerHTML = "Не удалось отправить. Напишите нам: <a href=\"https://t.me/millana_milman" + "\">Telegram</a> или позвоните " + esc(CFG.PHONE_DISPLAY || "");
      }).then(function () { btn.disabled = false; btn.textContent = old; if (form.hasAttribute("data-order")) render(); });
    });
  }
  function val(f, n) { var el = f.elements[n]; return el ? el.value.trim() : ""; }

  $$("[data-form]").forEach(function (f) {
    bindForm(f, function (form) {
      var kind = form.getAttribute("data-kind") || "Заявка";
      var t = "📩 " + kind + " — Мастерская YMi\n\nИмя: " + val(form, "name") + "\nКонтакт: " + val(form, "phone");
      if (val(form, "color")) t += "\nЦвет: " + val(form, "color");
      if (val(form, "qty")) t += "\nКоличество: " + val(form, "qty");
      if (val(form, "message")) t += "\n\nСообщение: " + val(form, "message");
      t += "\n\nСтраница: " + location.href;
      return t;
    });
  });
  $$("[data-order]").forEach(function (f) {
    bindForm(f, function (form) {
      if (!cart.length) { var m = $(".form-msg", form); m.className = "form-msg bad"; m.textContent = "Корзина пуста."; return ""; }
      var lines = cart.map(function (i, n) { var p = BY[i.id]; return (n + 1) + ". Артикул " + p.id + " — " + p.name + " × " + i.qty + " — " + money(p.price * i.qty); }).join("\n");
      var t = "🛍 Новый заказ — Мастерская YMi\n\n" + lines + "\n\nИтого: " + money(total()) +
        "\n\nИмя: " + val(form, "name") + "\nТелефон: " + val(form, "phone");
      if (val(form, "messenger")) t += "\nМессенджер: " + val(form, "messenger");
      if (val(form, "city")) t += "\nГород: " + val(form, "city");
      t += "\nДоставка: " + val(form, "delivery");
      if (val(form, "message")) t += "\n\nКомментарий: " + val(form, "message");
      return t;
    });
  });

  /* ---------- появление при скролле ---------- */
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $$(".sec-head,.cat-tile,.card,.why li,.custom-box,.post").forEach(function (el) { el.classList.add("rv"); io.observe(el); });
  }

  render();

  /* ---------- прелоадер ---------- */
  (function () {
    var pre = document.getElementById("pre"); if (!pre) return;
    var t0 = performance.now(), fin = false;
    function done() {
      if (fin) return; fin = true; pre.classList.add("gone");
      try { sessionStorage.setItem("ymi_pre", "1"); } catch (e) {}
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 900);
    }
    function go() { setTimeout(done, Math.max(0, 1100 - (performance.now() - t0))); }
    if (document.readyState === "complete") go(); else window.addEventListener("load", go);
    setTimeout(done, 4000);
  })();
})();
