import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConfig } from './index.ts';

test('parseConfig throws when welcomeText is missing', () => {
  assert.throws(() => parseConfig({}), /welcome-greeter: welcomeText is required/);
  assert.throws(() => parseConfig({ welcomeText: '' }), /welcome-greeter: welcomeText is required/);
  assert.throws(() => parseConfig({ welcomeText: '   ' }), /welcome-greeter: welcomeText is required/);
});

test('parseConfig returns defaults for omitted fields', () => {
  const cfg = parseConfig({ welcomeText: 'Hello {{contactName}}!' });
  assert.equal(cfg.welcomeText, 'Hello {{contactName}}!');
  assert.equal(cfg.greetInGroups, false);
  assert.equal(cfg.resetAfterDays, 0);
});

test('parseConfig parses all fields', () => {
  const cfg = parseConfig({
    welcomeText: 'Hi!',
    greetInGroups: true,
    resetAfterDays: 30,
  });
  assert.equal(cfg.welcomeText, 'Hi!');
  assert.equal(cfg.greetInGroups, true);
  assert.equal(cfg.resetAfterDays, 30);
});

test('parseConfig clamps resetAfterDays to 0 when negative', () => {
  const cfg = parseConfig({ welcomeText: 'Hi', resetAfterDays: -1 });
  assert.equal(cfg.resetAfterDays, 0);
});

test('parseConfig defaults resetAfterDays to 0 when not a number', () => {
  const cfg = parseConfig({ welcomeText: 'Hi', resetAfterDays: 'forever' });
  assert.equal(cfg.resetAfterDays, 0);
});

test('onEnable registers hook with default hookPriority 20', async () => {
  const { default: Plugin } = await import('./index.ts');
  let capturedPriority: number | undefined;
  const ctx = {
    config: { welcomeText: 'Hello {{contactName}}!' },
    logger: { log() {}, debug() {}, warn() {}, error() {} },
    storage: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
    messages: { sendText: async () => ({}) },
    registerHook: (_event: string, _handler: unknown, priority?: number) => { capturedPriority = priority; },
  } as any;
  await new Plugin().onEnable(ctx);
  assert.equal(capturedPriority, 20, 'default hookPriority');
});

test('onEnable reads custom hookPriority from config', async () => {
  const { default: Plugin } = await import('./index.ts');
  let capturedPriority: number | undefined;
  const ctx = {
    config: { welcomeText: 'Hello {{contactName}}!', hookPriority: 99 },
    logger: { log() {}, debug() {}, warn() {}, error() {} },
    storage: { get: async () => null, set: async () => {}, delete: async () => {}, list: async () => [] },
    messages: { sendText: async () => ({}) },
    registerHook: (_event: string, _handler: unknown, priority?: number) => { capturedPriority = priority; },
  } as any;
  await new Plugin().onEnable(ctx);
  assert.equal(capturedPriority, 99, 'custom hookPriority from config');
});
