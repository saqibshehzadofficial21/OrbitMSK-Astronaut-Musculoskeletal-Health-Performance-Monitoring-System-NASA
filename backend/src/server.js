import 'dotenv/config';
import app from './app.js';
import { PORT } from './config/env.js';
import { initialiseCollection } from './storage/jsonStorage.js';
import { seed } from './services/seedData.js';

const names = Object.keys(seed);
for (const name of names) await initialiseCollection(name, seed[name]);

app.listen(PORT, () => console.log(`OrbitMSK API running at http://localhost:${PORT}/api`));
