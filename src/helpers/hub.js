// will contain all hub related helper functions in the future

// first connect to the hub
// call a web api first, to see if this app can connect
// if it can connect,
// connect to its websocket
// then get the list of services


// parameter for login function, data will be from .env later

// full path
const hubUrl = process.env.REACT_APP_HUB_URL || 'http://192.168.0.191:5007/api/LoginService/login';
const serviceId = process.env.REACT_APP_HUB_USER || 'admin';
const servicePassword = process.env.REACT_APP_HUB_PASS || 'password';

const hubWsUrl = process.env.REACT_APP_HUB_WS_URL || 'ws://192.168.0.191:5007/ws/dashboard?dashboardId=CommandCenter';
// create a function to fetch the login service and see if this app can login
export async function loginToHub(credentials = { username: serviceId, password: servicePassword }) {
  const { username, password } = credentials;
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  };

  // use the global fetch (works in browser); let caller handle errors
  const response = await fetch(hubUrl, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = (data && data.message) || response.statusText || response.status;
    throw new Error(msg);
  }

  return data;
}

export function connectToHubWebSocket({
  token = null,
  wsUrl = hubWsUrl,
  onOpen = () => { },
  onMessage = () => { },
  onClose = () => { },
  onError = () => { },
  autoReconnect = false,
  maxRetries = 5,
  retryIntervalMs = 2000
} = {}) {
  const buildUrl = () => (token ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}` : wsUrl);

  let ws = null;
  let retries = 0;
  let shouldReconnect = autoReconnect;

  const createSocket = () => {
    const url = buildUrl();
    try {
      ws = new WebSocket(url);
    } catch (err) {
      onError(err);
      ws = null;
      return;
    }

    ws.onopen = (ev) => {
      retries = 0;
      onOpen(ev);
    };

    ws.onmessage = (ev) => {
      let payload = ev.data;
      try { payload = JSON.parse(ev.data); } catch { }
      onMessage(payload, ev);
    };

    ws.onclose = (ev) => {
      onClose(ev);
      if (shouldReconnect && retries < maxRetries) {
        retries += 1;
        setTimeout(() => createSocket(), retryIntervalMs * retries);
      }
    };

    ws.onerror = (ev) => onError(ev);
  };

  // create initial socket
  createSocket();

  return {
    send: (data) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error('WebSocket not open');
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    },
    close: (preventReconnect = true) => {
      shouldReconnect = !preventReconnect ? shouldReconnect : false;
      ws && ws.close();
    },
    get raw() { return ws; },
    get connected() { return !!ws && ws.readyState === WebSocket.OPEN }
  };
}



