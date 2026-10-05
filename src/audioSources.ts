import type { Profile } from './model';
import { elevenlabsSources } from './elevenlabsSources';
export const audioSources: Record<Profile, number | string> = {
  'demo-standard': require('../assets/audio/demo-standard.wav'),
  'demo-slow': require('../assets/audio/demo-slow.wav'),
  ...elevenlabsSources,
};
