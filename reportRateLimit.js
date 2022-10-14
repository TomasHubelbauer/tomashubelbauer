/**
 * 
 * @param {Headers} headers 
 */
export default function reportRateLimit(headers) {
  const used = headers.get('x-ratelimit-used');
  const limit = headers.get('x-ratelimit-limit');
  const resource = headers.get('x-ratelimit-resource');
  const remaining = headers.get('x-ratelimit-remaining');
  const reset = headers.get('x-ratelimit-reset');

  const format = new Intl.RelativeTimeFormat();
  const relative = format.format((new Date(reset * 1000) - new Date()) / 1000 / 60, 'minutes');
  const absolute = new Date(reset * 1000).toISOString();
  console.log(`Used ${used} out of ${limit} calls to ${resource} (${remaining} left, resets ${relative} on ${absolute})`);
}
