import { useRef, useState } from 'react';
import FormattedText from '@/components/FormattedText';

export default function TextEditor({ value = '', onChange, rows = 5, ...props }) {
  const ref = useRef(null); const [preview, setPreview] = useState(false);
  const replace = (mode, token) => {
    const el = ref.current; if (!el) return;
    const start = el.selectionStart; const end = el.selectionEnd;
    const selected = value.slice(start, end);
    let from = start; let to = end; let replacement;
    if (mode === 'wrap') replacement = token + (selected || 'szöveg') + token;
    else if (mode === 'line') {
      from = value.lastIndexOf('\n', start - 1) + 1;
      const next = value.indexOf('\n', end); to = next < 0 ? value.length : next;
      replacement = value.slice(from, to).split('\n').map(line => token + line).join('\n');
    } else replacement = token;
    onChange({ target: { value: value.slice(0, from) + replacement + value.slice(to) } });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(from + replacement.length, from + replacement.length); });
  };
  const tool = (name, action, child = name) => <button type="button" aria-label={name} title={name} disabled={preview} onMouseDown={e => e.preventDefault()} onClick={action} className="px-3 py-2 text-sm rounded hover:bg-[#3d3835] focus-ring disabled:opacity-40">{child}</button>;
  return <div className="border border-[#3d3835] rounded overflow-hidden">
    <div role="toolbar" aria-label="Szövegformázás" className="flex flex-wrap items-center gap-1 bg-[#24221E] p-1 border-b border-[#3d3835] text-[#D4AF6E]">
      {tool('Félkövér', () => replace('wrap', '**'), <b>B</b>)}
      {tool('Dőlt', () => replace('wrap', '*'), <i>I</i>)}
      {tool('Alcím', () => replace('line', '## '))}
      {tool('Felsorolás', () => replace('line', '- '))}
      {['🕯️', '🌿', '🌸', '🍇', '✨', '🔥'].map(emoji => <span key={emoji}>{tool(`Emoji beszúrása: ${emoji}`, () => replace('insert', emoji), emoji)}</span>)}
      <button type="button" onClick={() => setPreview(!preview)} aria-pressed={preview} className="ml-auto px-3 py-2 text-sm underline focus-ring">{preview ? 'Szerkesztés' : 'Előnézet'}</button>
    </div>
    {preview ? <div className="p-3 min-h-24"><FormattedText text={value} /></div> : <textarea {...props} ref={ref} rows={rows} value={value} onChange={onChange} className="admin-input !border-0 !rounded-none" />}
    <p className="admin-help px-3 pb-2">Jelöld ki a szöveget, majd válassz formázást. További emojik: Win + pont. A formázás eredményét az Előnézet mutatja.</p>
  </div>;
}
