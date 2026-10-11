import story from '../content/story.json';
import demoManifest from '../assets/audio/manifest.json';
import elevenlabsManifest from '../assets/audio/elevenlabs-manifest.json';
export type Profile = 'demo-standard' | 'demo-slow' | `eleven-${number}`;
type Track = typeof demoManifest.profiles['demo-standard'];
type Narrator = { id: Profile; label: string; description: string; kind: 'demo' | 'ai'; badge: string; stage?: 'preview' | 'reviewed' };
const development = typeof __DEV__ !== 'undefined' && __DEV__;
const activeNarrators = elevenlabsManifest.bookId === story.id && elevenlabsManifest.textVersion === story.textVersion
  ? (elevenlabsManifest.narrators as Narrator[]).filter(n => n.id === 'eleven-1' && (n.stage !== 'preview' || development)) : [];
const activeTracks = Object.fromEntries(activeNarrators.map(n => [n.id, (elevenlabsManifest.profiles as Record<string, Track>)[n.id]]));
export const manifest = { ...demoManifest, profiles: { ...demoManifest.profiles, ...activeTracks } as Record<Profile, Track> };
export { story };
// One narrator during audio-quality work. Unreviewed AI stays development-only.
export const profiles: Narrator[] = activeNarrators.length ? activeNarrators : [
  { id: 'demo-standard', label: 'Dengeli okuma', description: 'Türkçe sistem sesi · Demo kaydı', kind: 'demo', badge: 'Demo' },
];
export const defaultProfile = profiles[0].id;
export const hasAiNarrators = activeNarrators.length > 0;
export const narratorReviewNotice = activeNarrators.some(n => n.stage === 'preview')
  ? 'Bu AI deneme kaydının tam dinleme kalitesi ve ticari hakları henüz doğrulanmadı. Yalnızca yerel geliştirme denemesi içindir.'
  : hasAiNarrators ? 'AI anlatıcının dinleme ve hak kayıtları incelendi.' : 'Sistem sesi demo kaydıdır; ticari yayın hakları doğrulanmadı.';
export const profileExplanation = hasAiNarrators
  ? 'Hikâyenin tamamını Anlatıcı 1 okur. Bu sürümde tek ses kullanılır.'
  : 'Hikâyenin tamamı tek sistem sesiyle oynatılır. Bu bir demo kaydıdır.';
export const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
export type Saved = { schema: 1; bookId: string; textVersion: string; profile: Profile; paragraphId: string; offset: number; rate: number; completed: boolean; started: boolean; favorite: boolean };
export const initialSaved: Saved = { schema: 1, bookId: story.id, textVersion: story.textVersion, profile: defaultProfile, paragraphId: 'p01', offset: 0, rate: 1, completed: false, started: false, favorite: false };
export function decodeSaved(raw: string | null): Saved {
  if (!raw) return initialSaved;
  try {
    const s = JSON.parse(raw);
    if (s.schema !== 1 || s.bookId !== story.id || s.textVersion !== story.textVersion) return initialSaved;
    const profile = defaultProfile;
    const paragraph = manifest.profiles[profile].paragraphs.find(p => p.id === s.paragraphId);
    if (!paragraph) return initialSaved;
    // Old voices have different clocks. Retain the paragraph, restart its beginning.
    const offset = s.profile === profile && Number.isFinite(s.offset) ? Math.max(0, Math.min(s.offset, paragraph.duration)) : 0;
    return { ...initialSaved, profile, paragraphId: paragraph.id, offset, rate: rates.includes(s.rate) ? s.rate : 1, completed: s.completed === true, started: s.started === true, favorite: s.favorite === true };
  } catch { return initialSaved; }
}
export function paragraphAt(profile: Profile, seconds: number) {
  const items = manifest.profiles[profile].paragraphs;
  // Android seeks use whole milliseconds; PCM boundaries can contain sub-ms fractions.
  // Match the player's precision so a seek to a paragraph never selects its predecessor.
  const milliseconds = Math.floor(seconds * 1000);
  return items.find((p, i) => milliseconds >= Math.floor(p.start * 1000) && (i === items.length - 1 || milliseconds < Math.floor(items[i + 1].start * 1000))) ?? items[0];
}
export function positionOf(profile: Profile, paragraphId: string, offset = 0) {
  const p = manifest.profiles[profile].paragraphs.find(p => p.id === paragraphId) ?? manifest.profiles[profile].paragraphs[0];
  return p.start + Math.max(0, Math.min(offset, p.duration));
}
export function time(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
export function matches(query: string) {
  return `${story.title} ${story.description} ${story.author} kısa hikâye huzur deniz`.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR'));
}
