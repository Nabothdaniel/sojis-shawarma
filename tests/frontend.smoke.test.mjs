import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function readAppFile(relativePath) {
  return readFile(path.join(process.cwd(), relativePath), 'utf8');
}

test('login page source uses username instead of email', async () => {
  const source = await readAppFile('app/login/page.tsx');

  assert.match(source, /username/i);
  assert.match(source, /Enter your username/i);
  assert.doesNotMatch(source, /Email Address/i);
});

test('register page source asks for username and confirm password', async () => {
  const source = await readAppFile('app/register/page.tsx');

  assert.match(source, /username/i);
  assert.match(source, /Confirm Password/i);
  assert.match(source, /confirm_password/i);
  assert.doesNotMatch(source, /Verify Email/i);
});
