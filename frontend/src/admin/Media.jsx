import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UploadSimple, Trash, Check } from "@phosphor-icons/react";
import { adminApi, useA, errText } from "@/admin/adminApi";
import { Modal, Confirm } from "@/admin/ui";
import SmartImage from "@/components/SmartImage";

const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function UploadDrop({ onUploaded, compact = false }) {
  const a = useA();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (!TYPES.includes(f.type)) { toast.error(a("badType")); return; }
    if (f.size > MAX_MB * 1024 * 1024) { toast.error(a("tooLarge", { n: MAX_MB })); return; }
    setFile(f); setPreview(URL.createObjectURL(f));
  };
  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { data } = await adminApi.upload(file, alt);
      toast.success(a("uploaded"));
      setFile(null); setPreview(null); setAlt("");
      onUploaded?.(data);
    } catch (e) { toast.error(errText(e, a)); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3" data-testid="upload-drop">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
        onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label={a("upload")} data-testid="upload-dropzone"
        className={`border-2 border-dashed ${drag ? "border-[#D4AF6E] bg-[#24221E]" : "border-[#3d3835]"} ${compact ? "p-4" : "p-8"} text-center cursor-pointer transition-colors focus-ring`}>
        <input ref={inputRef} type="file" accept={TYPES.join(",")} className="hidden" data-testid="upload-input" onChange={(e) => pick(e.target.files?.[0])} />
        {preview ? <img src={preview} alt="" className="mx-auto max-h-40 object-contain" /> : (
          <>
            <UploadSimple size={compact ? 22 : 32} className="mx-auto text-[#D4AF6E]" />
            <p className="mt-2 text-sm">{a("dropHere")}</p>
            <p className="admin-help">{a("formats", { n: MAX_MB })}</p>
          </>
        )}
      </div>
      {file && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder={a("alt")} className="admin-input flex-1" data-testid="upload-alt" aria-label={a("alt")} />
          <button onClick={upload} disabled={busy} className="btn-primary !py-2 !px-5 text-sm focus-ring disabled:opacity-50" data-testid="upload-submit"><UploadSimple size={16} /> {busy ? a("uploading") : a("upload")}</button>
          <button onClick={() => { setFile(null); setPreview(null); }} className="btn-outline !py-2 !px-4 text-sm focus-ring" data-testid="upload-cancel">{a("cancel")}</button>
        </div>
      )}
    </div>
  );
}

export function MediaGrid({ onSelect, selectable = false }) {
  const a = useA();
  const [items, setItems] = useState([]);
  const [del, setDel] = useState(null);
  const [editAlt, setEditAlt] = useState({});
  const load = useCallback(() => adminApi.media().then(({ data }) => setItems(data)).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const saveAlt = async (m) => {
    try { await adminApi.patchMedia(m.media_id, editAlt[m.media_id] ?? m.alt); toast.success(a("saved")); load(); } catch (e) { toast.error(errText(e, a)); }
  };
  const remove = async () => {
    try { await adminApi.deleteMedia(del.media_id); toast.success(a("saved")); setDel(null); load(); } catch (e) { toast.error(errText(e, a)); setDel(null); }
  };

  return (
    <div>
      <UploadDrop onUploaded={(m) => { load(); if (selectable) onSelect?.(m); }} compact={selectable} />
      {items.length === 0 ? <p className="text-sm text-[#B8AE95] mt-6">{a("noMedia")}</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6" data-testid="media-grid">
          {items.map((m) => (
            <div key={m.media_id} className="admin-card p-2 flex flex-col gap-2" data-testid={`media-${m.media_id}`}>
              <div className="aspect-square bg-[#1A1917] overflow-hidden"><SmartImage src={m.url} alt={m.alt || m.filename} className="w-full h-full object-cover" /></div>
              <input value={editAlt[m.media_id] ?? m.alt ?? ""} onChange={(e) => setEditAlt({ ...editAlt, [m.media_id]: e.target.value })} onBlur={() => (editAlt[m.media_id] !== undefined && editAlt[m.media_id] !== m.alt) && saveAlt(m)} placeholder={a("alt")} aria-label={a("alt")} className="admin-input !py-1 text-xs" data-testid={`media-alt-${m.media_id}`} />
              <div className="flex items-center justify-between gap-1 text-[10px] text-[#8a826f]"><span className="truncate">{m.filename}</span><span>{Math.round(m.size / 1024)} KB</span></div>
              <div className="flex gap-2">
                {selectable && <button onClick={() => onSelect?.(m)} className="btn-primary !py-1.5 !px-3 text-xs flex-1 justify-center focus-ring" data-testid={`media-select-${m.media_id}`}><Check size={12} /> {a("select")}</button>}
                <button onClick={() => setDel(m)} aria-label={a("deleteMedia")} className="w-8 h-8 flex items-center justify-center border border-[#3d3835] hover:border-[#B0413E] focus-ring" data-testid={`media-del-${m.media_id}`}><Trash size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {del && <Confirm message={a("deleteMediaConfirm")} danger onNo={() => setDel(null)} onYes={remove} testId="media-del-confirm" />}
    </div>
  );
}

export function ImagePickerModal({ onPick, onClose }) {
  const a = useA();
  return <Modal title={a("pickImage")} onClose={onClose} wide testId="image-picker"><MediaGrid selectable onSelect={(m) => { onPick(m); onClose(); }} /></Modal>;
}

export function ImageField({ label, value, alt, onChange, testId }) {
  const a = useA();
  const [open, setOpen] = useState(false);
  return (
    <div data-testid={testId}>
      <span className="admin-label">{label}</span>
      <div className="flex gap-3 items-start">
        <div className="w-24 h-24 bg-[#1A1917] border border-[#3d3835] shrink-0 overflow-hidden">{value ? <SmartImage src={value} alt={alt || ""} className="w-full h-full object-cover" /> : null}</div>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className="btn-outline !py-1.5 !px-4 text-xs focus-ring" data-testid={`${testId}-pick`}>{a("pickImage")}</button>
            {value && <button type="button" onClick={() => onChange({ url: "", alt: "" })} className="text-xs text-[#B0413E] underline focus-ring" data-testid={`${testId}-remove`}>{a("removeImage")}</button>}
          </div>
          <input value={alt || ""} onChange={(e) => onChange({ url: value, alt: e.target.value })} placeholder={a("alt")} aria-label={a("alt")} className="admin-input text-xs" data-testid={`${testId}-alt`} />
          <p className="admin-help">{a("altHelp")}</p>
        </div>
      </div>
      {open && <ImagePickerModal onClose={() => setOpen(false)} onPick={(m) => onChange({ url: m.url, alt: alt || m.alt || "" })} />}
    </div>
  );
}
