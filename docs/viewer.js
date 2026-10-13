const MOVES = ["Wait", "Loot", "Cover", "Peek", "Regroup", "Zone", "Retreat", "Dodge", "Explore", "Push", "Hold a spot", "Revive"];
const MODES = ['총', '근접', '수류탄', '연막'];
const CONTROLLER = { learner: '학습 모델', model: '모델/과거', bot: '스크립트 봇' };
const SQUAD_COLORS = ['#ffd84a', '#ff5c5c', '#5cb8ff', '#c77dff', '#ff9a3c', '#5ce0b0', '#ff7eb6', '#9be15d', '#00c2d1', '#b8860b',
    '#e05cff', '#7d8cff', '#ffb3a7', '#2ec27e', '#f6d32d', '#a0522d', '#ff4f00', '#8fd3ff', '#c0c0c0', '#6a5acd'];
const moveColor = m => ["#d9d9d9", "#7fd3ff", "#7dff9b", "#7dff9b", "#d9d9d9", "#d9d9d9", "#ffb36b", "#ffb36b", "#7fd3ff", "#ff4dd2", "#7dff9b", "#d9d9d9"][m] ?? '#d9d9d9';
const canvas = document.getElementById('view'), ctx = canvas.getContext('2d');
let map = null, obstacles = new Map(), squadOf = new Map(), squadIndex = new Map();
let smokes = [], airdrops = [], planes = [];
let projectiles = [], seenProjectiles = new Set(), players = new Map(), bullets = [], gas = null, loot = [], intents = {}, threatOf = {}, alive = {};
let follow = 's0', camera = { x: 0, y: 0, scale: 7 }, showAll = true, showVision = true, visitedBy = {}, buildings = [];
let showReal = true, gameCam = false, focusPid = null;
let asGame = false, showInfo = true, wantSound = true, shakes = [], killFeed = [];
let queue = [], tickMs = 33, playClock = 0, gameTime = 0;
const PLAY_BUFFER = 8, GLIDE_JUMP = 6;
let playMs = 33, arriveMs = 0, lastBatchAt = 0;
const feed = [];
const events = new EventSource('/events');
events.addEventListener('map', e => {
    map = JSON.parse(e.data);
    obstacles = new Map(map.obstacles.map(o => [o.id, { ...o, state: o.st ?? 2 }]));
    buildings = (map.buildings ?? []).map(([type, x, y, ori, layer, scale, ceiling], i) => ({ i, type, x, y, ori, layer, scale, ceiling: ceiling ?? 0 }));
    Real.load(map.mapName ?? 'main').then(c => Snd.use(c));
    shakes = [];
    killFeed = [];
    squadOf.clear();
    squadIndex.clear();
    map.squads.forEach((s, i) => { squadIndex.set(s.id, i); for (const m of s.members)
        squadOf.set(m.pid, { squad: s.id, name: m.id, index: i }); });
    players.clear();
    queue = [];
    intents = {};
    threatOf = {};
    feed.length = 0;
    renderFeed();
    if (!map.squads.some(s => s.id === follow))
        follow = 's0';
});
events.addEventListener('frames', e => {
    const msg = JSON.parse(e.data);
    tickMs = msg.tickMs / msg.speed;
    alive = msg.alive;
    const arrivedAt = performance.now();
    if (lastBatchAt && msg.frames.length && arrivedAt - lastBatchAt < 5000) {
        const each = (arrivedAt - lastBatchAt) / msg.frames.length;
        arriveMs = arriveMs ? arriveMs * 0.8 + each * 0.2 : each;
    }
    lastBatchAt = arrivedAt;
    queue.push(...msg.frames);
    if (queue.length > 90) {
        for (const frame of queue.splice(0, queue.length - 30)) {
            for (const o of frame.no ?? [])
                obstacles.set(o.id, { ...o, state: o.st ?? 2 });
            changed(frame, false);
            if (frame.lo)
                loot = frame.lo;
        }
    }
});
events.addEventListener('episode', e => {
    const msg = JSON.parse(e.data);
    pushFeed(msg.skipped ? `⏭ 에피소드 ${msg.episode} 건너뜀 (${Math.round(msg.elapsed)}초)` : `🏁 에피소드 ${msg.episode} 종료 — 우승 ${msg.winner ?? '없음'} (${Math.round(msg.elapsed)}초)`);
});
events.addEventListener('state', e => {
    const s = JSON.parse(e.data);
    paused = s.paused;
    const b = document.getElementById('pause');
    b.classList.toggle('on', paused);
    b.textContent = paused ? '재생' : '일시정지';
    document.getElementById('speed').value = String(s.speed);
});
events.onerror = () => { document.getElementById('clock').textContent = '뷰어 서버 연결 끊김 — 재연결 중…'; };
function changed(frame, live = true) {
    for (const [id, state, x, y, r, c] of frame.ch ?? []) {
        const o = obstacles.get(id);
        if (!o)
            continue;
        if (live && o.state !== state)
            obstacleChanged(o, state);
        o.state = state;
        if (x != null) {
            o.x = x;
            o.y = y;
            o.r = r;
        }
        if (c) {
            o.c = c;
            o.shape = null;
        }
    }
    for (const [id, scale] of frame.os ?? []) {
        const o = obstacles.get(id);
        if (o)
            o.s = scale;
    }
    for (const [i, state] of frame.bc ?? [])
        if (buildings[i])
            buildings[i].ceiling = state;
}
const eyeNow = () => { if (!gameCam || !follow || !map)
    return null; const w = (map.squads.find(q => q.id === follow)?.members ?? []).map(m => players.get(m.pid)).filter(p => p && !p.dead); return w.find(p => p.id === focusPid) ?? w[0] ?? null; };
const voice = (p, eye) => (eye && p.id === eye.id ? 'activePlayer' : 'otherPlayers');
function obstacleChanged(o, state) {
    const def = Real.catalog()?.obstacles[o.t];
    if (!def)
        return;
    const at = { channel: 'sfx', pos: o, layer: o.l, filter: 'muffled' };
    if (state === 0) {
        Snd.play(def.snd?.[2], at);
        if (showReal)
            Real.chips(def.ep, o.x, o.y, o.l, 0, 0, 6);
    }
    else if (def.ds && (state === 1 || state === 2) && (o.state === 1 || o.state === 2))
        Snd.play(def.ds[state === 1 ? 0 : 1], at);
    else if (def.bs && state === 4)
        Snd.play(def.bs[0], at);
}
function killText(ev, by, v) {
    const down = ev.k === 'down', verb = down ? 'knocked out' : 'killed', thing = Real.catalog()?.names?.[ev.w] ?? ev.w;
    if (ev.d === 1)
        return by ? `${by} finally killed ${v}` : `${v} finally bled out`;
    if (ev.d === 2)
        return down ? `The red zone knocked out ${v}` : by ? `${by} finally killed ${v}` : `${v} died outside the safe zone`;
    if (ev.d === 3)
        return `The air drop ${down ? 'knocked out' : 'crushed'} ${v}`;
    if (ev.d === 4)
        return `${by || 'An air strike'} ${verb} ${v}${by ? ' with an air strike' : ''}`;
    return by ? `${by} ${verb} ${v}${thing ? ` with ${thing}` : ''}` : `${v} was ${verb}${thing ? ` by ${thing}` : ''}`;
}
function happened(e, eye) {
    const cat = Real.catalog();
    if (!cat)
        return;
    if (e[0] === 's') {
        const [, pid, type, x, y, layer, flags] = e, gun = cat.guns[type], p = players.get(pid);
        if (!gun)
            return;
        const name = (flags & 2) && gun.snd.last ? gun.snd.last : (flags & 4) && gun.snd.alt ? gun.snd.alt : gun.snd.shoot;
        Snd.play(name, { channel: p ? voice(p, eye) : 'otherPlayers', pos: { x, y }, layer: p?.layer ?? layer, filter: 'muffled', fallOff: gun.snd.fallOff });
        if (p)
            p.recoil = (p.recoil ?? 0) + gun.recoil;
    }
    else if (e[0] === 'o') {
        const [, type, x, y, layer, by, dx, dy] = e, def = cat.obstacles[type];
        if (!def)
            return;
        Snd.group(def.snd?.[by], { channel: 'hits', pos: { x, y }, layer, filter: 'muffled' });
        if (showReal)
            Real.chips(def.hp, x, y, layer, dx, dy);
    }
    else if (e[0] === 'p') {
        const [, pid, by] = e, p = players.get(pid);
        if (!p)
            return;
        if (by === 0)
            Snd.group('player_bullet_hit', { pos: p, fallOff: 1, layer: p.layer, filter: 'muffled' });
        else
            Snd.play(cat.meleeSounds.fists?.hit, { channel: 'hits', pos: p, fallOff: 1, layer: p.layer, filter: 'muffled' });
    }
    else if (e[0] === 'x') {
        const [, type, x, y, layer] = e, def = cat.explosions[type];
        if (!def)
            return;
        Snd.play(def.grass, { channel: 'sfx', pos: { x, y }, layer, filter: 'muffled', rangeMult: 2, detune: def.detune, volumeScale: def.vol });
        if (showReal)
            Real.burst(type, x, y, layer);
        if (def.shake)
            shakes.push({ x, y, str: def.shake, until: performance.now() + 350 });
    }
    else if (e[0] === 'f') {
        const [, pid, surface] = e, p = players.get(pid);
        if (!p)
            return;
        Snd.group('footstep_' + surface, { pos: p, fallOff: 3, layer: p.layer, filter: 'muffled' });
    }
}
function playerChanged(p, was, eye) {
    const cat = Real.catalog();
    if (!cat || !was || p.dead)
        return;
    const at = { channel: voice(p, eye), pos: p, fallOff: 2, layer: p.layer, filter: 'muffled' };
    if (p.action !== was.action || p.actionItem !== was.actionItem) {
        if (p.action === 1 || p.action === 2)
            Snd.play(cat.guns[p.actionItem]?.snd[p.action === 2 ? 'reloadAlt' : 'reload'], at);
        else if (p.action === 3)
            Snd.play(cat.uses[p.actionItem], at);
    }
    if (p.weapon !== was.weapon && p.weapon) {
        if (cat.guns[p.weapon]) {
            if (eye && p.id === eye.id)
                Snd.play('gun_switch_01', { channel: 'activePlayer' });
        }
        else
            Snd.play(cat.meleeSounds[p.weapon]?.deploy ?? cat.loot[p.weapon]?.ps, { channel: 'sfx', pos: p, fallOff: 3 });
    }
    if (p.swing && (!was.swing || was.swing[1] !== p.swing[1]))
        Snd.play(cat.meleeSounds[p.melee || 'fists']?.swing, { channel: 'sfx', pos: p, fallOff: 3, layer: p.layer, filter: 'muffled' });
    if (eye && p.id === eye.id) {
        const got = ITEM_KEYS.find((k, i) => p.items[i] > was.items[i]) ?? [['gun1', p.gun1], ['gun2', p.gun2], ['helmet', p.helmet], ['chest', p.chest], ['backpack', p.backpack], ['melee', p.melee]].find(([k, t]) => t && t !== was[k])?.[1];
        if (got)
            Snd.play(cat.loot[got]?.ps, { channel: 'ui' });
    }
}
const ITEM_KEYS = ['bandage', 'healthkit', 'soda', 'painkiller', 'frag', 'mirv', 'smoke'];
function apply(frame) {
    gameTime = frame.t;
    const eye = eyeNow();
    for (const p of frame.p) {
        const [id, x, y, dx, dy, hp, downed, dead, weapon, layer, zoom, gun1, gun2, ammo1, ammo2, items, boost, action, helmet, chest, backpack, melee, throwable, scope, kills, reserve, slot, swing, actionItem, pan, perks] = p;
        const was = players.get(id);
        players.set(id, { id, x, y, dx, dy, hp, downed, dead, weapon, layer, zoom, gun1, gun2, ammo1, ammo2, items: items ?? [0, 0, 0, 0, 0, 0, 0], boost, action, helmet, chest, backpack, melee, throwable, scope, kills, reserve: reserve ?? [0, 0], slot, swing: swing || null,
            actionItem: actionItem ?? '', pan: !!pan, perks: perks ?? [], recoil: was?.recoil ?? 0, emitIn: was?.emitIn ?? 0, name: squadOf.get(id)?.name ?? '' });
        glideFrom(players.get(id), was);
        playerChanged(players.get(id), was, eye);
    }
    bullets = frame.b;
    gas = frame.g;
    smokes = frame.sm ?? [];
    airdrops = frame.ad ?? [];
    planes = frame.pl ?? [];
    for (const o of frame.no ?? [])
        obstacles.set(o.id, { ...o, state: o.st ?? 2 });
    projectiles = frame.pr ?? [];
    if (frame.lo)
        loot = frame.lo;
    if (frame.i)
        intents = frame.i;
    if (frame.th)
        threatOf = frame.th;
    if (frame.vis)
        visitedBy = frame.vis;
    changed(frame);
    for (const e of frame.fx ?? [])
        happened(e, eye);
    for (const ev of frame.ev ?? []) {
        const v = squadOf.get(ev.v)?.name ?? ev.v, by = ev.by != null ? (squadOf.get(ev.by)?.name ?? '?') : '자기장/기타';
        const withWhat = ev.w ? ` (${Real.catalog()?.names?.[ev.w] ?? ev.w})` : '';
        pushFeed(ev.k === 'kill' ? `☠ ${by} → ${v}${withWhat}` : `▼ ${by} → ${v} 기절${withWhat}`);
        const mine = squadOf.get(ev.by)?.squad === follow || squadOf.get(ev.v)?.squad === follow;
        killFeed.push({ text: killText(ev, ev.by != null ? squadOf.get(ev.by)?.name ?? '?' : '', v), at: performance.now(), mine });
        if (killFeed.length > 6)
            killFeed.shift();
    }
}
function glideFrom(p, was) {
    const jump = !was || was.tx === undefined || Math.hypot(p.x - was.tx, p.y - was.ty) > GLIDE_JUMP;
    p.tx = p.x;
    p.ty = p.y;
    p.tdx = p.dx;
    p.tdy = p.dy;
    p.ox = jump ? p.x : was.tx;
    p.oy = jump ? p.y : was.ty;
    p.odx = jump ? p.dx : was.tdx;
    p.ody = jump ? p.dy : was.tdy;
    glide(p, 0);
}
function glide(p, a) {
    if (p.tx === undefined)
        return;
    p.x = p.ox + (p.tx - p.ox) * a;
    p.y = p.oy + (p.ty - p.oy) * a;
    const dx = p.odx + (p.tdx - p.odx) * a, dy = p.ody + (p.tdy - p.ody) * a, n = Math.hypot(dx, dy);
    if (n > 1e-6) {
        p.dx = dx / n;
        p.dy = dy / n;
    }
}
function pushFeed(text) { feed.unshift(text); feed.length = Math.min(feed.length, 14); renderFeed(); }
function renderFeed() { document.getElementById('feed').innerHTML = feed.map(t => `<div>${t}</div>`).join('') || '<div class="muted">아직 없음</div>'; }
const control = q => fetch('/control?' + q).catch(() => { });
let paused = false;
document.getElementById('pause').onclick = e => { paused = !paused; e.target.classList.toggle('on', paused); e.target.textContent = paused ? '재생' : '일시정지'; control('pause=' + (paused ? 1 : 0)); };
document.getElementById('next').onclick = () => { queue = []; control('next=1'); };
document.getElementById('speed').onchange = e => control('speed=' + e.target.value);
document.getElementById('allIntents').onclick = e => { showAll = !showAll; e.target.classList.toggle('on', showAll); };
document.getElementById('vision').onclick = e => { showVision = !showVision; e.target.classList.toggle('on', showVision); };
document.getElementById('real').onclick = e => { showReal = !showReal; e.target.classList.toggle('on', showReal); };
function setGameLook(want) { asGame = want; showInfo = !want; if (want)
    showReal = true; }
let lookBefore = false;
function setGameCam(want) {
    if (want === gameCam)
        return;
    gameCam = want;
    if (want) {
        if (!follow)
            follow = 's0';
        lookBefore = asGame;
        setGameLook(true);
    }
    else
        setGameLook(lookBefore);
}
document.getElementById('gameCam').onclick = () => { setGameCam(!gameCam); syncButtons(); };
document.getElementById('asGame').onclick = () => { setGameLook(!asGame); if (gameCam)
    lookBefore = asGame; syncButtons(); };
document.getElementById('info').onclick = () => { showInfo = !showInfo; syncButtons(); };
document.getElementById('sound').onclick = () => { wantSound = !wantSound; Snd.enable(wantSound); syncButtons(); };
for (const kind of ['pointerdown', 'keydown'])
    addEventListener(kind, () => { if (!Snd.enabled())
        Snd.enable(wantSound); }, { once: true, capture: true });
canvas.addEventListener('wheel', e => { e.preventDefault(); if (gameCam)
    setGameCam(false); camera.scale = Math.max(1, Math.min(30, camera.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); }, { passive: false });
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx: camera.x, cy: camera.y }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
    if (!drag)
        return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
        follow = null;
        camera.x = drag.cx - dx / camera.scale;
        camera.y = drag.cy + dy / camera.scale;
    }
});
canvas.addEventListener('pointerup', () => { drag = null; });
function resize() { const r = canvas.getBoundingClientRect(), d = devicePixelRatio || 1; canvas.width = r.width * d; canvas.height = r.height * d; }
addEventListener('resize', resize);
resize();
const S = (x, y) => [canvas.width / 2 + (x - camera.x) * camera.scale * devicePixelRatio, canvas.height / 2 - (y - camera.y) * camera.scale * devicePixelRatio];
const L = v => v * camera.scale * devicePixelRatio;
function squadCenter(id) {
    const s = map?.squads.find(q => q.id === id);
    if (!s)
        return null;
    const ps = s.members.map(m => players.get(m.pid)).filter(p => p && !p.dead);
    if (!ps.length)
        return null;
    return { x: ps.reduce((a, p) => a + p.x, 0) / ps.length, y: ps.reduce((a, p) => a + p.y, 0) / ps.length };
}
function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#5d7a3a';
    ctx.fillRect(0, 0, W, H);
    if (!map)
        return;
    const watched = follow ? (map.squads.find(q => q.id === follow)?.members ?? []).map(m => players.get(m.pid)).filter(p => p && !p.dead) : [];
    const eye = gameCam ? (watched.find(p => p.id === focusPid) ?? watched[0]) : null;
    const nowMs = performance.now(), dt = Math.min(0.1, (nowMs - (draw.at ?? nowMs)) / 1000);
    draw.at = nowMs;
    if (eye) {
        const r = canvas.getBoundingClientRect(), target = Math.max(r.width, r.height) / 2 / Math.max(10, eye.zoom || 28);
        camera.scale += (target - camera.scale) * Math.min(1, dt * (target > camera.scale ? 2 : 1.4));
        if (Math.abs(target - camera.scale) > target * 0.6)
            camera.scale = target;
        camera.x = eye.x;
        camera.y = eye.y;
        shakes = shakes.filter(s => s.until > nowMs);
        const shake = Math.max(0, ...shakes.map(s => Math.max(0, Math.min(1, (40 - Math.hypot(s.x - eye.x, s.y - eye.y)) / 30)) * s.str));
        if (shake > 0) {
            const a = Math.random() * Math.PI * 2;
            camera.x += Math.cos(a) * shake;
            camera.y += Math.sin(a) * shake;
        }
        Snd.listen(eye.x, eye.y, eye.layer);
    }
    else {
        if (follow) {
            const c = squadCenter(follow);
            if (c) {
                camera.x += (c.x - camera.x) * 0.2;
                camera.y += (c.y - camera.y) * 0.2;
            }
        }
        const side = Math.max(W, H) / 2 / (camera.scale * devicePixelRatio);
        Snd.listen(camera.x, camera.y, watched[0]?.layer ?? 0, Math.min(1, 28 / side));
    }
    const halfW = W / 2 / (camera.scale * devicePixelRatio) + 5, halfH = H / 2 / (camera.scale * devicePixelRatio) + 5;
    const visible = (x, y, r = 0) => Math.abs(x - camera.x) < halfW + r && Math.abs(y - camera.y) < halfH + r;
    const real = showReal && Real.ready() && Real.draw({ ctx, S, L, visible, map, buildings, obstacles: [...obstacles.values()], loot, bullets, projectiles, smokes, airdrops, planes, smokeAlpha: 0.45,
        players: players.values(), watchers: eye ? [eye] : watched, layer: (eye ?? watched[0])?.layer ?? 0,
        cam: { x0: camera.x - halfW, y0: camera.y - halfH, x1: camera.x + halfW, y1: camera.y + halfH }, bodies: !showInfo,
        names: !showInfo ? new Map(watched.filter(p => p !== eye).map(p => [p.id, p.name])) : null,
        ceilingAlpha: asGame ? 1 : 0.35 });
    if (!real) {
        const [mx0, my0] = S(0, map.mapSize.y), [mx1, my1] = S(map.mapSize.x, 0);
        ctx.fillStyle = map.shore ? '#3f7fb5' : '#6f8f45';
        ctx.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
        if (map.shore) {
            ctx.fillStyle = '#6f8f45';
            ctx.beginPath();
            map.shore.forEach(([x, y], i) => { const [sx, sy] = S(x, y); if (i)
                ctx.lineTo(sx, sy);
            else
                ctx.moveTo(sx, sy); });
            ctx.closePath();
            ctx.fill();
        }
        ctx.fillStyle = '#3f7fb5';
        for (const poly of map.water ?? []) {
            ctx.beginPath();
            poly.forEach(([x, y], i) => { const [sx, sy] = S(x, y); if (i)
                ctx.lineTo(sx, sy);
            else
                ctx.moveTo(sx, sy); });
            ctx.closePath();
            ctx.fill();
        }
        for (const o of obstacles.values()) {
            if (o.state === 0)
                continue;
            const c = o.c;
            const cx = c[0] === 0 ? c[1] : (c[1] + c[3]) / 2, cy = c[0] === 0 ? c[2] : (c[2] + c[4]) / 2;
            if (!visible(cx, cy, 15))
                continue;
            const style = { tree: '#2f5a24', wall: '#555a5e', crate: '#a8742c', door: o.state === 1 ? 'rgba(200,150,80,.35)' : '#c8964f', low: 'rgba(40,70,30,.45)' }[o.k];
            ctx.fillStyle = style;
            if (o.l & 1)
                ctx.globalAlpha = 0.35;
            if (c[0] === 0) {
                const [x, y] = S(c[1], c[2]);
                ctx.beginPath();
                ctx.arc(x, y, L(c[3]), 0, Math.PI * 2);
                ctx.fill();
            }
            else {
                const [x0, y0] = S(c[1], c[4]), [x1, y1] = S(c[3], c[2]);
                ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
            }
            ctx.globalAlpha = 1;
        }
    }
    const seen = new Set(visitedBy[follow] ?? []);
    (map.landmarks ?? []).forEach(([x, y, r], i) => {
        if (!showInfo || !visible(x, y, r))
            return;
        const [sx, sy] = S(x, y), done = seen.has(i);
        ctx.strokeStyle = done ? 'rgba(200,200,200,.6)' : '#f0c94a';
        ctx.lineWidth = 2;
        ctx.setLineDash(done ? [] : [4, 3]);
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(4, L(r)), 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        if (done) {
            ctx.fillStyle = 'rgba(220,220,220,.8)';
            ctx.font = `${12 * devicePixelRatio}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillText('✓', sx, sy + 4 * devicePixelRatio);
        }
    });
    if (!real) {
        ctx.fillStyle = '#f4f1c8';
        for (const [x, y] of loot) {
            if (!visible(x, y))
                continue;
            const [sx, sy] = S(x, y);
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(1.5, L(0.35)), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    if (gas) {
        const [gx, gy] = S(gas[0], gas[1]);
        ctx.fillStyle = real ? 'rgba(255,0,0,.6)' : 'rgba(200,30,30,.28)';
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.arc(gx, gy, L(gas[2]), 0, Math.PI * 2, true);
        ctx.fill('evenodd');
        const [nx, ny] = S(gas[3], gas[4]);
        if (showInfo) {
            ctx.strokeStyle = 'rgba(255,255,255,.7)';
            ctx.setLineDash([L(1.5), L(1.5)]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(nx, ny, L(gas[5]), 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    if (!real) {
        for (const [x, y, rad] of smokes) {
            if (!visible(x, y, rad))
                continue;
            const [sx, sy] = S(x, y);
            ctx.fillStyle = 'rgba(215,215,215,.4)';
            ctx.beginPath();
            ctx.arc(sx, sy, L(rad), 0, Math.PI * 2);
            ctx.fill();
        }
        for (const [x, y, fallT] of airdrops) {
            if (!visible(x, y, 12))
                continue;
            const [sx, sy] = S(x, y), r = L(5 + Math.pow(1 - fallT, 1.1) * 7);
            ctx.strokeStyle = '#ffe14d';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(sx, sy, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffe14d';
            ctx.fillRect(sx - L(1.25), sy - L(1.25), L(2.5), L(2.5));
        }
        for (const [x, y, dx, dy, strike] of planes) {
            if (!visible(x, y, 20))
                continue;
            const [sx, sy] = S(x, y), a = Math.atan2(-dy, dx);
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(a);
            ctx.fillStyle = strike ? '#ff6b6b' : '#ffe14d';
            ctx.beginPath();
            ctx.moveTo(L(4), 0);
            ctx.lineTo(-L(3), L(3));
            ctx.lineTo(-L(2), 0);
            ctx.lineTo(-L(3), -L(3));
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        for (const [x, y, , , type] of bullets) {
            if (type !== 'bullet_flare' || !visible(x, y))
                continue;
            const [sx, sy] = S(x, y);
            ctx.fillStyle = '#ff5800';
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(4, L(1)), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    if (!real)
        for (const [x, y, type] of projectiles) {
            if (!visible(x, y))
                continue;
            const [sx, sy] = S(x, y);
            ctx.fillStyle = String(type).includes('smoke') ? '#d8d8d8' : '#3a6b2a';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(3, L(0.6)), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = `${10 * devicePixelRatio}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillText(String(type).includes('smoke') ? '연막' : '💣', sx, sy - 6 * devicePixelRatio);
        }
    ctx.strokeStyle = '#ffe9a0';
    ctx.lineWidth = Math.max(1, L(0.15));
    if (!real)
        for (const [x, y, dx, dy] of bullets) {
            if (!visible(x, y))
                continue;
            const [a, b] = S(x, y), [c, d] = S(x - dx * 2.5, y - dy * 2.5);
            ctx.beginPath();
            ctx.moveTo(a, b);
            ctx.lineTo(c, d);
            ctx.stroke();
        }
    if (!showInfo && real)
        return;
    for (const [pid, it] of Object.entries(intents)) {
        const p = players.get(+pid), who = squadOf.get(+pid);
        if (!p || p.dead || !who || (!showAll && who.squad !== follow))
            continue;
        const [move, , , mx, my, tid] = it;
        const [px, py] = S(p.x, p.y);
        if (mx != null) {
            const [qx, qy] = S(mx, my);
            ctx.strokeStyle = moveColor(move);
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(qx, qy);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = moveColor(move);
            ctx.beginPath();
            ctx.arc(qx, qy, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        const t = tid != null ? players.get(tid) : null;
        if (t && !t.dead) {
            const [tx, ty] = S(t.x, t.y);
            ctx.strokeStyle = 'rgba(255,77,77,.85)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(tx, ty);
            ctx.stroke();
        }
    }
    if (showVision)
        for (const p of players.values()) {
            const who = squadOf.get(p.id);
            if (!who || who.squad !== follow || p.dead || !p.zoom)
                continue;
            const hw = p.zoom + 4, hh = hw / (16 / 9), [x0, y0] = S(p.x - hw, p.y + hh), [x1, y1] = S(p.x + hw, p.y - hh);
            ctx.strokeStyle = 'rgba(255,255,255,.45)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
            ctx.setLineDash([]);
        }
    for (const p of players.values()) {
        if (!visible(p.x, p.y, 3))
            continue;
        const who = squadOf.get(p.id);
        if (!who)
            continue;
        const [x, y] = S(p.x, p.y), r = Math.max(4, L(1)), color = SQUAD_COLORS[who.index % SQUAD_COLORS.length];
        if (p.dead) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - r, y - r);
            ctx.lineTo(x + r, y + r);
            ctx.moveTo(x + r, y - r);
            ctx.lineTo(x - r, y + r);
            ctx.stroke();
            continue;
        }
        if (real) {
            ctx.lineWidth = Math.max(2, L(0.18));
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(r, L(1.2)), 0, Math.PI * 2);
            ctx.stroke();
            if (who.squad === 's0') {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, Math.max(r, L(1.2)) + Math.max(2, L(0.18)), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        else {
            ctx.globalAlpha = p.downed ? 0.5 : 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = who.squad === 's0' ? '#ffffff' : 'rgba(0,0,0,.6)';
            ctx.lineWidth = who.squad === 's0' ? 3 : 1.5;
            ctx.stroke();
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + p.dx * r * 1.8, y - p.dy * r * 1.8);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        const w = r * 2.4;
        ctx.fillStyle = '#300';
        ctx.fillRect(x - w / 2, y - r - 8, w, 3);
        ctx.fillStyle = p.downed ? '#e0a030' : '#6ad06a';
        ctx.fillRect(x - w / 2, y - r - 8, w * p.hp / 100, 3);
        const th = threatOf[p.id];
        if (th !== undefined && camera.scale > 1.5) {
            ctx.font = `bold ${10 * devicePixelRatio}px system-ui`;
            ctx.textAlign = 'center';
            ctx.fillStyle = th >= 0.6 ? '#ff4d4d' : th >= 0.35 ? '#ffb347' : '#ffe680';
            ctx.strokeStyle = 'rgba(0,0,0,.75)';
            ctx.lineWidth = 3;
            ctx.strokeText(`위협 ${th.toFixed(2)}`, x, y - r - 11);
            ctx.fillText(`위협 ${th.toFixed(2)}`, x, y - r - 11);
        }
        if (camera.scale > 3) {
            ctx.fillStyle = '#fff';
            ctx.font = `${11 * devicePixelRatio}px system-ui`;
            ctx.textAlign = 'center';
            const label = (who.squad === follow ? who.name + ' · ' : '') + (p.weapon === 'fists' ? '👊' : p.weapon ?? '');
            ctx.fillText(label, x, y + r + 13 * devicePixelRatio);
        }
    }
}
const ITEMS = [['bandage', '붕대'], ['healthkit', '구급상자'], ['soda', '음료'], ['painkiller', '진통제'], ['frag', '수류탄'], ['mirv', 'MIRV'], ['smoke', '연막']];
const level = type => Number((/(\d+)$/.exec(type ?? '') ?? [0, 0])[1]);
function renderHud() {
    const hud = document.getElementById('hud');
    const s = follow ? map?.squads.find(q => q.id === follow) : null;
    const alive = s ? s.members.map(m => players.get(m.pid)).filter(p => p && !p.dead) : [];
    const p = gameCam ? (alive.find(q => q.id === focusPid) ?? alive[0]) : null;
    if (!p) {
        hud.hidden = true;
        return;
    }
    hud.hidden = false;
    const who = squadOf.get(p.id), img = type => { const src = Real.ready() ? Real.icon(type) : null; return src ? `<img src="${src}" alt="">` : ''; };
    const gear = (type, label) => `<div class="box" title="${label} ${type || '없음'}">${type ? img(type) : `<span class="none">${label}</span>`}${level(type) ? `<b>${level(type)}</b>` : ''}</div>`;
    let at = 0, boost = '';
    for (const w of [25, 25, 37.5, 12.5]) {
        boost += `<i><span style="width:${Math.max(0, Math.min(100, ((p.boost ?? 0) - at) / w * 100))}%"></span></i>`;
        at += w;
    }
    const slot = (i, type, ammo, reserve) => `<div class="box slot${p.slot === i ? ' on' : ''}"><span class="n">${i + 1}</span>${type ? img(type) : '<span></span>'}<span class="name">${type || ''}</span>${ammo != null && type ? `<span class="ammo">${ammo}<small> / ${reserve}</small></span>` : '<span></span>'}</div>`;
    const ctl = map.squads.find(q => q.id === who?.squad)?.controller;
    const doing = p.action === 3 ? ' · 회복 중' : p.action === 4 ? ' · 소생 중' : p.action === 1 || p.action === 2 ? ' · 재장전' : '';
    const left = [...players.values()].filter(q => !q.dead).length, nowMs = performance.now();
    killFeed = killFeed.filter(k => nowMs - k.at < 7000);
    const what = p.action === 1 || p.action === 2 ? 'Reloading' : p.action === 3 ? `Using ${p.actionItem}` : p.action === 4 ? 'Reviving' : '';
    hud.innerHTML = `
    <div class="alive box">${left}<small>Alive</small></div>
    <div class="kills">${killFeed.map(k => `<div class="box${k.mine ? ' mine' : ''}">${k.text}</div>`).join('')}</div>
    ${what ? `<div class="doing box">${what}</div>` : ''}
    <div class="who box">${who?.name ?? p.id} 관전 중<small>${CONTROLLER[ctl] ?? ''} · 킬 ${p.kills ?? 0}${doing}</small></div>
    <div class="items">${ITEMS.map(([type, name], i) => `<div class="box item${p.items[i] ? '' : ' zero'}" title="${name}">${img(type)}<span>${p.items[i]}</span></div>`).join('')}</div>
    <div class="bottom">
      <div class="gear">${gear(p.helmet, '헬멧')}${gear(p.chest, '조끼')}${gear(p.backpack, '가방')}${gear(p.scope, '스코프')}${(p.perks ?? []).map(t => gear(t, '퍽')).join('')}</div>
      <div class="boost">${boost}</div>
      <div class="hp box"><span class="${p.downed ? 'downed' : p.hp <= 25 ? 'low' : ''}" style="width:${p.downed ? 100 : Math.max(0, p.hp)}%"></span><em>${p.downed ? '기절' : Math.round(p.hp)}</em></div>
    </div>
    <div class="weapons">${slot(0, p.gun1, p.ammo1, p.reserve[0])}${slot(1, p.gun2, p.ammo2, p.reserve[1])}${slot(2, p.melee || 'fists', null)}${slot(3, p.throwable, null)}</div>`;
}
function syncButtons() {
    for (const [id, on] of [['allIntents', showAll], ['vision', showVision], ['real', showReal], ['gameCam', gameCam], ['asGame', asGame], ['info', showInfo], ['sound', wantSound], ['pause', paused]]) {
        const b = document.getElementById(id);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
    }
}
function renderPanel() {
    syncButtons();
    renderHud();
    if (!map)
        return;
    document.getElementById('squads').innerHTML = map.squads.map((s, i) => `<div class="squad ${s.id === follow ? 'followed' : ''}" data-id="${s.id}"><span class="dot" style="background:${SQUAD_COLORS[i % SQUAD_COLORS.length]}"></span>${s.id} <span class="muted">생존 ${alive[s.id] ?? '?'}</span><span class="tag">${CONTROLLER[s.controller]}</span></div>`).join('');
    const s = map.squads.find(q => q.id === follow);
    document.getElementById('agents').innerHTML = !s ? '<div class="muted">자유 시점 (스쿼드를 클릭하면 따라감)</div>' : s.members.map(m => {
        const p = players.get(m.pid), it = intents[m.pid];
        if (!p)
            return '';
        const state = p.dead ? '사망' : p.downed ? '기절' : `${p.hp} HP`;
        const target = it && it[5] != null ? (squadOf.get(it[5])?.name ?? '?') : '없음';
        const guns = [p.gun1 ? `${p.gun1} (${p.ammo1})` : '빈 슬롯', p.gun2 ? `${p.gun2} (${p.ammo2})` : '빈 슬롯'].join(' · ');
        const watching = gameCam && (focusPid === m.pid || (focusPid == null && s.members.find(x => !players.get(x.pid)?.dead) === m));
        return `<div class="agent${watching ? ' watching' : ''}" data-pid="${m.pid}" title="클릭: 인게임 시점으로 이 플레이어 보기"><div class="top"><b>${m.id}${watching ? ' 👁' : ''}</b><span class="muted">손: ${p.weapon ?? ''}</span></div>
      <div class="muted">총: ${guns}</div>
      <div class="muted">회복: 붕대 ${p.items[0]} · 구급상자 ${p.items[1]} · 음료 ${p.items[2]} · 진통제 ${p.items[3]} | 부스트 ${p.boost ?? 0} | 투척: 수류탄 ${p.items[4]} · MIRV ${p.items[5]} · 연막 ${p.items[6]}${p.action === 3 ? ' | <b>회복 중</b>' : p.action === 4 ? ' | <b>소생 중</b>' : p.action === 1 || p.action === 2 ? ' | 재장전' : ''}</div>
      <div class="hp"><div style="width:${p.dead ? 0 : p.hp}%"></div></div><div class="muted">${state}</div>
      ${it && !p.dead ? `<div class="intent">${MOVES[it[0]]} · 타겟 ${target} · ${MODES[it[2]]}</div>` : ''}</div>`;
    }).join('');
}
document.getElementById('squads').addEventListener('pointerdown', e => { const el = e.target.closest('.squad'); if (el) {
    follow = el.dataset.id;
    focusPid = null;
    renderPanel();
} });
document.getElementById('agents').addEventListener('pointerdown', e => {
    const el = e.target.closest('.agent');
    if (!el || !follow)
        return;
    focusPid = Number(el.dataset.pid);
    setGameCam(true);
    renderPanel();
});
let last = performance.now(), panelAt = 0;
function loop(now) {
    playMs = Math.max(tickMs, arriveMs || tickMs) * Math.max(0.7, Math.min(1.5, 1 - (queue.length - PLAY_BUFFER) * 0.04));
    playClock += Math.min(now - last, 500);
    last = now;
    while (queue.length && playClock >= playMs) {
        apply(queue.shift());
        playClock -= playMs;
    }
    if (!queue.length)
        playClock = Math.min(playClock, playMs);
    const glideAt = Math.min(1, playClock / playMs);
    for (const p of players.values())
        glide(p, glideAt);
    const m = Math.floor(gameTime / 60), s = Math.floor(gameTime % 60);
    document.getElementById('clock').textContent = map ? `에피소드(판) ${map.episode} · 게임 시간 ${m}:${String(s).padStart(2, '0')}${playMs > tickMs * 1.15 ? ` · 진행 속도 ${(tickMs / playMs).toFixed(2)}× (계산이 실시간보다 느림)` : ''}` : '첫 판 대기 중…';
    if (now - panelAt > 250) {
        renderPanel();
        panelAt = now;
    }
    try {
        draw();
    }
    catch (e) {
        console.error(e);
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
