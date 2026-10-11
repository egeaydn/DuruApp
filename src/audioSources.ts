import type { Profile } from './model';
// Keep archived recordings on disk, but only import the active narrator's audio.
export const audioSources: Partial<Record<Profile, number | string>> = {
  'demo-standard': require('../assets/audio/demo-standard.wav'),
  'eleven-1': require('../assets/audio/eleven-1.wav'),
};
