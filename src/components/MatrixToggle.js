import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

export default function MatrixToggle({ label, isOn, onToggle, disabled, bare = false }) {
  const inner = (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="mt-2">
        <button
          type="button"
          onClick={() => onToggle(!isOn)}
          className={"px-3 py-1 rounded " + (isOn ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-gray-600 text-white hover:bg-gray-700')}
          disabled={disabled}
        >
          {label}: {isOn ? 'On' : 'Off'}
        </button>
      </div>
    </div>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

MatrixToggle.propTypes = {
  label: PropTypes.string,
  isOn: PropTypes.bool,
  onToggle: PropTypes.func,
  disabled: PropTypes.bool,
};
