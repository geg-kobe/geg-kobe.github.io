/*
  コミュニティサイト共通の動き（GEG KOBE / MELC HYOGO で同じもの）
  - 日本語／English の切りかえ
  - data/site-data.js の内容から「次のイベント」と「お問い合わせ」を表示
  - 「カレンダーに追加」用の .ics ファイルをその場で作る
*/
(function () {
  "use strict";

  var root = document.documentElement;
  var STORAGE_KEY = "community-site-lang";

  /* ---------- 言語の切りかえ ---------- */
  function setLang(lang) {
    if (lang !== "ja" && lang !== "en") lang = "ja";
    root.setAttribute("data-ui-lang", lang);
    root.setAttribute("lang", lang);
    var buttons = document.querySelectorAll("[data-set-lang]");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-set-lang") === lang;
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* 保存できなくても動く */ }
  }

  function initialLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ja" || saved === "en") return saved;
    } catch (e) { /* 読めなくても動く */ }
    return "ja";
  }

  /* ---------- 小さな道具 ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  // 日本語と英語の2つを並べて作る（表示は CSS で片方だけになる）
  function both(tag, ja, en, attrs) {
    var frag = document.createDocumentFragment();
    var a = Object.assign({}, attrs || {});
    frag.appendChild(el(tag, Object.assign({ "data-lang": "ja" }, a), [ja]));
    frag.appendChild(el(tag, Object.assign({ "data-lang": "en" }, a), [en]));
    return frag;
  }

  function text(v, lang) {
    if (!v) return "";
    if (typeof v === "string") return v;
    return v[lang] || v.ja || "";
  }

  function isSafeUrl(url) {
    return typeof url === "string" && /^https:\/\//.test(url);
  }

  /* ---------- 日時の表示 ---------- */
  function formatDate(d, lang) {
    var opts = { timeZone: "Asia/Tokyo", year: "numeric", month: "long", day: "numeric", weekday: "short" };
    return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-US", opts).format(d);
  }
  function formatTime(d, lang) {
    var opts = { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit", hour12: false };
    return new Intl.DateTimeFormat(lang === "ja" ? "ja-JP" : "en-GB", opts).format(d);
  }

  /* ---------- カレンダー（.ics） ---------- */
  function icsDate(d) {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }
  function icsEscape(s) {
    return String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }
  function makeIcs(data, ev, start, end) {
    var title = data.siteName + " " + text(ev.title, "ja");
    var desc = [text(ev.theme, "ja"), ev.link || ""].filter(Boolean).join("\n");
    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//" + data.siteName + "//community site//JA",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:" + icsDate(start) + "-" + data.siteName.replace(/\s+/g, "-").toLowerCase() + "@community-site",
      "DTSTAMP:" + icsDate(new Date()),
      "DTSTART:" + icsDate(start),
      "DTEND:" + icsDate(end),
      "SUMMARY:" + icsEscape(title),
      "DESCRIPTION:" + icsEscape(desc),
      "LOCATION:" + icsEscape(ev.link || text(ev.format, "ja")),
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    return lines.join("\r\n") + "\r\n";
  }
  function downloadIcs(data, ev, start, end) {
    var blob = new Blob([makeIcs(data, ev, start, end)], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: data.siteName.replace(/\s+/g, "-").toLowerCase() + "-event.ics" });
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  /* ---------- 次のイベント ---------- */
  function renderEvent(data) {
    var box = document.getElementById("event");
    var ev = data && data.event;
    if (!box || !ev) return; // 予定がなければ HTML の「準備中」のまま

    var start = new Date(ev.start);
    var end = ev.end ? new Date(ev.end) : new Date(start.getTime() + 60 * 60 * 1000);
    if (isNaN(start.getTime())) return;

    box.textContent = "";
    box.appendChild(both("p", text(ev.title, "ja"), text(ev.title, "en"), { "class": "event-title" }));

    ["ja", "en"].forEach(function (lang) {
      var L = lang === "ja"
        ? { date: "日にち", time: "時間", format: "開き方", theme: "テーマ" }
        : { date: "Date", time: "Time", format: "Format", theme: "Theme" };
      var dl = el("dl", { "class": "event-meta", "data-lang": lang });
      function row(label, value) {
        if (!value) return;
        dl.appendChild(el("dt", null, [label]));
        dl.appendChild(el("dd", null, [value]));
      }
      row(L.date, formatDate(start, lang));
      row(L.time, formatTime(start, lang) + " – " + formatTime(end, lang) + (lang === "ja" ? "（日本時間）" : " (JST)"));
      row(L.format, text(ev.format, lang));
      row(L.theme, text(ev.theme, lang));
      box.appendChild(dl);
    });

    var actions = el("div", { "class": "actions" });
    if (isSafeUrl(ev.link)) {
      var join = el("a", { "class": "btn btn-primary", href: ev.link, target: "_blank", rel: "noopener" });
      join.appendChild(both("span", "参加リンクをひらく", "Open the meeting link"));
      actions.appendChild(join);
    }
    var cal = el("button", { "class": "btn btn-secondary", type: "button" });
    cal.appendChild(both("span", "カレンダーに追加", "Add to calendar"));
    cal.addEventListener("click", function () { downloadIcs(data, ev, start, end); });
    actions.appendChild(cal);
    box.appendChild(actions);

    box.appendChild(both(
      "p",
      "ミーティングは運営者1人で進めています。始まったあとに入ると、入室の許可が遅れることがあります。開始の10分前から入れますので、早めにお入りください。",
      "The meeting is run by one organizer. If you join after it starts, it may take a while before you are let in. You can join from 10 minutes before the start, so please come a little early.",
      { "class": "note" }
    ));
  }

  /* ---------- お問い合わせ ---------- */
  function renderContact(data) {
    var box = document.getElementById("contact");
    if (!box || !data || !isSafeUrl(data.formUrl)) return; // なければ「準備中」のまま
    box.textContent = "";
    box.appendChild(both(
      "p",
      "ご質問やご連絡は、フォームからお送りください。児童生徒の名前など、個人が分かることは書かないでください。",
      "Please send questions or messages through the form. Do not include anything that could identify a student, such as names."
    ));
    var a = el("a", { "class": "btn btn-primary", href: data.formUrl, target: "_blank", rel: "noopener" });
    a.appendChild(both("span", "お問い合わせフォームをひらく", "Open the contact form"));
    box.appendChild(el("div", { "class": "actions" }, [a]));
  }

  /* ---------- はじめに ---------- */
  function init() {
    setLang(initialLang());
    var buttons = document.querySelectorAll("[data-set-lang]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener("click", function () { setLang(this.getAttribute("data-set-lang")); });
    }
    var data = window.SITE_DATA || {};
    renderEvent(data);
    renderContact(data);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
