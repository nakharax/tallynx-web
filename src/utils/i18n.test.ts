import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { toggleLanguage, getDictionary } from './i18n';

describe('English and Thai product copy', () => {
  it('switches in both directions', () => {
    assert.equal(toggleLanguage('en'), 'th');
    assert.equal(toggleLanguage('th'), 'en');
  });

  it('keeps matching fields for the retained product surfaces', () => {
    const en = getDictionary('en');
    const th = getDictionary('th');
    const sections = ['nav', 'hero', 'infrastructure', 'workspace', 'deskV32', 'ctaSection', 'footer'] as const;
    assert.deepEqual(Object.keys(en).sort(), ['langCode', 'switchTooltip', ...sections].sort());
    assert.deepEqual(Object.keys(th).sort(), Object.keys(en).sort());
    for (const section of sections) {
      assert.deepEqual(Object.keys(th[section]).sort(), Object.keys(en[section]).sort(), section);
    }
    assert.equal(en.deskV32.features.length, 5);
    assert.equal(th.deskV32.features.length, en.deskV32.features.length);
    assert.equal(en.langCode, 'en');
    assert.equal(th.langCode, 'th');
    for (const value of [th.hero.headlineLine1, th.infrastructure.title, th.workspace.titleLine1, th.ctaSection.title, th.footer.legalText]) {
      assert.match(value, /[\u0E00-\u0E7F]/);
    }
  });

  it('preserves the exact Desk launch labels', () => {
    assert.equal(getDictionary('en').nav.openDesk, 'Launch TallyNX Desk');
    assert.equal(getDictionary('th').nav.openDesk, 'เปิดโต๊ะเทรด TallyNX Desk');
  });
});
