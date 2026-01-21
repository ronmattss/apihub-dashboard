// React Component for displaying a card with a list of services coming from a web server with Websocket
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { loginToHub } from '../helpers/hub';
import { SensorReading } from '../helpers/sensorReading';
import sensorCommand from '../helpers/sensorCommand';
import { useHub } from '../context/HubProvider';
import { HubLogin, MatrixToggle, MessageSender, CommandBuilder, WsLog } from './index';
import Card from './Card';
const { build: buildSensorCommand, SUPPORTED: SUPPORTED_CMDS, createSample } = sensorCommand;

export default function ServiceListCard({ onStatus, bare = false }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [wsType, setWsType] = useState('');
  const [wsMessage, setWsMessage] = useState('');
  // command builder moved into CommandBuilder component (local state there)
  const [wsLog, setWsLog] = useState([]);
  const connRef = useRef(null);
  const [matrix1On, setMatrix1On] = useState(false);
  const hub = useHub();


  async function handleTestClick() {
    setLoading(true);
    setMessage('');
    try {
      const res = await loginToHub();
      setResult(res);
      setMessage('Success');
      if (onStatus) onStatus(res);
    } catch (err) {
      setResult(null);
      setMessage('Error: ' + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setLoading(true);
    setMessage('');
    try {
      const res = true;//await loginToHub();
      setResult(res);
      if (onStatus) onStatus(res);
      const token = res?.token || res?.accessToken || null;
      // ensure centralized client is connected
      try {
        hub?.client?.connect?.({ token });
        hub?.client?.setHandlers?.({
          onOpen: () => setConnected(true),
          onClose: () => setConnected(false),
          onError: (e) => { console.error('ws error', e); setConnected(false); }
        });
        setMessage('Connected');
      } catch (e) {
        setMessage('Connect error: ' + (e && e.message ? e.message : String(e)));
      }
    } catch (err) {
      setResult(null);
      setMessage('Error: ' + (err && err.message ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    try { hub?.client?.close?.(); } catch (e) { /* ignore */ }
    setConnected(false);
    setMessage('Disconnected');
  }

  function handleSend() {
    if (!hub || !hub.connected) {
      setMessage('Socket not connected');
      return;
    }
    let payload;
    try { payload = JSON.parse(wsMessage); } catch { payload = wsMessage; }
    const data = wsType ? { Type: wsType, Payload: payload } : payload;
    try {
      hub.send(data);
      setMessage('Sent');
    } catch (err) {
      setMessage('Send error: ' + (err && err.message ? err.message : String(err)));
    }
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function sendCommandToTargetSensor(to) {
    if (!hub || !hub.connected) { setMessage('Socket not connected'); return; }
    // Build SensorCommand from user input (wsMessage) or create a default if wsMessage is empty
    let command;
    try {
      if (wsMessage && wsMessage.trim().length > 0) {
        // Try to build from provided JSON/object
        try {
          command = buildSensorCommand(wsMessage);
        } catch (e) {
          // If build failed, fallback to using the string as Message
          command = buildSensorCommand({ Type: 'Custom', Message: wsMessage });
        }
      } else {
        command = buildSensorCommand({ Type: 'Analog', Pin: 5, Message: null });
      }

      const msg = {
          Type: 'Command',
          To: to,
          From: 'CommandCenter',
          Id: command.Id || generateId('cmd'),
          CorrelationId: generateId('corr'),
          Meta: { schema: 'sensor-command:v1' },
          Payload: command
      };

      hub.send(msg);
      setMessage('Sent');
      setWsLog(prev => [{ who: to, msg }, ...prev].slice(0, 100));
    } catch (err) {
      setMessage('Send error: ' + (err && err.message ? err.message : String(err)));
    }
  }
  function sendMessageToService(to) {
    if (!hub || !hub.connected) { setMessage('Socket not connected'); return; }
    let payload;
    try { payload = JSON.parse(wsMessage); } catch { payload = wsMessage; }

      const msg = {
      Type: 'Information',
       To: "LoginService",
      From: 'CommandCenter',
      Id: generateId('cmd'),
      CorrelationId: generateId('corr'),
      Payload: {
        "Information":wsMessage
      }
    };

    try {
      hub.send(msg);
      setMessage('Sent');
      setWsLog(prev => [{ who: to, msg }, ...prev].slice(0, 100));
    } catch (err) {
      setMessage('Send error: ' + (err && err.message ? err.message : String(err)));
    }
  }
  function sendMessageToDashboard(to) {
    if (!hub || !hub.connected) { setMessage('Socket not connected'); return; }
    let payload;
    try { payload = JSON.parse(wsMessage); } catch { payload = wsMessage; }

    const msg = {
        Type: 'generic',
        To: to,
        From: 'dashboard-1',
        Id: generateId('cmd'),
        CorrelationId: generateId('corr'),
        Meta: { schema: 'sensor-command:v1' },
        Payload: {
          "Information": wsMessage
        }
    };

    try {
      hub.send(msg);
      setMessage('Sent');
      setWsLog(prev => [{ who: to, msg }, ...prev].slice(0, 100));
    } catch (err) {
      setMessage('Send error: ' + (err && err.message ? err.message : String(err)));
    }
  }

  useEffect(() => {
    // subscribe to centralized hub messages to populate local wsLog
    const unsub = hub?.subscribe?.((m) => setWsLog((previousLog) => [m, ...previousLog].slice(0, 100)));
    return () => { if (unsub) unsub(); };
  }, [hub]);

  const inner = (
    <>
      <HubLogin
        loading={loading}
        connected={connected}
        statusMessage={message}
        onTestLogin={handleTestClick}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        bare={true}
      />

      <div className="mt-3">
        <MatrixToggle label="Matrix 1" isOn={matrix1On} onToggle={(next) => {
          setMatrix1On(next);
          if (!connRef.current || !connRef.current.connected) { setMessage('Socket not connected'); return; }
          try {
            const built = { Type: 'Matrix', Value: next ? 1 : 0, Id: generateId('m') };
            const command = buildSensorCommand(built);
            const msg = {
              Type: 'Command',
              To: 'TempHumidSensor',
              From: 'CommandCenter',
              Id: command.Id || generateId('cmd'),
              CorrelationId: generateId('corr'),
              Meta: { schema: 'sensor-command:v1' },
              Payload: command
            };
            connRef.current.send(msg);
            setMessage('Sent Matrix ' + (next ? 'On' : 'Off'));
            setWsLog(prev => [{ who: 'TempHumidSensor', msg }, ...prev].slice(0, 100));
          } catch (err) {
            setMessage('Send error: ' + (err && err.message ? err.message : String(err)));
          }
        }} disabled={!connected} bare={true} />
      </div>

      <div className="mt-4">
        <MessageSender
          wsType={wsType}
          wsMessage={wsMessage}
          onChangeType={setWsType}
          onChangeMessage={setWsMessage}
          onSendToService={() => sendMessageToService('service')}
          onSendToSensor={() => sendCommandToTargetSensor('TempHumidSensor')}
          onSendToDashboard={() => sendMessageToDashboard('dashboard')}
          connected={connected}
          bare={true}
        />
      </div>

      <div className="mt-4">
          <CommandBuilder
          supportedCommands={SUPPORTED_CMDS}
          onSend={(validatedCommand) => {
            const to = 'TempHumidSensor';
            if (!connRef.current || !connRef.current.connected) { setMessage('Socket not connected'); return; }
            try {
              const msg = {
                Type: 'Command',
                To: to,
                From: 'CommandCenter',
                Id: validatedCommand.Id || generateId('cmd'),
                CorrelationId: generateId('corr'),
                Meta: { schema: 'sensor-command:v1' },
                Payload: validatedCommand
              };
              connRef.current.send(msg);
              setMessage('Sent');
              setWsLog(prev => [{ who: to, msg }, ...prev].slice(0, 100));
            } catch (err) {
              setMessage('Send error: ' + (err && err.message ? err.message : String(err)));
            }
          }}
            bare={true}
          />
      </div>

      <div className="mt-4">
          <WsLog wsLog={wsLog} bare={true} />
      </div>

      {!loading && result && (
        <pre className="text-sm text-gray-700 overflow-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
      )}
      {!loading && !result && (
        <div className="text-sm text-gray-500">No result yet.</div>
      )}
    </>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

ServiceListCard.propTypes = {
  onStatus: PropTypes.func,
};

