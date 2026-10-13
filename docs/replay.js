// The replay page: a recorded match (replays/<id>.bin, built by env/src/buildReplay.ts) played through the viewer's
// own drawing code (viewer.js). Where the live viewer gets frames from a stream, this hands them over from the
// recording — played, paused, jumped about in — and words the panels in English.
'use strict';
(async () => {
  const $ = id => document.getElementById(id);
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const thing = type => Real.catalog()?.names?.[type] ?? type ?? '';
  Object.assign(CONTROLLER, { learner: 'RL · latest', model: 'RL · snapshot', bot: 'scripted' });
  MODES.splice(0, MODES.length, 'gun', 'melee', 'grenade', 'smoke', 'boost');

  // The matches there are (replays/index.json), and the one the address asks for (?m=…), else the first.
  let rep, list, match;
  try {
    list = await (await fetch('replays/index.json')).json();
    match = list.find(m => m.id === new URLSearchParams(location.search).get('m')) ?? list[0];
    const res = await fetch(`replays/${match.id}.bin`);
    if (!res.ok) throw new Error(`match ${match.id}: ${res.status}`);
    rep = await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).json();
  } catch (error) {
    $('blurb').textContent = `The recording did not load (${error.message}). A recent Chrome, Firefox or Safari is needed.`;
    $('start').textContent = 'Not loaded';
    return;
  }
  const N = rep.frames.length, total = rep.frames[N - 1].t, types = rep.types, ids = rep.players, mapText = JSON.stringify(rep.map);

  // --- the recording, frame by frame ---
  // A frame of the file holds what changed since the one before, and every rep.key-th holds everything. step() gives
  // the frame at `at` whole, as the viewer's apply() takes one, and moves on; jump() goes to a whole frame.
  let at = 0, now = [], lootNow = new Map(), lootNext = 0, intentNow = {}, last = {};
  const lootItem = (a, i) => [a[i] / 10, a[i + 1] / 10, types[a[i + 2]], a[i + 3]];
  const setIntent = (a, i) => { intentNow[ids[a[i]]] = [a[i + 1], 0, a[i + 2], a[i + 3] == null ? null : a[i + 3] / 10, a[i + 4] == null ? null : a[i + 4] / 10, a[i + 5] < 0 ? null : ids[a[i + 5]]]; };
  function step() {
    const c = rep.frames[at], f = { n: at++, t: c.t };
    if (c.P) now = c.P.slice();
    else {
      const m = c.m ?? [];
      for (let i = 0; i < m.length; i += 5) { const a = now[m[i]] = now[m[i]].slice(); a[1] = m[i + 1] / 10; a[2] = m[i + 2] / 10; a[3] = m[i + 3] / 100; a[4] = m[i + 4] / 100; }
      for (const d of c.p ?? []) { const a = now[d[0]] = now[d[0]].slice(); for (let i = 1; i < d.length; i += 2) a[d[i]] = d[i + 1]; }
    }
    f.p = now.slice();
    const b = c.b ?? [], pr = c.pr ?? [];
    f.b = []; for (let i = 0; i < b.length; i += 7) f.b.push([b[i] / 10, b[i + 1] / 10, b[i + 2] / 100, b[i + 3] / 100, types[b[i + 4]], b[i + 5] / 10, b[i + 6]]);
    f.pr = []; for (let i = 0; i < pr.length; i += 4) f.pr.push([pr[i] / 10, pr[i + 1] / 10, types[pr[i + 2]], pr[i + 3]]);
    for (const k of ['g', 'sm', 'ad', 'pl']) { if (c[k]) last[k] = c[k]; f[k] = last[k]; }
    for (const k of ['ch', 'no', 'bc', 'os', 'fx', 'ev']) if (c[k]) f[k] = c[k];
    if (c.LO) { lootNow = new Map(); lootNext = 0; for (let i = 0; i < c.LO.length; i += 4) lootNow.set(lootNext++, lootItem(c.LO, i)); }
    for (const id of c.lr ?? []) lootNow.delete(id);
    if (c.la) for (let i = 0; i < c.la.length; i += 4) lootNow.set(lootNext++, lootItem(c.la, i));
    if (c.LO || c.lr || c.la) f.lo = [...lootNow.values()];
    if (c.I) { intentNow = {}; for (let i = 0; i < c.I.length; i += 6) setIntent(c.I, i); }
    if (c.i) for (let i = 0; i < c.i.length; i += 6) setIntent(c.i, i);
    if (c.I || c.i) f.i = { ...intentNow };
    return f;
  }

  // --- playing ---
  let playing = false, held = [], speed = 1, ended = false, shown = 0, scrubbing = false;
  let wantIntent = true, plans = {}, lastFollow = rep.end.winner ?? 's0', log = [];
  // Where on the track the followed squad knocked someone down or killed, and where it lost one of its own.
  const sideOf = new Map(rep.map.squads.flatMap(s => s.members.map(m => [m.pid, s.id])));
  const moments = rep.frames.flatMap((c, n) => (c.ev ?? []).map(ev => ({ n, by: sideOf.get(ev.by), v: sideOf.get(ev.v) })));
  let marked = null;
  function mark() {
    if (marked === follow) return;
    marked = follow;
    $('marks').innerHTML = moments.filter(m => m.by === follow || m.v === follow).map(m => `<i class="${m.by === follow ? '' : 'lost'}" style="left:${(m.n / (N - 1) * 100).toFixed(2)}%"></i>`).join('');
  }
  const nameOf = pid => squadOf.get(pid)?.name ?? '?';
  const note = f => { for (const ev of f.ev ?? []) log.push({ t: f.t, by: ev.by, v: ev.v, text: killText(ev, ev.by != null ? nameOf(ev.by) : '', nameOf(ev.v)) }); };
  const showPlans = () => { intents = wantIntent ? plans : {}; };
  // What a frame changes for good, without playing it (frames jumped over).
  const lasting = f => { for (const o of f.no ?? []) obstacles.set(o.id, { ...o, state: o.st ?? 2 }); changed(f, false); note(f); };

  const play = apply;   // the viewer's: one frame onto the screen
  window.apply = f => { note(f); play(f); shown = f.n; if (f.i) plans = f.i; showPlans(); };

  function seek(n) {
    n = Math.max(0, Math.min(N - 1, Math.round(n)));
    const following = follow;
    ReplayFeed.on.map({ data: mapText });   // the world as the match starts
    follow = following;
    log = []; plans = {};
    const from = Math.floor(n / rep.key) * rep.key;
    for (let i = 0; i < from; i++) lasting(rep.frames[i]);
    at = from;
    while (at < n) { const f = step(); lasting(f); if (f.lo) loot = f.lo; if (f.i) plans = f.i; }
    queue = []; held = []; ended = false;
    apply(step());
  }
  function setPlaying(want) {
    if (want && (ended || shown >= N - 1)) seek(0);
    if (want !== playing) {
      playing = want;
      if (want) { queue = held.concat(queue); held = []; } else { held = queue; queue = []; }
    }
    $('play').textContent = playing ? 'Pause' : 'Play';
  }
  function finish() {
    ended = true; setPlaying(false);
    const w = rep.end.winner, squad = rep.map.squads.find(s => s.id === w);
    document.querySelector('#cover h1').textContent = w ? `${w} won the match` : 'The match is over';
    $('blurb').textContent = w ? `${clock(total)} of play, ${squad?.kills ?? 0} kills. Watch it again from another squad's side: click one in the list.` : `${clock(total)} of play.`;
    $('start').textContent = 'Watch again';
    if (list.length > 1) { $('nextMatch').href = `?m=${list[(list.indexOf(match) + 1) % list.length].id}`; $('nextMatch').hidden = false; }
    $('cover').hidden = false;
  }
  function frame() {
    tickMs = rep.tickMs / speed;
    if (follow) lastFollow = follow;
    if (playing) {
      while (queue.length < 8 && at < N) queue.push(step());   // the viewer plays evenly with 8 in hand
      if (at >= N && !queue.length) finish();
    }
    if (!scrubbing) $('seek').value = shown;
    $('time').textContent = `${clock(gameTime)} / ${clock(total)}`;
    requestAnimationFrame(frame);
  }

  // --- the view ---
  function setView(player) {
    if (!follow) follow = lastFollow;
    setGameCam(player);
    if (!player) { setGameLook(false); camera.scale = 7; }
    renderPanel();
  }
  $('viewPlayer').onclick = () => setView(true);
  $('viewSquad').onclick = () => setView(false);
  $('intent').onclick = () => { wantIntent = !wantIntent; showPlans(); renderPanel(); };
  $('audio').onclick = () => { wantSound = !wantSound; Snd.enable(wantSound); renderPanel(); };
  $('play').onclick = () => setPlaying(!playing);
  $('rate').onchange = e => { speed = Number(e.target.value); };
  $('seek').addEventListener('pointerdown', () => { scrubbing = true; });
  $('seek').addEventListener('input', e => seek(Number(e.target.value)));
  for (const kind of ['change', 'pointerup', 'pointercancel', 'blur']) $('seek').addEventListener(kind, () => { scrubbing = false; });
  addEventListener('keydown', e => {
    if (e.target.closest('select, input')) return;
    if (e.code === 'Space') { e.preventDefault(); if ($('cover').hidden) setPlaying(!playing); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { e.preventDefault(); seek(shown + (e.code === 'ArrowRight' ? 150 : -150)); }
  });
  $('start').onclick = () => { $('cover').hidden = true; $('nextMatch').hidden = true; setPlaying(true); };

  // --- from one match to another: the page opens again on it (?m=…), and plays at once ---
  const AT_ONCE = 'survevbot.play';
  const remember = () => { try { sessionStorage.setItem(AT_ONCE, '1'); } catch { /* no storage: the cover shows first */ } };
  const openMatch = m => { remember(); location.search = `?m=${m.id}`; };
  const beside = step => list[(list.indexOf(match) + step + list.length) % list.length];
  $('matchPick').innerHTML = list.map((m, i) => `<option value="${m.id}"${m === match ? ' selected' : ''}>Match ${i + 1} of ${list.length} · ${m.winner} wins</option>`).join('');
  $('matchPick').onchange = e => openMatch(list.find(m => m.id === e.target.value));
  $('matchPrev').onclick = () => openMatch(beside(-1));
  $('matchNext').onclick = () => openMatch(beside(1));
  $('switch').hidden = list.length < 2;
  addEventListener('click', e => { if (e.target.closest('a[href^="?m="]')) remember(); }, true);   // the list's and the end card's links

  // --- the panels, in English (the viewer's are its own) ---
  const mine = e => squadOf.get(e.by)?.squad === follow || squadOf.get(e.v)?.squad === follow;
  window.renderPanel = () => {
    showVision = false; showAll = false; showInfo = gameCam ? wantIntent : true;   // from above: squad rings and health bars always
    renderHud();
    mark();
    for (const [id, on] of [['viewPlayer', gameCam], ['viewSquad', !gameCam && !!follow], ['intent', wantIntent], ['audio', wantSound]]) { $(id).classList.toggle('on', on); $(id).setAttribute('aria-pressed', String(on)); }
    if (!map) return;
    $('squads').innerHTML = map.squads.map((s, i) => {
      const members = s.members.map(m => players.get(m.pid)), n = members.filter(p => p && !p.dead).length, kills = members.reduce((sum, p) => sum + (p?.kills ?? 0), 0);
      return `<div class="squad${s.id === follow ? ' followed' : ''}${n ? '' : ' out'}${s.id === rep.end.winner ? ' won' : ''}" data-id="${s.id}"><span class="dot" style="background:${SQUAD_COLORS[i % SQUAD_COLORS.length]}"></span><b>${s.id}</b><span class="muted">${n} alive</span><span class="kills">${kills} kills</span><span class="tag">${CONTROLLER[s.controller]}</span></div>`;
    }).join('');
    const s = map.squads.find(q => q.id === follow);
    $('agents').innerHTML = !s ? '<div class="muted">Free camera. Click a squad to follow it.</div>' : s.members.map(m => {
      const p = players.get(m.pid), it = plans[m.pid];
      if (!p) return '';
      const state = p.dead ? 'dead' : p.downed ? 'knocked down' : `${p.hp} HP`;
      const target = it && it[5] != null ? nameOf(it[5]) : '';
      const guns = [p.gun1, p.gun2].filter(Boolean).map(thing).join(' · ') || 'no gun';
      const doing = p.action === 3 ? 'healing' : p.action === 4 ? 'reviving' : p.action === 1 || p.action === 2 ? 'reloading' : '';
      const watching = gameCam && (focusPid === m.pid || (focusPid == null && s.members.find(x => !players.get(x.pid)?.dead) === m));
      return `<div class="agent${watching ? ' watching' : ''}" data-pid="${m.pid}" title="Click for this player's view"><div class="top"><b>${m.id}${watching ? ' (watching)' : ''}</b><span class="muted">${state}</span></div>
        <div class="muted">${guns}${doing ? ` · ${doing}` : ''}</div>
        <div class="hp"><div style="width:${p.dead ? 0 : p.hp}%"></div></div>
        ${it && !p.dead ? `<div class="intent">${MOVES[it[0]]}${target ? ` → ${target}` : ''}${MODES[it[2]] ? ` · ${MODES[it[2]]}` : ''}</div>` : ''}</div>`;
    }).join('');
    $('log').innerHTML = log.slice(-40).reverse().map(e => `<div class="${mine(e) ? 'mine' : ''}"><time>${clock(e.t)}</time>${e.text}</div>`).join('') || '<div class="muted">Nothing yet</div>';
  };
  const ITEM_NAMES = [['bandage', 'Bandage'], ['healthkit', 'Med kit'], ['soda', 'Soda'], ['painkiller', 'Pills'], ['frag', 'Frag grenade'], ['mirv', 'MIRV'], ['smoke', 'Smoke grenade']];
  window.renderHud = () => {
    const hud = $('hud'), s = follow ? map?.squads.find(q => q.id === follow) : null;
    const alive = s ? s.members.map(m => players.get(m.pid)).filter(p => p && !p.dead) : [];
    const p = gameCam ? (alive.find(q => q.id === focusPid) ?? alive[0]) : null;
    if (!p) { hud.hidden = true; return; }
    hud.hidden = false;
    const who = squadOf.get(p.id), img = type => { const src = Real.ready() ? Real.icon(type) : null; return src ? `<img src="${src}" alt="">` : ''; };
    const gear = (type, label) => `<div class="box" title="${label}: ${type ? thing(type) : 'none'}">${type ? img(type) : `<span class="none">${label}</span>`}${level(type) ? `<b>${level(type)}</b>` : ''}</div>`;
    let from = 0, boost = '';
    for (const w of [25, 25, 37.5, 12.5]) { boost += `<i><span style="width:${Math.max(0, Math.min(100, ((p.boost ?? 0) - from) / w * 100))}%"></span></i>`; from += w; }
    const slot = (i, type, ammo, reserve) => `<div class="box slot${p.slot === i ? ' on' : ''}"><span class="n">${i + 1}</span>${type ? img(type) : '<span></span>'}<span class="name">${type ? thing(type) : ''}</span>${ammo != null && type ? `<span class="ammo">${ammo}<small> / ${reserve}</small></span>` : '<span></span>'}</div>`;
    const ctl = map.squads.find(q => q.id === who?.squad)?.controller, left = [...players.values()].filter(q => !q.dead).length, nowMs = performance.now();
    killFeed = killFeed.filter(k => nowMs - k.at < 7000);
    const what = p.action === 1 || p.action === 2 ? 'Reloading' : p.action === 3 ? `Using ${thing(p.actionItem)}` : p.action === 4 ? 'Reviving' : '';
    hud.innerHTML = `
      <div class="alive box">${left}<small>Alive</small></div>
      <div class="kills">${killFeed.map(k => `<div class="box${k.mine ? ' mine' : ''}">${k.text}</div>`).join('')}</div>
      ${what ? `<div class="doing box">${what}</div>` : ''}
      <div class="who box">Watching ${who?.name ?? p.id}<small>${CONTROLLER[ctl] ?? ''} · ${p.kills ?? 0} kills</small></div>
      <div class="items">${ITEM_NAMES.map(([type, name], i) => `<div class="box item${p.items[i] ? '' : ' zero'}" title="${name}">${img(type)}<span>${p.items[i]}</span></div>`).join('')}</div>
      <div class="bottom">
        <div class="gear">${gear(p.helmet, 'Helmet')}${gear(p.chest, 'Vest')}${gear(p.backpack, 'Pack')}${gear(p.scope, 'Scope')}${(p.perks ?? []).map(t => gear(t, 'Perk')).join('')}</div>
        <div class="boost">${boost}</div>
        <div class="hp box"><span class="${p.downed ? 'downed' : p.hp <= 25 ? 'low' : ''}" style="width:${p.downed ? 100 : Math.max(0, p.hp)}%"></span><em>${p.downed ? 'Knocked down' : Math.round(p.hp)}</em></div>
      </div>
      <div class="weapons">${slot(0, p.gun1, p.ammo1, p.reserve[0])}${slot(1, p.gun2, p.ammo2, p.reserve[1])}${slot(2, p.melee || 'fists', null)}${slot(3, p.throwable, null)}</div>`;
  };

  // --- start: the winner's side, paused on the first frame ---
  $('seek').max = N - 1;
  follow = lastFollow;
  seek(0);
  setView(true);
  const squads = rep.map.squads.length, w = rep.end.winner, which = list.length > 1 ? `Match ${list.indexOf(match) + 1} of ${list.length}. ` : '';
  $('matches').innerHTML = list.map((m, i) => `<a class="match${m === match ? ' on' : ''}" href="?m=${m.id}"><b>Match ${i + 1}</b><span class="muted">${m.winner} wins · ${CONTROLLER[m.by] ?? ''}</span><span class="muted">${clock(m.seconds)}</span></a>`).join('');
  $('blurb').textContent = `${which}A recorded match of survev, an open-source 2D battle royale: ${squads} squads of four, ${clock(total)} long, played on a local server. ${w ? `Squad ${w} wins it. You start on its side.` : ''}`;
  $('start').textContent = 'Watch the match'; $('start').disabled = false;
  let atOnce = false;
  try { atOnce = sessionStorage.getItem(AT_ONCE) === '1'; sessionStorage.removeItem(AT_ONCE); } catch { /* as above */ }
  if (atOnce) $('start').click();
  requestAnimationFrame(frame);
})();
