// Initialize Tone.js
let isPlaying = false;
let currentStep = 0;
const steps = 16;
const tracks = ['kick', 'snare', 'hihat', '808', 'clap', 'crash', 'percs', 'fx'];
const notes = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'];

// Drum kit samples - using Tone.js built-in synths for demo
const drumKit = {
  trap: {
    kick: new Tone.MembraneSynth().toDestination(),
    snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2, sustain: 0 } }).toDestination(),
    hihat: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.1, release: 0.01 } }).toDestination(),
    '808': new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }).toDestination(),
    clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }).toDestination(),
    crash: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 1.4, release: 0.2 } }).toDestination(),
    percs: new Tone.MembraneSynth().toDestination(),
    fx: new Tone.Synth({ oscillator: { type: 'sawtooth' } }).toDestination()
  }
};

let currentKit = drumKit.trap;
let customSamples = {};
let sequence = {};
let pianoRoll = {};
let volumes = {};

// Initialize sequence
tracks.forEach(track => {
  sequence[track] = new Array(steps).fill(false);
  volumes[track] = 80;
});

notes.forEach(note => {
  pianoRoll[note] = new Array(steps).fill(false);
});

// Elements
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const recordBtn = document.getElementById('recordBtn');
const bpmSlider = document.getElementById('bpmSlider');
const bpmValue = document.getElementById('bpmValue');
const masterVol = document.getElementById('masterVol');
const seqGrid = document.getElementById('seqGrid');
const piano = document.getElementById('piano');
const mixerChannels = document.getElementById('mixerChannels');
const sampleGrid = document.getElementById('sampleGrid');
const kitSelect = document.getElementById('kitSelect');
const clearSeq = document.getElementById('clearSeq');
const randomizeBtn = document.getElementById('randomizeBtn');
const exportBtn = document.getElementById('exportBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const uploadBtn = document.getElementById('uploadBtn');
const sampleUpload = document.getElementById('sampleUpload');
const customSamplesDiv = document.getElementById('customSamples');
const projectLoad = document.getElementById('projectLoad');

// Tone.js setup
Tone.Transport.bpm.value = 140;
Tone.Destination.volume.value = -10;

// Build sequencer UI
function buildSequencer() {
  seqGrid.innerHTML = '';
  tracks.forEach(track => {
    const row = document.createElement('div');
    row.className = 'seq-row';
    row.innerHTML = `<div class="seq-label">${track.toUpperCase()}</div>`;
    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'seq-steps';

    for (let i = 0; i < steps; i++) {
      const step = document.createElement('div');
      step.className = 'seq-step';
      if (i % 4 === 0) step.classList.add('bar');
      if (sequence[track][i]) step.classList.add('active');
      step.onclick = () => {
        sequence[track][i] =!sequence[track][i];
        step.classList.toggle('active');
      };
      stepsDiv.appendChild(step);
    }
    row.appendChild(stepsDiv);
    seqGrid.appendChild(row);
  });
}

// Build piano roll
function buildPiano() {
  piano.innerHTML = '';
  notes.forEach(note => {
    const row = document.createElement('div');
    row.className = 'piano-row';
    const key = document.createElement('div');
    key.className = 'piano-key';
    if (note.includes('#')) key.classList.add('black');
    key.textContent = note;
    row.appendChild(key);

    const stepsDiv = document.createElement('div');
    stepsDiv.className = 'seq-steps';
    for (let i = 0; i < steps; i++) {
      const step = document.createElement('div');
      step.className = 'seq-step';
      if (i % 4 === 0) step.classList.add('bar');
      if (pianoRoll[note][i]) step.classList.add('active');
      step.onclick = () => {
        pianoRoll[note][i] =!pianoRoll[note][i];
        step.classList.toggle('active');
      };
      stepsDiv.appendChild(step);
    }
    row.appendChild(stepsDiv);
    piano.appendChild(row);
  });
}

// Build mixer
function buildMixer() {
  mixerChannels.innerHTML = '';
  tracks.forEach(track => {
    const channel = document.createElement('div');
    channel.className = 'mixer-channel';
    channel.innerHTML = `
      <label>${track}</label>
      <input type="range" min="0" max="100" value="${volumes[track]}" data-track="${track}" orient="vertical">
      <span>${volumes[track]}</span>
    `;
    const slider = channel.querySelector('input');
    const span = channel.querySelector('span');
    slider.oninput = e => {
      volumes[track] = e.target.value;
      span.textContent = e.target.value;
    };
    mixerChannels.appendChild(channel);
  });
}

// Play sequence
const loop = new Tone.Loop(time => {
  // Update UI
  document.querySelectorAll('.seq-step').forEach((el, idx) => {
    el.classList.toggle('current', idx % steps === currentStep);
  });

  // Play drums
  tracks.forEach(track => {
    if (sequence[track][currentStep]) {
      const vol = volumes[track] / 100;
      if (track === 'kick') currentKit.kick.triggerAttackRelease('C1', '8n', time, vol);
      else if (track === 'snare') currentKit.snare.triggerAttackRelease('8n', time, vol);
      else if (track === 'hihat') currentKit.hihat.triggerAttackRelease('C4', '32n', time, vol);
      else if (track === '808') currentKit['808'].triggerAttackRelease('C1', '4n', time, vol);
      else if (track === 'clap') currentKit.clap.triggerAttackRelease('8n', time, vol);
      else if (track === 'crash') currentKit.crash.triggerAttackRelease('C5', '2n', time, vol);
      else if (track === 'percs') currentKit.percs.triggerAttackRelease('G2', '16n', time, vol);
      else if (track === 'fx') currentKit.fx.triggerAttackRelease('C5', '8n', time, vol);
    }
  });

  // Play piano
  notes.forEach(note => {
    if (pianoRoll[note][currentStep]) {
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease(note, '8n', time);
    }
  });

  currentStep = (currentStep + 1) % steps;
}, '16n');

// Controls
playBtn.onclick = async () => {
  await Tone.start();
  if (!isPlaying) {
    Tone.Transport.start();
    loop.start(0);
    isPlaying = true;
    playBtn.classList.add('active');
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else {
    Tone.Transport.pause();
    isPlaying = false;
    playBtn.classList.remove('active');
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
};

stopBtn.onclick = () => {
  Tone.Transport.stop();
  loop.stop();
  isPlaying = false;
  currentStep = 0;
  playBtn.classList.remove('active');
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  document.querySelectorAll('.seq-step').forEach(el => el.classList.remove('current'));
};

bpmSlider.oninput = e => {
  Tone.Transport.bpm.value = e.target.value;
  bpmValue.textContent = e.target.value;
};

masterVol.oninput = e => {
  Tone.Destination.volume.value = Tone.gainToDb(e.target.value / 100);
};

// Sample pads
sampleGrid.querySelectorAll('.sample-pad').forEach(pad => {
  pad.onclick = () => {
    const sample = pad.dataset.sample;
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 100);

    const vol = volumes[sample] / 100;
    if (sample === 'kick') currentKit.kick.triggerAttackRelease('C1', '8n');
    else if (sample === 'snare') currentKit.snare.triggerAttackRelease('8n');
    else if (sample === 'hihat') currentKit.hihat.triggerAttackRelease('C4', '32n');
    else if (sample === '808') currentKit['808'].triggerAttackRelease('C1', '4n');
    else if (sample === 'clap') currentKit.clap.triggerAttackRelease('8n');
    else if (sample === 'crash') currentKit.crash.triggerAttackRelease('C5', '2n');
    else if (sample === 'percs') currentKit.percs.triggerAttackRelease('G2', '16n');
    else if (sample === 'fx') currentKit.fx.triggerAttackRelease('C5', '8n');
  };
});

// Upload custom sample
uploadBtn.onclick = () => sampleUpload.click();
sampleUpload.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const name = file.name.replace(/\.[^/.]+$/, '');
    customSamples[name] = e.target.result;
    renderCustomSamples();
  };
  reader.readAsDataURL(file);
};

function renderCustomSamples() {
  customSamplesDiv.innerHTML = Object.keys(customSamples).map(name => `
    <div class="custom-sample">
      <span>${name}</span>
      <button class="btn-sm" onclick="playCustom('${name}')">
        <i class="fa-solid fa-play"></i>
      </button>
    </div>
  `).join('');
}

window.playCustom = name => {
  const player = new Tone.Player(customSamples[name]).toDestination();
  player.start();
};

// Clear/Randomize
clearSeq.onclick = () => {
  tracks.forEach(track => sequence[track].fill(false));
  notes.forEach(note => pianoRoll[note].fill(false));
  buildSequencer();
  buildPiano();
};

randomizeBtn.onclick = () => {
  tracks.forEach(track => {
    sequence[track] = sequence[track].map(() => Math.random() > 0.7);
  });
  buildSequencer();
};

// Export MP3
exportBtn.onclick = async () => {
  exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering...';
  exportBtn.disabled = true;

  const duration = (60 / Tone.Transport.bpm.value) * (steps / 4);
  const recorder = new Tone.Recorder();
  Tone.Destination.connect(recorder);
  recorder.start();

  Tone.Transport.stop();
  currentStep = 0;
  Tone.Transport.start();
  loop.start(0);

  setTimeout(async () => {
    const recording = await recorder.stop();
    Tone.Transport.stop();
    loop.stop();

    // Convert to MP3 using lamejs
    const arrayBuffer = await recording.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const mp3Encoder = new lamejs.Mp3Encoder(2, audioBuffer.sampleRate, 128);
    const samples = new Int16Array(audioBuffer.length * 2);
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1) || left;

    for (let i = 0; i < audioBuffer.length; i++) {
      samples[i * 2] = left[i] * 32767;
      samples[i * 2 + 1] = right[i] * 32767;
    }

    const mp3Data = [];
    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize * 2) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize * 2);
      const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) mp3Data.push(mp3buf);
    }
    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) mp3Data.push(mp3buf);

    const blob = new Blob(mp3Data, { type: 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fonk_beat_${Date.now()}.mp3`;
    a.click();

    exportBtn.innerHTML = '<i class="fa-solid fa-download"></i> Export MP3';
    exportBtn.disabled = false;
  }, duration * 1000 + 500);
};

// Save/Load project
saveBtn.onclick = () => {
  const project = {
    bpm: Tone.Transport.bpm.value,
    sequence,
    pianoRoll,
    volumes,
    kit: kitSelect.value
  };
  const blob = new Blob([JSON.stringify(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fonk_project_${Date.now()}.json`;
  a.click();
};

loadBtn.onclick = () => projectLoad.click();
projectLoad.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const project = JSON.parse(e.target.result);
    Tone.Transport.bpm.value = project.bpm;
    bpmSlider.value = project.bpm;
    bpmValue.textContent = project.bpm;
    sequence = project.sequence;
    pianoRoll = project.pianoRoll;
    volumes = project.volumes;
    kitSelect.value = project.kit;
    buildSequencer();
    buildPiano();
    buildMixer();
  };
  reader.readAsText(file);
};

// Kit change
kitSelect.onchange = e => {
  // In real app, load different samples here
  console.log('Kit changed to:', e.target.value);
};

// Init
buildSequencer();
buildPiano();
buildMixer();
