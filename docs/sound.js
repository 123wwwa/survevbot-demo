'use strict';
const Snd = (() => {
    const BASE = 0.5, MIN = 0.003, OTHER_FLOOR = 0.5;
    const VOICES = 48, PER_SOUND = 5, LATE = 0.25;
    let ac = null, out = null, cat = null, on = false, volume = 1;
    const ear = { x: 0, y: 0, layer: 0, near: 1 };
    const buffers = new Map();
    const playing = new Map();
    let voices = 0;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const sameFloor = (a, b) => a === b || (a & 2) || (b & 2);
    function load(file) {
        if (buffers.has(file))
            return buffers.get(file);
        const p = fetch('audio/' + file).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))).then(b => ac.decodeAudioData(b))
            .then(buf => { buffers.set(file, buf); return buf; }, () => { buffers.set(file, null); return null; });
        buffers.set(file, p);
        return p;
    }
    function start(file, buf, gainValue, pan, detune, muffled, loop) {
        if (voices >= VOICES || (playing.get(file) ?? 0) >= PER_SOUND)
            return null;
        const src = ac.createBufferSource(), gain = ac.createGain();
        src.buffer = buf;
        src.loop = !!loop;
        if (detune)
            src.detune.value = detune;
        gain.gain.value = gainValue;
        let node = src;
        if (muffled) {
            const low = ac.createBiquadFilter();
            low.type = 'lowpass';
            low.frequency.value = 700;
            node.connect(low);
            node = low;
        }
        node.connect(gain);
        node = gain;
        if (pan && ac.createStereoPanner) {
            const p = ac.createStereoPanner();
            p.pan.value = pan;
            node.connect(p);
            node = p;
        }
        node.connect(out);
        voices++;
        playing.set(file, (playing.get(file) ?? 0) + 1);
        src.onended = () => { voices--; playing.set(file, playing.get(file) - 1); };
        src.start();
        return { stop: () => { try {
                src.stop();
            }
            catch { } }, gain };
    }
    function play(name, o = {}) {
        if (!on || !ac || !cat || !name || name === 'none')
            return null;
        const channel = o.channel ?? 'activePlayer', ch = cat.channels[channel], def = ch && cat.sounds[ch[2] + '/' + name];
        if (!def)
            return null;
        let vol = ch[0] * BASE * def[1] * (o.volumeScale ?? 1) * volume, pan = 0;
        const otherFloor = o.layer !== undefined && !sameFloor(o.layer, ear.layer);
        if (channel !== 'activePlayer' && o.pos) {
            const range = (ch[1] * (o.rangeMult ?? 1)) || 1, dx = (ear.x - o.pos.x) * ear.near, dist = Math.hypot(dx, (ear.y - o.pos.y) * ear.near);
            vol *= Math.pow(1 - clamp(dist / range, 0, 1), 1 + (o.fallOff ?? 0) * 2);
            pan = clamp(-dx / range, -1, 1);
        }
        if (otherFloor)
            vol *= OTHER_FLOOR;
        if (vol <= MIN)
            return null;
        const file = def[0], buf = load(file), muffled = otherFloor && !!o.filter;
        if (buf instanceof Promise) {
            const asked = ac.currentTime;
            buf.then(b => { if (b && on && (o.loop || ac.currentTime - asked < LATE))
                start(file, b, vol, pan, o.detune, muffled, o.loop); });
            return null;
        }
        return buf ? start(file, buf, vol, pan, o.detune, muffled, o.loop) : null;
    }
    function group(name, o = {}) {
        const g = cat?.groups[name];
        return g ? play(g[1][Math.floor(Math.random() * g[1].length)], { ...o, channel: g[0] }) : play(name, o);
    }
    function enable(want) {
        on = want;
        if (!want) {
            if (ac)
                ac.suspend();
            return;
        }
        if (!ac) {
            ac = new (window.AudioContext || window.webkitAudioContext)();
            out = ac.createGain();
            out.connect(ac.destination);
        }
        ac.resume();
        warm();
    }
    function warm() {
        if (!ac || !cat || warm.done)
            return;
        warm.done = true;
        if (!warm.wind) {
            warm.wind = true;
            play('ambient_wind_01', { channel: 'ambient', loop: true });
        }
        const ahead = Object.entries(cat.groups).filter(([name]) => /^footstep_|^player_bullet_hit|_bullet$|^bullet_whiz/.test(name));
        for (const [, [channel, names]] of ahead)
            for (const n of names) {
                const d = cat.sounds[cat.channels[channel][2] + '/' + n];
                if (d)
                    load(d[0]);
            }
    }
    return { play, group, enable, enabled: () => on, use: c => { cat = c; warm.done = false; if (on)
            warm(); }, listen: (x, y, layer, near = 1) => { ear.x = x; ear.y = y; ear.layer = layer; ear.near = near; },
        volume: v => { volume = v; } };
})();
