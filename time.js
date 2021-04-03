export default function time(/** @type {Date} */ instant) {
  return instant.toLocaleString('en-US', { timeZone: 'Europe/Prague', hour12: false, hour: '2-digit', minute: '2-digit' });
}
