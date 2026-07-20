/* ==========================================================================
   Catecumen — Banner de consentimiento de cookies (RGPD)
   Copyright © 2026 CICADI/ICDC. Todos los derechos reservados.

   Google Analytics NO se carga hasta que el usuario acepta. Si rechaza,
   no se carga nunca y no se instala ninguna cookie de analítica.

   Decisión guardada en localStorage["catecumen_cookies"] = "aceptadas" | "rechazadas"
   Para reabrir el banner desde cualquier página: window.catecumenCookies.abrir()
   ========================================================================== */
(function () {
  "use strict";

  var GA_ID   = "G-YDQW0M852Y";
  var CLAVE   = "catecumen_cookies";
  var LANGS   = ["es", "en", "fr", "de", "pt", "it"];

  var TXT = {
    es: { t:"Usamos cookies", d:"Utilizamos cookies de analítica para entender cómo se usa la plataforma y mejorarla. Puedes aceptarlas o rechazarlas; si las rechazas, no instalaremos ninguna.",
          ok:"Aceptar", no:"Rechazar", mas:"Más información" },
    en: { t:"We use cookies", d:"We use analytics cookies to understand how the platform is used and improve it. You can accept or reject them; if you reject, none will be installed.",
          ok:"Accept", no:"Reject", mas:"More information" },
    fr: { t:"Nous utilisons des cookies", d:"Nous utilisons des cookies d'analyse pour comprendre l'utilisation de la plateforme et l'améliorer. Vous pouvez les accepter ou les refuser ; en cas de refus, aucun ne sera installé.",
          ok:"Accepter", no:"Refuser", mas:"Plus d'informations" },
    de: { t:"Wir verwenden Cookies", d:"Wir verwenden Analyse-Cookies, um die Nutzung der Plattform zu verstehen und sie zu verbessern. Sie können zustimmen oder ablehnen; bei Ablehnung werden keine gesetzt.",
          ok:"Akzeptieren", no:"Ablehnen", mas:"Mehr Informationen" },
    pt: { t:"Usamos cookies", d:"Utilizamos cookies de análise para entender como a plataforma é usada e melhorá-la. Pode aceitar ou recusar; se recusar, nenhum será instalado.",
          ok:"Aceitar", no:"Recusar", mas:"Mais informações" },
    it: { t:"Usiamo i cookie", d:"Utilizziamo cookie analitici per capire come viene usata la piattaforma e migliorarla. Puoi accettarli o rifiutarli; se rifiuti, non ne verrà installato nessuno.",
          ok:"Accetta", no:"Rifiuta", mas:"Maggiori informazioni" }
  };

  function idioma() {
    try {
      var s = localStorage.getItem("catecumen_lang");
      if (s && LANGS.indexOf(s) > -1) return s;
    } catch (e) {}
    var n = (navigator.language || "es").toLowerCase().split("-")[0];
    return LANGS.indexOf(n) > -1 ? n : "es";
  }

  function leer()  { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) {} }

  /* --- Carga de Google Analytics: SOLO tras aceptar --- */
  var cargado = false;
  function cargarGA() {
    if (cargado || !GA_ID) return;
    cargado = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
  }

  /* --- Banner --- */
  function quitar() {
    var b = document.getElementById("cat-cookies");
    if (b && b.parentNode) b.parentNode.removeChild(b);
    document.documentElement.style.removeProperty("--cookie-offset");
  }

  function mostrar() {
    if (document.getElementById("cat-cookies")) return;
    var t = TXT[idioma()] || TXT.es;

    var wrap = document.createElement("div");
    wrap.id = "cat-cookies";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-live", "polite");
    wrap.setAttribute("aria-label", t.t);
    wrap.innerHTML =
      '<style>' +
      '#cat-cookies{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;' +
        'background:#0B1526;border-top:1px solid rgba(200,169,81,.45);' +
        'box-shadow:0 -8px 28px rgba(0,0,0,.5);padding:14px 18px;' +
        'font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#F0EAD6;' +
        'display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;' +
        'animation:catCookIn .35s ease-out}' +
      '@keyframes catCookIn{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}' +
      '#cat-cookies .cc-txt{max-width:640px;font-size:13.5px;line-height:1.5}' +
      '#cat-cookies .cc-txt b{color:#C8A951;display:block;margin-bottom:3px;font-size:14px}' +
      '#cat-cookies .cc-txt a{color:#C8A951}' +
      '#cat-cookies .cc-btns{display:flex;gap:8px;flex-shrink:0}' +
      '#cat-cookies button{font:inherit;font-size:13px;font-weight:600;cursor:pointer;' +
        'border-radius:8px;padding:9px 18px;border:1px solid #C8A951;transition:filter .2s}' +
      '#cat-cookies button:hover{filter:brightness(1.15)}' +
      '#cat-cookies .cc-ok{background:#C8A951;color:#0B1526}' +
      '#cat-cookies .cc-no{background:transparent;color:#C8A951}' +
      '@media(max-width:640px){#cat-cookies{flex-direction:column;align-items:stretch;text-align:left}' +
        '#cat-cookies .cc-btns{justify-content:stretch}#cat-cookies button{flex:1}}' +
      '</style>' +
      '<div class="cc-txt"><b>' + t.t + '</b>' + t.d +
        ' <a href="/normatividad_catecumen.pdf" target="_blank" rel="noreferrer">' + t.mas + '</a></div>' +
      '<div class="cc-btns">' +
        '<button type="button" class="cc-no">' + t.no + '</button>' +
        '<button type="button" class="cc-ok">' + t.ok + '</button>' +
      '</div>';

    document.body.appendChild(wrap);
    // Deja espacio para que el banner no tape botones flotantes de la app
    document.documentElement.style.setProperty("--cookie-offset", wrap.offsetHeight + "px");

    wrap.querySelector(".cc-ok").addEventListener("click", function () {
      guardar("aceptadas"); quitar(); cargarGA();
    });
    wrap.querySelector(".cc-no").addEventListener("click", function () {
      guardar("rechazadas"); quitar();
    });
  }

  function iniciar() {
    var d = leer();
    if (d === "aceptadas") { cargarGA(); return; }   // ya consintió
    if (d === "rechazadas") return;                   // respetar el rechazo
    mostrar();                                        // sin decidir aún
  }

  // API pública: permite reabrir el banner (p.ej. desde un enlace "Cookies")
  window.catecumenCookies = {
    abrir: function () { try { localStorage.removeItem(CLAVE); } catch (e) {} quitar(); mostrar(); },
    estado: leer
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
