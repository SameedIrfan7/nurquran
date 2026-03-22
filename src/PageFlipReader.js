import { useState, useEffect, useRef } from 'react';

/*
 * Page flip reader:
 * - Groups ayahs into "pages" of ~8 ayahs each
 * - CSS 3D rotateY flip when turning page
 * - Arabic on the page, translation slides up on tap
 * - Smooth, satisfying book feel
 */

const PAGE_SIZE = 8; // ayahs per page

function groupIntoPages(ayahs) {
  const pages = [];
  for (let i = 0; i < ayahs.length; i += PAGE_SIZE) {
    pages.push(ayahs.slice(i, i + PAGE_SIZE));
  }
  return pages;
}

export function PageFlipReader({ surah, content, loading, completed, markRead, onAllRead }) {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [flipping, setFlipping] = useState(false);
  const [flipDir, setFlipDir] = useState('forward'); // forward | backward
  const [showTranslation, setShowTranslation] = useState(null); // ayah number
  const [pendingPage, setPendingPage] = useState(null);
  const flipRef = useRef(null);

  useEffect(() => {
    if (content) {
      setPages(groupIntoPages(content));
      setCurrentPage(0);
    }
  }, [content]);

  const goToPage = (dir) => {
    if (flipping) return;
    const next = dir === 'forward' ? currentPage + 1 : currentPage - 1;
    if (next < 0 || next >= pages.length) return;
    setFlipDir(dir);
    setPendingPage(next);
    setFlipping(true);
    setShowTranslation(null);

    // Auto-mark all ayahs on current page as read
    if (dir === 'forward' && pages[currentPage]) {
      pages[currentPage].forEach(a => markRead(surah.n, a.n, content.length));
    }

    setTimeout(() => {
      setCurrentPage(next);
      setFlipping(false);
      setPendingPage(null);
    }, 450);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 16 }}>
      <div style={{ fontFamily: 'Amiri,serif', fontSize: 32, color: '#C9A84C', opacity: 0.4, animation: 'pulse 1.5s infinite' }}>
        جَارٍ التَّحْمِيل
      </div>
      <div style={{ fontSize: 13, color: 'rgba(240,232,216,0.4)', letterSpacing: 1 }}>Loading {surah?.name}...</div>
    </div>
  );

  if (!content || pages.length === 0) return null;

  const page = pages[currentPage];
  const totalPages = pages.length;
  const progress = Math.round(((currentPage + 1) / totalPages) * 100);
  const readOnPage = page.filter(a => completed[surah.n + ':' + a.n]).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#080C08', position: 'relative', overflow: 'hidden' }}>

      {/* Surah header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '0.5px solid rgba(201,168,76,0.14)', background: '#0F1410', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'Amiri,serif', fontSize: 22, color: '#C9A84C' }}>{surah.ar}</div>
            <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.35)', marginTop: 2, letterSpacing: 0.5 }}>
              {surah.name} · {surah.type}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: '#C9A84C' }}>
              Page {currentPage + 1} of {totalPages}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.35)', marginTop: 2 }}>
              {readOnPage}/{page.length} read
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 2, background: '#1C2520', borderRadius: 2, marginTop: 12 }}>
          <div style={{ height: 2, width: progress + '%', background: 'linear-gradient(90deg,#A07828,#C9A84C)', borderRadius: 2, transition: 'width 0.5s' }} />
        </div>
      </div>

      {/* Basmala (first page, non-Tawba) */}
      {currentPage === 0 && surah.n !== 9 && (
        <div style={{ textAlign: 'center', padding: '16px 20px 0', fontFamily: 'Amiri,serif', fontSize: 22, color: 'rgba(240,232,216,0.45)', lineHeight: 1.8, flexShrink: 0 }}>
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </div>
      )}

      {/* PAGE CONTAINER — 3D flip */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1200px', padding: '12px 0', overflow: 'hidden' }}>
        <div
          ref={flipRef}
          style={{
            width: '92%', maxWidth: 500,
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: flipping
              ? (flipDir === 'forward' ? 'rotateY(-15deg)' : 'rotateY(15deg)')
              : 'rotateY(0deg)',
            transition: flipping ? 'transform 0.45s cubic-bezier(0.4,0,0.2,1)' : 'transform 0.2s ease',
          }}
        >
          {/* Page surface */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(160deg, #111810 0%, #0E1410 60%, #0C1209 100%)',
            borderRadius: 16,
            border: '0.5px solid rgba(201,168,76,0.15)',
            boxShadow: flipping
              ? (flipDir === 'forward' ? '-20px 10px 60px rgba(0,0,0,0.8)' : '20px 10px 60px rgba(0,0,0,0.8)')
              : '0 8px 40px rgba(0,0,0,0.6)',
            transition: 'box-shadow 0.45s ease',
            overflow: 'hidden',
          }}>
            {/* Corner ornament */}
            <div style={{ position: 'absolute', top: 12, left: 16, fontFamily: 'Amiri,serif', fontSize: 12, color: 'rgba(201,168,76,0.2)', letterSpacing: 2 }}>
              ✦
            </div>
            <div style={{ position: 'absolute', top: 12, right: 16, fontFamily: 'Amiri,serif', fontSize: 12, color: 'rgba(201,168,76,0.2)', letterSpacing: 2 }}>
              ✦
            </div>

            {/* Page content */}
            <div style={{ padding: '36px 20px 20px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {page.map((ayah, idx) => {
                const isRead = !!completed[surah.n + ':' + ayah.n];
                const isShowingTr = showTranslation === ayah.n;
                return (
                  <div
                    key={ayah.n}
                    onClick={() => setShowTranslation(isShowingTr ? null : ayah.n)}
                    style={{
                      padding: '10px 8px',
                      borderBottom: idx < page.length - 1 ? '0.5px solid rgba(201,168,76,0.06)' : 'none',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {/* Ayah number inline */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', gap: 10, direction: 'rtl' }}>
                      <div style={{
                        fontFamily: 'Amiri,serif', fontSize: 23, lineHeight: 2.2,
                        color: isRead ? 'rgba(240,232,216,0.5)' : '#F0E8D8',
                        textAlign: 'right', flex: 1,
                        transition: 'color 0.3s',
                      }}>
                        {ayah.ar}
                      </div>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, marginTop: 12,
                        background: isRead ? 'rgba(201,168,76,0.15)' : 'transparent',
                        border: '0.5px solid ' + (isRead ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.15)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Cormorant Garamond',serif", fontSize: 11,
                        color: isRead ? '#C9A84C' : 'rgba(240,232,216,0.3)',
                        transition: 'all 0.3s',
                      }}>
                        {isRead ? '✓' : ayah.n}
                      </div>
                    </div>

                    {/* Translation slide-down */}
                    {isShowingTr && (
                      <div style={{
                        marginTop: 8,
                        padding: '10px 12px',
                        background: 'rgba(201,168,76,0.05)',
                        borderRadius: 8,
                        border: '0.5px solid rgba(201,168,76,0.12)',
                        animation: 'fadeUp 0.2s ease both',
                      }}>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: 'rgba(240,232,216,0.7)', lineHeight: 1.7, fontStyle: 'italic' }}>
                          {ayah.en}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); markRead(surah.n, ayah.n, content.length); }}
                          style={{
                            marginTop: 8, background: isRead ? 'transparent' : 'rgba(201,168,76,0.12)',
                            border: '0.5px solid rgba(201,168,76,0.25)', borderRadius: 20,
                            padding: '4px 14px', fontSize: 11, color: '#C9A84C', cursor: 'pointer',
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        >
                          {isRead ? '✓ Read' : '+ Mark as read'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Page fold shadow on right */}
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 24, height: '100%',
              background: 'linear-gradient(to left, rgba(0,0,0,0.25) 0%, transparent 100%)',
              borderRadius: '0 16px 16px 0', pointerEvents: 'none',
            }} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid rgba(201,168,76,0.1)', flexShrink: 0, background: '#080C08' }}>
        <button
          onClick={() => goToPage('backward')}
          disabled={currentPage === 0 || flipping}
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: currentPage === 0 ? 'transparent' : '#161D16',
            border: '0.5px solid ' + (currentPage === 0 ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.2)'),
            color: currentPage === 0 ? 'rgba(240,232,216,0.15)' : '#C9A84C',
            fontSize: 20, cursor: currentPage === 0 ? 'default' : 'pointer',
          }}
        >
          ‹
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: 'rgba(240,232,216,0.4)' }}>
            {page[0]?.n}–{page[page.length - 1]?.n} of {surah.ayahs} ayahs
          </div>
          <div style={{ fontSize: 11, color: 'rgba(201,168,76,0.5)', marginTop: 2 }}>
            Tap any ayah for translation
          </div>
        </div>

        <button
          onClick={() => goToPage('forward')}
          disabled={currentPage === totalPages - 1 || flipping}
          style={{
            width: 48, height: 48, borderRadius: 12,
            background: currentPage === totalPages - 1 ? 'transparent' : '#C9A84C',
            border: 'none',
            color: currentPage === totalPages - 1 ? 'rgba(240,232,216,0.15)' : '#080C08',
            fontSize: 20, cursor: currentPage === totalPages - 1 ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          ›
        </button>
      </div>

      {/* Swipe hint overlay — only first visit */}
      <style>{`
        @keyframes swipeHint {
          0% { transform: translateX(0); opacity: 0.6; }
          50% { transform: translateX(16px); opacity: 1; }
          100% { transform: translateX(0); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
