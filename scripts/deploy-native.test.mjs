import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const deployScriptPath = join(root, 'scripts', 'deploy-native.sh');
const workflowPath = join(root, '.github', 'workflows', 'deploy.yml');
const makefilePath = join(root, 'Makefile');

test('native deployment builds before stopping the current service', () => {
  assert.equal(existsSync(deployScriptPath), true, 'deploy script is missing');
  const source = readFileSync(deployScriptPath, 'utf8');

  assert.ok(source.indexOf('npm run build') < source.indexOf('stop_service'));
});

test('native deployment uses a fast-forward pull, lock, and health check', () => {
  assert.equal(existsSync(deployScriptPath), true, 'deploy script is missing');
  const source = readFileSync(deployScriptPath, 'utf8');

  assert.match(source, /flock -n/);
  assert.match(source, /git pull --ff-only origin main/);
  assert.match(source, /curl --fail --silent --show-error/);
});

test('detached serve process does not inherit the deployment lock', () => {
  const source = readFileSync(deployScriptPath, 'utf8');

  assert.match(source, /LOCK_FILE="\$ROOT_DIR\/\.deploy-v2\.lock"/);
  assert.match(source, /setsid serve .* 9>&-/);
});

test('native deployment loads an NVM-managed Node runtime for non-interactive SSH', () => {
  const source = readFileSync(deployScriptPath, 'utf8');
  const nvmLoad = source.indexOf('$HOME/.nvm/nvm.sh');
  const commandCheck = source.indexOf('for command_name in git npm');

  assert.notEqual(nvmLoad, -1);
  assert.ok(nvmLoad < commandCheck);
});

test('make rs and automation share the same native deployment script', () => {
  const source = readFileSync(makefilePath, 'utf8');

  assert.match(source, /deploy-native:\s*\n\t@bash scripts\/deploy-native\.sh/);
  assert.match(source, /rs: deploy-native/);
});

test('workflow verifies main before deploying to the physical server', () => {
  assert.equal(existsSync(workflowPath), true, 'workflow is missing');
  const source = readFileSync(workflowPath, 'utf8');

  assert.match(source, /branches:\s*\[main\]/);
  assert.match(source, /needs:\s*verify/);
  assert.match(source, /DEPLOY_PATH: \$\{\{ secrets\.DEPLOY_PATH \}\}/);
  assert.match(source, /printf -v DEPLOY_COMMAND 'cd -- %q/);
  assert.doesNotMatch(source, /\/root\/workspace/);
  assert.doesNotMatch(source, /docker/i);
});
