export default function time(instant) {
  return instant.toISOString().slice(11, 16);
}
