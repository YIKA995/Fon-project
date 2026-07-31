const fs = require('fs');
const path = require('path');

/**
 * Durable local event queue backed by an append-only JSONL file.
 *
 * This is the piece that makes the agent "offline-first": every collected
 * event is fsynced to disk immediately, before any network call is
 * attempted. If the process crashes or the network is down for hours, the
 * queue file is the source of truth and nothing is lost. Once the sync
 * loop successfully uploads a batch, those lines (matched by externalId)
 * are removed by rewriting the file without them.
 */
class DurableQueue {
  constructor(filePath) {
    this.filePath = filePath;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
    }
  }

  enqueue(event) {
    fs.appendFileSync(this.filePath, `${JSON.stringify(event)}\n`);
  }

  readAll(limit = 500) {
    const raw = fs.readFileSync(this.filePath, 'utf8');
    const lines = raw.split('\n').filter(Boolean);
    return lines.slice(0, limit).map((line) => JSON.parse(line));
  }

  size() {
    const raw = fs.readFileSync(this.filePath, 'utf8');
    return raw.split('\n').filter(Boolean).length;
  }

  removeByExternalIds(externalIds) {
    const idSet = new Set(externalIds);
    const raw = fs.readFileSync(this.filePath, 'utf8');
    const remaining = raw
      .split('\n')
      .filter(Boolean)
      .filter((line) => !idSet.has(JSON.parse(line).externalId));
    fs.writeFileSync(this.filePath, remaining.length ? `${remaining.join('\n')}\n` : '');
  }
}

module.exports = { DurableQueue };
