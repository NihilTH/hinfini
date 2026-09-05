import { useState } from "react";

const FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'><rect width='400' height='500' fill='#24221E'/><text x='200' y='260' font-family='Georgia,serif' font-size='64' fill='#D4AF6E' text-anchor='middle'>∞</text></svg>`
);

export default function SmartImage({ src, alt, className = "", eager = false, ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? FALLBACK : src}
      alt={alt || ""}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
