/**
 * NurQuran Audio Processor v2
 * Aggressive noise removal pipeline for voice recitation
 */

export async function processAudio(rawBlob, onProgress) {
  onProgress?.('Reading audio...');
  const arrayBuffer = await rawBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 44100 });

  onProgress?.('Decoding...');
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  onProgress?.('Removing background noise...');
  const processed = await applyProcessingChain(audioCtx, audioBuffer, onProgress);

  onProgress?.('Encoding...');
  const outputBlob = await encodeToWav(processed);

  if (audioCtx.state !== 'closed') audioCtx.close();
  onProgress?.('Done');
  return outputBlob;
}

async function applyProcessingChain(audioCtx, inputBuffer, onProgress) {
  // Step 1: Convert to mono
  const mono = toMono(inputBuffer);

  // Step 2: Spectral noise reduction (estimate noise floor from first 0.5s)
  onProgress?.('Estimating noise profile...');
  const denoised = spectralSubtraction(mono);

  // Step 3: Offline processing chain
  const offlineCtx = new OfflineAudioContext(1, denoised.length, denoised.sampleRate);

  const source = offlineCtx.createBufferSource();
  source.buffer = denoised;

  // High-pass 100Hz — kill room rumble and handling noise
  const hp1 = offlineCtx.createBiquadFilter();
  hp1.type = 'highpass'; hp1.frequency.value = 100; hp1.Q.value = 0.9;

  // High-pass 150Hz second stage — extra rumble kill
  const hp2 = offlineCtx.createBiquadFilter();
  hp2.type = 'highpass'; hp2.frequency.value = 150; hp2.Q.value = 0.7;

  // Low-pass 7500Hz — remove hiss and high freq noise
  const lp = offlineCtx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 7500; lp.Q.value = 0.8;

  // Notch at 50Hz — kill AC hum (India uses 50Hz)
  const notch = offlineCtx.createBiquadFilter();
  notch.type = 'notch'; notch.frequency.value = 50; notch.Q.value = 10;

  // Notch at 100Hz harmonic
  const notch2 = offlineCtx.createBiquadFilter();
  notch2.type = 'notch'; notch2.frequency.value = 100; notch2.Q.value = 8;

  // Presence boost 2-4kHz — voice clarity and intelligibility
  const presence = offlineCtx.createBiquadFilter();
  presence.type = 'peaking'; presence.frequency.value = 2800;
  presence.gain.value = 4; presence.Q.value = 0.8;

  // Compressor — even out loud/quiet parts
  const comp = offlineCtx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 8;
  comp.ratio.value = 5;
  comp.attack.value = 0.002;
  comp.release.value = 0.2;

  // Makeup gain
  const gain = offlineCtx.createGain();
  gain.gain.value = 1.6;

  source.connect(notch);
  notch.connect(notch2);
  notch2.connect(hp1);
  hp1.connect(hp2);
  hp2.connect(lp);
  lp.connect(presence);
  presence.connect(comp);
  comp.connect(gain);
  gain.connect(offlineCtx.destination);
  source.start(0);

  onProgress?.('Applying filters...');
  const rendered = await offlineCtx.startRendering();

  // Step 4: Aggressive noise gate
  onProgress?.('Gating background voices...');
  const gated = aggressiveNoiseGate(rendered);

  // Step 5: Normalize
  onProgress?.('Normalizing...');
  return normalize(gated, 0.90);
}

// Spectral subtraction — estimates noise from first 500ms, subtracts from whole signal
function spectralSubtraction(buffer) {
  const data = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const fftSize = 2048;
  const hopSize = fftSize / 4;
  const noiseEstimateSamples = Math.min(Math.floor(0.5 * sampleRate), data.length / 4);

  // Estimate noise power from first 500ms
  const noisePower = new Float32Array(fftSize / 2);
  let noiseFrames = 0;
  for (let i = 0; i + fftSize < noiseEstimateSamples; i += hopSize) {
    const frame = data.slice(i, i + fftSize);
    const mag = simpleDFTMagnitude(frame);
    for (let k = 0; k < mag.length; k++) noisePower[k] += mag[k] * mag[k];
    noiseFrames++;
  }
  if (noiseFrames > 0) {
    for (let k = 0; k < noisePower.length; k++) noisePower[k] = Math.sqrt(noisePower[k] / noiseFrames);
  }

  // Subtract noise from signal — simple wiener-like filter
  const output = new Float32Array(data.length);
  for (let i = 0; i + fftSize < data.length; i += hopSize) {
    const frame = data.slice(i, i + fftSize);
    const mag = simpleDFTMagnitude(frame);
    // Apply suppression: reduce bins where signal is close to noise floor
    const alpha = 2.0; // oversubtraction factor
    const beta = 0.02; // spectral floor
    const suppression = new Float32Array(mag.length);
    for (let k = 0; k < mag.length; k++) {
      const ratio = Math.max(beta, 1 - alpha * (noisePower[k] / Math.max(mag[k], 1e-10)));
      suppression[k] = ratio;
    }
    // Apply suppression to time domain (simple gain reduction)
    const frameRms = rms(frame);
    const noiseRms = rms(Array.from(noisePower));
    const snr = frameRms / Math.max(noiseRms, 1e-10);
    const frameGain = Math.min(1, Math.max(0, (snr - 1) / 3));
    const end = Math.min(i + fftSize, data.length);
    for (let j = i; j < end; j++) output[j] += data[j] * frameGain * (1 / (fftSize / hopSize));
  }

  const outBuf = new AudioBuffer({ numberOfChannels: 1, length: buffer.length, sampleRate: buffer.sampleRate });
  outBuf.getChannelData(0).set(output);
  return outBuf;
}

function simpleDFTMagnitude(frame) {
  const N = frame.length;
  const half = N / 2;
  const mag = new Float32Array(half);
  // Approximate using energy in blocks (fast substitute for full DFT)
  const blockSize = N / half;
  for (let k = 0; k < half; k++) {
    let sum = 0;
    const start = Math.floor(k * blockSize);
    const end = Math.floor((k + 1) * blockSize);
    for (let i = start; i < end && i < N; i++) sum += frame[i] * frame[i];
    mag[k] = Math.sqrt(sum / blockSize);
  }
  return mag;
}

function rms(arr) {
  let sum = 0;
  for (let i = 0; i < arr.length; i++) sum += arr[i] * arr[i];
  return Math.sqrt(sum / arr.length);
}

// Aggressive noise gate with lookahead and smooth fade
function aggressiveNoiseGate(buffer) {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const out = new Float32Array(data.length);
  const windowMs = 30; // 30ms analysis window
  const windowSamples = Math.floor(windowMs * sr / 1000);
  const holdSamples = Math.floor(0.25 * sr); // 250ms hold
  const attackSamples = Math.floor(0.005 * sr); // 5ms attack
  const releaseSamples = Math.floor(0.08 * sr); // 80ms release

  // Compute dynamic threshold based on signal statistics
  let maxRms = 0;
  for (let i = 0; i < data.length - windowSamples; i += windowSamples) {
    const r = rms(Array.from(data.slice(i, i + windowSamples)));
    if (r > maxRms) maxRms = r;
  }
  const threshold = maxRms * 0.08; // gate below 8% of peak RMS

  let gateGain = 0;
  let holdCounter = 0;
  let state = 'closed'; // 'open', 'closed', 'attack', 'release'

  for (let i = 0; i < data.length; i += windowSamples) {
    const end = Math.min(i + windowSamples, data.length);
    const frameRms = rms(Array.from(data.slice(i, end)));

    if (frameRms > threshold) {
      state = 'open';
      holdCounter = holdSamples;
    } else if (holdCounter > 0) {
      holdCounter -= windowSamples;
      state = 'open';
    } else {
      state = 'closed';
    }

    const targetGain = state === 'open' ? 1 : 0.02;
    for (let j = i; j < end; j++) {
      // Smooth gain transition
      if (targetGain > gateGain) gateGain = Math.min(targetGain, gateGain + 1 / attackSamples);
      else gateGain = Math.max(targetGain, gateGain - 1 / releaseSamples);
      out[j] = data[j] * gateGain;
    }
  }

  const outBuf = new AudioBuffer({ numberOfChannels: 1, length: buffer.length, sampleRate: buffer.sampleRate });
  outBuf.getChannelData(0).set(out);
  return outBuf;
}

function toMono(buffer) {
  if (buffer.numberOfChannels === 1) return buffer;
  const out = new AudioBuffer({ numberOfChannels: 1, length: buffer.length, sampleRate: buffer.sampleRate });
  const outData = out.getChannelData(0);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < d.length; i++) outData[i] += d[i];
  }
  for (let i = 0; i < outData.length; i++) outData[i] /= buffer.numberOfChannels;
  return out;
}

function normalize(buffer, targetPeak = 0.90) {
  const data = buffer.getChannelData(0);
  let max = 0;
  for (let i = 0; i < data.length; i++) { const a = Math.abs(data[i]); if (a > max) max = a; }
  if (max === 0) return buffer;
  const g = targetPeak / max;
  const out = new AudioBuffer({ numberOfChannels: 1, length: buffer.length, sampleRate: buffer.sampleRate });
  const outData = out.getChannelData(0);
  for (let i = 0; i < data.length; i++) outData[i] = data[i] * g;
  return out;
}

function encodeToWav(buffer) {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const numSamples = data.length;
  const dataSize = numSamples * 2;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); view.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE');
  ws(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sr, true); view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ws(36, 'data'); view.setUint32(40, dataSize, true);
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return new Blob([ab], { type: 'audio/wav' });
}

export async function uploadToCloudinary(blob, episodeDay, onProgress) {
  const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
  if (!CLOUD_NAME || !UPLOAD_PRESET || CLOUD_NAME === 'skip') {
    throw new Error('Cloudinary not configured. Add REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET to .env');
  }
  const formData = new FormData();
  formData.append('file', blob, `episode-day-${episodeDay}.wav`);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'nurquran/episodes');
  formData.append('resource_type', 'video');
  onProgress?.('Uploading to secure storage...');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(`Uploading... ${Math.round(e.loaded/e.total*100)}%`); };
    xhr.onload = () => { if (xhr.status === 200) resolve(JSON.parse(xhr.responseText).secure_url); else reject(new Error('Upload failed: ' + xhr.statusText)); };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

export function createLevelMeter(stream, onLevel) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  let rafId;
  const tick = () => { analyser.getByteFrequencyData(data); onLevel(data.reduce((s,v)=>s+v,0)/data.length/255); rafId = requestAnimationFrame(tick); };
  tick();
  return { stop: () => { cancelAnimationFrame(rafId); source.disconnect(); if (ctx.state !== 'closed') ctx.close(); } };
}