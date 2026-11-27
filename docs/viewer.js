const MOVES = ["Wait", "Loot", "Cover", "Peek", "Regroup", "Zone", "Retreat", "Dodge", "Explore", "Push", "Hold a spot", "Revive", "Advance", "Flank", "Retreat", "Explore", "Hunt"];
const MODES = ['총', '근접', '수류탄', '섬광', '회복', '재장전'];
const CONTROLLER = { learner: '학습 모델', model: '모델/과거', bot: '스크립트 봇' };
const CONTROLLER_SHORT = { learner: '학습', model: '모델', bot: '봇' };
const PERK_INFO = {
    firepower: ['Firepower', '모든 총의 탄창이 커지고 재장전이 빨라짐'],
    windwalk: ['Windwalk', '총알이 5 안으로 스치면 3초 동안 빨라짐'],
    endless_ammo: ['Endless Ammo', '탄약이 줄지 않음'],
    steelskin: ['Steelskin', '받는 피해 45% 감소, 몸이 40% 커짐'],
    splinter: ['Splinter Rounds', '맞힌 총알이 갈라짐(본탄은 피해 0.6배)'],
    small_arms: ['Small Arms', '몸이 25% 작아지고 총을 바로 꺼냄'],
    takedown: ['Takedown', '적을 죽이면 체력 25, 부스트 25, 3초 가속'],
    field_medic: ['Combat Medic', '회복 아이템을 쓰는 동안에도 제 속도로 걸음'],
    tree_climbing: ['Tree Climbing', '나무를 통과하고 물에서 빠름'],
    scavenger: ['Scavenger', '상자를 부수면 아이템이 하나 더 나옴'],
    scavenger_adv: ['Master Scavenger', '상자를 부수면 좋은 아이템이 하나 더 나옴'],
    chambered: ['One in the Chamber', '탄창의 첫 발과 마지막 발 피해 25% 증가(산탄 제외)'],
    martyrdom: ['Martyrdom', '죽을 때 수류탄 파편 12개가 터짐'],
    bonus_45: ['.45 in the Chamber', '.45 탄 피해 12% 증가'],
    bonus_9mm: ['9mm Overpressure', '9mm 탄 피해 12% 증가, 더 빠르고 멀리'],
    broken_arrow: ['Broken Arrow', '스트로브 폭격이 2번 더'],
    fabricate: ['Fabricate', '10초마다 가방이 수류탄·MIRV(가끔 스트로브)로 채워짐'],
    self_revive: ['Revivify', '기절해도 혼자 일어남'],
    flak_jacket: ['Flak Jacket', '받는 피해 10%, 폭발 피해 90% 감소, 수류탄 칸 늘어남'],
    amped_explosives: ['Hyperfragmentation', '투척이 1.75배 멀리, 2배 빠르게, 파편 2배·피해 1.5배'],
    explosive: ['Explosive Rounds', '맞힌 총알이 폭발함'],
    bonus_assault: ['Hollow-Points', '모든 총알 피해 8% 증가, 이동 10% 빠름'],
    high_velocity: ['High-Velocity Rounds', '총알이 1.4배 빠르고 1.3배 멀리'],
    ap_rounds: ['AP Rounds', '방어구 80% 관통, 장애물 피해 1.5배'],
    targeting: ['Targeting', '피해 25% 증가'],
    gotw: ['Gift of the Wild', '초당 체력 1 회복, 몸이 20% 커짐'],
    lifeline: ['Indomitable', '부스트가 천천히 줄고, 부스트를 써서 체력을 회복'],
    combat_stims: ['Combat Stimulants', '5초 동안 피해 15% 증가, 체력 6% 회복'],
    aoe_heal: ['Mass Medicate', '회복 아이템이 주변 팀원도 회복'],
    leadership: ['Leadership', '부스트가 늘 가득, 몸이 25% 커짐(역할)'],
    assume_leadership: ['Assume Leadership', '부스트가 50 아래로 안 내려감, 몸이 15% 커짐'],
    final_bugle: ['Last Breath', '죽을 때 60 안의 팀원 피해 8% 증가·5초 가속'],
    inspiration: ['Inspiration', '나팔로 주변 팀원을 빠르게 함(역할)'],
    pirate: ["Pirate's Bounty", '해적 보물 아이템을 더 찾음'],
    hunted: ['The Hunted', '위치가 드러나는 역할'],
    rare_potato: ['Rare Potato', '감자 모드 퍽'],
    turkey_shoot: ['Perky Shoot', '이벤트 퍽'],
    halloween_mystery: ['Trick or Treat?', '주우면 아래 10개 중 하나가 무작위: 트릭 5개·트리트 4개 각 11%, 오카미 바 1%. 버릴 수 없음'],
    trick_nothing: ['One With Nothing (트릭)', '아무 효과 없음, 퍽 칸만 차지'],
    trick_size: ['Feedership (트릭)', '몸이 25% 커짐(맞기 쉬움)'],
    trick_m9: ['Dev Troll Special (트릭)', '두 번째 총 칸이 버릴 수 없는 저주받은 M9로 바뀜(원래 총은 사라짐)'],
    trick_chatty: ['Gabby Ghost (트릭)', '5~15초마다 이모트를 저절로 씀(이미 나를 보는 사람에게만 보여서 위치는 안 드러남)'],
    trick_drain: ['That Sucks (트릭)', '3초마다 체력 1씩 깎임'],
    treat_9mm: ['Candy Corn (트리트)', '9mm 탄 피해 12% 증가'],
    treat_12g: ['Red Jelly Beans (트리트)', '12게이지 탄 피해 12% 증가'],
    treat_556: ['Sour Apple Belt (트리트)', '5.56mm 탄 피해 12% 증가'],
    treat_762: ['Blueberry Taffy (트리트)', '7.62mm 탄 피해 12% 증가'],
    treat_super: ['Full Size OKAMI Bar (트리트)', '모든 총알 피해 8% 증가'],
};
const PERK_KINDS = { neutral: ['트릭 (중립)', '#9aa0a6'], trick: ['트릭 (나쁜 효과)', '#ff5c5c'], treat: ['트리트 (좋은 효과)', '#5ce0b0'], mystery: ['할로윈 미스터리', '#c77dff'], perk: ['퍽', '#f0c94a'] };
const perkKind = t => t === 'trick_nothing' || t === 'trick_chatty' ? 'neutral' : t.startsWith('trick_') ? 'trick' : t.startsWith('treat_') ? 'treat' : t === 'halloween_mystery' ? 'mystery' : 'perk';
const perkTipEl = document.getElementById('perkTip');
function showPerk(type, x, y) {
    const [name, what] = PERK_INFO[type] ?? [type, '설명 없음'], [kindName, color] = PERK_KINDS[perkKind(type)], src = Real.ready() ? Real.icon(type) : null;
    if (perkTipEl.dataset.type !== type) {
        perkTipEl.dataset.type = type;
        perkTipEl.style.setProperty('--tip', color);
        perkTipEl.innerHTML = `<div class="head">${src ? `<img src="${src}" alt="">` : ''}<div><div class="name">${name.replace(/ \((트릭|트리트)\)$/, '')}</div><span class="kind">${kindName}</span></div></div><div class="what">${what}</div><div class="id">${type}</div>`;
    }
    perkTipEl.hidden = false;
    const w = perkTipEl.offsetWidth, h = perkTipEl.offsetHeight;
    perkTipEl.style.left = `${x + 16 + w > innerWidth ? x - 16 - w : x + 16}px`;
    perkTipEl.style.top = `${y + 16 + h > innerHeight ? Math.max(4, y - 16 - h) : y + 16}px`;
}
document.addEventListener('mousemove', e => { const el = e.target.closest?.('[data-perk]'); if (el)
    showPerk(el.dataset.perk, e.clientX, e.clientY);
else if (!perkTipEl.hidden) {
    perkTipEl.hidden = true;
    perkTipEl.dataset.type = '';
} });
document.addEventListener('mouseleave', () => { perkTipEl.hidden = true; perkTipEl.dataset.type = ''; });
const SQUAD_COLORS = ['#ffd84a', '#ff5c5c', '#5cb8ff', '#c77dff', '#ff9a3c', '#5ce0b0', '#ff7eb6', '#9be15d', '#00c2d1', '#b8860b',
    '#e05cff', '#7d8cff', '#ffb3a7', '#2ec27e', '#f6d32d', '#a0522d', '#ff4f00', '#8fd3ff', '#c0c0c0', '#6a5acd'];
const tintOf = pid => { const i = squadOf.get(pid)?.index; return i == null ? null : parseInt(SQUAD_COLORS[i % SQUAD_COLORS.length].slice(1), 16); };
const moveColor = m => ["#d9d9d9", "#7fd3ff", "#7dff9b", "#7dff9b", "#d9d9d9", "#d9d9d9", "#ffb36b", "#ffb36b", "#7fd3ff", "#ff4dd2", "#7dff9b", "#d9d9d9", "#7dff9b", "#7dff9b", "#ffb36b", "#7fd3ff", "#ff4dd2"][m] ?? '#d9d9d9';
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
const events = new EventSource('/events');
const LIVE = !!document.getElementById('cmdLog');
events.addEventListener('map', e => {
    const msg = JSON.parse(e.data);
    if (map && map.episode === msg.episode && map.squads.length === msg.squads.length) {
        for (const o of msg.obstacles) {
            const had = obstacles.get(o.id);
            if (!had) {
                obstacles.set(o.id, { ...o, state: o.st ?? 2 });
                continue;
            }
            Object.assign(had, o, { state: o.st ?? 2, shape: null });
        }
        (msg.buildings ?? []).forEach(([, , , , , , ceiling], i) => { if (buildings[i])
            buildings[i].ceiling = ceiling ?? 0; });
        map = msg;
        return;
    }
    map = msg;
    obstacles = new Map(map.obstacles.map(o => [o.id, { ...o, state: o.st ?? 2 }]));
    buildings = (map.buildings ?? []).map(([type, x, y, ori, layer, scale, ceiling], i) => ({ i, type, x, y, ori, layer, scale, ceiling: ceiling ?? 0 }));
    Real.load(map.mapName ?? 'main').then(c => Snd.use(c));
    shakes = [];
    killFeed = [];
    noteSquads();
    players.clear();
    queue = [];
    intents = {};
    threatOf = {};
    gameTime = 0;
    if (!map.squads.some(s => s.id === follow))
        follow = map.squads[0]?.id ?? 's0';
});
function noteSquads() {
    squadOf.clear();
    squadIndex.clear();
    map.squads.forEach((s, i) => { squadIndex.set(s.id, i); for (const m of s.members)
        squadOf.set(m.pid, { squad: s.id, name: m.id, index: i, assassin: m.assassin, peeker: m.peeker, lag: m.lag }); });
}
events.addEventListener('squads', e => { if (!map)
    return; map.squads = JSON.parse(e.data).squads; noteSquads(); });
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
    const last = queue.length ? queue[queue.length - 1].t : gameTime;
    queue.push(...msg.frames.filter(f => f.t > last));
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
    note(msg.skipped ? `⏭ 에피소드 ${msg.episode} 건너뜀 (${Math.round(msg.elapsed)}초)` : `🏁 에피소드 ${msg.episode} 종료 — 우승 ${msg.winner ?? '없음'} (${Math.round(msg.elapsed)}초)`, 12000);
});
events.addEventListener('state', e => {
    const s = JSON.parse(e.data);
    paused = s.paused;
    const b = document.getElementById('pause');
    b.classList.toggle('on', paused);
    pauseWord(b);
    document.getElementById('speed').value = String(s.speed);
    if (s.options) {
        runOptions = s.options;
        const el = document.getElementById('opts'), text = optionsText(s.options);
        if (el.textContent !== text)
            el.textContent = text;
        el.title = text + '\n\n' + '이 뷰어가 돌리는 판의 옵션 (환경 변수 SURVEVBOT_MAPS · LAG · JITTER · LIVE): 학습 워커와 같은 값으로 띄워야 같은 조건이에요. 딜레이는 판마다 플레이어별로 뽑고, ms는 확장의 delay로 잰 값이에요.';
    }
});
let runOptions = null;
const lagMsOf = t => t ? Math.round((2 * t + 1) * (runOptions?.tickMs ?? 33) + (runOptions?.jitterMs ?? 40) / 2) : 0;
const MAP_NAMES = { main: '기본', desert: '사막', woods: '숲', potato: '감자', snow: '설원', halloween: '할로윈', savannah: '사바나', cobalt: '코발트', faction: '진영' };
function optionsText(o) {
    const maps = (o.maps ?? []).map(m => MAP_NAMES[m] ?? m).join('·') || '기본';
    const ms = t => Math.round((2 * t + 1) * (o.tickMs ?? 33) + (o.jitterMs ?? 0) / 2);
    const lag = o.lag ? `딜레이 ${o.lag[0] === o.lag[1] ? o.lag[0] : o.lag[0] + '~' + o.lag[1]}틱 (약 ${ms(o.lag[0])}${o.lag[0] === o.lag[1] ? '' : '~' + ms(o.lag[1])}ms)` : '딜레이 없음';
    return `${maps} · ${lag} · 지터 ${o.jitterMs ?? 0}ms · ${o.live ? '실서버 구조' : '기본 구조'}`;
}
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
    if (p.anim && (!was.anim || was.anim[2] !== p.anim[2]) && (p.anim[0] === 2 || p.anim[0] === 3)) {
        const snd = cat.throwables[p.weapon]?.snd ?? cat.throwables[was.weapon]?.snd;
        Snd.play(p.anim[0] === 2 ? snd?.pin : snd?.throw, { channel: 'sfx', pos: p, fallOff: 3, layer: p.layer, filter: 'muffled' });
    }
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
        const [id, x, y, dx, dy, hp, downed, dead, weapon, layer, zoom, gun1, gun2, ammo1, ammo2, items, boost, action, helmet, chest, backpack, melee, throwable, scope, kills, reserve, slot, swing, actionItem, pan, perks, dealt, score, anim, act] = p;
        const was = players.get(id);
        players.set(id, { id, x, y, dx, dy, hp, downed, dead, weapon, layer, zoom, gun1, gun2, ammo1, ammo2, items: items ?? [0, 0, 0, 0, 0, 0, 0], boost, action, helmet, chest, backpack, melee, throwable, scope, kills, reserve: reserve ?? [0, 0], slot, swing: swing || null,
            actionItem: actionItem ?? '', pan: !!pan, perks: perks ?? [], dealt: dealt ?? 0, score: score ?? 0, anim: anim || null, act: act || null, tint: tintOf(id),
            recoil: was?.recoil ?? 0, emitIn: was?.emitIn ?? 0, name: squadOf.get(id)?.name ?? '' });
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
        const v = squadOf.get(ev.v)?.name ?? ev.v;
        const mine = squadOf.get(ev.by)?.squad === follow || squadOf.get(ev.v)?.squad === follow;
        killFeed.push({ text: killText(ev, ev.by != null ? squadOf.get(ev.by)?.name ?? '?' : '', v), at: performance.now(), mine, until: 7000 });
        if (killFeed.length > 8)
            killFeed.shift();
        if (eye)
            killNotice(ev, eye);
    }
}
let killMsg = null;
function killNotice(ev, eye) {
    const cat = Real.catalog(), name = pid => squadOf.get(pid)?.name ?? '?', thing = cat?.names?.[ev.w] ?? '';
    const down = ev.k === 'down', D = { bleeding: 1, gas: 2, airdrop: 3, airstrike: 4 };
    let text = '', count = '';
    if (ev.by === eye.id) {
        const self = ev.v === eye.id, complete = ev.d !== D.bleeding, verb = down ? 'knocked out' : complete ? 'killed' : 'finally killed';
        const what = ev.d === D.airstrike ? 'an air strike' : thing;
        text = `${name(eye.id)} ${verb} ${self ? 'themselves' : name(ev.v)}${what && (complete || down) ? ` with ${what}` : ''}`;
        const kills = players.get(eye.id)?.kills ?? 0;
        if (!down && !self)
            count = `${kills} ${kills === 1 ? 'Kill' : 'Kills'}`;
    }
    else if (ev.v === eye.id && down) {
        const by = ev.by != null ? name(ev.by) : ev.d === D.gas ? 'The red zone' : ev.d === D.airdrop ? 'The air drop' : ev.d === D.airstrike ? 'The air strike' : '';
        const what = ev.by != null && ev.d === D.airstrike ? 'an air strike' : thing;
        text = `${by} knocked ${name(eye.id)} out${what ? ` with ${what}` : ''}`.trim();
    }
    if (text)
        killMsg = { pid: eye.id, text, count, at: performance.now() };
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
function note(text, until = 7000) { killFeed.push({ text, at: performance.now(), note: true, until }); if (killFeed.length > 8)
    killFeed.shift(); }
function renderTop() {
    const top = document.getElementById('top');
    if (!map) {
        top.hidden = true;
        return;
    }
    top.hidden = false;
    const left = [...players.values()].filter(q => !q.dead).length, nowMs = performance.now();
    killFeed = killFeed.filter(k => nowMs - k.at < (k.until ?? 7000));
    top.innerHTML = `<div class="alive box">${left}<small>Alive</small></div>
    <div class="kills">${killFeed.map(k => `<div class="box${k.mine ? ' mine' : ''}${k.note ? ' note' : ''}">${k.text}</div>`).join('')}</div>`;
}
const control = q => fetch('/control?' + q).catch(() => { });
let paused = false;
function pauseWord(b) { const word = b.querySelector('span'); if (word)
    word.textContent = paused ? '재생' : '일시정지';
else
    b.textContent = paused ? '재생' : '일시정지'; }
document.getElementById('pause').onclick = e => { paused = !paused; e.currentTarget.classList.toggle('on', paused); pauseWord(e.currentTarget); control('pause=' + (paused ? 1 : 0)); };
document.getElementById('next').onclick = () => { queue = []; control('next=1'); };
document.getElementById('speed').onchange = e => control('speed=' + e.target.value);
document.getElementById('allIntents').onclick = e => { showAll = !showAll; e.currentTarget.classList.toggle('on', showAll); };
document.getElementById('vision').onclick = e => { showVision = !showVision; e.currentTarget.classList.toggle('on', showVision); };
document.getElementById('real').onclick = e => { showReal = !showReal; e.currentTarget.classList.toggle('on', showReal); };
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
new ResizeObserver(() => resize()).observe(canvas);
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
    draw.eye = null;
    if (!map)
        return;
    const watched = follow ? (map.squads.find(q => q.id === follow)?.members ?? []).map(m => players.get(m.pid)).filter(p => p && !p.dead) : [];
    const eye = draw.eye = gameCam ? (watched.find(p => p.id === focusPid) ?? watched[0]) : null;
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
    for (const o of obstacles.values()) {
        const by = o.pl !== undefined && players.get(o.pl);
        if (!by)
            continue;
        if (o.c) {
            const dx = by.x - o.x, dy = by.y - o.y;
            if (o.c[0] === 0)
                o.c = [0, o.c[1] + dx, o.c[2] + dy, o.c[3]];
            else
                o.c = [o.c[0], o.c[1] + dx, o.c[2] + dy, o.c[3] + dx, o.c[4] + dy];
        }
        o.x = by.x;
        o.y = by.y;
        o.l = by.layer;
    }
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
        if (!real) {
            ctx.globalAlpha = p.downed ? 0.5 : 1;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,.6)';
            ctx.lineWidth = 1.5;
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
        if (p.boost > 0 && !p.dead) {
            ctx.fillStyle = 'rgba(0,0,0,.5)';
            ctx.fillRect(x - w / 2, y - r - 4, w, 2);
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(x - w / 2, y - r - 4, w * Math.min(100, p.boost) / 100, 2);
        }
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
            const label = (who.squad === follow ? who.name + (who.assassin ? ' 암살형' : who.peeker ? ' 피커형' : '') + ' · ' : '') + (p.weapon === 'fists' ? '👊' : p.weapon ?? '');
            ctx.fillText(label, x, y + r + 13 * devicePixelRatio);
        }
    }
    if (typeof drawOrders === 'function')
        drawOrders();
}
function gameUi() {
    const eye = draw.eye, box = document.getElementById('killmsg');
    const age = killMsg ? (performance.now() - killMsg.at) / 1000 : Infinity;
    if (!box) { }
    else if (!eye || !killMsg || killMsg.pid !== eye.id || age > 7)
        box.hidden = true;
    else {
        if (box.dataset.at !== String(killMsg.at)) {
            box.firstChild.textContent = killMsg.text;
            box.lastChild.textContent = killMsg.count;
            box.dataset.at = String(killMsg.at);
        }
        box.hidden = false;
        box.style.opacity = String(Math.min(1, (7 - age) / 0.2));
    }
    if (!eye)
        return;
    const cat = Real.catalog();
    let label = '', elapsed = 0, duration = 0;
    if (eye.act && eye.action) {
        [elapsed, duration] = eye.act;
        if (eye.action === 1 || eye.action === 2)
            label = 'Reloading';
        else if (eye.action === 3)
            label = `Using ${cat?.names?.[eye.actionItem] ?? eye.actionItem}`;
        else if (eye.action === 4)
            label = eye.downed || !eye.act[2] ? 'Reviving' : `Reviving ${squadOf.get(eye.act[2])?.name ?? ''}`;
    }
    else if (eye.anim?.[0] === 2) {
        const fuse = cat?.throwables[eye.weapon]?.fuse;
        if (fuse) {
            elapsed = eye.anim[1];
            duration = fuse;
            label = `Cooking ${cat.names?.[eye.weapon] ?? eye.weapon}`;
        }
    }
    if (!label || !(duration > 0))
        return;
    const d = devicePixelRatio || 1, cx = canvas.width / 2, cy = canvas.height / 3, done = Math.min(1, elapsed / duration);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.27)';
    ctx.beginPath();
    ctx.arc(cx, cy, 36 * d, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6 * d;
    ctx.beginPath();
    ctx.arc(cx, cy, 35 * d, -Math.PI / 2, -Math.PI / 2 + done * Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${24 * d}px "Roboto Condensed", Arial, sans-serif`;
    ctx.lineWidth = 3 * d;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#fff';
    const left = Math.max(0, duration - elapsed).toFixed(1);
    ctx.strokeText(left, cx, cy);
    ctx.fillText(left, cx, cy);
    const w = (56 + label.length * 24 * 0.45) * d, h = 36 * d, y = cy + 87.5 * d;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(cx - w / 2, y - h / 2, w, h, 5 * d);
    ctx.fill();
    ctx.font = `300 ${24 * d}px "Roboto Condensed", Arial, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText(label, cx, y);
    ctx.restore();
}
const ITEMS = [['bandage', '붕대'], ['healthkit', '구급상자'], ['soda', '음료'], ['painkiller', '진통제'], ['frag', '수류탄'], ['mirv', 'MIRV'], ['strobe', '섬광탄']];
function full(p, type, n) {
    const cat = Real.catalog(), cap = cat?.bags?.[type]?.[cat.gear[p.backpack]?.level ?? 0];
    return cap != null && n > 0 && n >= cap;
}
const fullRounds = (p, gun, n) => full(p, Real.catalog()?.guns[gun]?.ammo, n);
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
    const gear = (type, label, perk) => `<div class="box${perk ? ' perk' : ''}" ${perk ? `data-perk="${type}"` : `title="${label} ${type || '없음'}"`}>${type ? img(type) : `<span class="none">${label}</span>`}${level(type) ? `<b>${level(type)}</b>` : ''}</div>`;
    let at = 0, boost = '';
    for (const w of [25, 25, 37.5, 12.5]) {
        boost += `<i><span style="width:${Math.max(0, Math.min(100, ((p.boost ?? 0) - at) / w * 100))}%"></span></i>`;
        at += w;
    }
    const slot = (i, type, ammo, reserve) => `<div class="box slot${p.slot === i ? ' on' : ''}"><span class="n">${i + 1}</span>${type ? img(type) : '<span></span>'}<span class="name">${type || ''}</span>${ammo != null && type ? `<span class="ammo">${ammo}<small${fullRounds(p, type, reserve) ? ' class="full"' : ''}> / ${reserve}</small></span>` : '<span></span>'}</div>`;
    const ctl = map.squads.find(q => q.id === who?.squad)?.controller;
    const doing = p.action === 3 ? ' · 회복 중' : p.action === 4 ? (p.downed ? ' · 소생 받는 중' : ' · 소생 중') : p.action === 1 || p.action === 2 ? ' · 재장전' : '';
    const team = s.members.map(m => {
        const q = players.get(m.pid);
        if (!q)
            return '';
        const hp = q.dead ? 0 : Math.max(0, Math.min(100, q.hp)), cls = q.downed ? 'downed' : hp <= 25 ? 'low' : '';
        return `<div class="box${q.id === p.id ? ' me' : ''}${q.dead ? ' dead' : ''}">${m.id}${m.assassin ? ' 암살형' : m.peeker ? ' 피커형' : ''}${m.lag ? ` · ${lagMsOf(m.lag)}ms` : ''}${q.dead ? ' · 사망' : q.downed ? ` · 기절 ${Math.round(hp)}` : ''}<i><span class="${cls}" style="width:${hp}%"></span></i></div>`;
    }).join('');
    const bar = document.getElementById('bar'), below = (bar?.closest('#stage') ? bar.offsetHeight : 0) + 16;
    hud.innerHTML = `
    <div class="team" style="top:${below}px">${team}</div>
    <div class="who box" style="top:${below}px">${who?.name ?? p.id} 관전 중<small>${who?.assassin ? '암살형 봇' : who?.peeker ? '피커형 봇' : CONTROLLER[ctl] ?? ''} · 킬 ${p.kills ?? 0}${who?.lag ? ` · 딜레이 약 ${lagMsOf(who.lag)}ms` : ''}${doing}</small></div>
    <div class="items">${ITEMS.map(([type, name], i) => `<div class="box item${p.items[i] ? '' : ' zero'}${full(p, type, p.items[i]) ? ' full' : ''}" title="${name}${full(p, type, p.items[i]) ? ' (가방 가득)' : ''}">${img(type)}<span>${p.items[i]}</span></div>`).join('')}</div>
    <div class="bottom">
      <div class="gear">${gear(p.helmet, '헬멧')}${gear(p.chest, '조끼')}${gear(p.backpack, '가방')}${gear(p.scope, '스코프')}${(p.perks ?? []).map(t => gear(t, '퍽', true)).join('')}</div>
      <div class="boost">${boost}</div>
      <div class="hp box"><span class="${p.downed ? 'downed' : p.hp <= 25 ? 'low' : ''}" style="width:${Math.max(0, p.hp)}%"></span><em>${p.downed ? `기절 · ${Math.round(p.hp)}` : Math.round(p.hp)}</em></div>
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
    renderTop();
    if (!map)
        return;
    const standing = s => s.members.filter(m => { const p = players.get(m.pid); return p && !p.dead; }).length;
    const out = [];
    document.getElementById('squads').innerHTML = map.squads.map((s, i) => {
        const n = players.size ? standing(s) : alive[s.id] ?? s.members.length, dead = n === 0;
        if (dead && LIVE) {
            out.push(s.id);
            return '';
        }
        const gear = players.size ? s.members.reduce((t, m) => { const p = players.get(m.pid); return t + (p && !p.dead ? p.score ?? 0 : 0); }, 0) : null;
        const hidden = s.members.filter(m => m.assassin).length;
        const peeking = s.members.filter(m => m.peeker).length;
        const badges = [hidden ? `<span class="assassin" title="암살형 봇 ${hidden}명">암살 ${hidden}</span>` : '', peeking ? `<span title="피커형 봇 ${peeking}명">피커 ${peeking}</span>` : '', s.joinAt ? `<span title="${s.joinAt}초에 들어옴">${s.joinAt}s</span>` : ''].join('');
        return `<div class="squad${s.id === follow ? ' followed' : ''}${dead ? ' dead' : ''}" data-id="${s.id}" title="${dead ? '전멸' : '클릭: 따라가기'}"><span class="dot" style="background:${SQUAD_COLORS[i % SQUAD_COLORS.length]}"></span><span class="sid">${s.id}</span><span class="left">${dead ? '전멸' : `${n}/${s.members.length}`}</span><span class="gear" title="스쿼드 장비 점수 합 (살아 있는 멤버)">${gear != null && !dead ? `장비 ${gear.toFixed(1)}` : ''}</span><span class="badges">${badges}</span><span class="tag ${s.controller}" title="${CONTROLLER[s.controller]}">${CONTROLLER_SHORT[s.controller]}</span></div>`;
    }).join('') + (out.length ? `<div class="wiped" title="전멸한 스쿼드">전멸 ${out.length} · ${out.join(' ')}</div>` : '');
    const s = map.squads.find(q => q.id === follow);
    const icon = (type, perk) => { const src = Real.ready() ? Real.icon(type) : null, tip = perk ? '' : ` title="${type}"`; return src ? `<img src="${src}" alt="${type}"${tip}>` : `<span${tip}>${type}</span>`; };
    const cell = (type, n, title, cls = '', perk) => `<div class="ic${cls}${perk ? ' perk' : ''}${n === 0 ? ' zero' : ''}" ${perk ? `data-perk="${type}"` : `title="${title}${type ? ` ${type}` : ' 없음'}"`}>${type ? icon(type, perk) : `<span class="muted">${title}</span>`}${n ? `<b>${n}</b>` : ''}</div>`;
    const gunCell = (p, type, ammo, reserve, on) => type ? `<div class="gun${on ? ' on' : ''}" title="${type}">${icon(type)}<span>${type}</span><span class="ammo">${ammo} <span class="muted${fullRounds(p, type, reserve) ? ' full' : ''}">/ ${reserve}</span></span></div>` : `<div class="gun" title="빈 슬롯"><span></span><span class="muted">빈 슬롯</span><span></span></div>`;
    const agentsTitle = document.getElementById('agentsTitle');
    if (agentsTitle)
        agentsTitle.innerHTML = s ? `<span style="white-space:nowrap">따라가는 스쿼드 ${s.id}</span><span class="hint">${CONTROLLER[s.controller]} · 카드 클릭: 인게임 시점${s.controller !== 'bot' ? ' · 📣: 명령' : ''}</span>` : '따라가는 스쿼드';
    document.getElementById('agents').innerHTML = !s ? '<div class="muted">자유 시점 (스쿼드를 클릭하면 따라감)</div>' : s.members.map(m => {
        const p = players.get(m.pid), it = intents[m.pid];
        if (!p)
            return '';
        const state = p.dead ? '사망' : p.downed ? `기절 ${p.hp} HP` : `${p.hp} HP`;
        const target = it && it[5] != null ? (squadOf.get(it[5])?.name ?? '?') : '없음';
        const watching = gameCam && (focusPid === m.pid || (focusPid == null && s.members.find(x => !players.get(x.pid)?.dead) === m));
        const doing = p.action === 3 ? '<b>회복 중</b>' : p.action === 4 ? (p.downed ? '<b>소생 받는 중</b>' : '<b>소생 중</b>') : p.action === 1 || p.action === 2 ? '재장전' : '';
        const commandable = LIVE && s.controller !== 'bot' && !p.dead;
        if (p.dead)
            return `<div class="agent dead" data-pid="${m.pid}"><div class="top"><b>${m.id}</b>${m.assassin ? '<span class="kind">암살형</span>' : m.peeker ? '<span class="kind">피커형</span>' : ''}<span class="state">사망 · 킬 ${p.kills ?? 0} · 피해 ${p.dealt ?? 0}</span></div></div>`;
        const cells = [cell(p.melee || 'fists', null, '근접', p.slot === 2 ? ' gear' : ''), ...ITEMS.map(([type, name], i) => cell(type, p.items[i], name, full(p, type, p.items[i]) ? ' full' : '')),
            cell(p.helmet, level(p.helmet) || null, '헬멧', ' gear'), cell(p.chest, level(p.chest) || null, '조끼', ' gear'), cell(p.backpack, level(p.backpack) || null, '가방', ' gear'), cell(p.scope, null, '스코프', ' gear'),
            ...(p.perks ?? []).map(t => cell(t, null, '퍽', ' gear', true))];
        return `<div class="agent${watching ? ' watching' : ''}${p.dead ? ' dead' : ''}" data-pid="${m.pid}" title="클릭: 인게임 시점으로 이 플레이어 보기"><div class="top"><b>${m.id}${watching ? ' 👁' : ''}</b>${m.assassin ? '<span class="kind">암살형</span>' : m.peeker ? '<span class="kind">피커형</span>' : ''}${commandable ? `<span class="cmdme" data-agent="${m.id}" title="이 봇에게 명령">📣</span>` : ''}<span class="state">${state}${doing ? ' · ' + doing : ''}</span></div>
      <div class="hp"><div style="width:${p.hp}%${p.downed ? ';background:#ff3b30' : ''}"></div></div>
      <div class="hp boost" title="아드레날린 ${p.boost ?? 0} (50부터 이동 속도, 있는 동안 체력 회복)"><div style="width:${Math.min(100, p.boost ?? 0)}%"></div></div>
      <div class="guns">${gunCell(p, p.gun1, p.ammo1, p.reserve[0], p.slot === 0)}${gunCell(p, p.gun2, p.ammo2, p.reserve[1], p.slot === 1)}</div>
      <div class="icons" style="grid-template-columns:repeat(${cells.length},minmax(0,1fr))">${cells.join('')}</div>
      <div class="foot"><span class="stats" title="킬 · 피해 · 장비 점수 (core items.ts loadoutScore)${m.lag ? ` · 이 판 이 플레이어의 딜레이 (한쪽 ${m.lag}틱)` : ''}">킬 <b>${p.kills ?? 0}</b> · 피해 <b>${p.dealt ?? 0}</b> · 장비 <b>${(p.score ?? 0).toFixed(1)}</b>${m.lag ? ` · <b>${lagMsOf(m.lag)}</b>ms` : ''}</span>${it ? `<span class="intent" title="정책의 지금 선택: 이동 · 타겟 · 모드">${MOVES[it[0]]} · ${target === '없음' ? '타겟 없음' : target} · ${MODES[it[2]]}</span>` : ''}</div></div>`;
    }).join('');
}
document.getElementById('squads').addEventListener('pointerdown', e => { const el = e.target.closest('.squad'); if (el && !el.classList.contains('dead')) {
    follow = el.dataset.id;
    focusPid = null;
    renderPanel();
} });
document.getElementById('agents').addEventListener('pointerdown', e => {
    const me = e.target.closest('.cmdme');
    if (me) {
        cmdWho = me.dataset.agent;
        cmdWhoAuto = false;
        renderCommand();
        document.getElementById('cmdText').focus();
        e.preventDefault();
        return;
    }
    const el = e.target.closest('.agent');
    if (!el || !follow)
        return;
    focusPid = Number(el.dataset.pid);
    setGameCam(true);
    renderPanel();
});
let last = performance.now(), panelAt = 0, paceAvg = 1, paceSlow = false;
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
    paceAvg += (Math.min(1, tickMs / playMs) - paceAvg) * 0.02;
    if (paceAvg < 0.85)
        paceSlow = true;
    else if (paceAvg > 0.95)
        paceSlow = false;
    const m = Math.floor(gameTime / 60), s = Math.floor(gameTime % 60), clockEl = document.getElementById('clock');
    const clockText = map ? `판 ${map.episode} · ${m}:${String(s).padStart(2, '0')}${paceSlow ? ` · 실시간의 ${paceAvg.toFixed(1)}배` : ''}` : '첫 판 대기 중…';
    if (clockEl.textContent !== clockText)
        clockEl.textContent = clockText;
    if (now - panelAt > 250) {
        renderPanel();
        if (LIVE) {
            renderCommand();
            renderBrainPick();
        }
        panelAt = now;
    }
    if (LIVE)
        try {
            drawBrain(now);
        }
        catch (e) {
            console.error(e);
        }
    try {
        draw();
        gameUi();
    }
    catch (e) {
        console.error(e);
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
