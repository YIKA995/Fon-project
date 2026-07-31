const levels = ['error', 'warn', 'info', 'debug'];

function log(level, message, meta) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

const logger = {};
for (const level of levels) {
  logger[level] = (message, meta) => log(level, message, meta);
}

module.exports = logger;
