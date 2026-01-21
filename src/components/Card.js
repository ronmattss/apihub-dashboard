import React from 'react';
import PropTypes from 'prop-types';

export default function Card({ children, className = '', style = {}, role = 'region', color = 'white', ratio = '2/3', width = 500, height = 275, responsive = false, onRemove = null }) {
  const cardStyle = { ...style };
  if (color) cardStyle.backgroundColor = color;

  // compute numeric ratio (width/height) if possible
  let computedRatio = null;
  if (ratio) {
    if (typeof ratio === 'number') computedRatio = ratio;
    else if (typeof ratio === 'string' && ratio.includes('/')) {
      const parts = ratio.split('/').map(p => Number(p));
      if (parts.length === 2 && parts.every(Number.isFinite) && parts[1] !== 0) computedRatio = parts[0] / parts[1];
    } else {
      const n = Number(ratio);
      if (Number.isFinite(n) && n > 0) computedRatio = n;
    }
  }

  // If responsive, make the card fill its container width and use aspect-ratio to determine height.
  if (responsive) {
    cardStyle.width = '100%';
    if (computedRatio) {
      // CSS expects aspect-ratio as e.g. '16/9' or a number string
      cardStyle.aspectRatio = typeof ratio === 'number' ? String(ratio) : ratio;
    } else if (width && height) {
      cardStyle.aspectRatio = `${width}/${height}`;
    }
    // allow limiting max width when provided
    if (width) cardStyle.maxWidth = typeof width === 'number' ? `${width}px` : width;
  } else {
    // fixed pixel dimensions
    if (width) cardStyle.maxWidth = typeof width === 'number' ? `${width}px` : width;
    if (height) cardStyle.height = typeof height === 'number' ? `${height}px` : height;
  }

  // Ensure content can scroll inside if it overflows
  if (!cardStyle.overflow) cardStyle.overflow = 'auto';

  return (
    <div role={role} className={`rounded shadow p-4 ${className}`} style={cardStyle}>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label="Remove card"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-0.5 shadow-sm border text-red-600 hover:bg-red-50 z-10"
          title="Remove"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
  role: PropTypes.string,
  color: PropTypes.string,
  ratio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  responsive: PropTypes.bool,
  onRemove: PropTypes.func,
};
