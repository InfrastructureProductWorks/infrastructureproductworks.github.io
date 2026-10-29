// URLSearchParams repairs malformed percent escapes and UTF-8. Inquiry records
// must not silently substitute contact text or purpose/notice assertions.
export function parseUnambiguousForm(raw) {
  const source = new TextDecoder('utf-8', {fatal:true, ignoreBOM:true}).decode(raw);
  const fields = new Map();
  const decode = value => decodeURIComponent(value.replaceAll('+', ' '));
  for (const pair of source.split('&')) {
    if (!pair) continue;
    const separator = pair.indexOf('=');
    const name = decode(separator < 0 ? pair : pair.slice(0, separator));
    const value = decode(separator < 0 ? '' : pair.slice(separator + 1));
    if (fields.has(name)) throw new Error('duplicate_form_field');
    fields.set(name, value);
  }
  return Object.fromEntries(fields);
}
