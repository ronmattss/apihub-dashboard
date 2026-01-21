import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import HubClient from '../helpers/hubClient';

const HubContext = createContext(null);

export function useHub() {
  return useContext(HubContext);
}

export function HubProvider({ children, wsUrl, token }) {
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const url = wsUrl || process.env.REACT_APP_HUB_WS_URL || 'ws://192.168.0.191:5007/ws/dashboard?dashboardId=CommandCenter';
    HubClient.setHandlers({
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: () => setConnected(false),
      onMessage: () => {}
    });
    HubClient.connect({ url, token, autoReconnect: true });

    const unsub = HubClient.subscribe((m) => setLog(prev => [m, ...prev].slice(0, 200)));
    return () => { unsub(); HubClient.close(); };
  }, [wsUrl, token]);

  const send = useCallback((msg) => HubClient.send(msg), []);
  const subscribe = useCallback((cb) => HubClient.subscribe(cb), []);

  const value = {
    connected,
    send,
    subscribe,
    log,
    client: HubClient
  };

  return (
    <HubContext.Provider value={value}>{children}</HubContext.Provider>
  );
}

export default HubProvider;
