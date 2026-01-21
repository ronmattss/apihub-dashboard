import React from 'react';
import PropTypes from 'prop-types';

export default function Sidebar({ navigationItems = [], activePath = '/', onNavigate }) {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <nav className="space-y-2">
        {navigationItems.map((navigationItem) => (
          <button
            key={navigationItem.id}
            onClick={() => onNavigate && onNavigate(navigationItem.path)}
            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-3 ${
              navigationItem.path === activePath ? 'bg-gray-100 font-medium' : 'text-gray-700'
            }`}
          >
            {navigationItem.icon && (
              <span className="w-5 h-5 inline-flex items-center justify-center">{navigationItem.icon}</span>
            )}
            <span>{navigationItem.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

Sidebar.propTypes = {
  navigationItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ),
  activePath: PropTypes.string,
  onNavigate: PropTypes.func,
};
