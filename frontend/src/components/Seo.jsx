import { useEffect } from "react";

const setMeta = (name, content) => {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

export default function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · H'INFINI Candles` : "H'INFINI Candles";
    if (description) setMeta("description", description);
  }, [title, description]);
  return null;
}
