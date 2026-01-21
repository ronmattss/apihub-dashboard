import React, { useState, useEffect, useRef } from 'react';
import { ResponsiveGridLayout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Header, Sidebar, HubLogin, MessageSender, CommandBuilder, WsLog, MatrixToggle } from '../components';
import WeatherCard from '../components/WeatherCard';
import Card from '../components/Card';
import sensorCommand from '../helpers/sensorCommand';
import HubClient from '../helpers/hubClient';
import { loginToHub } from '../helpers/hub';

const { SUPPORTED: SUPPORTED_CMDS } = sensorCommand;

const DEFAULT_CARD_SIZE = { w: 3, h: 3 };
const ROW_HEIGHT = 90;
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const SAMPLE_WEATHER = {
  current: {
    temperature: 0,
    windspeed: 2,
    weathercode: 0,
    time: new Date().toISOString(),
  },
  daily_units: {
    time: 'iso8601',
    weathercode: 'wmo code',
    temperature_2m_max: '°C',
    temperature_2m_min: '°C',
  },
  daily: {
    time: [new Date().toISOString().slice(0, 10)],
    weathercode: [0],
    temperature_2m_max: [2],
    temperature_2m_min: [-4],
  },
};
const DEFAULT_WS_URL = process.env.REACT_APP_HUB_WS_URL || 'ws://192.168.0.191:5007/ws/dashboard?dashboardId=CommandCenter';

export default function Home() {
  const [statusText, setStatusText] = useState('Not connected');
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePath, setActivePath] = useState('/home');
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const [hubConnecting, setHubConnecting] = useState(false);
  const [hubConnected, setHubConnected] = useState(false);
  const [hubStatus, setHubStatus] = useState('');
  const [hubToken, setHubToken] = useState(null);
  const [wsType, setWsType] = useState('');
  const [wsMessage, setWsMessage] = useState('');

  const componentRegistry = {
    WeatherCard,
    HubLogin,
    MessageSender,
    CommandBuilder,
    MatrixToggle,
    WsLog,
  };

  const defaultCardLayout = [
    { id: 'card-weather', type: 'WeatherCard', props: {}, layout: { i: 'card-weather', x: 0, y: 0, w: DEFAULT_CARD_SIZE.w, h: DEFAULT_CARD_SIZE.h } },
    { id: 'card-hub', type: 'HubLogin', props: {}, layout: { i: 'card-hub', x: 3, y: 0, w: DEFAULT_CARD_SIZE.w, h: DEFAULT_CARD_SIZE.h } },
  ];

  const [cardLayout, setCardLayout] = useState(defaultCardLayout);
  const [newCardType, setNewCardType] = useState(Object.keys(componentRegistry)[0] || '');
  const [containerWidth, setContainerWidth] = useState(1200);
  const gridWrapperRef = useRef(null);

  function persistCardLayout(nextLayout) {
    setCardLayout(nextLayout);
  }

  function addCard(cardType) {
    if (!cardType || !componentRegistry[cardType]) return;
    const id = `${cardType}-${Date.now()}`;
    const sizeW = DEFAULT_CARD_SIZE.w;
    const sizeH = DEFAULT_CARD_SIZE.h;
    const newCard = { id, type: cardType, props: {}, layout: { i: id, x: 0, y: Infinity, w: sizeW, h: sizeH } };
    persistCardLayout([...cardLayout, newCard]);
  }

  function removeCardById(cardId) {
    persistCardLayout(cardLayout.filter((c) => c.id !== cardId));
  }

  function normalizeLayout(layout = {}, cols = 12) {
    const w = Math.max(1, Math.min(Number.isFinite(Number(layout.w)) ? Number(layout.w) : DEFAULT_CARD_SIZE.w, cols));
    const h = Number.isFinite(Number(layout.h)) ? Number(layout.h) : DEFAULT_CARD_SIZE.h;
    const maxX = Math.max(0, cols - w);
    const x = Math.max(0, Math.min(Number.isFinite(Number(layout.x)) ? Number(layout.x) : 0, maxX));
    const y = Number.isFinite(Number(layout.y)) ? Number(layout.y) : 0;
    return { i: layout.i, x, y, w, h };
  }

  function buildLayouts(cards) {
    const result = {};
    Object.entries(COLS).forEach(([bp, colCount]) => {
      result[bp] = (cards || []).map((card, index) => {
        const norm = normalizeLayout({ ...card.layout, i: card.id }, colCount);
        if (!Number.isFinite(norm.y) || norm.y === Infinity) {
          const itemsPerRow = Math.max(1, Math.floor(colCount / norm.w));
          norm.y = Math.floor(index / itemsPerRow) * norm.h;
          norm.x = (index % itemsPerRow) * norm.w;
        }
        return norm;
      });
    });
    return result;
  }

  function handleLayoutChange(layout, allLayouts) {
    if (!allLayouts) return;
    const nextCards = cardLayout.map((card) => {
      const match = (allLayouts[currentBreakpoint] || []).find((item) => item.i === card.id);
      if (!match) return card;
      return { ...card, layout: { i: card.id, x: match.x, y: match.y, w: match.w, h: match.h } };
    });
    persistCardLayout(nextCards);
  }

  useEffect(() => {
    const url = process.env.REACT_APP_WEATHER_URL || null;
    if (!url) {
      setWeather(SAMPLE_WEATHER);
      return;
    }
    let mounted = true;
    setLoadingWeather(true);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText || String(r.status));
        return r.json();
      })
      .then((j) => { if (mounted) setWeather(j); })
      .catch(() => { if (mounted) setWeather(SAMPLE_WEATHER); })
      .finally(() => { if (mounted) setLoadingWeather(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // ensure no websocket connection is left open on mount
    HubClient.close();
    return () => HubClient.close();
  }, []);

  function handleStatus(res) {
    if (!res) return setStatusText('No response');
    if (res.ok) return setStatusText(`Connected (${res.status})`);
    setStatusText(res.error ? `Error: ${res.error}` : `Failed (${res.status})`);
  }

  function handleToggleSidebar() {
    setIsSidebarOpen((previous) => !previous);
  }

  function handleNavigate(nextPath) {
    setActivePath(nextPath);
  }

  function handleChangeWsType(val) {
    setWsType(val);
  }

  function handleChangeWsMessage(val) {
    setWsMessage(val);
  }

  function sendWs(target) {
    if (!HubClient.isConnected || !HubClient.isConnected()) {
      setHubStatus('WS not connected');
      setStatusText('WS not connected');
      return;
    }
    const payload = {
      target,
      type: wsType || 'message',
      message: wsMessage,
    };
    try {
      HubClient.send(payload);
      setHubStatus(`Sent to ${target}`);
      setStatusText(`Sent to ${target}`);
    } catch (err) {
      setHubStatus(err?.message || 'Send failed');
      setStatusText('Send failed');
    }
  }

  const handleSendToService = () => sendWs('service');
  const handleSendToSensor = () => sendWs('sensor');
  const handleSendToDashboard = () => sendWs('dashboard');

  async function handleTestLogin() {
    setHubConnecting(true);
    try {
      const res = await loginToHub();
      const token = res?.token || res?.accessToken || res?.Token || res?.jwt || res?.data?.token || null;
      setHubToken(token);
      setHubStatus(token ? 'Login ok' : 'Login ok (no token)');
      setStatusText('Hub login ok');
    } catch (err) {
      setHubStatus(err?.message || 'Login failed');
      setStatusText('Hub login failed');
    } finally {
      setHubConnecting(false);
    }
  }

  function handleConnectWs() {
    setHubConnecting(true);
    HubClient.close(false);
    HubClient.setHandlers({
      onOpen: () => { setHubConnected(true); setHubConnecting(false); setHubStatus('WS connected'); setStatusText('WS connected'); },
      onClose: () => { setHubConnected(false); setHubStatus('WS closed'); },
      onError: (ev) => { setHubConnecting(false); setHubStatus(`WS error${ev?.message ? `: ${ev.message}` : ''}`); },
    });
    HubClient.connect({ url: DEFAULT_WS_URL, token: hubToken, autoReconnect: false });
  }

  function handleDisconnectWs() {
    HubClient.close();
    setHubConnected(false);
    setHubConnecting(false);
    setHubStatus('WS disconnected');
    setStatusText('WS disconnected');
  }

  useEffect(() => () => { HubClient.close(); }, []);

  useEffect(() => {
    const node = gridWrapperRef.current;
    if (!node) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = entry.contentRect.width;
      if (Number.isFinite(nextWidth) && nextWidth > 0) {
        setContainerWidth(nextWidth);
      }
    });
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const layouts = buildLayouts(cardLayout);
  const navigationItems = [{ label: 'Home', path: '/home' }];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header statusText={statusText} />

      <div className="flex">
        {isSidebarOpen && (
          <Sidebar
            navigationItems={navigationItems}
            activePath={activePath}
            onNavigate={handleNavigate}
          />
        )}

        <div className="flex-1 p-6" ref={gridWrapperRef}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome</h1>
              <p className="text-gray-700">This is the Home page for the Hub Dashboard.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleSidebar}
                className="px-3 py-1 bg-white border rounded hover:bg-gray-100"
              >
                {isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm">Add card:</label>
            <select value={newCardType} onChange={(e) => setNewCardType(e.target.value)} className="p-2 border rounded">
              {Object.keys(componentRegistry).map((componentKey) => (
                <option key={componentKey} value={componentKey}>{componentKey}</option>
              ))}
            </select>
            <button
              onClick={() => addCard(newCardType)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <ResponsiveGridLayout
            className="layout"
            breakpoints={BREAKPOINTS}
            cols={COLS}
            layouts={layouts}
            rowHeight={ROW_HEIGHT}
            margin={[10, 10]}
            compactType="vertical"
            isResizable={false}
            draggableCancel="button, a, input, textarea, select, option, [role='button']"
            onLayoutChange={handleLayoutChange}
            onBreakpointChange={(bp) => setCurrentBreakpoint(bp)}
            width={containerWidth}
          >
            {cardLayout.map((card) => {
              const CardComponent = componentRegistry[card.type];
              if (!CardComponent) return null;

              const dynamicProps = card.type === 'WeatherCard'
                ? { data: weather, loading: loadingWeather }
                : card.type === 'ServiceListCard'
                ? { onStatus: handleStatus }
                : card.type === 'CommandBuilder'
                ? { supportedCommands: SUPPORTED_CMDS, onSend: (built) => setStatusText(`Command: ${built.Type || ''} ready`) }
                : card.type === 'HubLogin'
                ? {
                    loading: hubConnecting,
                    connected: hubConnected,
                    statusMessage: hubStatus,
                    onTestLogin: handleTestLogin,
                    onConnect: handleConnectWs,
                    onDisconnect: handleDisconnectWs,
                  }
                : card.type === 'MessageSender'
                ? {
                    wsType,
                    wsMessage,
                    onChangeType: handleChangeWsType,
                    onChangeMessage: handleChangeWsMessage,
                    onSendToService: handleSendToService,
                    onSendToSensor: handleSendToSensor,
                    onSendToDashboard: handleSendToDashboard,
                    connected: hubConnected,
                  }
                : {};

              const mergedProps = { ...card.props, ...dynamicProps };
              const gridLayout = (layouts[currentBreakpoint] || []).find((item) => item.i === card.id)
                || { x: 0, y: 0, w: DEFAULT_CARD_SIZE.w, h: DEFAULT_CARD_SIZE.h, i: card.id };

              return (
                <div key={card.id} data-grid={gridLayout} className="group h-full">
                  <Card
                    onRemove={() => removeCardById(card.id)}
                    responsive={false}
                    style={{ height: '100%', width: '100%' }}
                    className="relative h-full"
                  >
                    <CardComponent {...mergedProps} bare={true} />
                  </Card>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        </div>
      </div>
    </div>
  );
}
