import { Link, useParams } from "react-router-dom";
import { useLang } from "@/context/LangContext";
import Seo from "@/components/Seo";
import { Info } from "@phosphor-icons/react";

// Editable legal templates. Bracketed placeholders [..] must be replaced with real company data after legal review.
const PAGES = {
  szallitas: {
    key: "legal.shipping",
    hu: [
      ["Szállítási módok", "Házhozszállítás futárszolgálattal Magyarország területén. Csomagpontos átvétel bevezetése folyamatban — jelenleg nem választható."],
      ["Szállítási díj", "Házhozszállítás: 1 990 Ft. 25 000 Ft feletti rendelés esetén a szállítás ingyenes. [Díjak a cég döntése szerint módosítandók.]"],
      ["Szállítási idő", "A rendelést a sikeres fizetést követő 2–4 munkanapon belül adjuk fel. [Pontos vállalás beállítandó.]"],
      ["Fizetési módok", "Bankkártyás fizetés a SimplePay (OTP Mobil Kft.) rendszerén keresztül, forintban. A kártyaadatok nem jutnak el hozzánk. Jelenleg a fizetés tesztüzemmódban működik."],
      ["Számlázás", "A számlát NAV-kompatibilis számlázó rendszer állítja ki és küldi el e-mailben. [Számlázó szolgáltató neve.]"],
    ],
    en: [
      ["Shipping methods", "Home delivery by courier within Hungary. Parcel point pickup is under development and not yet available."],
      ["Shipping fee", "Home delivery: 1,990 Ft. Free shipping over 25,000 Ft. [Adjust fees as decided by the company.]"],
      ["Delivery time", "Orders are dispatched within 2–4 business days after successful payment. [Exact commitment to be set.]"],
      ["Payment methods", "Card payment via SimplePay (OTP Mobil Ltd.) in HUF. Card data never reaches us. Payments currently run in test (sandbox) mode."],
      ["Invoicing", "Invoices are issued by a NAV-compliant invoicing provider and emailed to you. [Provider name.]"],
    ],
  },
  elallas: {
    key: "legal.returns",
    hu: [
      ["Elállási jog", "A fogyasztót a 45/2014. (II. 26.) Korm. rendelet alapján a termék átvételétől számított 14 napon belül indoklás nélküli elállási jog illeti meg. [Jogi ellenőrzés szükséges.]"],
      ["Az elállás menete", "Elállási szándékodat írásban jelezd a [SUPPORT_EMAIL] címen a rendelésazonosító megadásával. A terméket sértetlenül, eredeti csomagolásában küldd vissza a [VISSZAKÜLDÉSI CÍM] címre."],
      ["Visszatérítés", "A visszaküldött termék beérkezésétől számított 14 napon belül visszatérítjük a vételárat az eredeti fizetési módra."],
      ["Kivételek", "Egyedi kérésre készült, illetve higiéniai okból (felbontott illatolaj, illóolaj) nem visszaküldhető termékek esetén az elállási jog korlátozott lehet. [Pontosítandó.]"],
    ],
    en: [
      ["Right of withdrawal", "Consumers may withdraw within 14 days of receiving the goods without giving reasons (Gov. Decree 45/2014). [Legal review required.]"],
      ["How to withdraw", "Notify us in writing at [SUPPORT_EMAIL] with your order ID. Return the product undamaged in its original packaging to [RETURN ADDRESS]."],
      ["Refund", "We refund the purchase price to the original payment method within 14 days of receiving the returned goods."],
      ["Exceptions", "Custom-made products and opened fragrance/essential oils may be excluded for hygiene reasons. [To be specified.]"],
    ],
  },
  aszf: {
    key: "legal.terms",
    hu: [
      ["Szolgáltató adatai", "Cégnév: [CÉGNÉV] · Székhely: [SZÉKHELY] · Cégjegyzékszám: [CÉGJEGYZÉKSZÁM] · Adószám: [ADÓSZÁM] · E-mail: [SUPPORT_EMAIL] · Tárhelyszolgáltató: [TÁRHELY]"],
      ["A szerződés létrejötte", "A megrendelés elküldésével fizetési kötelezettséggel járó ajánlatot teszel. A szerződés a visszaigazoló e-mail megérkezésével jön létre. A „rendelés megérkezett” visszaigazolás nem jelenti a fizetés sikerességét."],
      ["Árak", "Az árak forintban értendők és tartalmazzák az ÁFÁ-t. A szállítási díj a pénztárban külön tételként jelenik meg."],
      ["Fizetés", "Bankkártyás fizetés SimplePay rendszeren keresztül. A fizetés sikerességét kizárólag a SimplePay szerveroldali visszaigazolása alapján tekintjük megtörténtnek."],
      ["Teljesítés", "A rendelést a fizetés visszaigazolása után készítjük elő és adjuk fel. A készlethiányról e-mailben tájékoztatunk."],
      ["Panaszkezelés", "Panaszaidat a [SUPPORT_EMAIL] címen fogadjuk. Békéltető testület: [ILLETÉKES BÉKÉLTETŐ TESTÜLET]."],
    ],
    en: [
      ["Provider details", "Company: [COMPANY] · Registered seat: [ADDRESS] · Registration no.: [REG NO] · Tax no.: [TAX NO] · Email: [SUPPORT_EMAIL] · Hosting: [HOSTING]"],
      ["Formation of contract", "Submitting an order is an offer with a payment obligation. The contract is concluded upon receipt of our confirmation email. 'Order received' does not mean payment succeeded."],
      ["Prices", "Prices are in HUF and include VAT. Shipping is shown as a separate line at checkout."],
      ["Payment", "Card payment via SimplePay. A payment is considered successful only upon SimplePay's server-side confirmation."],
      ["Fulfilment", "Orders are prepared and dispatched after payment confirmation. We notify you by email about stock shortages."],
      ["Complaints", "Send complaints to [SUPPORT_EMAIL]. Conciliation body: [COMPETENT BODY]."],
    ],
  },
  adatkezeles: {
    key: "legal.privacy",
    hu: [
      ["Adatkezelő", "[CÉGNÉV], [SZÉKHELY], [SUPPORT_EMAIL]."],
      ["Kezelt adatok és cél", "Rendelés teljesítéséhez: név, e-mail, telefon, szállítási cím, rendelési adatok. Jogalap: szerződés teljesítése és jogi kötelezettség (számviteli bizonylat megőrzése)."],
      ["Hírlevél", "Kizárólag külön, önkéntes hozzájárulás alapján küldünk hírlevelet. A hozzájárulás bármikor visszavonható a [SUPPORT_EMAIL] címen."],
      ["Adatfeldolgozók", "Fizetés: OTP Mobil Kft. (SimplePay). Tranzakciós e-mail: [E-MAIL SZOLGÁLTATÓ, pl. Resend / SendGrid]. Tárhely és adatbázis: [SZOLGÁLTATÓ]. Képtárolás: [S3/R2 SZOLGÁLTATÓ]. Számlázás: [SZÁMLÁZÓ]. Futárszolgálat: [FUTÁR]."],
      ["Megőrzési idő", "Rendelési adatok: a számviteli törvény szerinti 8 év. Hírlevél: a hozzájárulás visszavonásáig."],
      ["Jogaid", "Hozzáférés, helyesbítés, törlés, korlátozás, adathordozhatóság, tiltakozás. Panasz: Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)."],
    ],
    en: [
      ["Controller", "[COMPANY], [ADDRESS], [SUPPORT_EMAIL]."],
      ["Data & purpose", "For order fulfilment: name, email, phone, shipping address, order details. Legal basis: performance of contract and legal obligation (accounting records)."],
      ["Newsletter", "Sent only with separate, voluntary consent, which you can withdraw anytime at [SUPPORT_EMAIL]."],
      ["Processors", "Payment: OTP Mobil Ltd. (SimplePay). Transactional email: [EMAIL PROVIDER, e.g. Resend / SendGrid]. Hosting & database: [PROVIDER]. Image storage: [S3/R2 PROVIDER]. Invoicing: [PROVIDER]. Courier: [COURIER]."],
      ["Retention", "Order data: 8 years per accounting law. Newsletter: until consent is withdrawn."],
      ["Your rights", "Access, rectification, erasure, restriction, portability, objection. Complaints: Hungarian National Authority for Data Protection (NAIH)."],
    ],
  },
  kapcsolat: {
    key: "legal.contact",
    hu: [
      ["Ügyfélszolgálat", "E-mail: [SUPPORT_EMAIL] · Telefon: [TELEFON] · Munkanapokon 9–17 óra között."],
      ["Műhely", "[CÍM] — előzetes egyeztetés alapján látogatható."],
      ["Rendeléssel kapcsolatban", "Kérjük, minden megkeresésnél add meg a rendelésazonosítót (#ord_...)."],
    ],
    en: [
      ["Customer service", "Email: [SUPPORT_EMAIL] · Phone: [PHONE] · Business days 9am–5pm."],
      ["Studio", "[ADDRESS] — visits by appointment."],
      ["About an order", "Please include your order ID (#ord_...) in every message."],
    ],
  },
};

export default function Legal() {
  const { page } = useParams();
  const { t, lang } = useLang();
  const data = PAGES[page];
  if (!data) return <div className="max-w-3xl mx-auto px-6 py-24 text-center text-[#B8AE95]" data-testid="legal-missing">{t("err.notFound")} <Link to="/" className="text-[#D4AF6E] underline ml-2">H'INFINI</Link></div>;
  const sections = (data[lang] || data.hu).map(([h, body]) => [h, lang === "hu" ? body.replaceAll("[SUPPORT_EMAIL]", "[ÜGYFÉLSZOLGÁLATI E-MAIL-CÍM]") : body]);
  return (
    <article data-testid={`legal-${page}`} className="max-w-3xl mx-auto px-6 py-16">
      <Seo title={t(data.key)} description={sections[0]?.[1]} />
      <div className="overline mb-4">{t("footer.info")}</div>
      <h1 className="font-serif-display text-4xl md:text-6xl leading-tight">{t(data.key)}</h1>
      <div className="mt-8 p-4 border border-[#D4AF6E]/40 bg-[#24221E] text-sm text-[#B8AE95] flex gap-3" data-testid="legal-template-note"><Info size={20} className="text-[#D4AF6E] shrink-0" /> {t("legal.template")}</div>
      <div className="mt-12 space-y-10">
        {sections.map(([h, body]) => (<section key={h}><h2 className="font-serif-display text-2xl md:text-3xl mb-3">{h}</h2><p className="text-[#B8AE95] leading-relaxed">{body}</p></section>))}
      </div>
      <nav className="mt-16 pt-8 border-t border-[#3d3835] flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label={t("footer.info")}>
        {Object.entries(PAGES).filter(([k]) => k !== page).map(([k, v]) => <Link key={k} to={`/${k}`} className="link-underline text-[#D4AF6E] focus-ring">{t(v.key)}</Link>)}
      </nav>
    </article>
  );
}
