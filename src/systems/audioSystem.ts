import { Faction } from '../types/game';

let audioCtx: AudioContext | null = null;
let lastSpeechTime = 0;

export function initAudio(): void {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

export function playCannonShot(isHeavy = false, enabled = true): void {
  if (!enabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(isHeavy ? 110 : 140, now);
  osc.frequency.exponentialRampToValueAtTime(isHeavy ? 24 : 32, now + (isHeavy ? 0.35 : 0.25));

  gain.gain.setValueAtTime(isHeavy ? 0.7 : 0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + (isHeavy ? 0.35 : 0.25));

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + (isHeavy ? 0.35 : 0.25));

  playNoiseBurst(isHeavy ? 0.3 : 0.18, isHeavy ? 0.5 : 0.3, isHeavy ? 180 : 260);
}

export function playLaserBeam(enabled = true): void {
  if (!enabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(440, now);
  osc2.frequency.exponentialRampToValueAtTime(880, now + 0.25);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.25);
  osc2.stop(now + 0.25);
}

export function playGatlingFire(enabled = true): void {
  if (!enabled) return;
  initAudio();
  playNoiseBurst(0.05, 0.28, 1400);
}

export function playExplosion(size: 'small' | 'large' | 'nuke' = 'small', enabled = true): void {
  if (!enabled) return;
  initAudio();

  const duration = size === 'nuke' ? 2.8 : size === 'large' ? 1.2 : 0.6;
  const volume = size === 'nuke' ? 0.85 : size === 'large' ? 0.6 : 0.35;
  const cutoff = size === 'nuke' ? 160 : size === 'large' ? 210 : 320;

  playNoiseBurst(duration, volume, cutoff);
}

export function playSiren(enabled = true): void {
  if (!enabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  // 3 cycles between 300Hz and 700Hz
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.linearRampToValueAtTime(700, now + 0.4);
  osc.frequency.linearRampToValueAtTime(300, now + 0.8);
  osc.frequency.linearRampToValueAtTime(700, now + 1.2);
  osc.frequency.linearRampToValueAtTime(300, now + 1.6);
  osc.frequency.linearRampToValueAtTime(700, now + 2.0);
  osc.frequency.linearRampToValueAtTime(300, now + 2.4);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 2.5);
}

export function playCashSound(enabled = true): void {
  if (!enabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1046, now);
  osc.frequency.setValueAtTime(1318, now + 0.08);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function playBuildSound(enabled = true): void {
  if (!enabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);

  gain.gain.setValueAtTime(0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.22);
}

function playNoiseBurst(duration: number, volume: number, cutoff: number): void {
  if (!audioCtx) return;
  const bufferSize = Math.floor(audioCtx.sampleRate * duration);
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, audioCtx.currentTime);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

// Web Speech API Voice synthesis with 2.5s throttling
export function speakVoice(type: 'select' | 'move' | 'attack' | 'buildComplete', faction: Faction, enabled = true): void {
  if (!enabled) return;
  if (!('speechSynthesis' in window)) return;

  const now = Date.now();
  if (now - lastSpeechTime < 2500) return; // 2.5s cooldown
  lastSpeechTime = now;

  let phrase = '';
  if (faction === 'USA') {
    if (type === 'select') phrase = 'Ready for action!';
    else if (type === 'move') phrase = 'Moving to coordinates.';
    else if (type === 'attack') phrase = 'Target confirmed!';
    else phrase = 'Construction complete!';
  } else if (faction === 'China') {
    if (type === 'select') phrase = 'China will grow larger!';
    else if (type === 'move') phrase = 'We stand together.';
    else if (type === 'attack') phrase = 'Overlord moving!';
    else phrase = 'Building is ready!';
  } else {
    // GLA
    if (type === 'select') phrase = 'I will work.';
    else if (type === 'move') phrase = 'No problem.';
    else if (type === 'attack') phrase = 'For the cause!';
    else phrase = 'Scaffold finished!';
  }

  try {
    const utter = new SpeechSynthesisUtterance(phrase);
    utter.volume = 0.7;
    utter.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    // Graceful fallback if speech synthesis is disabled by browser permissions
  }
}
