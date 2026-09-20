import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import FormattedText, { plainText } from '../FormattedText';
import TextEditor from '@/admin/TextEditor';
let host, root;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
test('formats headings, bold, italic and lists, but never interprets HTML', async () => {
 const text = '## Illatjegyek\n**Meleg** és *gyümölcsös* 🍇\n\n- Szója\n- Kézzel öntött\n\n<script>alert(1)</script>';
 await act(async () => root.render(<FormattedText text={text} />));
 expect(host.querySelector('h3').textContent).toBe('Illatjegyek');
 expect(host.querySelector('strong').textContent).toBe('Meleg');
 expect(host.querySelector('em').textContent).toBe('gyümölcsös');
 expect(host.querySelectorAll('li')).toHaveLength(2);
 expect(host.querySelector('script')).toBeNull();
 expect(host.textContent).toContain('<script>alert(1)</script>');
 expect(plainText('**Illat** *szója*')).toBe('Illat szója');
});
test('toolbar wraps the selected text and preview displays its formatting', async () => {
 function Editor() { const [value, setValue] = useState('Meleg illat 🍇'); return <TextEditor value={value} onChange={e => setValue(e.target.value)} />; }
 await act(async () => root.render(<Editor />));
 host.querySelector('textarea').setSelectionRange(0, 5);
 await act(async () => host.querySelector('[aria-label="Félkövér"]').click());
 expect(host.querySelector('textarea').value).toBe('**Meleg** illat 🍇');
 await act(async () => host.querySelector('[aria-pressed]').click());
 expect(host.querySelector('strong').textContent).toBe('Meleg');
});
test('reflows copied line breaks while retaining paragraphs and lists', async () => {
 await act(async () => root.render(<FormattedText text={'**Meleg illat**\na szőlő\njellegzetes aromájával.\n\nMásodik bekezdés.\n- Piros\n- Fehér'} />));
 const paragraphs = host.querySelectorAll('p');
 expect(paragraphs).toHaveLength(2);
 expect(paragraphs[0].textContent).toBe('Meleg illat a szőlő jellegzetes aromájával.');
 expect(host.querySelectorAll('li')).toHaveLength(2);
});
