import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRAND_COLOR_TOKENS,
  LOGO_DESIGN_PRINCIPLES,
  exportLogoSvg,
  getLogoPalette,
  getLogoStudioCopy,
} from './logoSpec';

test('exportLogoSvg generates pure institutional SVG without gradients for all variants and themes', () => {
  const variants = ['lockup', 'mark', 'stacked'] as const;
  const themes = ['light', 'dark', 'mono'] as const;

  for (const variant of variants) {
    for (const theme of themes) {
      const svg = exportLogoSvg(variant, theme);
      assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
      assert.ok(svg.endsWith('</svg>'));
      assert.ok(svg.includes('<polygon'));
      assert.equal(svg.includes('linearGradient'), false);
      assert.equal(svg.includes('<ellipse'), false);
      if (variant === 'mark') {
        assert.ok(svg.includes('<path'));
      } else {
        assert.ok(svg.includes('TALLYNX'));
        assert.ok(svg.includes('TECHNOLOGIES'));
        assert.ok(svg.includes('Georgia'));
      }
    }
  }
});

test('getLogoPalette returns official Brand Identity hex tokens for light, dark, and mono themes', () => {
  const light = getLogoPalette('light');
  const dark = getLogoPalette('dark');
  const mono = getLogoPalette('mono');

  assert.equal(light.primary, '#7A1C24');
  assert.equal(light.bg, '#F8F6F0');
  assert.equal(light.descriptor, '#2B2D2F');

  assert.equal(dark.primary, '#F8F6F0');
  assert.equal(dark.accent, '#FFFFFF');
  assert.equal(dark.descriptor, '#C4C0B8');
  assert.equal(dark.bg, '#141618');

  assert.equal(mono.primary, '#141618');
  assert.equal(mono.accent, '#141618');
  assert.equal(mono.descriptor, '#141618');
});

test('BRAND_COLOR_TOKENS and LOGO_DESIGN_PRINCIPLES are complete and bilingual', () => {
  assert.equal(BRAND_COLOR_TOKENS.length, 6);
  assert.equal(LOGO_DESIGN_PRINCIPLES.length, 4);
  assert.deepEqual(
    BRAND_COLOR_TOKENS.map((t) => t.hex),
    ['#7A1C24', '#2B2D2F', '#F8F6F0', '#FFFFFF', '#141618', '#D6D1C7']
  );
  assert.notEqual(getLogoStudioCopy('en').description, getLogoStudioCopy('th').description);
});
