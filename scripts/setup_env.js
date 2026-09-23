// Headless browser mock environment for Node.js
function createMockCanvas(w = 640, h = 480) {
  const noop = () => {};
  return {
    getContext: () => ({
      fillRect: noop,
      drawImage: noop,
      beginPath: noop,
      arc: noop,
      arcTo: noop,
      bezierCurveTo: noop,
      quadraticCurveTo: noop,
      fill: noop,
      stroke: noop,
      ellipse: noop,
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
      save: noop,
      restore: noop,
      scale: noop,
      translate: noop,
      rotate: noop,
      setTransform: noop,
      resetTransform: noop,
      clip: noop,
      rect: noop,
      roundRect: noop,
      moveTo: noop,
      lineTo: noop,
      closePath: noop,
      setLineDash: noop,
      strokeRect: noop,
      fillText: noop,
      strokeText: noop,
      measureText: (text) => ({ width: (text || '').length * 8 }),
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 1,
      lineJoin: 'miter',
      lineCap: 'butt',
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: 'transparent',
      shadowOffsetX: 0,
      shadowOffsetY: 0
    }),
    width: w,
    height: h,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    setAttribute: () => {},
    getAttribute: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
}

globalThis.window = globalThis;
globalThis.window.innerWidth = 1280;
globalThis.window.innerHeight = 720;
globalThis.window.addEventListener = () => {};
globalThis.window.removeEventListener = () => {};
globalThis.window.location = { search: '', href: 'http://localhost:8000', pathname: '/' };
globalThis.location = globalThis.window.location;
globalThis.window.requestAnimationFrame = (cb) => setTimeout(cb, 16);
globalThis.window.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.requestAnimationFrame = globalThis.window.requestAnimationFrame;
globalThis.cancelAnimationFrame = globalThis.window.cancelAnimationFrame;

const mockElement = () => ({
  style: {},
  classList: { add: () => {}, remove: () => {}, contains: () => false },
  addEventListener: () => {},
  removeEventListener: () => {},
  appendChild: () => {},
  removeChild: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
});

globalThis.document = {
  getElementById: (id) => createMockCanvas(),
  querySelector: (sel) => null,
  querySelectorAll: (sel) => [],
  createElement: (tag) => {
    if (tag === 'canvas') return createMockCanvas();
    return mockElement();
  },
  body: mockElement(),
  head: mockElement(),
  addEventListener: () => {},
  removeEventListener: () => {}
};

globalThis.Image = class {
  constructor() {
    this.width = 100;
    this.height = 100;
    this.onload = null;
  }
};

globalThis.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; }
};

function createAudioParam(initial = 0) {
  return {
    value: initial,
    setValueAtTime: () => {},
    exponentialRampToValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
    setTargetAtTime: () => {},
    cancelScheduledValues: () => {},
    setValueCurveAtTime: () => {}
  };
}

globalThis.AudioContext = class {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: createAudioParam(440),
      detune: createAudioParam(0),
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createGain() {
    return {
      gain: createAudioParam(1),
      connect: () => {}
    };
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: createAudioParam(1000),
      Q: createAudioParam(1),
      gain: createAudioParam(0),
      connect: () => {}
    };
  }
  createBufferSource() {
    return {
      buffer: null,
      loop: false,
      playbackRate: createAudioParam(1),
      detune: createAudioParam(0),
      connect: () => {},
      start: () => {},
      stop: () => {}
    };
  }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData: () => new Float32Array(length)
    };
  }
  createStereoPanner() {
    return {
      pan: createAudioParam(0),
      connect: () => {}
    };
  }
  createPanner() {
    return {
      positionX: createAudioParam(0),
      positionY: createAudioParam(0),
      positionZ: createAudioParam(0),
      connect: () => {}
    };
  }
  createDynamicsCompressor() {
    return {
      threshold: createAudioParam(-24),
      knee: createAudioParam(30),
      ratio: createAudioParam(12),
      attack: createAudioParam(0.003),
      release: createAudioParam(0.25),
      connect: () => {}
    };
  }
  createWaveShaper() {
    return {
      curve: null,
      oversample: 'none',
      connect: () => {}
    };
  }
  createDelay() {
    return {
      delayTime: createAudioParam(0),
      connect: () => {}
    };
  }
  createConvolver() {
    return {
      buffer: null,
      normalize: true,
      connect: () => {}
    };
  }
  get destination() { return {}; }
  get currentTime() { return Date.now() / 1000; }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
};
globalThis.webkitAudioContext = globalThis.AudioContext;
