import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseInlineBold,
  parseAdvisorBlocks,
  getAdvisorCopy,
} from './advisorLogic';

test('parseInlineBold splits bold markdown markers without leaking raw asterisks', () => {
  const segs = parseInlineBold('Supports **MT5 Sync** and **SHA-256** proofs.');
  assert.deepEqual(segs, [
    { text: 'Supports ', bold: false },
    { text: 'MT5 Sync', bold: true },
    { text: ' and ', bold: false },
    { text: 'SHA-256', bold: true },
    { text: ' proofs.', bold: false },
  ]);
});

test('parseAdvisorBlocks parses bullets and paragraphs cleanly', () => {
  const blocks = parseAdvisorBlocks(
    'Overview text.\n\n- **Rule 1**: Keep orders in MT5.\n- Simple bullet'
  );
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].type, 'paragraph');
  assert.equal(blocks[1].type, 'bullet');
  assert.equal(blocks[1].segments[0].bold, true);
  assert.equal(blocks[1].segments[0].text, 'Rule 1');
  assert.equal(blocks[2].type, 'bullet');
});

test('getAdvisorCopy provides clean localized EN/TH content with zero legacy brand names', () => {
  const en = getAdvisorCopy('en');
  const th = getAdvisorCopy('th');

  assert.equal(en.launcherLabel, 'Ask TallyNX Advisor');
  assert.equal(en.suggestions.length, 3);
  assert.equal(th.suggestions.length, 3);
  assert.notEqual(en.greeting, th.greeting);

  const combined = JSON.stringify({ en, th }).toLowerCase();
  assert.equal(combined.includes('hermes'), false);
  assert.equal(combined.includes('xpfirm'), false);
  assert.equal(combined.includes('nakharax'), false);
});
