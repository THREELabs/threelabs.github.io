import assert from 'node:assert/strict';
import { PostProcessingManager } from '../src/engine/PostProcessingManager.js';

// Exercise quality selection without requiring a GPU or DOM.
for (const [mode, lowPower, mobile, expected] of [
  ['turbo120', true, false, false],
  ['balanced', true, false, false],
  ['high', true, false, true],
  ['turbo120', false, false, true],
  ['balanced', false, false, true],
  ['high', false, false, true],
  ['performance', false, false, false],
  ['high', false, true, false],
  ['turbo120', false, true, false],
]) {
  const manager = Object.create(PostProcessingManager.prototype);
  manager.bloomPass = {};
  manager.setQualityMode(mode, lowPower, mobile);
  assert.equal(manager.enabled, expected, `${mode}: low=${lowPower}, mobile=${mobile}`);
}
console.log('PASS: 9 post-processing quality cases');
