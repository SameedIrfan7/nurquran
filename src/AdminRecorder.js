import { useState, useRef, useEffect } from 'react';
import { processAudio, uploadToCloudinary, createLevelMeter } from './audioProcessor';
import { supabase } from './supabase';

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'nurquran786';

async function addEpisode(ep) {
  const { data, error } = await supabase.from('episodes').insert(ep).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function getNextDay() {
  const { data } = await supabase.from('episodes').select('day').order('day', { ascending: false }).limit(1);
  return data?.[0]?.day ? data[0].day + 1 : 1;
}

function LiveMeter({ level }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 52, justifyContent: 'center' }}>
      {Array.from({ length: 32 }, (_, i) => {
        const active = (level * 32) > i;
        const h = Math.max(4, active ? level * 52 : 4);
        return (
          <div key={i} style={{
            width: 4, height: h, borderRadius: 2,
            background: active ? (level > 0.75 ? '#E05252' : level > 0.45 ? '#C8A45A' : '#3DB87B') : 'rgba(200,164,90,0.1)',
            transition: 'height 0.05s, background 0.1s'
          }} />
        );
      })}
    </div>
  );
}

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

const S = {
  panel: { background: '#0E1812', border: '0.5px solid rgba(200,164,90,0.25)', borderRadius: '20px 20px 0 0', padding: 28, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' },
  label: { fontSize: 11, color: 'rgba(242,234,216,0.4)', letterSpacing: 1, marginBottom: 6, display: 'block' },
  input: { width: '100%', background: '#152018', border: '0.5px solid rgba(200,164,90,0.2)', borderRadius: 10, padding: '12px 14px', color: '#F2EAD8', fontSize: 14, outline: 'none', marginBottom: 12, fontFamily: "'DM Sans',sans-serif" },
  btn: (active, color = '#C8A45A') => ({ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: active ? color : color + '20', color: active ? '#08100A' : color, fontFamily: "'Cormorant Garamond',serif", fontSize: 17, cursor: active ? 'pointer' : 'not-allowed', letterSpacing: 0.5, transition: 'all 0.2s', marginBottom: 10 }),
};

/* ── LEADERBOARD ADMIN ── */
function LeaderboardAdmin() {
  const [lbData, setLbData] = useState([]);
  const [lbLoading, setLbLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLbLoading(true);
    supabase.from('readers').select('*').order('pts', { ascending: false }).limit(200)
      .then(({ data, error }) => {
        if (!error) setLbData(data || []);
        setLbLoading(false);
      });
  }, []);

  const deleteEntry = (id, name) => {
    if (!window.confirm('Remove ' + name + ' from leaderboard?')) return;
    supabase.from('readers').delete().eq('id', id).then(({ error }) => {
      if (!error) setLbData(prev => prev.filter(u => u.id !== id));
    });
  };

  const resetPoints = (id, name) => {
    if (!window.confirm('Reset all points for ' + name + '?')) return;
    supabase.from('readers').update({ pts: 0, ayahs_read: 0 }).eq('id', id).then(({ error }) => {
      if (!error) setLbData(prev => prev.map(u => u.id === id ? { ...u, pts: 0, ayahs_read: 0 } : u));
    });
  };

  const filtered = search ? lbData.filter(u => u.name?.toLowerCase().includes(search.toLowerCase())) : lbData;

  if (lbLoading) return <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(242,234,216,0.4)', animation: 'pulse 1.5s infinite' }}>Loading leaderboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'rgba(242,234,216,0.4)' }}>{lbData.length} readers total</div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name..."
          style={{ background: '#152018', border: '0.5px solid rgba(200,164,90,0.2)', borderRadius: 8, padding: '6px 12px', color: '#F2EAD8', fontSize: 12, outline: 'none', width: 160 }}
        />
      </div>
      {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(242,234,216,0.3)' }}>No readers found</div>}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {filtered.map((u, i) => (
          <div key={u.id || i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid rgba(200,164,90,0.08)', gap: 10 }}>
            <div style={{ width: 28, fontSize: 12, color: 'rgba(200,164,90,0.4)', textAlign: 'center', flexShrink: 0 }}>#{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: '#F2EAD8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(242,234,216,0.3)' }}>{u.pts || 0} pts · {u.ayahs_read || 0} ayahs</div>
            </div>
            <button onClick={() => resetPoints(u.id, u.name)} style={{ background: 'rgba(200,164,90,0.1)', border: '0.5px solid rgba(200,164,90,0.2)', borderRadius: 6, padding: '5px 10px', color: '#C8A45A', cursor: 'pointer', fontSize: 11 }}>Reset</button>
            <button onClick={() => deleteEntry(u.id, u.name)} style={{ background: 'rgba(224,82,82,0.1)', border: '0.5px solid rgba(224,82,82,0.2)', borderRadius: 6, padding: '5px 10px', color: '#E05252', cursor: 'pointer', fontSize: 11 }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminRecorder({ onClose, onEpisodeAdded }) {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState(false);
  const [state, setState] = useState('idle');
  const [adminTab, setAdminTab] = useState('record');
  const [level, setLevel] = useState(0);
  const [duration, setDuration] = useState(0);
  const [step, setStep] = useState('');
  const [rawBlob, setRawBlob] = useState(null); // eslint-disable-line no-unused-vars
  const [processedBlob, setProcessedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [nextDay, setNextDay] = useState(1);
  const [approved, setApproved] = useState(false);
  const [info, setInfo] = useState({ name: '', ar: '', range: '', desc: '' });
  const [err, setErr] = useState('');

  const mrRef = useRef(null);
  const meterRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => { if (authed) getNextDay().then(setNextDay); }, [authed]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => { cleanup(); if (previewUrl) URL.revokeObjectURL(previewUrl); }, []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    meterRef.current?.stop();
    if (mrRef.current?.state !== 'inactive') mrRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwErr(false); }
    else { setPwErr(true); setPw(''); }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, sampleRate: 44100, channelCount: 1 }
      });
      streamRef.current = stream;
      const chunks = [];
      setDuration(0); setLevel(0); setApproved(false);
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' });
      mrRef.current = mr;
      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRawBlob(blob);
        handleProcess(blob);
      };
      mr.start(1000);
      setState('recording');
      meterRef.current = createLevelMeter(stream, setLevel);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch (e) {
      setErr('Microphone access denied. Please allow mic in browser settings.'); setState('error');
    }
  };

  const stopRec = () => { cleanup(); setState('processing'); };

  const handleProcess = async (blob) => {
    setState('processing'); setStep('Starting...');
    try {
      const processed = await processAudio(blob, s => setStep(s));
      setProcessedBlob(processed);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(processed);
      setPreviewUrl(url);
      setState('preview');
    } catch (e) { setErr('Processing failed: ' + e.message); setState('error'); }
  };

  const handleUpload = async () => {
    if (!processedBlob || !info.name.trim()) { setErr('Fill in the Surah name first.'); return; }
    if (!approved) { setErr('Please listen to the audio and check the approval box first.'); return; }
    setState('uploading'); setErr('');
    try {
      const audioUrl = await uploadToCloudinary(processedBlob, nextDay, s => setStep(s));
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const ep = await addEpisode({
        day: nextDay, surah_name: info.name.trim(), surah_ar: info.ar.trim(),
        ayah_range: info.range.trim(), description: info.desc.trim(),
        audio_url: audioUrl, duration: fmt(duration), date: today, listens: 0,
      });
      onEpisodeAdded?.(ep);
      setState('done');
    } catch (e) { setErr(e.message); setState('error'); }
  };

  const reset = () => {
    cleanup();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setRawBlob(null); setProcessedBlob(null);
    setDuration(0); setLevel(0); setErr(''); setStep('');
    setApproved(false); setInfo({ name: '', ar: '', range: '', desc: '' });
    setState('idle');
  };

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(12px)' };

  if (!authed) return (
    <div style={overlay} onClick={onClose}>
      <div style={S.panel} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: '#C8A45A', marginBottom: 6 }}>Admin Access</div>
        <div style={{ fontSize: 13, color: 'rgba(242,234,216,0.4)', marginBottom: 24 }}>Enter password to continue</div>
        <input type="password" value={pw} autoFocus onChange={e => { setPw(e.target.value); setPwErr(false); }}
          onKeyDown={e => { if (e.key === 'Enter') login(); }}
          placeholder="Password"
          style={{ ...S.input, textAlign: 'center', fontSize: 22, letterSpacing: 8, borderColor: pwErr ? '#E05252' : 'rgba(200,164,90,0.2)' }} />
        {pwErr && <div style={{ color: '#E05252', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>Incorrect password</div>}
        <button onClick={login} style={S.btn(pw.length > 0)}>Enter</button>
        <button onClick={onClose} style={{ ...S.btn(false), background: 'none', color: 'rgba(242,234,216,0.2)' }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div style={overlay} onClick={onClose}>
      <div style={S.panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: '#C8A45A' }}>Admin Panel</div>
            <div style={{ fontSize: 12, color: 'rgba(242,234,216,0.4)', marginTop: 2 }}>Day {nextDay} of 365</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(242,234,216,0.4)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {[['record', '🎙 Record'], ['leaderboard', '🏆 Leaderboard']].map(([t, label]) => (
            <button key={t} onClick={() => setAdminTab(t)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid',
              borderColor: adminTab === t ? '#C8A45A' : 'rgba(200,164,90,0.15)',
              background: adminTab === t ? 'rgba(200,164,90,0.1)' : 'transparent',
              color: adminTab === t ? '#C8A45A' : 'rgba(242,234,216,0.35)',
              cursor: 'pointer', fontFamily: "'Cormorant Garamond',serif", fontSize: 15, transition: 'all 0.15s'
            }}>{label}</button>
          ))}
        </div>

        {/* Leaderboard tab */}
        {adminTab === 'leaderboard' && <LeaderboardAdmin />}

        {/* Record tab */}
        {adminTab === 'record' && <>
          {/* Progress steps */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
            {['Record', 'Process', 'Review', 'Upload'].map((s, i) => {
              const stateIdx = { idle: 0, recording: 0, processing: 1, preview: 2, uploading: 3, done: 4, error: 0 }[state];
              const active = stateIdx >= i;
              return (
                <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ height: 3, borderRadius: 2, background: active ? '#C8A45A' : 'rgba(200,164,90,0.15)', marginBottom: 5, transition: 'background 0.3s' }} />
                  <div style={{ fontSize: 10, color: active ? '#C8A45A' : 'rgba(242,234,216,0.3)', letterSpacing: 0.5 }}>{s.toUpperCase()}</div>
                </div>
              );
            })}
          </div>

          {/* IDLE */}
          {state === 'idle' && (
            <>
              <div style={{ background: '#152018', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🎙</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#F2EAD8', marginBottom: 8 }}>Ready to record</div>
                <div style={{ fontSize: 13, color: 'rgba(242,234,216,0.45)', lineHeight: 1.7 }}>Find a quiet place · Sit comfortably · Say Bismillah</div>
              </div>
              <div style={{ background: 'rgba(200,164,90,0.06)', border: '0.5px solid rgba(200,164,90,0.18)', borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 12, color: 'rgba(242,234,216,0.5)', lineHeight: 1.9 }}>
                After recording, the processor will:<br />
                ✦ Remove AC hum (50Hz Indian power) & harmonics<br />
                ✦ Spectral subtraction of background noise<br />
                ✦ Noise gate — silences background voices & fan<br />
                ✦ EQ boost for voice presence & warmth<br />
                ✦ Compression & normalisation<br />
                ✦ Then you listen and approve before uploading
              </div>
              <button onClick={startRec} style={S.btn(true)}>● Start Recording</button>
            </>
          )}

          {/* RECORDING */}
          {state === 'recording' && (
            <>
              <div style={{ background: '#152018', borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E05252', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontSize: 12, color: '#E05252', letterSpacing: 1.5 }}>RECORDING</span>
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, color: '#C8A45A', letterSpacing: 2, marginBottom: 16 }}>{fmt(duration)}</div>
                <LiveMeter level={level} />
                <div style={{ fontSize: 12, color: 'rgba(242,234,216,0.35)', marginTop: 10 }}>
                  {level < 0.05 ? '⚠ Very quiet — move closer to mic' : level > 0.85 ? '⚠ Too loud — move back a little' : '✓ Good level — keep going'}
                </div>
              </div>
              <button onClick={stopRec} style={S.btn(true, '#E05252')}>⏹ Stop & Process</button>
            </>
          )}

          {/* PROCESSING */}
          {state === 'processing' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: 'Amiri,serif', fontSize: 28, color: '#C8A45A', opacity: 0.4, marginBottom: 20, animation: 'pulse 1.5s infinite' }}>جَارٍ التَّحْمِيل</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#F2EAD8', marginBottom: 10 }}>Processing Audio</div>
              <div style={{ fontSize: 13, color: '#C8A45A', opacity: 0.8, marginBottom: 16 }}>{step}</div>
              <div style={{ fontSize: 11, color: 'rgba(242,234,216,0.25)', lineHeight: 2 }}>
                Estimating noise floor → Spectral subtraction<br />
                AC hum removal → EQ & voice enhancement<br />
                Noise gate → Compression → Normalise
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {state === 'preview' && (
            <>
              <div style={{ background: '#152018', borderRadius: 14, padding: '18px', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, color: '#F2EAD8' }}>Listen & Review</div>
                  <div style={{ fontSize: 10, color: '#C8A45A', opacity: 0.7, background: 'rgba(200,164,90,0.1)', padding: '3px 10px', borderRadius: 10 }}>✦ Noise removed</div>
                </div>
                <audio src={previewUrl} controls style={{ width: '100%', height: 40, marginBottom: 12 }} />
                <div onClick={() => setApproved(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '12px 16px', borderRadius: 10, border: `1px solid ${approved ? '#C8A45A' : 'rgba(200,164,90,0.2)'}`, background: approved ? 'rgba(200,164,90,0.08)' : 'transparent', transition: 'all 0.2s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${approved ? '#C8A45A' : 'rgba(200,164,90,0.3)'}`, background: approved ? '#C8A45A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                    {approved && <span style={{ color: '#08100A', fontSize: 14, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: approved ? '#C8A45A' : 'rgba(242,234,216,0.5)' }}>I have listened and the audio sounds good</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>SURAH NAME (English) *</label>
                <input style={S.input} value={info.name} onChange={e => setInfo(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Al-Fatiha" />
                <label style={S.label}>SURAH NAME (Arabic)</label>
                <input style={{ ...S.input, textAlign: 'right', fontFamily: 'Amiri,serif', fontSize: 18, direction: 'rtl' }} value={info.ar} onChange={e => setInfo(s => ({ ...s, ar: e.target.value }))} placeholder="الفاتحة" />
                <label style={S.label}>AYAH RANGE</label>
                <input style={S.input} value={info.range} onChange={e => setInfo(s => ({ ...s, range: e.target.value }))} placeholder="e.g. 1–7 or Complete" />
                <label style={S.label}>DESCRIPTION</label>
                <textarea style={{ ...S.input, resize: 'none', height: 64 }} value={info.desc} onChange={e => setInfo(s => ({ ...s, desc: e.target.value }))} placeholder="Brief description of this recitation..." />
              </div>

              {err && <div style={{ color: '#E05252', fontSize: 13, marginBottom: 12, padding: '10px 14px', background: 'rgba(224,82,82,0.08)', borderRadius: 8 }}>{err}</div>}

              <button onClick={handleUpload} style={S.btn(approved && info.name.trim().length > 0)}>↑ Publish Episode {nextDay}</button>
              <button onClick={reset} style={{ ...S.btn(true, 'rgba(242,234,216,0.3)'), background: 'transparent', border: '0.5px solid rgba(242,234,216,0.1)' }}>✕ Record Again</button>
            </>
          )}

          {/* UPLOADING */}
          {state === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#F2EAD8', marginBottom: 16 }}>Uploading...</div>
              <div style={{ fontSize: 13, color: '#C8A45A' }}>{step}</div>
            </div>
          )}

          {/* DONE */}
          {state === 'done' && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✦</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, color: '#C8A45A', marginBottom: 8 }}>Episode {nextDay} is Live</div>
              <div style={{ fontSize: 14, color: 'rgba(242,234,216,0.5)', lineHeight: 1.8 }}>Processed, cleaned and live for every listener.<br />JazakAllahu Khayran.</div>
              <button onClick={() => { reset(); onClose(); }} style={{ ...S.btn(true), marginTop: 28 }}>Done</button>
            </div>
          )}

          {/* ERROR */}
          {state === 'error' && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ color: '#E05252', fontSize: 14, marginBottom: 16, lineHeight: 1.7, padding: '14px', background: 'rgba(224,82,82,0.08)', borderRadius: 10 }}>{err}</div>
              <button onClick={reset} style={S.btn(true, '#E05252')}>Try Again</button>
            </div>
          )}
        </>}
      </div>
    </div>
  );
}