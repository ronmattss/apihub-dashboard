import React from 'react';
import PropTypes from 'prop-types';

export default function Header({ statusText }) {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="font-semibold">Dashboard</div>
        <div className="text-sm opacity-90">{statusText}</div>
      </div>
    </header>
  );
}

Header.defaultProps = {
  statusText: 'Not connected',
};

Header.propTypes = {
  statusText: PropTypes.string,
};
