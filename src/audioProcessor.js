/**
 * NurQuran Audio Processor v3
 * Uses Web Audio API for real-time processing
 * Works directly in browser — no external libraries needed
 */

export async function processAudio(rawBlob, onProgress) {
  onProgress?.('Reading audio...');
  const arrayBuffer = await rawBlob.arrayBuffer();

  onProgress?.('Setting up audio context...');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });

  onProgress?.('Decoding audio...');
  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch(e) {
    if(audioCtx.state !== 'closed') audioCtx.close();
    throw new Error('Could not decode audio. Try recording again.');
  }

  onProgress?.('Converting to mono...');
  const mono = toMono(audioBuffer);

  onProgress?.('Analysing noise floor...');
  const noiseProfile = estimateNoise(mono);

  onProgress?.('Applying noise reduction...');
  const denoised = applyNoiseReduction(mono, noiseProfile);

  onProgress?.('Applying EQ filters...');
  const filtered = await applyFilters(audioCtx, denoised, onProgress);

  onProgress?.('Applying noise gate...');
  const gated = applyNoiseGate(filtered, noiseProfile.rms * 3);

  onProgress?.('Normalising volume...');
  const normalised = normalise(gated, 0.88);

  if(audioCtx.state !== 'closed') audioCtx.close();
  onProgress?.('Encoding...');
  const blob = encodeWav(normalised);
  onProgress?.('Done ✓');
  return blob;
}

/* ── MONO CONVERSION ── */
function toMono(buf) {
  if(buf.numberOfChannels === 1) return buf;
  const out = new AudioBuffer({ numberOfChannels:1, length:buf.length, sampleRate:buf.sampleRate });
  const outData = out.getChannelData(0);
  for(let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for(let i = 0; i < d.length; i++) outData[i] += d[i];
  }
  for(let i = 0; i < outData.length; i++) outData[i] /= buf.numberOfChannels;
  return out;
}

/* ── NOISE FLOOR ESTIMATION ──
   Samples the quieter parts of the recording to estimate background noise */
function estimateNoise(buf) {
  const data = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const blockSize = Math.floor(0.05 * sr); // 50ms blocks
  const blocks = [];

  for(let i = 0; i + blockSize < data.length; i += blockSize) {
    let sum = 0;
    for(let j = i; j < i + blockSize; j++) sum += data[j] * data[j];
    blocks.push({ rms: Math.sqrt(sum / blockSize), start: i });
  }

  // Sort by RMS, take bottom 20% as noise estimate
  const sorted = [...blocks].sort((a,b) => a.rms - b.rms);
  const noiseBlocks = sorted.slice(0, Math.max(5, Math.floor(sorted.length * 0.2)));
  const noiseRms = noiseBlocks.reduce((s,b) => s + b.rms, 0) / noiseBlocks.length;

  // Build noise spectrum from quiet blocks
  const noiseSpectrum = new Float32Array(blockSize);
  noiseBlocks.forEach(b => {
    for(let i = 0; i < blockSize; i++) noiseSpectrum[i] += Math.abs(data[b.start + i]);
  });
  for(let i = 0; i < noiseSpectrum.length; i++) noiseSpectrum[i] /= noiseBlocks.length;

  return { rms: noiseRms, spectrum: noiseSpectrum, blockSize };
}

/* ── SPECTRAL SUBTRACTION NOISE REDUCTION ── */
function applyNoiseReduction(buf, noiseProfile) {
  const data = buf.getChannelData(0);
  const { blockSize, spectrum, rms } = noiseProfile;
  const out = new Float32Array(data.length);
  const overSub = 2.5; // oversubtraction factor — higher = more aggressive
  const floor = 0.01;  // spectral floor to avoid musical noise

  for(let i = 0; i < data.length; i += blockSize) {
    const end = Math.min(i + blockSize, data.length);
    const frameLen = end - i;

    // Calculate frame energy
    let frameEnergy = 0;
    for(let j = i; j < end; j++) frameEnergy += data[j] * data[j];
    const frameRms = Math.sqrt(frameEnergy / frameLen);

    // SNR-based gain
    const snr = frameRms / Math.max(rms, 1e-10);

    // Wiener-like gain function
    const gain = Math.max(floor, Math.min(1, 1 - overSub * (1 / Math.max(snr, 0.5))));

    // Apply per-sample with the spectrum shape
    for(let j = i; j < end; j++) {
      const specIdx = (j - i) % spectrum.length;
      const specGain = spectrum[specIdx] > 0 ?
        Math.max(floor, 1 - overSub * (spectrum[specIdx] / Math.max(Math.abs(data[j]), 1e-10))) : 1;
      out[j] = data[j] * gain * Math.min(1, specGain + 0.3);
    }
  }

  const result = new AudioBuffer({ numberOfChannels:1, length:buf.length, sampleRate:buf.sampleRate });
  result.getChannelData(0).set(out);
  return result;
}

/* ── OFFLINE FILTER CHAIN ── */
async function applyFilters(audioCtx, inputBuf, onProgress) {
  const offCtx = new OfflineAudioContext(1, inputBuf.length, inputBuf.sampleRate);
  const src = offCtx.createBufferSource();
  src.buffer = inputBuf;

  // 1. High pass 80Hz — kill room rumble
  const hp1 = offCtx.createBiquadFilter();
  hp1.type = 'highpass'; hp1.frequency.value = 80; hp1.Q.value = 0.7;

  // 2. Notch 50Hz — Indian AC hum
  const notch50 = offCtx.createBiquadFilter();
  notch50.type = 'notch'; notch50.frequency.value = 50; notch50.Q.value = 15;

  // 3. Notch 100Hz — 2nd harmonic of AC hum
  const notch100 = offCtx.createBiquadFilter();
  notch100.type = 'notch'; notch100.frequency.value = 100; notch100.Q.value = 10;

  // 4. Notch 150Hz — 3rd harmonic
  const notch150 = offCtx.createBiquadFilter();
  notch150.type = 'notch'; notch150.frequency.value = 150; notch150.Q.value = 8;

  // 5. Low shelf boost 200-400Hz — body of voice
  const warmth = offCtx.createBiquadFilter();
  warmth.type = 'lowshelf'; warmth.frequency.value = 300; warmth.gain.value = 2;

  // 6. High pass 120Hz — extra rumble cut
  const hp2 = offCtx.createBiquadFilter();
  hp2.type = 'highpass'; hp2.frequency.value = 120; hp2.Q.value = 0.5;

  // 7. Low pass 8000Hz — kill hiss
  const lp = offCtx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 8000; lp.Q.value = 0.7;

  // 8. Presence boost 2.5kHz — voice clarity
  const presence = offCtx.createBiquadFilter();
  presence.type = 'peaking'; presence.frequency.value = 2500;
  presence.gain.value = 5; presence.Q.value = 0.9;

  // 9. De-harsh 5kHz — reduce sibilance
  const deHarsh = offCtx.createBiquadFilter();
  deHarsh.type = 'peaking'; deHarsh.frequency.value = 5000;
  deHarsh.gain.value = -3; deHarsh.Q.value = 1;

  // 10. Compressor
  const comp = offCtx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 6;
  comp.ratio.value = 6;
  comp.attack.value = 0.003;
  comp.release.value = 0.15;

  // 11. Makeup gain
  const gain = offCtx.createGain();
  gain.gain.value = 1.8;

  src.connect(hp1);
  hp1.connect(notch50);
  notch50.connect(notch100);
  notch100.connect(notch150);
  notch150.connect(hp2);
  hp2.connect(lp);
  lp.connect(warmth);
  warmth.connect(presence);
  presence.connect(deHarsh);
  deHarsh.connect(comp);
  comp.connect(gain);
  gain.connect(offCtx.destination);

  src.start(0);
  onProgress?.('Processing EQ chain...');
  return await offCtx.startRendering();
}

/* ── NOISE GATE ── */
function applyNoiseGate(buf, threshold) {
  const data = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const out = new Float32Array(data.length);
  const windowSamples = Math.floor(0.025 * sr); // 25ms window
  const holdSamples = Math.floor(0.3 * sr); // 300ms hold
  const attackSamples = Math.floor(0.008 * sr);
  const releaseSamples = Math.floor(0.1 * sr);

  let gateGain = 0;
  let holdCount = 0;
  let gateOpen = false;

  for(let i = 0; i < data.length; i += windowSamples) {
    const end = Math.min(i + windowSamples, data.length);
    let sum = 0;
    for(let j = i; j < end; j++) sum += data[j] * data[j];
    const rms = Math.sqrt(sum / (end - i));

    if(rms > threshold) {
      gateOpen = true;
      holdCount = holdSamples;
    } else if(holdCount > 0) {
      holdCount -= windowSamples;
      gateOpen = true;
    } else {
      gateOpen = false;
    }

    const targetGain = gateOpen ? 1.0 : 0.01; // attenuate to 1% when gated
    const step = gateOpen ?
      (targetGain - gateGain) / Math.max(1, attackSamples / windowSamples) :
      (gateGain - targetGain) / Math.max(1, releaseSamples / windowSamples);

    for(let j = i; j < end; j++) {
      if(gateOpen && gateGain < targetGain) gateGain = Math.min(targetGain, gateGain + step);
      if(!gateOpen && gateGain > targetGain) gateGain = Math.max(targetGain, gateGain - step);
      out[j] = data[j] * gateGain;
    }
  }

  const result = new AudioBuffer({ numberOfChannels:1, length:buf.length, sampleRate:buf.sampleRate });
  result.getChannelData(0).set(out);
  return result;
}

/* ── NORMALISE ── */
function normalise(buf, target = 0.88) {
  const data = buf.getChannelData(0);
  let max = 0;
  for(let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if(a > max) max = a; }
  if(max < 0.001) return buf;
  const g = target / max;
  const result = new AudioBuffer({ numberOfChannels:1, length:buf.length, sampleRate:buf.sampleRate });
  const out = result.getChannelData(0);
  for(let i = 0; i < data.length; i++) out[i] = Math.max(-1, Math.min(1, data[i] * g));
  return result;
}

/* ── WAV ENCODER ── */
function encodeWav(buf) {
  const data = buf.getChannelData(0);
  const sr = buf.sampleRate;
  const n = data.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const v = new DataView(ab);
  const ws = (o, s) => { for(let i = 0; i < s.length; i++) v.setUint8(o+i, s.charCodeAt(i)); };
  ws(0,'RIFF'); v.setUint32(4, 36+n*2, true); ws(8,'WAVE');
  ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true);
  v.setUint16(22,1,true); v.setUint32(24,sr,true); v.setUint32(28,sr*2,true);
  v.setUint16(32,2,true); v.setUint16(34,16,true);
  ws(36,'data'); v.setUint32(40,n*2,true);
  let off = 44;
  for(let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    v.setInt16(off, s < 0 ? s*0x8000 : s*0x7FFF, true);
    off += 2;
  }
  return new Blob([ab], {type:'audio/wav'});
}

/* ── CLOUDINARY UPLOAD ── */
export async function uploadToCloudinary(blob, episodeDay, onProgress) {
  const CLOUD = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  if(!CLOUD || CLOUD==='skip') throw new Error('Cloudinary not configured. Add REACT_APP_CLOUDINARY_CLOUD_NAME to .env');
  const fd = new FormData();
  fd.append('file', blob, `episode-day-${episodeDay}.wav`);
  fd.append('upload_preset', PRESET);
  fd.append('folder', 'nurquran/episodes');
  fd.append('resource_type', 'video');
  onProgress?.('Uploading to secure storage...');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`);
    xhr.upload.onprogress = e => { if(e.lengthComputable) onProgress?.(`Uploading... ${Math.round(e.loaded/e.total*100)}%`); };
    xhr.onload = () => { if(xhr.status===200) resolve(JSON.parse(xhr.responseText).secure_url); else reject(new Error('Upload failed: '+xhr.statusText)); };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(fd);
  });
}

/* ── LEVEL METER ── */
export function createLevelMeter(stream, onLevel) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  src.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let rafId;
  const tick = () => { analyser.getByteFrequencyData(data); onLevel(data.reduce((s,v)=>s+v,0)/data.length/255); rafId=requestAnimationFrame(tick); };
  tick();
  return { stop: () => { cancelAnimationFrame(rafId); src.disconnect(); if(ctx.state!=='closed') ctx.close(); } };
}