let now = new Date();
const dates = {};
for (let index = 0; index < 7; index++) {
  const date = now.toISOString().slice(0, 10);
  if (index === 0) {
    dates[date] = 'Today';
  }
  else if (index === 1) {
    dates[date] = 'Yesterday';
  }
  else {
    dates[date] = now.toLocaleDateString('en-US', { weekday: 'long' });
  }

  now = new Date(now.setDate(now.getDate() - 1));
}

export default function date(instant) {
  const date = instant.toISOString().slice(0, 10);
  return dates[date] || date;
}
