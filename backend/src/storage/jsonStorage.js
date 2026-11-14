import fs from 'node:fs/promises';
import path from 'node:path';
import { DATA_DIR } from '../config/env.js';

const queues = new Map();

function safeFile(name) {
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(name)) throw new Error('Invalid storage collection');
  return path.join(DATA_DIR, `${name}.json`);
}

export async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readCollection(name) {
  await ensureDataDir();
  const file = safeFile(name);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error(`${name}.json must contain a JSON array`);
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function writeCollection(name, records) {
  await ensureDataDir();
  if (!Array.isArray(records)) throw new TypeError('Collection data must be an array');
  const file = safeFile(name);
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  await fs.rename(temp, file);
  return records;
}

// Serialise mutations per collection so overlapping requests cannot overwrite one another.
export function withCollectionLock(name, task) {
  const previous = queues.get(name) || Promise.resolve();
  const next = previous.catch(() => {}).then(task);
  queues.set(name, next);
  return next.finally(() => {
    if (queues.get(name) === next) queues.delete(name);
  });
}

export async function initialiseCollection(name, seed = []) {
  await ensureDataDir();
  const file = safeFile(name);
  try {
    await fs.access(file);
  } catch {
    await writeCollection(name, seed);
  }
}
