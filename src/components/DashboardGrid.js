import React from 'react';
import PropTypes from 'prop-types';

export default function DashboardGrid({ children, columnCount = 3, gapSize = 6 }) {
  const gridClass = `grid gap-${gapSize} grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columnCount}`;

  return <main className={gridClass}>{children}</main>;
}

DashboardGrid.propTypes = {
  children: PropTypes.node,
  columnCount: PropTypes.number,
  gapSize: PropTypes.number,
};
