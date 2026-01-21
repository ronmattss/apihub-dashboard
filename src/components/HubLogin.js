import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

export default function HubLogin({ loading, connected, statusMessage, onTestLogin, onConnect, onDisconnect, bare = false }) {
  const inner = (
    <>
      <h2 className="text-lg font-semibold mb-2">Hub Login Result</h2>
      {loading && <div className="text-sm text-gray-500">Connecting...</div>}
      <div className="mt-3">
        <button
          type="button"
          onClick={onTestLogin}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          Test Login
        </button>
        <button
          type="button"
          onClick={onConnect}
          className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={loading || connected}
        >
          Connect WS
        </button>
        <button
          type="button"
          onClick={onDisconnect}
          className="ml-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          disabled={!connected}
        >
          Disconnect WS
        </button>
        <div className="inline-block ml-3 text-sm text-gray-700">Result: {statusMessage}</div>
      </div>
    </>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

HubLogin.propTypes = {
  loading: PropTypes.bool,
  connected: PropTypes.bool,
  statusMessage: PropTypes.string,
  onTestLogin: PropTypes.func,
  onConnect: PropTypes.func,
  onDisconnect: PropTypes.func,
};
