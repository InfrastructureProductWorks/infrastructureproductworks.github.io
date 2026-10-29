const actions = new Set(['purchased','changed','cancelled','pending_change','pending_change_cancelled']);
// Only routing metadata is logged. A valid signature does not make arbitrary
// event names, payload properties or delivery headers safe logging values.
export function marketplaceTelemetry(event, payload, delivery, receivedAt) {
  const knownEvent = event === 'marketplace_purchase' || event === 'ping';
  return {
    event:knownEvent ? event : 'unrecognized',
    action:event === 'marketplace_purchase' && typeof payload?.action === 'string'
      && actions.has(payload.action) ? payload.action : null,
    delivery:typeof delivery === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(delivery) ? delivery.toLowerCase() : null,
    receivedAt
  };
}
