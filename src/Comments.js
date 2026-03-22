import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

// ── DB FUNCTIONS ─────────────────────────────────────────────────────────

export async function getComments(episodeId) {
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('episode_id', episodeId)
    .order('created_at', { ascending: true });
  return data || [];
}

export async function postComment(episodeId, userName, message, type) {
  const { data } = await supabase
    .from('comments')
    .insert({ episode_id: episodeId, user_name: userName, message, type })
    .select().single();
  return data;
}

export async function likeComment(commentId) {
  await supabase.rpc('like_comment', { comment_id: commentId });
}

export function subscribeComments(episodeId, onNew) {
  return supabase
    .channel('comments-' + episodeId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `episode_id=eq.${episodeId}` },
      p => onNew(p.new))
    .subscribe();
}

// ── COMMENT TYPE CONFIG ───────────────────────────────────────────────────

const TYPES = [
  { value: 'comment', label: 'Comment',    icon: '◎', color: '#C9A84C' },
  { value: 'correction', label: 'Correction', icon: '◈', color: '#E07B5A' },
  { value: 'dua', label: 'Du\'a',         icon: '◆', color: '#7BAE8E' },
];

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

// ── COMMENTS COMPONENT ────────────────────────────────────────────────────

export function CommentsSection({ episode, userName }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [type, setType] = useState('comment');
  const [posting, setPosting] = useState(false);
  const [likedIds, setLikedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nq_liked') || '[]'); } catch { return []; }
  });
  const bottomRef = useRef(null);

  // Load comments
  useEffect(() => {
    if (!episode?.id) return;
    getComments(episode.id).then(setComments);

    // Subscribe to realtime new comments
    const channel = subscribeComments(episode.id, (newComment) => {
      setComments(prev => [...prev, newComment]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => supabase.removeChannel(channel);
  }, [episode?.id]);

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    const result = await postComment(episode.id, userName, text.trim(), type);
    if (result) setText('');
    setPosting(false);
  };

  const handleLike = async (id) => {
    if (likedIds.includes(id)) return;
    await likeComment(id);
    const newLiked = [...likedIds, id];
    setLikedIds(newLiked);
    localStorage.setItem('nq_liked', JSON.stringify(newLiked));
    setComments(prev => prev.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
  };

  const correctionCount = comments.filter(c => c.type === 'correction').length;

  return (
    <div style={{ padding: '0 0 24px' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid rgba(201,168,76,0.14)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: '#F0E8D8' }}>
            Feedback
          </div>
          {correctionCount > 0 && (
            <div style={{ background: 'rgba(224,123,90,0.12)', border: '0.5px solid rgba(224,123,90,0.3)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: '#E07B5A' }}>
              {correctionCount} tajweed correction{correctionCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(240,232,216,0.4)', lineHeight: 1.6 }}>
          Open to correction. If I mispronounce, please let me know — that's why this section exists.
        </div>
      </div>

      {/* Comments list */}
      <div style={{ maxHeight: 380, overflowY: 'auto', padding: '0 0 4px' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: 'rgba(240,232,216,0.4)', marginBottom: 6 }}>
              No feedback yet
            </div>
            <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.25)' }}>
              Be the first — leave a comment, a correction, or a du'a
            </div>
          </div>
        ) : (
          comments.map((c, i) => {
            const typeInfo = TYPES.find(t => t.value === c.type) || TYPES[0];
            const isLiked = likedIds.includes(c.id);
            return (
              <div key={c.id} style={{
                padding: '14px 20px',
                borderBottom: '0.5px solid rgba(255,255,255,0.03)',
                animation: 'fadeUp 0.3s ease both',
                borderLeft: c.type === 'correction' ? '2px solid #E07B5A' : c.type === 'dua' ? '2px solid #7BAE8E' : '2px solid transparent'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: typeInfo.color + '20',
                    border: '0.5px solid ' + typeInfo.color + '50',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: typeInfo.color, fontWeight: 500
                  }}>
                    {c.user_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: '#F0E8D8' }}>
                        {c.user_name}
                      </span>
                      <span style={{
                        fontSize: 10, color: typeInfo.color,
                        background: typeInfo.color + '15',
                        border: '0.5px solid ' + typeInfo.color + '30',
                        borderRadius: 20, padding: '2px 8px', letterSpacing: 0.5
                      }}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.3)', marginTop: 1 }}>
                      {timeAgo(c.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLike(c.id)}
                    style={{
                      background: 'none', border: 'none', cursor: isLiked ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: isLiked ? '#C9A84C' : 'rgba(240,232,216,0.3)',
                      fontSize: 12, padding: '4px 8px',
                      borderRadius: 20,
                      background: isLiked ? 'rgba(201,168,76,0.08)' : 'transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    ♡ {c.likes > 0 ? c.likes : ''}
                  </button>
                </div>
                <div style={{
                  fontSize: 14, color: 'rgba(240,232,216,0.8)',
                  lineHeight: 1.7, paddingLeft: 36,
                  fontFamily: c.type === 'dua' ? "'Amiri',serif" : 'inherit',
                  fontSize: c.type === 'dua' ? 16 : 14
                }}>
                  {c.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef}/>
      </div>

      {/* Type selector */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', gap: 8 }}>
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)} style={{
            flex: 1, padding: '8px 4px', border: '0.5px solid',
            borderColor: type === t.value ? t.color : 'rgba(201,168,76,0.14)',
            borderRadius: 10, background: type === t.value ? t.color + '15' : 'transparent',
            color: type === t.value ? t.color : 'rgba(240,232,216,0.4)',
            fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: "'DM Sans',sans-serif"
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(); }}}
          placeholder={
            type === 'correction' ? 'Point out the tajweed correction kindly...' :
            type === 'dua' ? 'Share a du\'a for the reciter...' :
            'Leave a comment...'
          }
          rows={2}
          style={{
            flex: 1, background: '#161D16', border: '0.5px solid rgba(201,168,76,0.2)',
            borderRadius: 12, padding: '12px 16px', color: '#F0E8D8',
            fontSize: 14, outline: 'none', resize: 'none',
            fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5
          }}
        />
        <button
          onClick={handlePost}
          disabled={!text.trim() || posting}
          style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: text.trim() ? '#C9A84C' : 'rgba(201,168,76,0.12)',
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            color: text.trim() ? '#080C08' : 'rgba(201,168,76,0.3)',
            fontSize: 18, transition: 'all 0.2s', fontWeight: 600
          }}
        >
          {posting ? '...' : '↑'}
        </button>
      </div>
      <div style={{ padding: '6px 16px 0', fontSize: 11, color: 'rgba(240,232,216,0.25)' }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}
