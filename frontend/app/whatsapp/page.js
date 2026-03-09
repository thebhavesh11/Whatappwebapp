'use client';
import { useState, useEffect } from 'react';
const API = 'http://localhost:8000/api';

export default function WhatsApp() {
  const [status, setStatus] = useState({ connected: false, hasQR: false, info: null, error: null });
  const [qrImage, setQrImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type) => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3500); };
  const fetchQR = async () => { try { const r = await fetch(`${API}/whatsapp/qr`); const d = await r.json(); if (d.qr) setQrImage(d.qr); } catch {} };
  const checkStatus = async () => { try { const r = await fetch(`${API}/whatsapp/status`); const d = await r.json(); setStatus(d); if (d.hasQR) fetchQR(); } catch { setStatus({ connected: false, hasQR: false, info: null, error: 'Backend unreachable' }); } finally { setLoading(false); } };

  useEffect(() => { checkStatus(); const iv = setInterval(checkStatus, 8000); return () => clearInterval(iv); }, []);

  const disconnect = async () => { if (!confirm('Disconnect? You will need to scan QR again.')) return; try { await fetch(`${API}/whatsapp/disconnect`, { method: 'POST' }); showToast('Disconnected.', 'success'); setQrImage(null); checkStatus(); } catch { showToast('Disconnect failed', 'error'); } };
  const restart = async () => { try { await fetch(`${API}/whatsapp/restart`, { method: 'POST' }); showToast('Restarting...', 'success'); setTimeout(checkStatus, 5000); } catch { showToast('Restart failed', 'error'); } };

  if (loading) return <div className="loading"><div className="spinner"></div>Loading WhatsApp status...</div>;

  return (<>
    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>WhatsApp Connection</h2>
    <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24 }}>Manage linked WhatsApp sessions</p>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="card-header" style={{ textAlign: 'center' }}>WhatsApp Web Connection</div>
        {status.connected ? (<div style={{ padding: '30px 0' }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)', marginBottom: 6 }}>Connected</div>{status.info && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{status.info.pushname||'WhatsApp User'}</div>}</div>) : (<>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, marginTop: 8 }}>Scan this QR code with WhatsApp on your phone to connect.</p>
          {qrImage ? <div style={{ marginBottom: 16 }}><img src={qrImage} alt="QR" style={{ width: 220, height: 220, borderRadius: 8, border: '2px solid var(--border-color)' }} /></div> :
          <div style={{ width: 220, height: 220, margin: '0 auto 16px', borderRadius: 8, border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-tertiary)', fontSize: 13 }}><div style={{ fontSize: 28, marginBottom: 8 }}>📱</div>{status.error ? <span style={{ color: 'var(--danger)', fontSize: 12, maxWidth: 160, textAlign: 'center' }}>{status.error}</span> : 'Waiting for QR code...'}</div>}
        </>)}
        <button className="btn btn-primary" onClick={() => { fetchQR(); checkStatus(); }} style={{ marginBottom: 10 }}>Generate QR Code</button>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.8, marginTop: 12 }}>1. Open WhatsApp on your phone<br/>2. Go to Settings → Linked Devices<br/>3. Tap "Link a Device" and scan</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
          {status.connected && <button className="btn btn-danger" onClick={disconnect}>Disconnect & Change Number</button>}
          <button className="btn btn-secondary" onClick={restart}>🔄 Restart Connection</button>
          <button className="btn btn-secondary" onClick={checkStatus}>↻ Refresh Status</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card"><div className="card-header">Connection Settings</div>
          <div className="form-group"><label className="form-label">Business WhatsApp Number</label><input className="form-input" placeholder="+92 300 0000000" disabled /></div>
          <div className="form-group"><label className="form-label">Session Name</label><input className="form-input" defaultValue="main-session" disabled /></div>
          <div className="form-group"><label className="form-label">Auto-reconnect</label><select className="form-select" defaultValue="yes" disabled><option value="yes">Yes</option><option value="no">No</option></select></div>
        </div>
        <div className="card"><div className="card-header">Message Settings</div>
          <div className="form-group"><label className="form-label">Typing Indicator</label><select className="form-select" defaultValue="enabled" disabled><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></div>
          <div className="form-group"><label className="form-label">Read Receipts</label><select className="form-select" defaultValue="after" disabled><option value="after">After reply</option><option value="immediate">Immediately</option><option value="never">Never</option></select></div>
          <div className="form-group"><label className="form-label">Business Hours Only</label><select className="form-select" defaultValue="24/7" disabled><option value="24/7">24/7</option><option value="hours">Business hours only</option></select></div>
        </div>
      </div>
    </div>
    {toast && <div className={`toast toast-${toast.type}`}>{toast.type==='success'?'✅':'❌'} {toast.message}</div>}
  </>);
}
