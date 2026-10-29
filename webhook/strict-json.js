// Bounded JSON parsing that never resolves ambiguous object keys by last value.
export function parseUnambiguousJson(raw, maxDepth = 32) {
  const source = new TextDecoder('utf-8', {fatal:true, ignoreBOM:true}).decode(raw);
  const result = JSON.parse(source); // Validate the complete JSON grammar first.
  let at = 0;
  const space = () => { while (/[\x20\t\r\n]/.test(source[at] || '\x00')) at++; };
  const string = () => {
    const start = at++;
    while (at < source.length) {
      if (source[at] === '\\') at += 2;
      else if (source[at++] === '"') return JSON.parse(source.slice(start, at));
    }
    throw new Error('Invalid JSON');
  };
  const value = depth => {
    if (depth > maxDepth) throw new Error('Invalid JSON');
    space();
    if (source[at] === '{') {
      at++; space(); const seen = new Set();
      if (source[at] !== '}') while (true) {
        space(); const key = string();
        if (seen.has(key)) throw new Error('Invalid JSON');
        seen.add(key); space(); at++; value(depth + 1); space();
        if (source[at] !== ',') break;
        at++;
      }
      at++;
    } else if (source[at] === '[') {
      at++; space();
      if (source[at] !== ']') while (true) {
        value(depth + 1); space();
        if (source[at] !== ',') break;
        at++;
      }
      at++;
    } else if (source[at] === '"') string();
    else while (at < source.length && !/[\x20\t\r\n,}\]]/.test(source[at])) at++;
  };
  value(0); space();
  if (at !== source.length) throw new Error('Invalid JSON');
  return result;
}
