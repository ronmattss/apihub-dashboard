// Singleton HubClient: centralized WebSocket connection usable across the app
// Usage:
// import HubClient from '../helpers/hubClient';
// HubClient.connect({ url: 'ws://host:port/ws', token, autoReconnect: true });
// const unsub = HubClient.subscribe(msg => ...);
// HubClient.send(msg);
// unsub(); HubClient.close();

const HubClient = (() => {
  let ws = null;
  let currentUrl = null;
  let currentToken = null;
  const subs = new Set();
  let handlers = {};
  let shouldReconnect = false;
  let retries = 0;
  let maxRetries = 5;
  let retryIntervalMs = 2000;

  function _buildUrl() {
    if (!currentUrl) return null;
    return currentToken ? `${currentUrl}${currentUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(currentToken)}` : currentUrl;
  }

  function _createSocket() {
    const url = _buildUrl();
    if (!url) return;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      handlers.onError?.(err);
      ws = null;
      return;
    }

    ws.onopen = (ev) => {
      retries = 0;
      handlers.onOpen?.(ev);
    };

    ws.onmessage = (ev) => {
      let data = ev.data;
      try { data = JSON.parse(ev.data); } catch (_) {}
      // component-level subscribers
      subs.forEach(cb => {
        try { cb(data, ev); } catch (e) { console.error('HubClient subscriber error', e); }
      });
      handlers.onMessage?.(data, ev);
    };

    ws.onclose = (ev) => {
      handlers.onClose?.(ev);
      ws = null;
      if (shouldReconnect && retries < maxRetries) {
        retries += 1;
        setTimeout(() => _createSocket(), retryIntervalMs * retries);
      }
    };

    ws.onerror = (ev) => handlers.onError?.(ev);
  }

  function connect({ url, token, autoReconnect = false, maxRetries: mr, retryIntervalMs: ril } = {}) {
    if (url) currentUrl = url;
    if (token) currentToken = token;
    shouldReconnect = !!autoReconnect;
    if (mr !== undefined) maxRetries = mr;
    if (ril !== undefined) retryIntervalMs = ril;

    // If already connected to same url, reuse
    const target = _buildUrl();
    if (ws && ws.readyState === WebSocket.OPEN && target === (ws.url || target)) return HubClient;
    _createSocket();
    return HubClient;
  }

  function send(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('WebSocket not open');
    ws.send(typeof message === 'string' ? message : JSON.stringify(message));
  }

  function subscribe(cb) {
    subs.add(cb);
    return () => subs.delete(cb);
  }

  function setHandlers(h = {}) {
    handlers = Object.assign({}, handlers, h);
  }

  function isConnected() {
    return !!ws && ws.readyState === WebSocket.OPEN;
  }

  function close(preventReconnect = true) {
    shouldReconnect = preventReconnect ? false : shouldReconnect;
    if (ws) {
      try { ws.close(); } catch (_) {}
      ws = null;
    }
    subs.clear();
  }

  return { connect, send, subscribe, setHandlers, isConnected, close, get raw() { return ws; } };
})();

export default HubClient;
