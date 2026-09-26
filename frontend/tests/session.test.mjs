import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenExpiresAt, safeReturnPath } from '../src/lib/session.ts';
const jwt = (payload) => `e30.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
test('uses JWT expiration in milliseconds', () => assert.equal(tokenExpiresAt(jwt({ exp: 1000 })), 1000000));
test('rejects malformed tokens and missing/non-numeric expiry', () => {
  for (const token of ['broken', jwt({}), jwt({ exp: '1000' }), jwt({ exp: null })]) assert.equal(tokenExpiresAt(token), 0);
});
test('permits only internal known return routes', () => {
  assert.equal(safeReturnPath('/gastos'), '/gastos');
  for (const value of ['//evil.test', '/\\evil.test', 'https://evil.test', '/unknown', undefined, 42]) assert.equal(safeReturnPath(value), '/painel');
});
