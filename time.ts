export default function time(instant: Date) {
  return instant.toLocaleString("en-US", {
    timeZone: "Europe/Prague",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}
