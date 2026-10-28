/* CyberJKD Roadmap — visitor collector (client side)
 * Sends one hit per browser session to your Apps Script Web App.
 * Captures: platform/referrer, UTM tags, timezone, device/OS/browser,
 * language, screen, page, and country/region/city (IP is used only to
 * look up location and is NOT sent or stored).
 * -> Paste your deployed Web App URL into ENDPOINT below.
 */
(function () {
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbwuyTLItzCQuo6rOaXgxsDDSx7n8vR9Tq7gUilSBKRR83s8-HsIgjpV4RDHrRR8BoSsWA/exec";  // <-- PASTE your Apps Script /exec URL here

  if (!ENDPOINT) return;

  var params = new URLSearchParams(location.search);

  // Let yourself opt out: visit the site once with ?me=1 on each of your devices.
  try {
    if (params.get('me') === '1') localStorage.setItem('cjk_skip', '1');
    if (localStorage.getItem('cjk_skip')) return;
  } catch (e) {}

  // One hit per session (a refresh won't double-count).
  try {
    if (sessionStorage.getItem('cjk_tracked')) return;
    sessionStorage.setItem('cjk_tracked', '1');
  } catch (e) {}

  var ua = navigator.userAgent || '';
  var os = /Windows NT/.test(ua) ? 'Windows'
         : /Android/.test(ua) ? 'Android'
         : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
         : /Mac OS X/.test(ua) ? 'macOS'
         : /Linux/.test(ua) ? 'Linux' : 'Other';
  var browser = /Edg\//.test(ua) ? 'Edge'
              : /OPR\//.test(ua) ? 'Opera'
              : /Chrome\//.test(ua) ? 'Chrome'
              : /Firefox\//.test(ua) ? 'Firefox'
              : (/Safari\//.test(ua) && !/Chrome/.test(ua)) ? 'Safari' : 'Other';
  var device = /iPad|Tablet/.test(ua) ? 'Tablet'
             : /Mobi|Android|iPhone|iPod/.test(ua) ? 'Mobile' : 'Desktop';

  function platform(ref, src) {
    if (src) return src;                      // explicit UTM wins
    if (!ref) return 'Direct / unknown';
    try {
      var h = new URL(ref).hostname.replace(/^www\./, '');
      if (/linkedin/.test(h)) return 'LinkedIn';
      if (/t\.co|twitter|x\.com/.test(h)) return 'X / Twitter';
      if (/instagram/.test(h)) return 'Instagram';
      if (/facebook|fb\./.test(h)) return 'Facebook';
      if (/youtube|youtu\.be/.test(h)) return 'YouTube';
      if (/github/.test(h)) return 'GitHub';
      if (/google/.test(h)) return 'Google';
      if (/bing/.test(h)) return 'Bing';
      if (/reddit/.test(h)) return 'Reddit';
      if (/whatsapp|wa\.me/.test(h)) return 'WhatsApp';
      return h;
    } catch (e) { return ref; }
  }

  var ref = document.referrer || '';
  var data = {
    platform: platform(ref, params.get('utm_source')),
    referrer: ref,
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || '',
    device: device, os: os, browser: browser,
    language: navigator.language || '',
    screen: (screen.width + 'x' + screen.height),
    page: location.pathname + location.search,
    country: '', region: '', city: ''
  };

  function send() {
    try {
      var body = JSON.stringify(data);
      if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, body);
      else fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors' });
    } catch (e) {}
  }

  // Approximate location from IP (country/region/city only; IP never stored).
  fetch('https://ipwho.is/')
    .then(function (r) { return r.json(); })
    .then(function (g) {
      if (g && g.success !== false) {
        data.country = g.country || '';
        data.region = g.region || '';
        data.city = g.city || '';
      }
      send();
    })
    .catch(function () { send(); });
})();
