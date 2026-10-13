'use strict';
const Real = (() => {
    let cat = null, catMap = null, loading = null;
    const images = new Map();
    const tinted = new Map();
    const RES = 2;
    const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);
    async function load(mapName) {
        if (catMap === mapName && cat)
            return cat;
        if (loading && catMap === mapName)
            return loading;
        catMap = mapName;
        loading = fetch('catalog.json').then(r => r.json()).then(c => { cat = c; return c; });
        return loading;
    }
    function image(name) {
        if (!name || !cat)
            return null;
        if (images.has(name))
            return images.get(name);
        images.set(name, null);
        const path = cat.sprites[name];
        if (!path)
            return null;
        const img = new Image();
        img.onload = () => images.set(name, img);
        img.src = 'img/' + path;
        return null;
    }
    function sprite(name, tint) {
        const img = image(name);
        if (!img || !img.naturalWidth)
            return null;
        const packed = cat.spriteScale?.[cat.sprites[name]] ?? 1, w = img.naturalWidth * packed, h = img.naturalHeight * packed;
        if (tint == null || (tint & 0xffffff) === 0xffffff)
            return { src: img, w, h };
        const key = name + '|' + tint;
        let c = tinted.get(key);
        if (!c) {
            c = document.createElement('canvas');
            c.width = Math.max(1, Math.ceil(img.naturalWidth * RES));
            c.height = Math.max(1, Math.ceil(img.naturalHeight * RES));
            const g = c.getContext('2d');
            g.drawImage(img, 0, 0, c.width, c.height);
            g.globalCompositeOperation = 'multiply';
            g.fillStyle = hex(tint);
            g.fillRect(0, 0, c.width, c.height);
            g.globalCompositeOperation = 'destination-in';
            g.drawImage(img, 0, 0, c.width, c.height);
            tinted.set(key, c);
        }
        return { src: c, w, h };
    }
    function put(ctx, spr, x, y, rot, sx, sy, alpha = 1, ax = 0.5, ay = 0.5) {
        if (!spr || alpha <= 0)
            return;
        ctx.save();
        ctx.translate(x, y);
        if (rot)
            ctx.rotate(rot);
        ctx.scale(sx, sy);
        ctx.globalAlpha *= alpha;
        ctx.drawImage(spr.src, -spr.w * ax, -spr.h * ay, spr.w, spr.h);
        ctx.restore();
    }
    const rotate = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    const oriToRad = o => (o % 4) * 0.5 * Math.PI;
    const sameLayer = (a, b) => (a & 1) === (b & 1) || ((a & 2) && (b & 2));
    function regions(b, def) {
        const rot = oriToRad(b.ori), s = b.scale;
        return def.zoom.map(c => {
            if (c.t === 0) {
                const [x, y] = rotate(c.p[0] * s, c.p[1] * s, rot);
                return { t: 0, x: b.x + x, y: b.y + y, r: c.r * s };
            }
            const corners = [[c.min[0], c.min[1]], [c.max[0], c.max[1]]].map(([x, y]) => rotate(x * s, y * s, rot));
            return { t: 1, x0: b.x + Math.min(corners[0][0], corners[1][0]), y0: b.y + Math.min(corners[0][1], corners[1][1]), x1: b.x + Math.max(corners[0][0], corners[1][0]), y1: b.y + Math.max(corners[0][1], corners[1][1]) };
        });
    }
    function circleHit(c, x, y, rad) {
        if (c.t === 0) {
            const dx = x - c.x, dy = y - c.y, r = c.r + rad, d2 = dx * dx + dy * dy;
            if (d2 >= r * r)
                return null;
            const d = Math.sqrt(d2);
            return d > 0.00001 ? { dx: dx / d, dy: dy / d, pen: r - d } : { dx: 1, dy: 0, pen: r - d };
        }
        if (x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1) {
            const ex = (c.x1 - c.x0) / 2, ey = (c.y1 - c.y0) / 2, px = x - (c.x0 + ex), py = y - (c.y0 + ey), xp = Math.abs(px) - ex - rad, yp = Math.abs(py) - ey - rad;
            return xp > yp ? { dx: px > 0 ? 1 : -1, dy: 0, pen: -xp } : { dx: 0, dy: py > 0 ? 1 : -1, pen: -yp };
        }
        const dx = x - Math.max(c.x0, Math.min(c.x1, x)), dy = y - Math.max(c.y0, Math.min(c.y1, y)), d2 = dx * dx + dy * dy;
        if (d2 >= rad * rad)
            return null;
        const d = Math.sqrt(d2);
        return d > 0.0001 ? { dx: dx / d, dy: dy / d, pen: rad - d } : { dx: 1, dy: 0, pen: rad - d };
    }
    function segmentHit(c, x, y, dx, dy, len) {
        if (c.t === 0) {
            const mx = x - c.x, my = y - c.y, b = mx * dx + my * dy, cc = mx * mx + my * my - c.r * c.r;
            if (cc > 0 && b > 0)
                return null;
            const disc = b * b - cc;
            if (disc < 0)
                return null;
            let t = -b - Math.sqrt(disc);
            if (t < 0)
                t = -b + Math.sqrt(disc);
            return t <= len ? t : null;
        }
        const eps = 0.00001;
        if (Math.abs(dx) < eps)
            dx = eps * 2;
        if (Math.abs(dy) < eps)
            dy = eps * 2;
        const tx1 = (c.x0 - x) / dx, tx2 = (c.x1 - x) / dx, ty1 = (c.y0 - y) / dy, ty2 = (c.y1 - y) / dy;
        const tmin = Math.max(0, Math.min(tx1, tx2), Math.min(ty1, ty2)), tmax = Math.min(Math.max(tx1, tx2), Math.max(ty1, ty2));
        return tmin > tmax || tmin > len ? null : tmin;
    }
    const shape = c => c[0] === 0 ? { t: 0, x: c[1], y: c[2], r: c[3] } : { t: 1, x0: c[1], y0: c[2], x1: c[3], y1: c[4] };
    function reach(obs, x, y, dx, dy, len, layer, low) {
        let dist = len;
        for (const o of obs) {
            const sight = o.v ?? (o.k === 'wall' || o.k === 'door' ? 2 : 0);
            if (sight < (low ? 1 : 2) || !sameLayer(o.l, layer) || (!low && (layer & 2) && o.l === 0))
                continue;
            const t = segmentHit(o.shape ??= shape(o.c), x, y, dx, dy, len);
            if (t !== null && t < dist)
                dist = t;
        }
        return dist;
    }
    function seesIn(region, obs, x, y, layer, width, dist, rays = 5) {
        const to = circleHit(region, x, y, dist);
        if (!to)
            return false;
        if (to.pen >= dist)
            return true;
        const qx = -to.dy, qy = to.dx, a = reach(obs, x, y, -qx, -qy, width / 2, layer, true), b = reach(obs, x, y, qx, qy, width / 2, layer, true);
        for (let i = 0; i < rays; i++) {
            const s = -a + (a + b) * (i / Math.max(rays - 1, 1)), rx = x + qx * s, ry = y + qy * s, near = circleHit(region, rx, ry, dist);
            if (!near)
                continue;
            const hit = segmentHit(region, rx, ry, -near.dx, -near.dy, dist);
            if (hit !== null && hit <= reach(obs, rx, ry, -near.dx, -near.dy, dist, layer, false))
                return true;
        }
        return false;
    }
    let drawnAt = 0;
    const effects = [];
    const rand = (lo, hi) => lo + Math.random() * (hi - lo);
    function burst(type, x, y, layer) {
        const e = cat?.explosions[type];
        if (!e || !e.img || !e.sc || effects.length > 300)
            return;
        effects.push({ img: e.img, tint: 0xfa6100, x, y, vx: 0, vy: 0, drag: 0, life: 0.5, age: 0, s0: e.sc, s1: 4 * e.sc, a0: 1, fadeFrom: 0.75, rot: rand(0, 6.28), spin: 0, layer, z: 500 });
    }
    function chips(particle, x, y, layer, dx, dy, count) {
        const img = cat?.particles[particle];
        if (!img || effects.length > 300)
            return;
        const broken = count !== undefined, n = count ?? (Math.random() < 0.5 ? 1 : 2);
        for (let i = 0; i < n; i++) {
            const a = broken ? rand(0, 6.28) : Math.atan2(-dy, -dx) + rand(-0.52, 0.52), speed = broken ? rand(4, 9) : 9.5;
            effects.push({ img, tint: 0xffffff, x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, drag: rand(1, 5), life: broken ? rand(0.8, 1.3) : rand(0.5, 1), age: 0,
                s0: broken ? rand(0.12, 0.2) : rand(0.04, 0.08) * 2.5, s1: broken ? 0.08 : 0.04, a0: 1, fadeFrom: 0.85, rot: rand(0, 6.28), spin: rand(-9, 9), layer, z: 19 });
        }
    }
    const POSES = {
        fists: [[14, -12.25], [14, 12.25]], rifle: [[28, 5.25], [14, 1.75]], dualRifle: [[5.75, -16], [5.75, 16]], bullpup: [[28, 5.25], [24, 1.75]],
        minigun: [[18, 7.25], [54, 0]], launcher: [[20, 10], [2, 22]], pistol: [[14, 1.75], [14, 1.75]], dualPistol: [[15.75, -8.75], [15.75, 8.75]],
        slash: [[18, -8.25], [6, 20.25]], meleeTwoHanded: [[10.5, -14.25], [18, 6.25]], meleeKatana: [[8.5, 13.25], [-3, 17.75]],
        meleeNaginata: [[19, -7.25], [8.5, 24.25]], machete: [[14, -12.25], [1, 17.75]], cutlass: [[14, -12.25], [6, 16]],
    };
    const BAG_OFFSETS = [10.25, 11.5, 12.75];
    function swingPose(attacks, [time, seq]) {
        const name = attacks[seq % attacks.length], frames = cat.anims?.[name];
        if (!frames?.length || time > frames[frames.length - 1].t)
            return null;
        const mirror = name === 'fists' && attacks.length === 1 && seq % 2 === 1;
        let b = 0;
        while (b < frames.length - 1 && time >= frames[b].t)
            b++;
        const a = Math.max(0, b - 1), t = frames[b].t > frames[a].t ? Math.min(1, (time - frames[a].t) / (frames[b].t - frames[a].t)) : 1;
        return [0, 1].map(i => {
            const bone = mirror ? 1 - i : i, A = frames[a].b[bone], B = frames[b].b[bone];
            if (!A || !B)
                return undefined;
            const p = A.map((x, j) => x + (B[j] - x) * t);
            return mirror ? [p[0], -p[1], -p[2], p[3], -p[4]] : p;
        });
    }
    function drawPlayer(ctx, p, x, y, k) {
        const o = cat.outfit, gun = cat.guns[p.weapon], melee = gun ? null : cat.melee?.[p.weapon], dir = -Math.atan2(p.dy, p.dx);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(dir);
        const part = (name, tint, px, py, scale, rot = 0, ax = 0.5, ay = 0.5, sy) => put(ctx, sprite(name, tint), px * k, py * k, rot, scale * k, (sy ?? scale) * k, 1, ax, ay);
        const bag = cat.gear[p.backpack]?.level ?? 0;
        if (bag > 0 && !p.downed)
            part(o.pack, o.packTint, -BAG_OFFSETS[Math.min(bag - 1, 2)], 0, (0.4 + bag * 0.03) * 0.5);
        if (p.downed) {
            for (const side of [-1, 1]) {
                if (o.foot)
                    part(o.foot, o.footTint, -15.75, 9 * side, 0.45, Math.PI / 2);
                part(o.hand, o.handTint, 14, 12.25 * side, 0.175);
            }
        }
        part(o.body, o.bodyTint, 0, 0, 0.25);
        const chest = cat.gear[p.chest];
        if (chest?.s)
            part(chest.s, chest.t, 0, 0, 0.25);
        if (p.pan && cat.pan)
            part(cat.pan.s, cat.pan.t, cat.pan.p[0], cat.pan.p[1], cat.pan.sc, cat.pan.r);
        const pose = POSES[p.downed ? 'fists' : gun ? gun.pose : melee ? melee.pose : 'fists'] ?? POSES.fists;
        let [lx, ly] = pose[0];
        let [rx, ry] = pose[1];
        const sw = !gun && !p.downed && p.swing ? swingPose(melee?.atk ?? ['fists'], p.swing) : null;
        const boneL = sw?.[0], boneR = sw?.[1];
        if (boneL)
            [lx, ly] = boneL;
        if (boneR)
            [rx, ry] = boneR;
        if (gun && !p.downed && gun.lh) {
            lx += gun.lh[0];
            ly += gun.lh[1];
        }
        if (gun && !p.downed && p.recoil)
            rx -= p.recoil * 1.125;
        if (gun && !p.downed) {
            const off = gun.pose === 'dualRifle' || gun.pose === 'dualPistol' ? [-5.95, 0] : [-4.25 + (gun.go?.[0] ?? 0), -1.75 + (gun.go?.[1] ?? 0)];
            const drawGun = (hx, hy) => {
                ctx.save();
                ctx.translate((hx + off[0]) * k, (hy + off[1]) * k);
                ctx.rotate(Math.PI / 2);
                if (gun.mag && !gun.mag.top)
                    put(ctx, sprite(gun.mag.s, 0xffffff), gun.mag.p[0] * k, gun.mag.p[1] * k, 0, 0.25 * k, 0.25 * k);
                put(ctx, sprite(gun.s, gun.t), 0, 0, 0, gun.sc[0] * 0.5 * k, gun.sc[1] * 0.5 * k, 1, 0.5, 1);
                if (gun.mag && gun.mag.top)
                    put(ctx, sprite(gun.mag.s, 0xffffff), gun.mag.p[0] * k, gun.mag.p[1] * k, 0, 0.25 * k, 0.25 * k);
                ctx.restore();
            };
            if (gun.pose === 'dualRifle' || gun.pose === 'dualPistol')
                drawGun(lx, ly);
            if (!gun.below)
                drawGun(rx, ry);
            part(o.hand, o.handTint, lx, ly, 0.175);
            part(o.hand, o.handTint, rx, ry, 0.175);
            if (gun.below)
                drawGun(rx, ry);
        }
        else if (!p.downed) {
            const hand = (bx, by, bone, draw) => { ctx.save(); ctx.translate(bx * k, by * k); if (bone) {
                ctx.rotate(bone[2]);
                ctx.translate(bone[3] * k, bone[4] * k);
            } draw(); ctx.restore(); };
            hand(lx, ly, boneL, () => part(o.hand, o.handTint, 0, 0, 0.175));
            const spr = melee && !p.downed ? sprite(melee.s, melee.t) : null;
            hand(rx, ry, boneR, () => {
                if (spr) {
                    ctx.save();
                    ctx.rotate(melee.r);
                    ctx.scale(melee.sc[0] * k, melee.sc[1] * k);
                    ctx.drawImage(spr.src, melee.p[0] - spr.w / 2, melee.p[1] - spr.h / 2, spr.w, spr.h);
                    ctx.restore();
                }
                part(o.hand, o.handTint, 0, 0, 0.175);
            });
        }
        const helmet = cat.gear[p.helmet];
        if (helmet?.s)
            part(helmet.s, helmet.t, (p.downed ? 1 : -1) * 3.33, 0, helmet.sc ?? 0.15);
        ctx.restore();
    }
    function draw(v) {
        if (!cat)
            return false;
        const { ctx, S, L, visible, map } = v, k = L(1) / cat.ppu, layer = v.layer ?? 0, col = cat.colors;
        const now = performance.now(), dt = Math.min(0.1, drawnAt ? (now - drawnAt) / 1000 : 0.1);
        drawnAt = now;
        const [mx0, my0] = S(0, map.mapSize.y), [mx1, my1] = S(map.mapSize.x, 0);
        ctx.fillStyle = hex(layer & 1 ? col.underground : col.background);
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        if (!(layer & 1)) {
            const path = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => { const [sx, sy] = S(x, y); if (i)
                ctx.lineTo(sx, sy);
            else
                ctx.moveTo(sx, sy); }); ctx.closePath(); };
            if (map.shore) {
                path(map.shore);
                ctx.fillStyle = hex(col.beach);
                ctx.fill();
                ctx.save();
                ctx.clip();
                ctx.lineWidth = L(16);
                ctx.strokeStyle = hex(col.beach);
                ctx.fillStyle = hex(col.grass);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            else {
                ctx.fillStyle = hex(col.grass);
                ctx.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
            }
            for (const poly of map.water ?? []) {
                path(poly);
                ctx.fillStyle = hex(col.water);
                ctx.fill();
                ctx.lineWidth = L(1.5);
                ctx.strokeStyle = hex(col.riverbank);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = Math.max(1, L(0.125));
            ctx.beginPath();
            const GRID = 16, [gx0, gy0] = [Math.floor(v.cam.x0 / GRID) * GRID, Math.floor(v.cam.y0 / GRID) * GRID];
            for (let x = Math.max(0, gx0); x <= Math.min(map.mapSize.x, v.cam.x1); x += GRID) {
                const [sx] = S(x, 0);
                ctx.moveTo(sx, Math.max(0, my0));
                ctx.lineTo(sx, Math.min(ctx.canvas.height, my1));
            }
            for (let y = Math.max(0, gy0); y <= Math.min(map.mapSize.y, v.cam.y1); y += GRID) {
                const [, sy] = S(0, y);
                ctx.moveTo(Math.max(0, mx0), sy);
                ctx.lineTo(Math.min(ctx.canvas.width, mx1), sy);
            }
            ctx.stroke();
        }
        const items = [];
        const NEAR = 20, blockers = v.watchers.map(w => v.obstacles.filter(o => o.state !== 0 && o.c && (o.v ?? 2) > 0 && sameLayer(o.l, w.layer)
            && Math.abs(o.x - w.x) < NEAR + 30 && Math.abs(o.y - w.y) < NEAR + 30 && circleHit(o.shape ??= shape(o.c), w.x, w.y, NEAR)));
        for (const b of v.buildings) {
            if (!sameLayer(b.layer, layer) || !visible(b.x, b.y, 60))
                continue;
            const def = cat.buildings[b.type];
            if (!def)
                continue;
            const rot = oriToRad(b.ori);
            const place = (img, z, i, alpha) => items.push([z, b.i * 100 + i, () => {
                    const [ox, oy] = rotate(img.p[0], img.p[1], rot), [sx, sy] = S(b.x + ox, b.y + oy), s = b.scale * img.sc * k;
                    put(ctx, sprite(img.s, img.t), sx, sy, -rot + oriToRad(img.r), s * (img.mx ? -1 : 1), s * (img.my ? -1 : 1), img.a * alpha);
                }]);
            def.floor.forEach((img, i) => place(img, def.z, i, 1));
            if (!def.ceiling.length)
                continue;
            b.regions ??= regions(b, def);
            const [dist, width, linger, fadeRate] = def.vis ?? [5.5, 2.75, 0, 12], gone = b.ceiling === 2;
            const sees = gone || v.watchers.some((w, n) => (b.layer === w.layer || (w.layer & 2)) && b.regions.some(r => seesIn(r, blockers[n], w.x, w.y, w.layer, width * 2, dist)));
            b.liftFor = sees ? linger + 0.0001 : (b.liftFor ?? 0) - dt;
            const lifted = b.liftFor > 0, gap = (lifted ? 0 : 1) - (b.fade ?? 1), stepBy = gap * Math.min(1, dt * (lifted ? 12 : fadeRate));
            b.fade = (b.fade ?? 1) + (Math.abs(stepBy) < 0.001 ? gap : stepBy);
            if (b.fade > 0.01)
                def.ceiling.forEach((img, i) => { if (!(img.rd && b.ceiling))
                    place(img, 750 - def.z, i, (v.ceilingAlpha ?? 1) * b.fade); });
        }
        for (const o of v.obstacles) {
            if (!sameLayer(o.l, layer) || !visible(o.x, o.y, 15))
                continue;
            const def = cat.obstacles[o.t];
            if (!def)
                continue;
            const dead = o.state === 0, name = dead ? def.res : o.state === 4 && def.on ? def.on : o.state === 5 && def.off ? def.off : def.s;
            if (!name)
                continue;
            items.push([dead ? 5 : def.z, o.id, () => {
                    const [sx, sy] = S(o.x, o.y), s = o.s * def.sc * k;
                    put(ctx, sprite(name, def.t), sx, sy, -o.r, s * (def.mx ? -1 : 1), s * (def.my ? -1 : 1), dead ? 0.75 : def.a, def.ax ?? 0.5, def.ay ?? 0.5);
                }]);
            if (def.casing && !dead)
                items.push([def.z, o.id + 0.5, () => {
                        const c = def.casing, open = o.state === 1, turn = o.r + Math.PI / 2;
                        const shut = open && def.slide ? [o.x + Math.cos(turn) * def.slide, o.y + Math.sin(turn) * def.slide] : [o.x, o.y];
                        const [sx, sy] = S(shut[0] + Math.cos(turn) * c.x - Math.sin(turn) * c.y, shut[1] + Math.sin(turn) * c.x + Math.cos(turn) * c.y), s = o.s * c.sc * k;
                        put(ctx, sprite(c.s, c.t), sx, sy, -o.r, s, s, c.a);
                    }]);
        }
        for (const [x, y, type, itemLayer] of v.loot) {
            const def = cat.loot[type];
            if (!def || !visible(x, y) || (itemLayer !== undefined && !sameLayer(itemLayer, layer)))
                continue;
            items.push([13, 0, () => {
                    const [sx, sy] = S(x, y), s = def.sc * 1.25 * k;
                    if (def.b)
                        put(ctx, sprite(def.b, def.bt), sx, sy, 0, s, s);
                    put(ctx, sprite(def.s, def.t), sx, sy, def.r || 0, s * def.in * (def.m ? -1 : 1), s * def.in);
                }]);
        }
        for (const p of v.players) {
            if (!sameLayer(p.layer, layer) || !visible(p.x, p.y, 3))
                continue;
            if (p.dead) {
                if (v.bodies)
                    items.push([12, p.id, () => {
                            const [sx, sy] = S(p.x, p.y);
                            put(ctx, sprite('skull.img', 0x5a5a5a), sx, sy, 0, 0.4 * k, 0.4 * k);
                            if (p.name) {
                                ctx.font = `bold ${Math.max(9, 11 * k)}px Arial, sans-serif`;
                                ctx.textAlign = 'center';
                                ctx.fillStyle = 'rgba(128,128,128,0.9)';
                                ctx.fillText(p.name, sx, sy + 26 * k);
                            }
                        }]);
                continue;
            }
            if (p.action === 3 || p.action === 4) {
                p.emitIn = (p.emitIn ?? 0) - dt;
                if (p.emitIn <= 0 && effects.length < 300) {
                    const revive = p.action === 4, boost = !revive && !/bandage|healthkit/.test(p.actionItem ?? ''), a = rand(0, 6.28), r = 1.5 * Math.sqrt(Math.random()), value = rand(0.7, 1) * 255;
                    p.emitIn = revive ? rand(0.5, 0.55) : rand(0.3, 0.35);
                    effects.push({ img: boost ? 'part-boost-basic.img' : 'part-heal-basic.img', tint: revive ? (Math.round(value * 0.98) << 16) | Math.round(value) : boost ? (Math.round(value * 0.2) << 16) | (Math.round(value) << 8) : Math.round(value) << 16,
                        x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, vx: 0, vy: rand(1, 1.5), drag: boost ? 0 : 0.25, life: rand(0.75, 1), age: 0, s0: boost ? rand(0.12, 0.14) : rand(0.1, 0.12), s1: boost ? rand(0.06, 0.08) : rand(0.05, 0.07),
                        a0: 1, fadeFrom: 0.7, fadeIn: 0.05, rot: boost ? rand(0, 6.28) : 0, spin: boost ? rand(0.79, 1.57) : 0, layer: p.layer, z: 19.5 });
                }
            }
            else
                p.emitIn = 0;
            if (p.recoil)
                p.recoil = Math.max(0, p.recoil - p.recoil * dt * 5 - dt);
            items.push([18, p.id, () => { const [sx, sy] = S(p.x, p.y); drawPlayer(ctx, p, sx, sy, k); }]);
            if (v.names?.has(p.id))
                items.push([18.5, p.id, () => {
                        const [sx, sy] = S(p.x, p.y);
                        ctx.font = `bold ${Math.max(10, 13 * k)}px Arial, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.lineWidth = Math.max(2, 3 * k);
                        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                        ctx.fillStyle = '#ffffff';
                        const name = v.names.get(p.id), y = sy + 34 * k;
                        ctx.strokeText(name, sx, y);
                        ctx.fillText(name, sx, y);
                    }]);
        }
        for (const [x, y, dx, dy, type, flown, bulletLayer] of v.bullets) {
            if (!visible(x, y, 30) || (bulletLayer !== undefined && !sameLayer(bulletLayer, layer)))
                continue;
            if (type === 'bullet_flare') {
                items.push([1000, 0, () => {
                        const [a, b] = S(x, y), r = Math.max(4, L(0.9) * (cat.flare.scale ?? 2)), g = ctx.createRadialGradient(a, b, 0, a, b, r), c = hex(cat.flare.color);
                        g.addColorStop(0, '#ffffff');
                        g.addColorStop(0.25, c);
                        g.addColorStop(1, c + '00');
                        ctx.fillStyle = g;
                        ctx.beginPath();
                        ctx.arc(a, b, r, 0, Math.PI * 2);
                        ctx.fill();
                    }]);
                continue;
            }
            items.push([20, 0, () => {
                    const [width, length] = cat.tracers?.[type] ?? [0.1, 0.8], long = Math.max(0.3, 1.8 * Math.min(length * 15, (flown ?? 12) / 2));
                    const [a, b] = S(x, y), [c, d] = S(x - dx * long, y - dy * long), g = ctx.createLinearGradient(a, b, c, d), color = hex(cat.bullets[type] ?? 0xffffff);
                    g.addColorStop(0, color);
                    g.addColorStop(1, color + '00');
                    ctx.strokeStyle = g;
                    ctx.lineWidth = Math.max(1, L(2.25 * width));
                    ctx.lineCap = 'butt';
                    ctx.beginPath();
                    ctx.moveTo(a, b);
                    ctx.lineTo(c, d);
                    ctx.stroke();
                }]);
        }
        for (const [x, y, rad, layer] of v.smokes ?? []) {
            if (!sameLayer(layer, v.layer ?? 0) || !visible(x, y, rad))
                continue;
            items.push([700, 0, () => {
                    const [sx, sy] = S(x, y), spr = sprite(cat.smoke[0], 0xcfcfcf);
                    if (spr)
                        put(ctx, spr, sx, sy, 0, (L(rad) * 2) / spr.w, (L(rad) * 2) / spr.h, v.smokeAlpha ?? 0.45);
                    else {
                        ctx.fillStyle = `rgba(210,210,210,${v.smokeAlpha ?? 0.45})`;
                        ctx.beginPath();
                        ctx.arc(sx, sy, L(rad), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }]);
        }
        const below = (layer & 1) === 1 && !(layer & 2);
        for (const [x, y, fallT] of v.airdrops ?? []) {
            if (below || !visible(x, y, 15))
                continue;
            items.push([1500, 0, () => { const [sx, sy] = S(x, y), rad = 5 + Math.pow(1 - fallT, 1.1) * 7, s = (2 * rad / cat.ppu) * k; put(ctx, sprite(cat.air.chute, 0xffff00), sx, sy, 0, s, s); }]);
        }
        for (const [x, y, dx, dy, strike] of v.planes ?? []) {
            if (below || !visible(x, y, 30))
                continue;
            items.push([1501, 0, () => {
                    const [sx, sy] = S(x, y), rad = strike ? cat.air.strikeRad : cat.air.planeRad, s = (rad / cat.ppu) * k;
                    put(ctx, sprite(strike ? cat.air.strike : cat.air.plane, 0xffff00), sx, sy, Math.atan2(dx, dy), s, s, 0.55);
                }]);
        }
        for (const [x, y, type, thrownLayer] of v.projectiles) {
            const def = cat.throwables[type];
            if (!def || !visible(x, y) || (thrownLayer !== undefined && !sameLayer(thrownLayer, layer)))
                continue;
            items.push([21, 0, () => { const [sx, sy] = S(x, y), s = def.sc * k; put(ctx, sprite(def.s, def.t), sx, sy, 0, s, s); }]);
        }
        for (let i = effects.length - 1; i >= 0; i--) {
            const e = effects[i];
            e.age += dt;
            if (e.age >= e.life) {
                effects.splice(i, 1);
                continue;
            }
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.rot += e.spin * dt;
            const slow = Math.max(0, 1 - e.drag * dt);
            e.vx *= slow;
            e.vy *= slow;
            if (!sameLayer(e.layer, layer) || !visible(e.x, e.y, 20))
                continue;
            const t = e.age / e.life, s = (e.s0 + (e.s1 - e.s0) * t) * k, alpha = e.a0 * (e.fadeIn && t < e.fadeIn ? t / e.fadeIn : t < e.fadeFrom ? 1 : 1 - (t - e.fadeFrom) / (1 - e.fadeFrom));
            items.push([e.z, i, () => { const [sx, sy] = S(e.x, e.y); put(ctx, sprite(e.img, e.tint), sx, sy, e.rot, s, s, alpha); }]);
        }
        items.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        for (const it of items) {
            try {
                it[2]();
            }
            catch (e) {
                if (!draw.warned) {
                    draw.warned = true;
                    console.warn('real view:', e);
                }
            }
        }
        return true;
    }
    const icon = type => { const d = cat?.loot[type], path = d && cat.sprites[d.s]; return path ? 'img/' + path : null; };
    return { load, draw, icon, ready: () => !!cat, mapName: () => catMap, seesIn, regions, burst, chips, catalog: () => cat };
})();
