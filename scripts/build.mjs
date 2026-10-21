import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import './check.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
// Never clean paths outside this checkout's dedicated build directory.
if (dirname(output) !== resolve(root) || !output.endsWith('dist')) throw new Error('Diretório de build inválido.');
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
for (const file of ['server.js', 'src', 'public', 'README.md', 'docs', '.env.example']) {
  cpSync(resolve(root, file), resolve(output, file), { recursive: true });
}
writeFileSync(resolve(output, 'package.json'), JSON.stringify({ name: 'vitoria-santa-production', private: true, type: 'module', engines: { node: '>=24' }, scripts: { start: 'node --env-file-if-exists=.env server.js' } }, null, 2));
console.log('Build de produção pronto em dist/. Iniciar: node dist/server.js');
