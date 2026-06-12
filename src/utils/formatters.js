export function formatValue(value, formatter) {
  switch (formatter) {
    case 'peso':
      // Show up to 2 decimal places, but only when the value isn't a whole number
      return `₱${value.toLocaleString('en-PH', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`;
    case 'number':
      return value.toLocaleString('en-PH');
    case 'area':
    case 'km2': // legacy alias
      return `${value.toLocaleString('en-PH')} km²`;
    case 'pesoMillions':
    case 'millions': // legacy alias
      return `₱${value.toLocaleString('en-PH')}M`;
    default:
      return String(value);
  }
}
