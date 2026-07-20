export const TEMPERATURE_SCALES = {
  celsius: { label: 'Celsius', symbol: '°C' },
  kelvin: { label: 'Kelvin', symbol: 'K' },
  fahrenheit: { label: 'Fahrenheit', symbol: '°F' }
};

export function convertTemperature(value, sourceScale) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return { celsius: NaN, kelvin: NaN, fahrenheit: NaN };
  }

  const celsius = sourceScale === 'celsius'
    ? numeric
    : sourceScale === 'kelvin'
      ? numeric - 273.15
      : (numeric - 32) * 5 / 9;

  return {
    celsius,
    kelvin: celsius + 273.15,
    fahrenheit: celsius * 9 / 5 + 32
  };
}

export function formatTemperature(value) {
  if (!Number.isFinite(value)) return '—';
  const rounded = Math.round(value * 1e9) / 1e9;
  return rounded.toLocaleString('es-AR', {
    maximumFractionDigits: 6,
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2
  });
}
