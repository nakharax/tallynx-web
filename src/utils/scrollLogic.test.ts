import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCROLL_TO_TOP_THRESHOLD_PX,
  shouldShowScrollToTop,
  getScrollToTopLabel,
} from './scrollLogic';

test('SCROLL_TO_TOP_THRESHOLD_PX is 500', () => {
  assert.equal(SCROLL_TO_TOP_THRESHOLD_PX, 500);
});

test('shouldShowScrollToTop returns false at or below 500px', () => {
  assert.equal(shouldShowScrollToTop(-10), false);
  assert.equal(shouldShowScrollToTop(0), false);
  assert.equal(shouldShowScrollToTop(250), false);
  assert.equal(shouldShowScrollToTop(500), false);
  assert.equal(shouldShowScrollToTop(NaN), false);
});

test('shouldShowScrollToTop returns true strictly above 500px', () => {
  assert.equal(shouldShowScrollToTop(500.1), true);
  assert.equal(shouldShowScrollToTop(501), true);
  assert.equal(shouldShowScrollToTop(1200), true);
});

test('getScrollToTopLabel returns English and Thai labels accurately', () => {
  const en = getScrollToTopLabel('en');
  assert.equal(en.label, 'TOP');
  assert.ok(en.ariaLabel.includes('Scroll back to top'));

  const th = getScrollToTopLabel('th');
  assert.equal(th.label, 'บนสุด');
  assert.ok(th.ariaLabel.includes('เลื่อนกลับไปด้านบนสุด'));
});
