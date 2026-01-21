import React, { useState } from 'react';
import PropTypes from 'prop-types';
import sensorCommand from '../helpers/sensorCommand';
import Card from './Card';
const { createSample, build: buildSensorCommand, SUPPORTED: DEFAULT_SUPPORTED } = sensorCommand;

export default function CommandBuilder({ supportedCommands = DEFAULT_SUPPORTED, onSend, bare = false }) {
  const [localCmdType, setLocalCmdType] = useState(supportedCommands && supportedCommands[0] ? supportedCommands[0] : 'Custom');
  const [localCmdPin, setLocalCmdPin] = useState('');
  const [localCmdValue, setLocalCmdValue] = useState('');
  const [localCmdMessage, setLocalCmdMessage] = useState('');
  const [localCmdPinMode, setLocalCmdPinMode] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  function handleInsertSample() {
    try {
      const sample = createSample(localCmdType);
      setLocalCmdType(sample.Type || localCmdType);
      setLocalCmdPin(sample.Pin ?? '');
      setLocalCmdValue(sample.Value ?? '');
      setLocalCmdMessage(sample.Message ?? '');
      setLocalCmdPinMode(sample.PinMode ?? '');
      setStatusMessage('Sample inserted');
    } catch (err) {
      setStatusMessage('Insert sample error');
    }
  }

  function handleSend() {
    try {
      const built = {
        Type: localCmdType,
        Pin: localCmdPin !== '' ? Number(localCmdPin) : undefined,
        Value: localCmdValue !== '' ? Number(localCmdValue) : undefined,
        Message: localCmdMessage !== '' ? localCmdMessage : undefined,
        PinMode: localCmdPinMode !== '' ? localCmdPinMode : undefined,
      };

      const validated = buildSensorCommand(built);
      if (onSend) onSend(validated);
      setStatusMessage('Command built and sent');
    } catch (err) {
      setStatusMessage('Build/send error: ' + (err && err.message ? err.message : String(err)));
    }
  }

  const inner = (
    <div>
      <h3 className="text-sm font-medium">Command Builder</h3>
      <div className="mt-2 grid grid-cols-1 gap-2 bg-gray-50 p-3 rounded">
        <div>
          <label className="block text-sm">Type</label>
          <select value={localCmdType} onChange={(e) => setLocalCmdType(e.target.value)} className="mt-1 p-2 border rounded w-full">
            {(supportedCommands || []).map((commandType) => <option key={commandType} value={commandType}>{commandType}</option>)}
          </select>
        </div>

        {(localCmdType === 'PinWrite' || localCmdType === 'PinRead' || localCmdType === 'PwmWrite') && (
          <div>
            <label className="block text-sm">Pin</label>
            <input value={localCmdPin} onChange={(e) => setLocalCmdPin(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="e.g. 13" />
          </div>
        )}

        {(localCmdType === 'PinWrite' || localCmdType === 'Matrix' || localCmdType === 'PwmWrite') && (
          <div>
            <label className="block text-sm">Value</label>
            <input value={localCmdValue} onChange={(e) => setLocalCmdValue(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="e.g. 1 or 128" />
          </div>
        )}

        {(localCmdType === 'SerialPrint' || localCmdType === 'SerialLog') && (
          <div>
            <label className="block text-sm">Message</label>
            <input value={localCmdMessage} onChange={(e) => setLocalCmdMessage(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="text" />
          </div>
        )}

        <div>
          <label className="block text-sm">PinMode (optional)</label>
          <input value={localCmdPinMode} onChange={(e) => setLocalCmdPinMode(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="INPUT, OUTPUT, INPUT_PULLUP" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="px-3 py-1 bg-gray-600 text-white rounded" onClick={handleInsertSample}>Insert Sample</button>
          <button type="button" className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleSend}>Send Command</button>
        </div>

        {statusMessage && <div className="text-sm text-gray-600 mt-2">{statusMessage}</div>}
      </div>
    </div>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

CommandBuilder.propTypes = {
  supportedCommands: PropTypes.array,
  onSend: PropTypes.func,
};
