import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../src/styles/globals.css', import.meta.url), 'utf8');
const declarations = block => Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]));
const light = declarations(css.match(/:root\s*\{([^}]+)\}/)[1]);
const dark = declarations(css.match(/\.dark\s*\{([^}]+)\}/)[1]);
function rgb(name) {
  let value = light[name];
  while (value?.startsWith('var(')) value = light[value.slice(4, -1)];
  if (value?.startsWith('#')) return value.slice(1).match(/../g).map(v => parseInt(v, 16) / 255);
  assert.ok(value, `Missing token: ${name}`);
  const [h, s, l] = value.match(/[\d.]+/g).map(Number);
  const saturation = s / 100, luminance = l / 100;
  const a = saturation * Math.min(luminance, 1 - luminance);
  return [0, 8, 4].map(n => { const k = (n + h / 30) % 12; return luminance - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); });
}
function luminance(color) {
  return color.map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
}
function ratio(a, b) { const [min, max] = [luminance(rgb(a)), luminance(rgb(b))].sort((a, b) => a - b); return (max + .05) / (min + .05); }
test('light text and primary states meet AA on their surfaces', () => {
  for (const bg of ['--background', '--background-subtle', '--card', '--popover', '--muted', '--accent', '--accent-hover', '--accent-active', '--surface-balance']) {
    for (const fg of ['--foreground', '--foreground-secondary', '--foreground-muted', '--primary']) {
      assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg}: ${ratio(fg, bg).toFixed(2)}`);
    }
  }
  for (const bg of ['--primary', '--primary-hover', '--primary-active']) assert.ok(ratio('--primary-foreground', bg) >= 4.5);
});
test('light charts, focus and input boundaries have sufficient contrast', () => {
  for (const fg of ['--chart-axis', '--chart-reference', '--chart-primary', '--chart-bar']) assert.ok(ratio(fg, '--card') >= 4.5, fg);
  for (const bg of ['--card', '--background', '--background-subtle']) assert.ok(ratio('--ring', bg) >= 3);
  assert.ok(ratio('--input', '--background') >= 3);
  for (const key of Object.keys(light).filter(k => k.startsWith('--category-'))) assert.ok(ratio(key, '--card') >= 3, key);
  assert.equal(light['--chart-bar-opacity'], '1');
});
test('the original dark palette remains unchanged', () => {
  const expected = {
    '--background': '150 5% 7%', '--foreground': '150 5% 94%', '--card': '150 4% 9%', '--popover': '150 4% 12%',
    '--primary': '158 48% 59%', '--primary-foreground': '155 25% 9%', '--secondary': '150 4% 15%',
    '--muted': '150 4% 13%', '--muted-foreground': '150 3% 65%', '--accent': '150 4% 17%',
    '--border': '150 3% 19%', '--input': '150 3% 32%', '--ring': '158 48% 59%',
    '--destructive': '0 65% 70%', '--warning': '38 64% 65%',
  };
  for (const [key, value] of Object.entries(expected)) assert.equal(dark[key], value, key);
});
