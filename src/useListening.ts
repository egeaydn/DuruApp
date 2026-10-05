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
  const status = useAudioPlayerStatus(player);
  const pending = useRef(positionOf(saved.profile, saved.paragraphId, saved.offset));
  const desiredPlay = useRef(false);
  const readyPlayer = useRef<unknown>(null);
  const configuringPlayer = useRef<unknown>(null);
  const snapshot = useRef(saved);
  const writeQueue = useRef(Promise.resolve());
  const duration = manifest.profiles[profile].duration;
  const isReady = status.isLoaded && readyId === String(player.id);
  const seconds = isReady ? status.currentTime : pending.current;
  const paragraph = paragraphAt(profile, seconds);

  function persist(value: Saved) {
    const serialized = JSON.stringify(value);
    writeQueue.current = writeQueue.current.then(() => AsyncStorage.setItem(STORAGE_KEY, serialized))
      .then(() => setStorageError(null)).catch(() => setStorageError('İlerlemen kaydedilemedi. Cihazının depolama izinlerini kontrol et.'));
  }
  useEffect(() => {
    let cancelled = false;
    if (!status.isLoaded || String(status.id) !== String(player.id) || !player.isLoaded || readyPlayer.current === player.id || configuringPlayer.current === player.id) return;
    configuringPlayer.current = player.id;
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' });
        if (cancelled) return;
        await player.seekTo(Math.min(pending.current, duration));
        if (cancelled) return;
        player.setPlaybackRate(rate);
        readyPlayer.current = player.id;
        setReadyId(String(player.id));
        configuringPlayer.current = null;
        if (desiredPlay.current) {
          activate();
          player.play();
        }
        setError(null);
      } catch { if (!cancelled) setError('Ses açılamadı. Yeniden deneyebilirsin.'); }
    })();
    return () => { cancelled = true; configuringPlayer.current = null; };
  }, [player, status.isLoaded, status.id, status.duration]);
  useEffect(() => {
    if (status.error) { desiredPlay.current = false; setError('Ses oynatılamadı. Yeniden deneyebilirsin.'); }
  }, [status.error]);
  useEffect(() => {
    if (status.didJustFinish && readyPlayer.current === player.id) {
      desiredPlay.current = false;
      setCompleted(true);
      setSleepUntil(null);
      setNotice('Hikâye bitti. Yeni bir sayfada buluşmak üzere.');
    }
  }, [status.didJustFinish, player]);
  useEffect(() => {
    const timeout = setTimeout(() => { if (!player.isLoaded) setError('Sesin yüklenmesi beklenenden uzun sürdü. Yeniden dene.'); }, 15000);
    return () => clearTimeout(timeout);
  }, [player]);
  useEffect(() => {
    if (readyPlayer.current !== player.id) return;
    const p = paragraphAt(profile, status.currentTime);
    snapshot.current = { schema: 1, bookId: story.id, textVersion: story.textVersion, profile, paragraphId: p.id, offset: Math.max(0, status.currentTime - p.start), rate, completed, started, favorite };
    persist(snapshot.current);
  }, [profile, Math.floor(status.currentTime), status.playing, rate, started, favorite, completed, status.isLoaded, readyId]);
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
    if (next === profile) return;
    pending.current = switchPosition(profile, next, player.isLoaded ? player.currentTime : pending.current);
    desiredPlay.current = player.playing;
    player.pause();
    readyPlayer.current = null;
    setReadyId(null);
    setCompleted(false);
    setProfile(next);
    setNotice('Okuma profili değişti. Aynı paragrafın başına döndün.');
  }
  function changeRate(next: number) {
    if (!rates.includes(next)) return;
    try { player.setPlaybackRate(next); setRate(next); } catch { setError('Hız değiştirilemedi.'); }
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
