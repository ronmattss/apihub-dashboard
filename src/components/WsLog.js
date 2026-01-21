import React from 'react';
import PropTypes from 'prop-types';
import { SensorReading } from '../helpers/sensorReading';
import Card from './Card';

export default function WsLog({ wsLog, bare = false }) {
  const inner = (
    <>
      <h3 className="text-sm font-medium">WS Messages</h3>
      <div className="mt-2 max-h-40 overflow-auto text-sm bg-gray-50 p-2 rounded">
        {wsLog.length === 0 && <div className="text-gray-500">No messages yet.</div>}
        {wsLog.map((entry, index) => {
          let display = '';
          let who = null;
          let payload = entry;

          if (entry && typeof entry === 'object' && ('msg' in entry || 'who' in entry)) {
            who = entry.who || null;
            payload = entry.msg !== undefined ? entry.msg : null;
          }

          let parsed = payload;
          if (typeof payload === 'string') {
            try { parsed = JSON.parse(payload); } catch { parsed = payload; }
          }

          try {
            if (parsed && typeof parsed === 'object') {
              try {
                SensorReading.validate(parsed);
                const measurements = parsed.Payload && parsed.Payload.Measurements;
                if (Array.isArray(measurements)) {
                  const find = (k) => measurements.find(x => String(x.Key).toLowerCase() === k)?.Value;
                  const temp = find('temperature');
                  const hum = find('humidity');
                  const pres = find('pressure');
                  if (temp !== undefined || hum !== undefined || pres !== undefined) {
                    const parts = [];
                    if (temp !== undefined) parts.push(`T: ${temp}`);
                    if (hum !== undefined) parts.push(`H: ${hum}`);
                    if (pres !== undefined) parts.push(`P: ${pres}`);
                    display = `Telemetry: ${parts.join(' | ')}`;
                  }
                }
              } catch (_) {
                // not a valid envelope according to SensorReading
              }
            }
          } catch (_) {}

          if (!display) {
            const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
            display = who ? `${who}: ${raw}` : raw;
          } else if (who) {
            display = `${who}: ${display}`;
          }

          return <pre key={index} className="mb-1">{display}</pre>;
        })}
      </div>
    </>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

WsLog.propTypes = {
  wsLog: PropTypes.array,
};
