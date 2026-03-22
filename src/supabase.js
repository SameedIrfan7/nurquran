import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function upsertUser(name, pts, ayahsRead) {
  await supabase.from('readers').upsert(
    { name, pts, ayahs_read: ayahsRead, updated_at: new Date().toISOString() },
    { onConflict: 'name' }
  );
}

export async function getLeaderboard() {
  const { data } = await supabase.from('readers').select('name,pts,ayahs_read,streak').order('pts',{ascending:false}).limit(50);
  return data || [];
}

export async function getEpisodes() {
  const { data } = await supabase.from('episodes').select('*').order('day',{ascending:false});
  return data || [];
}

export async function incrementListens(episodeId) {
  await supabase.rpc('increment_listens', { ep_id: episodeId });
}

export function subscribeToPresence(roomName, userName, onCountChange) {
  const channel = supabase.channel(roomName, { config: { presence: { key: userName } } });
  channel
    .on('presence', { event: 'sync' }, () => onCountChange(Object.keys(channel.presenceState()).length))
    .subscribe(async s => { if (s === 'SUBSCRIBED') await channel.track({ user: userName }); });
  return channel;
}

export function unsubscribePresence(channel) {
  if (channel) supabase.removeChannel(channel);
}
