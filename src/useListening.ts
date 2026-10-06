import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { audioSources } from './audioSources';
import { manifest, paragraphAt, positionOf, profiles, rates, story, switchPosition, type Profile, type Saved } from './model';

export const STORAGE_KEY = 'duru.listening.v1';
export function useListening(saved: Saved) {
  const [profile, setProfile] = useState<Profile>(saved.profile);
  const [rate, setRate] = useState(saved.rate);
  const [started, setStarted] = useState(saved.started);
  const [favorite, setFavorite] = useState(saved.favorite);
  const [completed, setCompleted] = useState(saved.completed);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sleepUntil, setSleepUntil] = useState<number | null>(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [retry, setRetry] = useState(0);
  const [readyId, setReadyId] = useState<string | null>(null);
  const source = audioSources[profile];
  const player = useAudioPlayer({ ...(typeof source === 'string' ? { uri: source } : { assetId: source }), name: `${profile}-${retry}` }, { updateInterval: 250 });
  // Native objects can be released before our effect cleanup runs. Capture the
  // ID while the object is alive; cleanup must not read a released native object.
  const playerId = player.id;
  const status = useAudioPlayerStatus(player);
  const pending = useRef(positionOf(saved.profile, saved.paragraphId, saved.offset));
  const requestedRate = useRef(saved.rate);
  const desiredPlay = useRef(false);
  const readyPlayer = useRef<unknown>(null);
  const configuringPlayer = useRef<unknown>(null);
  const activePlayer = useRef<unknown>(null);
  const snapshot = useRef(saved);
  const writeQueue = useRef(Promise.resolve());
  const duration = manifest.profiles[profile].duration;
  const isReady = readyId === String(playerId) && player.currentStatus.isLoaded;
  const seconds = isReady ? player.currentTime : pending.current;
  const paragraph = paragraphAt(profile, seconds);

  useEffect(() => {
    activePlayer.current = playerId;
    return () => { if (activePlayer.current === playerId) activePlayer.current = null; };
  }, [player]);

  function persist(value: Saved) {
    const serialized = JSON.stringify(value);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
      .then(() => setStorageError(null)).catch(() => setStorageError('İlerlemen kaydedilemedi. Cihazının depolama izinlerini kontrol et.'));
  }
  useEffect(() => {
    if (readyPlayer.current === playerId || configuringPlayer.current === playerId) return;
    let cancelled = false;
    configuringPlayer.current = playerId;
    // A cached Android asset can finish loading before the JS event listener
    // subscribes. Read native readiness as well, instead of waiting indefinitely
    // for an event. Seeking must not cancel the initialization of this player.
    const isCurrent = () => !cancelled && activePlayer.current === playerId;
    (async () => {
      try {
        const deadline = Date.now() + 15000;
        while (isCurrent() && !player.currentStatus.isLoaded) {
          if (Date.now() >= deadline) throw new Error('Audio readiness timed out');
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!isCurrent()) return;
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
        if (!isCurrent()) return;
        await player.seekTo(Math.min(pending.current, duration));
        if (!isCurrent()) return;
        player.shouldCorrectPitch = true;
        player.setPlaybackRate(requestedRate.current, 'high');
        readyPlayer.current = playerId;
        setReadyId(String(playerId));
        configuringPlayer.current = null;
        if (desiredPlay.current) {
          activate();
          player.play();
        }
        setError(null);
      } catch {
        if (isCurrent()) {
          configuringPlayer.current = null;
          desiredPlay.current = false;
          setError('Ses açılamadı. Yeniden deneyebilirsin.');
        }
      }
    })();
    return () => {
      cancelled = true;
      if (configuringPlayer.current === playerId) configuringPlayer.current = null;
    };
  }, [player]);
  useEffect(() => {
    if (status.error) { desiredPlay.current = false; setError('Ses oynatılamadı. Yeniden deneyebilirsin.'); }
  }, [status.error]);
  useEffect(() => {
    if (status.didJustFinish && readyPlayer.current === playerId) {
      desiredPlay.current = false;
      setCompleted(true);
      setSleepUntil(null);
      setNotice('Hikâye bitti. Yeni bir sayfada buluşmak üzere.');
    }
  }, [status.didJustFinish, player]);
  useEffect(() => {
    if (!isReady) return;
    const p = paragraphAt(profile, seconds);
    snapshot.current = { schema: 1, bookId: story.id, textVersion: story.textVersion, profile, paragraphId: p.id, offset: Math.max(0, seconds - p.start), rate, completed, started, favorite };
    persist(snapshot.current);
  }, [profile, Math.floor(seconds), status.playing, rate, started, favorite, completed, isReady]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', () => persist(snapshot.current));
    const flush = () => persist(snapshot.current);
    if (Platform.OS === 'web') window.addEventListener('pagehide', flush);
    return () => { subscription.remove(); if (Platform.OS === 'web') window.removeEventListener('pagehide', flush); };
  }, []);
  useEffect(() => {
    if (!sleepUntil) { setSleepRemaining(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((sleepUntil - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (!remaining) { player.pause(); desiredPlay.current = false; setSleepUntil(null); setNotice('Uyku zamanlayıcısı sesi durdurdu. İyi dinlenmeler.'); }
    };
    tick();
    const interval = setInterval(tick, 500);
    const subscription = AppState.addEventListener('change', tick);
    return () => { clearInterval(interval); subscription.remove(); };
  }, [sleepUntil, player]);
  function activate() {
    const narrator = profiles.find(p => p.id === profile)!;
    if (Platform.OS !== 'web') player.setActiveForLockScreen(true, { title: story.title, artist: `${narrator.badge} · ${narrator.label}`, albumTitle: 'Duru · Özgün hikâyeler' }, { showSeekBackward: true, showSeekForward: true });
  }
  function toggle() {
    try {
      if (status.playing || desiredPlay.current && !isReady) { desiredPlay.current = false; player.pause(); return; }
      setStarted(true);
      desiredPlay.current = true;
      if (completed || seconds >= duration - 0.1) {
        setCompleted(false); pending.current = 0;
        if (isReady) void player.seekTo(0).then(() => { activate(); player.play(); }).catch(() => setError('Başa dönülemedi. Yeniden dene.'));
      }
      else if (isReady) { activate(); player.play(); }
    } catch { desiredPlay.current = false; setError('Oynatma başlatılamadı. Yeniden dene.'); }
  }
  async function seek(target: number) {
    const clamped = Math.max(0, Math.min(target, duration));
    try { pending.current = clamped; await player.seekTo(clamped); setCompleted(clamped >= duration); }
    catch { setError('Bu konuma gidilemedi. Yeniden dene.'); }
  }
  function changeProfile(next: Profile) {
    if (next === profile || !profiles.some(p => p.id === next)) return;
    pending.current = switchPosition(profile, next, isReady ? player.currentTime : pending.current);
    // A second choice during loading must preserve the original playback intent.
    desiredPlay.current = isReady ? player.playing : desiredPlay.current;
    player.pause();
    readyPlayer.current = null;
    setReadyId(null);
    setCompleted(false);
    setProfile(next);
    snapshot.current = { ...snapshot.current, profile: next, paragraphId: paragraphAt(next, pending.current).id, offset: 0, rate, started, favorite, completed: false };
    persist(snapshot.current);
    setNotice(profiles.find(p => p.id === next)?.kind === 'ai'
      ? 'Ses değişti. Aynı paragrafın başına döndün.'
      : 'Okuma profili değişti. Aynı paragrafın başına döndün.');
  }
  function changeRate(next: number) {
    if (!rates.includes(next)) return;
    // A rate chosen during loading must supersede the rate captured when the
    // source started preparing. Apply it after restore, on the current player.
    try {
      if (isReady) { player.shouldCorrectPitch = true; player.setPlaybackRate(next, 'high'); }
      requestedRate.current = next;
      setRate(next);
    } catch { setError('Hız değiştirilemedi.'); }
  }
  function retryAudio() {
    pending.current = seconds;
    desiredPlay.current = false;
    player.pause();
    readyPlayer.current = null;
    setReadyId(null);
    setError(null);
    setRetry(value => value + 1);
  }
  return { profile, rate, started, favorite, completed, error, storageError, notice, setNotice, sleepUntil, sleepRemaining, seconds, duration, paragraph,
    playing: status.playing, loading: !isReady || status.isBuffering,
    toggle, seek, changeProfile, changeRate, retryAudio,
    selectParagraph: (id: string) => seek(positionOf(profile, id)),
    setSleep: (minutes: number) => setSleepUntil(minutes ? Date.now() + minutes * 60000 : null),
    toggleFavorite: () => setFavorite(value => !value),
  };
}
export type Listening = ReturnType<typeof useListening>;
