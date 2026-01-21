import React from 'react';
import PropTypes from 'prop-types';
import Card from './Card';

function formatTime(isoString, timezone) {
  try {
    const dt = new Date(isoString);
    return dt.toLocaleString(undefined, { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: timezone });
  } catch (_) {
    return isoString;
  }
}

function WeatherRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-gray-600">
      <div className="font-medium text-gray-700">{label}</div>
      <div>{value}</div>
    </div>
  );
}

export default function WeatherCard({ data, loading, bare = false }) {
  const current = data?.current ?? null;
  const units = data?.current_units ?? {};
  const tz = data?.timezone || undefined;

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Current Conditions</h3>
          <div className="text-sm text-gray-500">{data?.timezone_abbreviation || data?.timezone || 'Local'}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-800">
            {loading ? '—' : (current?.temperature_2m != null ? `${current.temperature_2m.toFixed(1)}${units?.temperature_2m || '°'}` : 'N/A')}
          </div>
          <div className="text-sm text-gray-500">Feels like {loading ? '—' : (current?.apparent_temperature != null ? `${current.apparent_temperature.toFixed(1)}${units?.apparent_temperature || '°'}` : 'N/A')}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <WeatherRow label="Time" value={loading ? '—' : (current?.time ? formatTime(current.time, tz) : 'N/A')} />
        <WeatherRow label="Humidity" value={loading ? '—' : (current?.relative_humidity_2m != null ? `${current.relative_humidity_2m}${units?.relative_humidity_2m || '%'}` : 'N/A')} />
        <WeatherRow label="Is Day" value={loading ? '—' : (current?.is_day != null ? (current.is_day ? 'Yes' : 'No') : 'N/A')} />
        <WeatherRow label="Elevation" value={data?.elevation != null ? `${data.elevation} m` : 'N/A'} />
        <WeatherRow label="Generated" value={data?.generationtime_ms != null ? `${data.generationtime_ms.toFixed(2)} ms` : 'N/A'} />
      </div>

      <div className="mt-4 text-xs text-gray-400">Latitude: {data?.latitude ?? '—'} • Longitude: {data?.longitude ?? '—'}</div>
    </>
  );

  if (bare) return inner;
  return <Card>{inner}</Card>;
}

WeatherCard.propTypes = {
  data: PropTypes.object,
  loading: PropTypes.bool
};
