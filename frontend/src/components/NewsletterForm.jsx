import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useLang } from "@/context/LangContext";

export default function NewsletterForm() {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!consent) { toast.error(t("footer.consentReq")); return; }
    setBusy(true);
    try {
      const { data } = await api.post("/newsletter/subscribe", { email, consent, lang, source: "footer" });
      toast.success(data.already ? t("footer.already") : t("footer.subscribed"));
      setDone(true);
    } catch (err) {
      toast.error(err?.response?.status === 422 ? t("footer.invalid") : t("err.generic"));
    } finally { setBusy(false); }
  };

  if (done) return <p data-testid="footer-newsletter-done" className="text-sm text-[#D4AF6E]">{t("footer.subscribed")}</p>;

  return (
    <form className="space-y-3" onSubmit={submit} data-testid="footer-newsletter-form">
      <div className="flex gap-2">
        <label htmlFor="footer-email" className="sr-only">{t("co.email")}</label>
        <input id="footer-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("footer.emailPh")} data-testid="footer-email"
          className="flex-1 min-w-0 bg-transparent border-b border-[#3d3835] px-1 py-2 text-sm focus:outline-none focus:border-[#D4AF6E] focus-ring" />
        <button type="submit" disabled={busy} data-testid="footer-submit" className="text-sm text-[#D4AF6E] uppercase tracking-widest focus-ring disabled:opacity-50">{t("footer.join")}</button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-relaxed cursor-pointer">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} data-testid="footer-consent" className="mt-0.5 accent-[#D4AF6E] focus-ring" />
        <span>{t("footer.consent")}</span>
      </label>
    </form>
  );
}
