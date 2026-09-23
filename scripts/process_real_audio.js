import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright-core';

function encodeWav(audioData, sampleRate, numChannels) {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numFrames = audioData[0].length;
  const dataSize = numFrames * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1.0, Math.min(1.0, audioData[ch][i]));
      const intVal = s < 0 ? s * 0x8000 : s * 0x7FFF;
      buffer.writeInt16LE(Math.floor(intVal), offset);
      offset += 2;
    }
  }
  return buffer;
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body></body></html>');
    return;
  }
  const filePath = path.join('/tmp/audio_test', req.url.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': ext === '.ogg' ? 'audio/ogg' : 'audio/wav' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(9878, async () => {
  try {
    const browser = await chromium.launch({
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('http://localhost:9878/');

    const exported = await page.evaluate(async () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      async function load(url) {
        const r = await fetch(url);
        return await ctx.decodeAudioData(await r.arrayBuffer());
      }

      function extractLoop(buf, startSec, durSec, crossfadeSec = 0.08) {
        const sr = buf.sampleRate;
        const startFrame = Math.floor(startSec * sr);
        const lenFrames = Math.floor(durSec * sr);
        const xfadeFrames = Math.floor(crossfadeSec * sr);
        const numCh = buf.numberOfChannels;
        const channels = [];

        for (let ch = 0; ch < numCh; ch++) {
          const srcData = buf.getChannelData(ch);
          const outData = new Float32Array(lenFrames);
          for (let i = 0; i < lenFrames; i++) {
            outData[i] = srcData[startFrame + i] || 0;
          }
          // Apply seamless loop crossfade
          for (let i = 0; i < xfadeFrames; i++) {
            const factor = i / xfadeFrames;
            outData[i] = outData[i] * factor + srcData[startFrame + lenFrames - xfadeFrames + i] * (1.0 - factor);
          }
          channels.push(Array.from(outData));
        }
        return { channels, sampleRate: sr, numChannels: numCh };
      }

      function extractRange(buf, startSec, durSec) {
        const sr = buf.sampleRate;
        const startFrame = Math.floor(startSec * sr);
        const lenFrames = Math.floor(durSec * sr);
        const numCh = buf.numberOfChannels;
        const channels = [];
        for (let ch = 0; ch < numCh; ch++) {
          const srcData = buf.getChannelData(ch);
          const outData = new Float32Array(lenFrames);
          for (let i = 0; i < lenFrames; i++) {
            outData[i] = srcData[startFrame + i] || 0;
          }
          channels.push(Array.from(outData));
        }
        return { channels, sampleRate: sr, numChannels: numCh };
      }

      const slantBuf = await load('/225_slant_six.ogg');
      const heavyBuf = await load('/opengameart_heavy.wav');
      const loop0Buf = await load('/opengameart_loop0.wav');
      const loop2Buf = await load('/opengameart_loop2.wav');
      const loop4Buf = await load('/opengameart_loop4.wav');
      const loop5Buf = await load('/opengameart_loop5.wav');
      const startBuf = await load('/opengameart_start.wav');
      const hornBuf = await load('/vintage_horn.ogg');

      return {
        engine_idle: extractLoop(slantBuf, 1.2, 5.0, 0.12),
        engine_heavy_rumble: extractLoop(heavyBuf, 0.0, 3.8, 0.10),
        engine_low: extractLoop(loop0Buf, 0.0, loop0Buf.duration, 0.05),
        engine_mid: extractLoop(loop2Buf, 0.0, loop2Buf.duration, 0.05),
        engine_high: extractLoop(loop4Buf, 0.0, loop4Buf.duration, 0.05),
        engine_rev_limit: extractLoop(loop5Buf, 0.0, loop5Buf.duration, 0.05),
        jeep_starter: extractRange(startBuf, 0.0, startBuf.duration),
        jeep_horn: extractRange(hornBuf, 4.8, 1.35)
      };
    });

    const outDir = path.resolve('public/audio/jeep');
    for (const [key, data] of Object.entries(exported)) {
      const wav = encodeWav(data.channels, data.sampleRate, data.numChannels);
      const filename = key + '.wav';
      const targetPath = path.join(outDir, filename);
      fs.writeFileSync(targetPath, wav);
      console.log('Saved ' + filename + ': ' + wav.length + ' bytes, ' + data.channels[0].length + ' frames @ ' + data.sampleRate + 'Hz, ' + data.numChannels + ' ch');
    }

    fs.copyFileSync(path.join(outDir, 'engine_idle.wav'), path.join(outDir, 'jeep_idle_loop.wav'));
    console.log('Synchronized jeep_idle_loop.wav with real engine_idle.wav');

    await browser.close();
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    server.close();
  }
});
