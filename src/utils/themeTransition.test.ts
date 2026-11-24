import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeThemeRippleGeometry } from './themeTransition.ts';

describe('themeTransition geometry', () => {
  it('uses explicit pointer coordinates when non-zero click event is provided', () => {
    const geom = computeThemeRippleGeometry({
      viewportWidth: 1440,
      viewportHeight: 900,
      clientX: 1200,
      clientY: 28,
      rect: { left: 100, top: 10, width: 32, height: 32 },
    });

    assert.equal(geom.x, 1200);
    assert.equal(geom.y, 28);
    // Max distance is from (1200, 28) to bottom-left (0, 900)
    const expected = Math.ceil(Math.hypot(1200, 900 - 28));
    assert.equal(geom.endRadius, expected);
  });

  it('falls back to button bounding rect center for keyboard triggers (clientX=0, clientY=0)', () => {
    const geom = computeThemeRippleGeometry({
      viewportWidth: 390,
      viewportHeight: 844,
      clientX: 0,
      clientY: 0,
      rect: { left: 300, top: 12, width: 36, height: 36 },
    });

    assert.equal(geom.x, 318);
    assert.equal(geom.y, 30);
    const expected = Math.ceil(Math.hypot(318, 844 - 30));
    assert.equal(geom.endRadius, expected);
  });

  it('uses safe viewport top-right default if neither pointer nor rect exists', () => {
    const geom = computeThemeRippleGeometry({
      viewportWidth: 1280,
      viewportHeight: 720,
    });

    assert.equal(geom.x, 1280 - 140);
    assert.equal(geom.y, 28);
    assert.ok(geom.endRadius > 1200);
  });
});
