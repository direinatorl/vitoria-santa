import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['server.js', ...['public', 'src', 'api'].flatMap(dir => readdirSync(resolve(root, dir)).filter(file => file.endsWith('.js')).map(file => dir + '/' + file))];
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', resolve(root, file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Sintaxe verificada: ${files.length} arquivos.`);
