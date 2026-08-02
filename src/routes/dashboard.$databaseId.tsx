
import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-start";
import { useState, useEffect } from "react";
import { initSchema } from "~/db";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/dashboard/$databaseId")({
  component: DatabaseDetailPage,
});

type Field = { id: string; name: string; type: string; field_order: number; config: Record<string, unknown>; };
type Record = { id: string; data: Record<string, unknown>; created_at: string; updated_at: string; };

const FIELD_TYPES = [
  { value: "text", label: "Text" }, { value: "number", label: "Number" },
  { value: "date", label: "Date" }, { value: "currency", label: "Currency" },
  { value: "select", label: "Select" }, { value: "boolean", label: "Yes/No" },
];

const COLORS = ["#116dff","#ED1566","#a78bfa","#c084fc","#e879f9","#f472b6","#fb7185","#f87171","#fb923c","#fbbf24","#a3e635","#4ade80","#34d399","#2dd4bf","#22d3ee"];

function DatabaseDetailPage() {
  const { databaseId } = Route.useParams();
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [dbName, setDbName] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [activeTab, setActiveTab] = useState<"data"|"schema"|"dashboard">("data");
  const [showNewField, setShowNewField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [subscription, setSubscription] = useState({ tier: "free" });
  const [recordLimit, setRecordLimit] = useState({ allowed: true, current: 0, limit: 100 });
  const [newRecordData, setNewRecordData] = useState<Record<string, string>>({});

  useEffect(() => { if (isLoaded && isSignedIn && user) loadData(); }, [isLoaded, isSignedIn, user, databaseId]);

  const loadData = async () => {
    const mod = await import("~/db");
    try { await mod.initSchema({ data: {} }); } catch {}
    let userDbs = [], flds = [], recs = [];
    try {
      const results = await Promise.all([
        mod.getUserDatabases({ data: { userId: user!.id } }),
        mod.getFields({ data: { databaseId } }),
        mod.getRecords({ data: { databaseId } }),
      ]);
      userDbs = results[0];
      flds = results[1];
      recs = results[2];
    } catch (e) {
      console.error("Failed to load database:", e);
    }
    const db = userDbs.find((d: any) => d.id === databaseId);
    setDbName(db?.name || "Database");
    setFields(flds);
    setRecords(recs);
    try {
      const sub = await mod.getUserSubscription({ data: { userId: user!.id } });
      setSubscription(sub);
      const rl = await mod.checkRecordLimit({ data: { userId: user!.id, databaseId } });
      setRecordLimit(rl);
    } catch {}
    setLoading(false);
  };

  const addField = async () => {
    if (!newFieldName.trim()) return;
    const mod = await import("~/db");
    const field = await mod.addField({ data: { databaseId, name: newFieldName.trim(), type: newFieldType, fieldOrder: fields.length } });
    setFields([...fields, field]);
    setNewFieldName(""); setShowNewField(false);
  };

  const deleteField = async (fieldId: string) => {
    if (!confirm("Remove this field?")) return;
    const mod = await import("~/db");
    await mod.deleteField({ data: { fieldId, databaseId } });
    setFields(fields.filter((f) => f.id !== fieldId));
  };

  const addRecord = async () => {
    const mod = await import("~/db");
    const data: Record<string, unknown> = {};
    for (const key of Object.keys(newRecordData)) { const val = newRecordData[key]; if (val !== "") data[key] = val; }
    const record = await mod.addRecord({ data: { databaseId, data } });
    setRecords([record, ...records]);
    setNewRecordData({}); setShowNewRecord(false);
  };

  const deleteRecord = async (recordId: string) => {
    if (!confirm("Delete this record?")) return;
    const mod = await import("~/db");
    await mod.deleteRecord({ data: { recordId, databaseId } });
    setRecords(records.filter((r) => r.id !== recordId));
  };

  const handleExport = async () => {
    const mod = await import("~/db");
    const result = await mod.exportCSV({ data: { databaseId } });
    const blob = new Blob([result.content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = result.filename; a.click();
    URL.revokeObjectURL(url);
  };

  // Dashboard computations
  const numFields = fields.filter((f) => f.type === "number" || f.type === "currency");
  const catFields = fields.filter((f) => f.type === "select");
  const dateFields = fields.filter((f) => f.type === "date");
  const hasDateField = dateFields.length > 0;
  const totals: Record<string, number> = {};
  for (const f of numFields) totals[f.name] = records.reduce((sum, r) => sum + (Number(r.data[f.name]) || 0), 0);
  const count = records.length;
  const avgs: Record<string, number> = {};
  if (count > 0) for (const f of numFields) avgs[f.name] = totals[f.name] / count;

  const barData = numFields.length > 0 ? records.slice(0, 20).map((r, i) => {
    const row: Record<string, string|number> = { name: "#" + (records.length - i) };
    for (const f of numFields) row[f.name] = Number(r.data[f.name]) || 0;
    return row;
  }) : [];

  const catBreakdowns: Record<string, Record<string, number>> = {};
  for (const f of catFields) {
    const counts: Record<string, number> = {};
    for (const r of records) { const val = String(r.data[f.name] || "Uncategorized"); counts[val] = (counts[val] || 0) + 1; }
    catBreakdowns[f.name] = counts;
  }
  const boolFields = fields.filter((f) => f.type === "boolean");
  const boolBreakdowns: Record<string, Record<string, number>> = {};
  for (const f of boolFields) {
    let yes = 0, no = 0;
    for (const r of records) { if (r.data[f.name] === true || r.data[f.name] === "true") yes++; else no++; }
    boolBreakdowns[f.name] = { Yes: yes, No: no };
  }
  const lineData = hasDateField && records.length > 0 ? (() => {
    const dateField = dateFields[0].name;
    const grouped: Record<string, Record<string, number>> = {};
    for (const r of records) {
      const date = String(r.data[dateField] || "Unknown").slice(0, 10);
      if (!grouped[date]) grouped[date] = { date: date };
      for (const f of numFields) grouped[date][f.name] = (grouped[date][f.name] || 0) + (Number(r.data[f.name]) || 0);
    }
    return Object.values(grouped).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  })() : [];

  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" /></div>;
  if (!isSignedIn) return <Navigate to="/sign-in" />;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 text-white text-sm font-bold shadow-sm">F</span>
            <span className="text-lg font-bold tracking-tight text-gray-900">{dbName}</span>
          </div>
          <button onClick={handleExport} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Export CSV</button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 pt-20 pb-12">
        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm border border-gray-200">
          {(["data","schema","dashboard"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={"flex-1 rounded-lg px-4 py-2 text-sm font-medium transition " + (activeTab===tab?"bg-brand-600 text-white shadow-sm":"text-gray-600 hover:text-gray-900")}>
              {tab==="data"?"Records":tab==="schema"?"Schema":"Dashboard"}
            </button>
          ))}
        </div>

        {/* Schema Tab */}
        {activeTab === "schema" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Database Fields</h2>
              <button onClick={() => setShowNewField(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">+ Add Field</button>
            </div>
            <div className="mt-4 space-y-3">
              {fields.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-300 py-12">
                  <div className="max-w-md mx-auto text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <span className="text-3xl">🏗️</span>
                      <h3 className="text-lg font-semibold text-gray-900">Let's build your database!</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-8">Define the fields (columns) you want to track. It only takes a minute.</p>
                    <div className="space-y-4 text-left">
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Add your first field</p>
                          <p className="text-xs text-gray-500">Click "+ Add Field" and define what you want to track — like "Amount", "Category", or "Date".</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">2</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Add records</p>
                          <p className="text-xs text-gray-500">Once you have fields, switch to the Records tab and start entering data.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">3</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">View your dashboard</p>
                          <p className="text-xs text-gray-500">Charts and insights are auto-generated from your data — no setup needed.</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setShowNewField(true)} className="mt-8 inline-flex items-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
                      + Add Your First Field
                    </button>
                  </div>
                </div>
              ) : null}
              {fields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">{i+1}</div>
                  <div className="flex-1"><p className="font-medium text-gray-900">{field.name}</p><p className="text-xs text-gray-500">{FIELD_TYPES.find(t=>t.value===field.type)?.label||field.type}</p></div>
                  <button onClick={() => deleteField(field.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
              ))}
            </div>
            {showNewField && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
                  <h2 className="text-lg font-bold text-gray-900">Add Field</h2>
                  <div className="mt-4 space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700">Name</label><input type="text" value={newFieldName} onChange={e=>setNewFieldName(e.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm" autoFocus/></div>
                    <div><label className="block text-sm font-medium text-gray-700">Type</label>
                      <select value={newFieldType} onChange={e=>setNewFieldType(e.target.value)} className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm">
                        {FIELD_TYPES.map(ft=><option key={ft.value} value={ft.value}>{ft.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={()=>setShowNewField(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium">Cancel</button>
                    <button onClick={addField} disabled={!newFieldName.trim()} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Add</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Data Tab */}
        {activeTab === "data" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Records ({records.length})</h2>
                {subscription.tier === "free" && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {records.length}/{recordLimit.limit} records used (Free plan)
                    {records.length >= recordLimit.limit && (
                      <Link to="/pricing" className="ml-1 font-semibold text-brand-600 underline">Upgrade to Pro</Link>
                    )}
                  </p>
                )}
              </div>
              <button onClick={()=>{if (!recordLimit.allowed && subscription.tier === "free") {alert("Free plan limit: 100 records. Upgrade to Pro.");return;}setNewRecordData({});setShowNewRecord(true);}} disabled={fields.length===0} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">+ Add Record</button>
            </div>
            {subscription.tier === "free" && records.length >= 90 && (<div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs text-amber-800"><strong>{100 - records.length} records remaining</strong> on free plan. <a href="/pricing">Upgrade</a></p></div>)}<div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              {records.length === 0 ? (
                <div className="py-16 text-center"><p className="text-sm text-gray-500">No records yet.</p></div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead><tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 font-semibold text-gray-600">#</th>
                    {fields.map(f=><th key={f.id} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{f.name}</th>)}
                    <th className="px-4 py-3 font-semibold text-gray-600">Created</th><th/>
                  </tr></thead>
                  <tbody>{records.map((r,i)=>(
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-400">{records.length-i}</td>
                      {fields.map(f=>{
                        const val = r.data[f.name];
                        let display = String(val ?? "\u2014");
                        if (f.type==="currency" && val) display = "$" + Number(val).toLocaleString("en-US",{minimumFractionDigits:2});
                        return <td key={f.id} className="px-4 py-3 whitespace-nowrap">{display}</td>;
                      })}
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3"><button onClick={()=>deleteRecord(r.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
            {showNewRecord && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-gray-900">Add Record</h2>
                <div className="mt-4 space-y-4">
                  {fields.map(f=>(
                    <div key={f.id}>
                      <label className="block text-sm font-medium text-gray-700">{f.name}</label>
                      {f.type==="boolean" ? (
                        <div className="mt-1 flex gap-4">
                          <label className="flex items-center gap-2"><input type="radio" name={"n-"+f.name} value="true" onChange={e=>setNewRecordData({...newRecordData,[f.name]:"true"})}/>Yes</label>
                          <label className="flex items-center gap-2"><input type="radio" name={"n-"+f.name} value="false" onChange={e=>setNewRecordData({...newRecordData,[f.name]:"false"})}/>No</label>
                        </div>
                      ) : (
                        <input type={f.type==="number"||f.type==="currency"?"number":f.type==="date"?"date":"text"}
                          step={f.type==="currency"?"0.01":undefined}
                          value={newRecordData[f.name]||""}
                          onChange={e=>setNewRecordData({...newRecordData,[f.name]:e.target.value})}
                          className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm"/>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={()=>setShowNewRecord(false)} className="rounded-xl border px-4 py-2.5 text-sm font-medium">Cancel</button>
                  <button onClick={addRecord} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Add</button>
                </div>
              </div>
            </div>)}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Dashboard</h2>
            {records.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-gray-300 py-16 text-center">
                <p className="text-sm text-gray-500">Add records to see dashboard insights.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Records</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{count}</p>
                  </div>
                  {numFields.map(f=>(
                    <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total {f.name}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">{(f.type==="currency"?"$":"") + (totals[f.name]||0).toLocaleString(undefined,{maximumFractionDigits:2})}</p>
                      {count>1&&<p className="mt-0.5 text-xs text-gray-400">Avg: {(f.type==="currency"?"$":"") + (avgs[f.name]||0).toLocaleString(undefined,{maximumFractionDigits:2})}</p>}
                    </div>
                  ))}
                </div>

                {/* Bar Chart */}
                {barData.length>1&&<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Records Overview</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData} margin={{top:5,right:30,left:20,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="name" fontSize={12} tick={{fill:"#6b7280"}}/>
                      <YAxis fontSize={12} tick={{fill:"#6b7280"}}/>
                      <Tooltip contentStyle={{borderRadius:"12px",border:"1px solid #e5e7eb"}}/>
                      {numFields.map((f,i)=><Bar key={f.id} dataKey={f.name} fill={COLORS[i%COLORS.length]} radius={[4,4,0,0]}/>)}
                    </BarChart>
                  </ResponsiveContainer>
                </div>}

                {/* Line Chart */}
                {lineData.length>1&&<div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Trends Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={lineData} margin={{top:5,right:30,left:20,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                      <XAxis dataKey="date" fontSize={12} tick={{fill:"#6b7280"}}/>
                      <YAxis fontSize={12} tick={{fill:"#6b7280"}}/>
                      <Tooltip contentStyle={{borderRadius:"12px",border:"1px solid #e5e7eb"}}/>
                      {numFields.map((f,i)=><Line key={f.id} type="monotone" dataKey={f.name} stroke={COLORS[i%COLORS.length]} strokeWidth={2} dot={{r:3}}/>)}
                    </LineChart>
                  </ResponsiveContainer>
                </div>}

                {/* Pie Charts */}
                {Object.entries(catBreakdowns).map(([fieldName,counts])=>{
                  const pieData = Object.entries(counts).map(([n,v])=>({name:n,value:v}));
                  return <div key={fieldName} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">{fieldName} Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                        label={({name,percent})=>name + " " + (percent*100).toFixed(0) + "%"}>
                        {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie><Tooltip/><Legend/></PieChart>
                    </ResponsiveContainer>
                  </div>;
                })}

                {/* Boolean Pie Charts */}
                {Object.entries(boolBreakdowns).map(([fieldName,counts])=>{
                  const pieData = Object.entries(counts).map(([n,v])=>({name:n,value:v}));
                  return <div key={"b-"+fieldName} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">{fieldName}</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart><Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                        label={({name,percent})=>name + " " + (percent*100).toFixed(0) + "%"}>
                        {pieData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie><Tooltip/><Legend/></PieChart>
                    </ResponsiveContainer>
                  </div>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
