/**
 * Instalação PWA — "app" direto pelo site, sem Play Store / App Store.
 */
(function (global) {
  var deferredPrompt = null;

  function isStandalone() {
    return global.matchMedia('(display-mode: standalone)').matches ||
      global.navigator.standalone === true;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(global.navigator.userAgent);
  }

  function isAndroid() {
    return /android/i.test(global.navigator.userAgent);
  }

  function registrarServiceWorker() {
    if (!('serviceWorker' in global.navigator)) return;
    global.navigator.serviceWorker.register('/sw.js').catch(function () {});
  }

  function mostrar(el, visivel) {
    if (!el) return;
    el.hidden = !visivel;
    el.style.display = visivel ? '' : 'none';
  }

  function atualizarUi() {
    var botoesInstalar = document.querySelectorAll('.js-pwa-instalar');
    var secao = document.getElementById('secao-app');
    var iosDica = document.getElementById('app-ios-dica');
    var jaInstalado = document.getElementById('app-ja-instalado');
    var instrucoesDesktop = document.getElementById('app-instrucoes-desktop');

    if (isStandalone()) {
      botoesInstalar.forEach(function (el) { mostrar(el, false); });
      mostrar(secao, true);
      mostrar(jaInstalado, true);
      mostrar(iosDica, false);
      mostrar(instrucoesDesktop, false);
      return;
    }

    mostrar(jaInstalado, false);
    mostrar(secao, true);
    mostrar(instrucoesDesktop, false);

    if (deferredPrompt) {
      botoesInstalar.forEach(function (el) { mostrar(el, true); });
      mostrar(iosDica, false);
    } else if (isIos()) {
      botoesInstalar.forEach(function (el) { mostrar(el, false); });
      mostrar(iosDica, true);
    } else {
      botoesInstalar.forEach(function (el) { mostrar(el, true); });
      mostrar(iosDica, false);
    }
  }

  async function instalarApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      atualizarUi();
      return;
    }

    var painel = document.getElementById('app-instrucoes-desktop');
    if (painel) {
      painel.hidden = false;
      painel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function iniciar() {
    registrarServiceWorker();

    global.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      atualizarUi();
    });

    global.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      atualizarUi();
    });

    var btnHero = document.getElementById('btn-instalar-app-hero');
    var btn = btnHero || document.getElementById('btn-instalar-app');
    if (btn) btn.addEventListener('click', instalarApp);
    document.querySelectorAll('.js-pwa-instalar').forEach(function (el) {
      if (el === btn) return;
      el.addEventListener('click', instalarApp);
    });

    atualizarUi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }

  global.PwaInstall = { instalarApp, isStandalone, isIos, isAndroid };
})(window);
