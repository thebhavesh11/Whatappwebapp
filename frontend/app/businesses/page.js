'use client';
import { useState, useEffect } from 'react';
const API = 'http://localhost:8000/api';
const PROVIDER_MODELS = { openai: ['gpt-4o','gpt-4o-mini','gpt-4-turbo','gpt-4','gpt-3.5-turbo','o1-mini','o3-mini'], gemini: ['gemini-2.0-flash','gemini-1.5-pro','gemini-1.5-flash','gemini-1.0-pro'], openrouter: [] };

export default function Businesses() {
  const [biz, setBiz] = useState(null);
  const [ai, setAi] = useState(null);
  const [tab, setTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);

  useEffect(() => { Promise.all([fetch(`${API}/business`).then(r=>r.json()), fetch(`${API}/ai-settings`).then(r=>r.json())]).then(([b,a]) => { setBiz(b); setAi(a); }).catch(()=>{}).finally(()=>setLoading(false)); }, []);

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };
  const saveBusiness = async () => { setSaving(true); try { const r = await fetch(`${API}/business`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(biz) }); showToast(r.ok?'Business info saved!':'Failed to save', r.ok?'success':'error'); } catch { showToast('Error saving','error'); } finally { setSaving(false); } };
  const saveAI = async () => { setSaving(true); try { const r = await fetch(`${API}/ai-settings`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(ai) }); showToast(r.ok?'AI settings saved!':'Failed to save', r.ok?'success':'error'); } catch { showToast('Error saving','error'); } finally { setSaving(false); } };
  const testConnection = async () => { setValidating(true); setValidationStatus(null); try { const r = await fetch(`${API}/ai-settings/validate`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ provider:ai.provider, api_key:ai.api_key, model:ai.model }) }); const d = await r.json(); setValidationStatus(d); showToast(d.valid?'✅ Connected!':'❌ '+d.message, d.valid?'success':'error'); } catch { setValidationStatus({valid:false,message:'Connection failed'}); } finally { setValidating(false); } };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading business profile...</div>;

  return (<>
    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Business Profiles</h2>
    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24 }}>Configure AI behavior per business</p>
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Businesses</div>
        <div className="card" style={{ border: '2px solid var(--accent)', padding: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{biz?.name||'My Business'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 10 }}>{biz?.industry||'No industry set'}</div>
          <span className="lead-badge" style={{ background:'rgba(16,185,129,0.12)', color:'var(--accent)', fontSize:10, padding:'2px 8px' }}><span className="badge-dot" style={{ background:'var(--accent)', width:5, height:5 }}></span>Active</span>
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 32 }}>🏢</span>
          <div><div style={{ fontWeight: 700, fontSize: 18 }}>{biz?.name||'My Business'}</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{biz?.industry||''}</div></div>
        </div>
        <div className="tabs" style={{ padding: '0 24px' }}>
          {['info','ai-agent','system-prompt','scoring-prompt','calendar'].map(t => (<div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t==='info'?'Info':t==='ai-agent'?'AI Agent':t==='system-prompt'?'System Prompt':t==='scoring-prompt'?'Scoring Prompt':'Calendar'}</div>))}
        </div>
        <div style={{ padding: 24 }}>
          {tab==='info' && biz && (<>
            <div className="grid-2"><div className="form-group"><label className="form-label">Business Name</label><input className="form-input" value={biz.name||''} onChange={e=>setBiz({...biz,name:e.target.value})} /></div><div className="form-group"><label className="form-label">Industry</label><input className="form-input" value={biz.industry||''} onChange={e=>setBiz({...biz,industry:e.target.value})} /></div></div>
            <div className="grid-2"><div className="form-group"><label className="form-label">Location</label><input className="form-input" value={biz.location||''} onChange={e=>setBiz({...biz,location:e.target.value})} /></div><div className="form-group"><label className="form-label">Working Hours</label><input className="form-input" value={biz.working_hours||''} onChange={e=>setBiz({...biz,working_hours:e.target.value})} /></div></div>
            <div className="form-group"><label className="form-label">Business Information (AI Knowledge Base)</label><textarea className="form-textarea" style={{ minHeight: 100 }} value={biz.services||''} onChange={e=>setBiz({...biz,services:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Pricing</label><textarea className="form-textarea" style={{ minHeight: 80 }} value={biz.pricing||''} onChange={e=>setBiz({...biz,pricing:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">Current Offers</label><textarea className="form-textarea" style={{ minHeight: 60 }} value={biz.offers||''} onChange={e=>setBiz({...biz,offers:e.target.value})} /></div>
            <div className="form-group"><label className="form-label">FAQs</label><textarea className="form-textarea" style={{ minHeight: 80 }} value={biz.faqs||''} onChange={e=>setBiz({...biz,faqs:e.target.value})} /></div>
            <button className="btn btn-primary" onClick={saveBusiness} disabled={saving}>{saving?'⏳ Saving...':'Save Changes'}</button>
          </>)}
          {tab==='ai-agent' && ai && (<>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">AI Provider</label><select className="form-select" value={ai.provider} onChange={e=>{const p=e.target.value;setAi({...ai,provider:p,model:p==='openai'?'gpt-4o-mini':p==='gemini'?'gemini-1.5-flash':''});setValidationStatus(null);}}><option value="openai">OpenAI</option><option value="gemini">Google Gemini</option><option value="openrouter">OpenRouter</option></select></div>
              <div className="form-group"><label className="form-label">AI Model</label>{ai.provider==='openrouter'?<input className="form-input" placeholder="e.g. openai/gpt-4o-mini" value={ai.model||''} onChange={e=>setAi({...ai,model:e.target.value})} />:<select className="form-select" value={ai.model} onChange={e=>setAi({...ai,model:e.target.value})}>{(PROVIDER_MODELS[ai.provider]||[]).map(m=><option key={m} value={m}>{m}</option>)}</select>}</div>
            </div>
            <div className="form-group"><label className="form-label">API Key</label><div style={{ display: 'flex', gap: 10 }}><input className="form-input" type="password" placeholder="Enter your API key..." value={ai.api_key||''} onChange={e=>{setAi({...ai,api_key:e.target.value});setValidationStatus(null);}} style={{ flex:1 }} /><button className="btn btn-secondary" onClick={testConnection} disabled={validating||!ai.api_key}>{validating?'⏳ Testing...':'🔌 Test Connection'}</button></div>
              {validationStatus && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, background: validationStatus.valid?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: validationStatus.valid?'var(--success)':'var(--danger)', border: `1px solid ${validationStatus.valid?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}` }}>{validationStatus.valid?'✅':'❌'} {validationStatus.message}</div>}
            </div>
            <div className="grid-2"><div className="form-group"><label className="form-label">Temperature ({ai.temperature})</label><input type="range" min="0" max="2" step="0.1" value={ai.temperature} onChange={e=>setAi({...ai,temperature:parseFloat(e.target.value)})} style={{ width: '100%', accentColor: 'var(--accent)' }} /></div><div className="form-group"><label className="form-label">Max Tokens</label><input className="form-input" type="number" value={ai.max_tokens} onChange={e=>setAi({...ai,max_tokens:parseInt(e.target.value)||500})} /></div></div>
            <button className="btn btn-primary" onClick={saveAI} disabled={saving}>{saving?'⏳ Saving...':'Save Agent Config'}</button>
          </>)}
          {tab==='system-prompt' && ai && (<>
            <div className="form-group"><label className="form-label">Response AI System Prompt</label><textarea className="form-textarea" style={{ minHeight: 180 }} placeholder="You are a professional customer assistant..." value={ai.system_prompt||''} onChange={e=>setAi({...ai,system_prompt:e.target.value})} /><p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>This prompt controls how the AI agent responds. Business info is appended as reference data automatically.</p></div>
            <button className="btn btn-primary" onClick={saveAI} disabled={saving}>{saving?'⏳ Saving...':'Save Prompts'}</button>
          </>)}
          {tab==='scoring-prompt' && ai && (<>
            <div className="form-group"><label className="form-label">Lead Scoring System Prompt</label><textarea className="form-textarea" style={{ minHeight: 200 }} placeholder="Analyze this conversation and score the lead from 0-100.\n\nScoring criteria:\n- HOT (80-100): Ready to buy, has budget clarity, shows urgency\n- WARM (50-79): Interested but comparing options, needs nurturing\n- COLD (0-49): Just browsing, no budget mentioned, vague interest" value={ai.scoring_prompt||''} onChange={e=>setAi({...ai,scoring_prompt:e.target.value})} /><p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.7 }}>This prompt tells the AI how to score leads. The conversation history is appended automatically.<br/>The AI must return a JSON: <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4 }}>{'{"score": number, "label": "hot|warm|cold"}'}</code><br/>Leave empty to use the default scoring criteria.</p></div>
            <button className="btn btn-primary" onClick={saveAI} disabled={saving}>{saving?'⏳ Saving...':'Save Scoring Prompt'}</button>
          </>)}
          {tab==='calendar' && <div className="empty-state"><div className="empty-icon">📅</div><p>Calendar integration coming soon. Connect Google Calendar or Cal.com for appointment booking.</p></div>}
        </div>
      </div>
    </div>
    {toast && <div className={`toast toast-${toast.type}`}>{toast.type==='success'?'✅':'❌'} {toast.message}</div>}
  </>);
}
