import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

export default function MessageSender({ wsType, wsMessage, onChangeType, onChangeMessage, onSendToService, onSendToSensor, onSendToDashboard, connected, bare = false }) {
  const inner = (
    <div>
      <label className="block text-sm font-medium text-gray-700">Type</label>
      <input value={wsType} onChange={(e) => onChangeType(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="message type (optional)" />
      <label className="block text-sm font-medium text-gray-700 mt-2">Message</label>
      <input value={wsMessage} onChange={(e) => onChangeMessage(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder='JSON or plain text' />
      <div className="mt-2 grid grid-cols-3 gap-2">
        <button onClick={onSendToService} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" disabled={!connected}>Send to Service</button>
        <button onClick={onSendToSensor} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" disabled={!connected}>Send to Sensor</button>
        <button onClick={onSendToDashboard} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700" disabled={!connected}>Send to Dashboard</button>
      </div>
    </div>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

MessageSender.propTypes = {
  wsType: PropTypes.string,
  wsMessage: PropTypes.string,
  onChangeType: PropTypes.func,
  onChangeMessage: PropTypes.func,
  onSendToService: PropTypes.func,
  onSendToSensor: PropTypes.func,
  onSendToDashboard: PropTypes.func,
  connected: PropTypes.bool,
};
