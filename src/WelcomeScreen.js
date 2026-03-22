import { useState } from 'react';

const QUOTES = [
  "We are not asking your hours — just 10 minutes daily to save your emaan and keep your generations connected to God.",
  "The Quran is not just a book. It is a conversation between you and your Creator.",
  "Every letter you read, ten rewards. Every page, a light in your grave.",
  "In the remembrance of Allah do hearts find rest. — Quran 13:28",
];

export function WelcomeScreen({ onDone }) {
  const [step, setStep] = useState('intro'); // intro | name | support
  const [name, setName] = useState('');
  const quote = QUOTES[0];

  const S = {
    wrap: {
      minHeight: '100vh', background: '#080C08',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '32px 24px',
      fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden',
    },
    glow: {
      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', height: '55vh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)',
      pointerEvents: 'none',
    },
    card: {
      maxWidth: 420, width: '100%', position: 'relative',
      animation: 'fadeUp 0.7s ease both',
    },
    bismillah: {
      fontFamily: 'Amiri, serif', fontSize: 34, color: '#C9A84C',
      textAlign: 'center', lineHeight: 1.8, marginBottom: 8, letterSpacing: 2,
    },
    bismillahTr: {
      fontSize: 11, color: 'rgba(240,232,216,0.3)', textAlign: 'center',
      letterSpacing: 2, marginBottom: 48,
    },
    appName: {
      fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300,
      color: '#F0E8D8', textAlign: 'center', letterSpacing: 4, marginBottom: 4,
    },
    tagline: {
      fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontStyle: 'italic',
      color: 'rgba(240,232,216,0.45)', textAlign: 'center', marginBottom: 40, letterSpacing: 0.5,
    },
    quoteBox: {
      border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 14,
      padding: '18px 20px', marginBottom: 36,
      background: 'rgba(201,168,76,0.04)',
    },
    quoteText: {
      fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: 'italic',
      color: 'rgba(240,232,216,0.75)', lineHeight: 1.8, textAlign: 'center',
    },
    label: { fontSize: 11, color: 'rgba(240,232,216,0.35)', letterSpacing: 1.5, marginBottom: 8, display: 'block' },
    input: {
      width: '100%', background: '#161D16', border: '0.5px solid rgba(201,168,76,0.25)',
      borderRadius: 12, padding: '16px 20px', color: '#F0E8D8', fontSize: 16,
      outline: 'none', textAlign: 'center', letterSpacing: 0.5, marginBottom: 14,
      fontFamily: "'DM Sans', sans-serif",
    },
    btnGold: {
      width: '100%', background: '#C9A84C', border: 'none', borderRadius: 12,
      padding: '16px', color: '#080C08', fontFamily: "'Cormorant Garamond', serif",
      fontSize: 19, fontWeight: 600, cursor: 'pointer', letterSpacing: 1, marginBottom: 10,
    },
    btnGhost: {
      width: '100%', background: 'none', border: '0.5px solid rgba(201,168,76,0.2)',
      borderRadius: 12, padding: '14px', color: 'rgba(240,232,216,0.5)',
      fontFamily: "'Cormorant Garamond', serif", fontSize: 16, cursor: 'pointer', letterSpacing: 0.5,
    },
    divider: {
      display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0',
    },
    divLine: { flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.15)' },
    divDot: { width: 4, height: 4, borderRadius: '50%', background: 'rgba(201,168,76,0.3)' },
  };

  // Step 1: Intro
  if (step === 'intro') return (
    <div style={S.wrap}>
      <div style={S.glow} />
      <div style={S.card}>
        <div style={S.bismillah}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</div>
        <div style={S.bismillahTr}>In the name of God — the Most Gracious, the Most Merciful</div>
        <div style={S.appName}>NurQuran</div>
        <div style={S.tagline}>One voice. 365 days. Every human on earth.</div>
        <div style={S.quoteBox}>
          <div style={S.quoteText}>"{quote}"</div>
        </div>
        <button style={S.btnGold} onClick={() => setStep('name')}>
          Begin My Journey
        </button>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(240,232,216,0.25)', marginTop: 12, lineHeight: 1.8 }}>
          Free for every human on earth · No account required
        </div>
      </div>
    </div>
  );

  // Step 2: Name
  if (step === 'name') return (
    <div style={S.wrap}>
      <div style={S.glow} />
      <div style={S.card}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: '#F0E8D8', marginBottom: 8, textAlign: 'center' }}>
          What shall we call you?
        </div>
        <div style={{ fontSize: 13, color: 'rgba(240,232,216,0.4)', textAlign: 'center', marginBottom: 36, lineHeight: 1.7 }}>
          Your name appears on the leaderboard and tracks your progress. No email needed.
        </div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep('support'); }}
          placeholder="Your name"
          autoFocus
          style={S.input}
        />
        <button
          onClick={() => { if (name.trim()) setStep('support'); }}
          style={S.btnGold}
        >
          Continue →
        </button>
      </div>
    </div>
  );

  // Step 3: Support screen
  if (step === 'support') return (
    <div style={S.wrap}>
      <div style={S.glow} />
      <div style={S.card}>
        {/* Geometric ornament */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 28, color: 'rgba(201,168,76,0.4)', letterSpacing: 4 }}>
            ✦ ✦ ✦
          </div>
        </div>

        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: '#F0E8D8', textAlign: 'center', marginBottom: 6, lineHeight: 1.3 }}>
          Welcome, {name}
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: 'rgba(240,232,216,0.4)', textAlign: 'center', fontStyle: 'italic', marginBottom: 32 }}>
          Before you begin, a moment of honesty
        </div>

        {/* Message box */}
        <div style={{ background: '#0F1410', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 16, padding: '22px 20px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Amiri, serif', fontSize: 22, color: '#C9A84C', textAlign: 'center', marginBottom: 16, lineHeight: 1.8 }}>
            إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ
          </div>
          <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.3)', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 }}>
            "The patient will receive their reward without measure." — Quran 39:10
          </div>

          <div style={{ height: '0.5px', background: 'rgba(201,168,76,0.1)', marginBottom: 20 }} />

          <div style={{ fontSize: 14, color: 'rgba(240,232,216,0.7)', lineHeight: 1.9, textAlign: 'center' }}>
            This app is <strong style={{ color: '#F0E8D8' }}>completely free</strong> and will remain so,
            by the will of Allah. No ads, no tracking, no paywalls.
          </div>
        </div>

        {/* Two options */}
        <div style={{ background: 'rgba(201,168,76,0.05)', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#C9A84C', letterSpacing: 1.5, marginBottom: 10 }}>IF ALLAH HAS BLESSED YOU WITH WEALTH</div>
          <div style={{ fontSize: 13, color: 'rgba(240,232,216,0.65)', lineHeight: 1.8, marginBottom: 14 }}>
            Consider a small sadaqah to keep this running — server costs, time, and the dream of reaching every Muslim family on earth.
          </div>
          <button
            onClick={() => { window.open('https://ko-fi.com', '_blank'); onDone(name.trim()); }}
            style={{
              width: '100%', background: '#C9A84C', border: 'none', borderRadius: 10,
              padding: '13px', color: '#080C08', fontFamily: "'Cormorant Garamond', serif",
              fontSize: 16, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            Support with Sadaqah ✦
          </button>
        </div>

        <div style={S.divider}>
          <div style={S.divLine} /><div style={S.divDot} /><div style={S.divLine} />
        </div>

        <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.4)', textAlign: 'center', lineHeight: 1.8, marginBottom: 16 }}>
          If your financial condition is not easy right now —<br />
          <span style={{ color: 'rgba(240,232,216,0.65)', fontStyle: 'italic' }}>please go ahead, this is free. No questions asked.<br />
          You can support us anytime in the future when Allah eases your way.</span>
        </div>

        <button onClick={() => onDone(name.trim())} style={S.btnGhost}>
          Enter NurQuran — I'll tip later
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(240,232,216,0.2)', marginTop: 16, lineHeight: 1.8 }}>
          Your support goes directly to keeping this free for everyone.
        </div>
      </div>
    </div>
  );
}
