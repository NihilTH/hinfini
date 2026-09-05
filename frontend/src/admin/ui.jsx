import { useEffect } from "react";
import { X } from "@phosphor-icons/react";
import { useA } from "@/admin/adminApi";

export function Modal({ title, onClose, children, wide = false, testId = "admin-modal" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto" onClick={onClose} role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
      <div className={`bg-[#1A1917] border border-[#3d3835] w-full ${wide ? "max-w-6xl" : "max-w-xl"} max-h-[95vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3d3835] sticky top-0 bg-[#1A1917] z-10">
          <h2 className="font-serif-display text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Bezárás" data-testid={`${testId}-close`} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#24221E] focus-ring"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({ message, onYes, onNo, danger = false, testId = "admin-confirm" }) {
  const a = useA();
  return (
    <Modal title={a("confirm")} onClose={onNo} testId={testId}>
      <p className="text-sm text-[#B8AE95] leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onNo} className="btn-outline !py-2 !px-5 text-sm focus-ring" data-testid={`${testId}-no`}>{a("no")}</button>
        <button onClick={onYes} className={`btn-primary !py-2 !px-5 text-sm focus-ring ${danger ? "!bg-[#B0413E] !text-white" : ""}`} data-testid={`${testId}-yes`}>{a("yes")}</button>
      </div>
    </Modal>
  );
}

export function Field({ label, help, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="admin-label">{label}</label>
      {children}
      {help && <p className="admin-help">{help}</p>}
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="admin-card p-4 sm:p-5">
      <h3 className="overline text-[#D4AF6E] mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const STATUS_CLASS = { published: "badge-green", draft: "", hidden: "", archived: "badge-red", PAID: "badge-green", UNPAID: "badge-gold", FAILED: "badge-red", RESERVED: "", SENT: "badge-green", SKIPPED: "", COMPLETED: "badge-green", SHIPPED: "badge-gold", CANCELLED: "badge-red" };
export function Badge({ value, label, testId }) {
  return <span data-testid={testId} className={`badge ${STATUS_CLASS[value] || ""}`}>{label ?? value}</span>;
}
