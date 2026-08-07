import { useState } from "react";

type Props = { open: boolean; onClose: () => void; onAdd?: (d: string, a: string, c: string) => void };

export default function AddRecordSheet({ open, onClose, onAdd }: Props) {
  const [desc, setDesc] = useState("");
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState("");
  if (!open) return null;

  const add = () => { if (onAdd && desc && amt) onAdd(desc, amt, cat || "General"); setDesc(""); setAmt(""); setCat(""); onClose(); };
  const cancel = () => { setDesc(""); setAmt(""); setCat(""); onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={cancel} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[22px] bg-white pb-8 animate-[sheetUp_0.28s_ease]" style={{ boxShadow: "0 -4px 30px rgba(0,0,0,0.12)" }}>
        <div className="flex justify-center pt-3 pb-2"><div className="h-1 w-10 rounded-full bg-gray-300" /></div>
        <div className="px-5">
          <h2 className="mb-5 text-lg font-extrabold tracking-tight text-gray-900">Add record</h2>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">Description</label>
          <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. Client payment" className="mb-4 h-12 w-full rounded-[13px] border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          <div className="mb-6 flex gap-3">
            <div className="flex-1"><label className="mb-1.5 block text-xs font-semibold text-gray-700">Amount</label>
              <div className="flex h-12 items-center rounded-[13px] border border-gray-300 bg-white px-4 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <span className="mr-1 text-sm text-gray-400">$</span><input type="text" value={amt} onChange={e => setAmt(e.target.value)} placeholder="0.00" className="w-full text-sm outline-none" />
              </div></div>
            <div className="flex-1"><label className="mb-1.5 block text-xs font-semibold text-gray-700">Category</label>
              <div className="flex h-12 items-center rounded-[13px] border border-gray-300 bg-white px-4 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
                <input type="text" value={cat} onChange={e => setCat(e.target.value)} placeholder="General" className="w-full text-sm outline-none" />
              </div></div>
          </div>
          <div className="flex gap-3">
            <button onClick={cancel} className="flex-1 rounded-[14px] bg-gray-100 py-3 text-sm font-semibold text-gray-600 active:bg-gray-200">Cancel</button>
            <button onClick={add} className="flex-1 rounded-[14px] bg-brand-600 py-3 text-sm font-bold text-white shadow-md shadow-brand-600/20 active:bg-brand-700">Add</button>
          </div>
        </div>
      </div>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </>
  );
}
