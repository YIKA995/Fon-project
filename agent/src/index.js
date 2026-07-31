require('dotenv').config();
const path = require('path');
const { DurableQueue } = require('./queue');
const { nextEvent } = require('./collector');
const { SyncClient } = require('./sync');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:4000';
const AGENT_API_KEY = process.env.AGENT_API_KEY || 'dev-agent-key-1';
const ASSET_ID = process.env.ASSET_ID || undefined;
const COLLECT_INTERVAL_MS = Number(process.env.COLLECT_INTERVAL_MS) || 4000;
const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS) || 10000;
const QUEUE_FILE = path.resolve(process.env.QUEUE_FILE || './data/queue.jsonl');

const queue = new DurableQueue(QUEUE_FILE);
const client = new SyncClient({ serverUrl: SERVER_URL, apiKey: AGENT_API_KEY });

function log(msg, meta) {
  const line = `[sentinel-agent] ${new Date().toISOString()} ${msg}`;
  console.log(meta ? `${line} ${JSON.stringify(meta)}` : line);
}

function collectTick() {
  const event = nextEvent(ASSET_ID);
  queue.enqueue(event);
  log('collected event, queued locally', { eventType: event.eventType, queued: queue.size() });
}

async function syncTick() {
  const pending = queue.readAll(200);
  if (pending.length === 0) return;

  const online = await client.isOnline();
  if (!online) {
    log('offline - keeping events buffered locally', { queued: pending.length });
    return;
  }

  try {
    const result = await client.pushBatch(pending);
    queue.removeByExternalIds(pending.map((e) => e.externalId));
    log('synced buffered events to Sentinel Africa', result);
  } catch (err) {
    log('sync attempt failed, will retry next cycle', { error: err.message });
  }
}

log('Sentinel Africa edge agent starting', {
  serverUrl: SERVER_URL,
  queueFile: QUEUE_FILE,
  assetId: ASSET_ID || '(none - unassigned telemetry)',
});

setInterval(collectTick, COLLECT_INTERVAL_MS);
setInterval(syncTick, SYNC_INTERVAL_MS);

// Also try immediately on boot so a freshly-restarted agent doesn't wait
// a full interval before flushing whatever was buffered while it was down.
syncTick();
