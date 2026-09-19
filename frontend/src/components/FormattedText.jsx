// A deliberately small formatting language: React escapes every text fragment.
// No raw HTML, remote images or executable links are interpreted.
function inline(text) {
  return text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i} className="font-semibold text-[#EAE5D4]">{part.slice(2, -2)}</strong> :
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? <em key={i}>{part.slice(1, -1)}</em> : part);
}
export function plainText(text = '') {
  return text.replace(/^\s*(?:#{1,3}\s+|[-•]\s+)/gm, '').replace(/\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g, (_, bold, italic) => bold || italic);
}
export default function FormattedText({ text = '', className = '', ...props }) {
  const blocks = []; const lines = text.replace(/\r\n?/g, '\n').split('\n');
  for (let i = 0; i < lines.length;) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\s*[-•]\s+/.test(line)) {
      const items = []; const key = i;
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) items.push(<li key={i}>{inline(lines[i++].replace(/^\s*[-•]\s+/, ''))}</li>);
      blocks.push(<ul key={key} className="list-disc pl-5 space-y-1 marker:text-[#D4AF6E]">{items}</ul>);
    } else if (/^#{1,3}\s+/.test(line)) {
      blocks.push(<h3 key={i} className="font-serif-display text-xl text-[#D4AF6E]">{inline(line.replace(/^#{1,3}\s+/, ''))}</h3>); i++;
    } else {
      const key = i; const paragraph = [];
      while (i < lines.length && lines[i].trim() && !/^\s*[-•]\s+|^#{1,3}\s+/.test(lines[i])) paragraph.push(lines[i++]);
      blocks.push(<p key={key} className="whitespace-pre-wrap">{inline(paragraph.join('\n'))}</p>);
    }
  }
  return <div {...props} className={`space-y-3 text-[#B8AE95] leading-relaxed break-words ${className}`}>{blocks}</div>;
}
