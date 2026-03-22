import { useState, useRef, useEffect } from 'react';
import { SCHEDULE } from './schedule';

function getTodayEntry() {
  const today = new Date();
  const start = new Date('2026-03-22');
  const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  const dayNum = diffDays + 1;
  return SCHEDULE.find(s => s.day === dayNum) || SCHEDULE[0];
}

function getProgress() {
  const total = SCHEDULE.length;
  const today = getTodayEntry();
  return Math.round((today.day / total) * 100);
}

export function ScheduleView({ completed, openSurah, SURAHS_MAP }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const canvasRef = useRef(null);
  const todayEntry = getTodayEntry();
  const progress = getProgress();

  const entry = selectedDay ? SCHEDULE.find(s => s.day === selectedDay) : todayEntry;

  // Generate downloadable Instagram card
  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 1080x1080 for Instagram
    canvas.width = 1080;
    canvas.height = 1080;

    // Background
    ctx.fillStyle = '#080C08';
    ctx.fillRect(0, 0, 1080, 1080);

    // Gold border
    ctx.strokeStyle = 'rgba(201,168,76,0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1020, 1020);
    ctx.strokeStyle = 'rgba(201,168,76,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(44, 44, 992, 992);

    // App name
    ctx.font = '700 52px serif';
    ctx.fillStyle = '#C9A84C';
    ctx.textAlign = 'center';
    ctx.fillText('NurQuran', 540, 120);

    // Tagline
    ctx.font = '300 28px serif';
    ctx.fillStyle = 'rgba(240,232,216,0.4)';
    ctx.fillText('nurquran.app', 540, 165);

    // Ornament line
    ctx.strokeStyle = 'rgba(201,168,76,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(150, 195); ctx.lineTo(930, 195); ctx.stroke();

    // Day badge
    ctx.font = '500 22px sans-serif';
    ctx.fillStyle = 'rgba(201,168,76,0.6)';
    ctx.fillText(`DAY ${entry.day} OF 329`, 540, 260);

    // Main message
    ctx.font = '300 72px serif';
    ctx.fillStyle = '#F0E8D8';
    ctx.fillText("Today's Reading", 540, 340);

    // Sessions
    let y = 420;
    entry.sessions.forEach(s => {
      ctx.font = '600 40px serif';
      ctx.fillStyle = '#C9A84C';
      ctx.fillText(s.name, 540, y);
      ctx.font = '300 30px sans-serif';
      ctx.fillStyle = 'rgba(240,232,216,0.6)';
      ctx.fillText(`Ayahs ${s.from}–${s.to}  ·  ${entry.count} ayahs total`, 540, y + 48);
      y += 120;
    });

    // Motivational line
    ctx.strokeStyle = 'rgba(201,168,76,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(150, y + 20); ctx.lineTo(930, y + 20); ctx.stroke();

    ctx.font = 'italic 300 34px serif';
    ctx.fillStyle = 'rgba(240,232,216,0.5)';
    ctx.fillText('Just 10 minutes. Every day. Until Ramadan.', 540, y + 80);

    // Progress
    ctx.font = '400 26px sans-serif';
    ctx.fillStyle = 'rgba(201,168,76,0.5)';
    ctx.fillText(`${progress}% of the Quran completed`, 540, y + 140);

    // Progress bar
    const barY = y + 165;
    ctx.fillStyle = '#1C2520';
    ctx.beginPath();
    ctx.roundRect(150, barY, 780, 10, 5);
    ctx.fill();
    ctx.fillStyle = '#C9A84C';
    ctx.beginPath();
    ctx.roundRect(150, barY, 780 * (progress / 100), 10, 5);
    ctx.fill();

    // Bottom CTA
    ctx.font = '500 30px sans-serif';
    ctx.fillStyle = 'rgba(201,168,76,0.7)';
    ctx.fillText('Read along at nurquran.app', 540, 980);

    // Download
    const link = document.createElement('a');
    link.download = `nurquran-day${entry.day}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const S = {
    wrap: { paddingBottom: 100 },
    hero: {
      padding: '24px 20px',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)',
      borderBottom: '0.5px solid rgba(201,168,76,0.14)',
    },
    dayBadge: {
      display: 'inline-block',
      background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.25)',
      borderRadius: 20, padding: '4px 14px',
      fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: '#C9A84C',
      letterSpacing: 1.5, marginBottom: 14,
    },
    title: { fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 300, lineHeight: 1.2, marginBottom: 6 },
    sessionCard: {
      background: '#161D16', border: '0.5px solid rgba(201,168,76,0.15)',
      borderRadius: 14, padding: '16px 18px', marginBottom: 10, cursor: 'pointer',
    },
  };

  return (
    <div style={S.wrap}>
      {/* Hidden canvas for card generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Hero */}
      <div style={S.hero}>
        <div style={S.dayBadge}>DAY {entry.day} · {entry.date}</div>
        <div style={S.title}>
          Today's<br /><em style={{ color: '#C9A84C' }}>Reading Plan</em>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(240,232,216,0.4)', marginBottom: 20 }}>
          {entry.count} ayahs · ~10 minutes · {entry.sessions.map(s => s.name).join(', ')}
        </div>

        {/* Sessions */}
        {entry.sessions.map((s, i) => (
          <div key={i} style={S.sessionCard}
            onClick={() => { const surah = SURAHS_MAP[s.s]; if (surah) openSurah(surah); }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#F0E8D8' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.4)', marginTop: 2 }}>
                  Ayahs {s.from}–{s.to} · {s.to - s.from + 1} ayahs
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'Amiri,serif', fontSize: 22, color: '#C9A84C' }}>
                  {/* We'd need arabic from SURAHS_MAP */}
                </div>
                <div style={{ fontSize: 12, color: '#C9A84C', opacity: 0.7 }}>Read →</div>
              </div>
            </div>
          </div>
        ))}

        {/* Progress to Ramadan */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(240,232,216,0.3)', marginBottom: 8 }}>
            <span>Day {entry.day} of {SCHEDULE.length}</span>
            <span style={{ color: '#C9A84C' }}>{progress}% to Ramadan 2027</span>
          </div>
          <div style={{ height: 3, background: '#1C2520', borderRadius: 3 }}>
            <div style={{ height: 3, width: progress + '%', background: 'linear-gradient(90deg,#A07828,#C9A84C)', borderRadius: 3, transition: 'width 1s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(240,232,216,0.2)', marginTop: 6 }}>
            <span>Mar 22, 2026</span>
            <span>☽ Ramadan Feb 17, 2027</span>
          </div>
        </div>
      </div>

      {/* Download card */}
      <div style={{ margin: '16px', background: '#161D16', border: '0.5px solid rgba(201,168,76,0.2)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, color: '#F0E8D8', marginBottom: 6 }}>
          Instagram / Reels Card
        </div>
        <div style={{ fontSize: 13, color: 'rgba(240,232,216,0.4)', lineHeight: 1.7, marginBottom: 16 }}>
          Download today's reading as a 1080×1080 branded image. Post as a Story or Reel to grow your audience.
        </div>
        <button onClick={generateCard} style={{
          width: '100%', background: 'linear-gradient(135deg,#A07828,#C9A84C)',
          border: 'none', borderRadius: 10, padding: '13px',
          color: '#080C08', fontFamily: "'Cormorant Garamond',serif",
          fontSize: 16, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5,
        }}>
          ↓ Download Today's Card
        </button>
        <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.25)', textAlign: 'center', marginTop: 8 }}>
          Auto-branded with NurQuran logo + today's reading + progress
        </div>
      </div>

      {/* Full calendar */}
      <div style={{ padding: '16px 16px 4px', fontFamily: "'Cormorant Garamond',serif", fontSize: 11, color: '#C9A84C', letterSpacing: 2, opacity: 0.7 }}>
        FULL READING SCHEDULE
      </div>
      {SCHEDULE.map((s, i) => {
        const isPast = s.day < entry.day;
        const isToday = s.day === entry.day;
        return (
          <div key={s.day}
            onClick={() => setSelectedDay(isToday ? null : s.day)}
            style={{
              display: 'flex', alignItems: 'center', padding: '10px 16px',
              borderBottom: '0.5px solid rgba(255,255,255,0.03)',
              cursor: 'pointer', opacity: isPast ? 0.45 : 1,
              background: isToday ? 'rgba(201,168,76,0.05)' : 'transparent',
              borderLeft: isToday ? '2px solid #C9A84C' : '2px solid transparent',
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0, marginRight: 14,
              background: isPast ? '#161D16' : isToday ? 'rgba(201,168,76,0.15)' : '#161D16',
              border: '0.5px solid ' + (isToday ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.1)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Cormorant Garamond',serif", fontSize: 13,
              color: isToday ? '#C9A84C' : isPast ? '#3DB87B' : 'rgba(240,232,216,0.3)',
            }}>
              {isPast ? '✓' : s.day}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: '#F0E8D8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.sessions.map(x => x.name).join(', ')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.35)', marginTop: 1 }}>
                {s.date} · {s.count} ayahs
              </div>
            </div>
            {isToday && (
              <div style={{ fontSize: 11, color: '#C9A84C', background: 'rgba(201,168,76,0.1)', borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>
                Today
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
