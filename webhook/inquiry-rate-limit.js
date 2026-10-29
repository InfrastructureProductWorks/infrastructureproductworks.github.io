import crypto from 'node:crypto';

// Local abuse control only: no raw address keys, durable identity or transport.
export function createInquiryRateLimiter({windowMs=10*60*1000, max=6, maxClients=1000,
  now=()=>performance.now(), setTimer=setTimeout, clearTimer=clearTimeout}={}) {
  const entries=new Map();
  let key=crypto.randomBytes(32), timer;
  function prune(time) {
    for(const [id,times] of entries) {
      const recent=times.filter(t=>time-t<windowMs);
      if(recent.length)entries.set(id,recent);else entries.delete(id);
    }
  }
  function arm(time) {
    if(timer!==undefined){clearTimer(timer);timer=undefined;}
    if(!entries.size)return;
    let expiry=Infinity;
    for(const times of entries.values())expiry=Math.min(expiry,times[0]+windowMs);
    timer=setTimer(()=>{timer=undefined;const time=now();prune(time);arm(time);},Math.max(1,expiry-time));
    timer.unref?.();
  }
  return {
    limited(address) {
      const time=now();prune(time);
      const id=crypto.createHmac('sha256',key).update(address).digest('hex');
      if(!entries.has(id)&&entries.size>=maxClients){arm(time);return true;}
      const times=entries.get(id)||[];
      const blocked=times.length>=max;
      if(!blocked){times.push(time);entries.set(id,times);}
      arm(time);return blocked;
    },
    get trackedClients(){return entries.size;},
    clear() {
      if(timer!==undefined){clearTimer(timer);timer=undefined;}
      entries.clear();key.fill(0);key=crypto.randomBytes(32);
    }
  };
}
