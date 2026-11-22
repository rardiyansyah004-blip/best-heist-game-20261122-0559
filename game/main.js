// The Midnight Vault — a top-down heist game.
// Steal the loot, crack the vault, dodge the guards and the cameras,
// and escape to the getaway car before the police arrive.
// Pure canvas + WebAudio, no network, deterministic (seeded RNG).
// Keyboard: WASD/arrows move, Shift sneak, Space dash, E (hold) crack,
// Q throw a coin, M mute, P pause, R restart level, Enter start.
(function () {
  'use strict';

  var TILE = 40, COLS = 32, ROWS = 21, W = 1280, H = 860, PLAY_H = ROWS * TILE;
  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');

  // ---- deterministic RNG (mulberry32) ----
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rng = mulberry32(20261122);

  // ---- levels ----
  // Legend: # wall . floor D door S safe V vault L cash G gold J jewel
  //         h shadow (dark hiding spot) P player start X getaway car
  var LEVELS = [
    {
      name: 'HEIST 1 — THE CORNER BANK',
      target: 6000, timeLimit: 240,
      map: [
        '################################',
        '#......#........#......#.......#',
        '#.P....#...L....#..S...#...L...#',
        '#......#........#......#.......#',
        '#..h...D....h...D..h...D...h...#',
        '#......#........#......#.......#',
        '###.####...######...####.#######',
        '#..............................#',
        '#.L......h......C.....h......L.#',
        '#..............................#',
        '#..######...########....######.#',
        '#..#....#...#......#....#....#.#',
        '#..#.S..D...D.V....#....D.G..#.#',
        '#..#....#...#......#....#....#.#',
        '#..######...########....######.#',
        '#..............................#',
        '#.h......L......h.....L......h.#',
        '#..............................#',
        '#......#........#......#.......#',
        '#..X...#...J....#..L...#...G...#',
        '################################'
      ],
      guards: [
        { wp: [[8, 7], [23, 7], [23, 9], [8, 9]], speed: 78 },
        { wp: [[4, 15], [27, 15], [27, 17], [4, 17]], speed: 84 },
        { wp: [[15, 1], [15, 5], [24, 5], [24, 1]], speed: 72 }
      ],
      cameras: [
        { tx: 16, ty: 8, base: Math.PI / 2, sweep: 1.1, speed: 0.55 },
        { tx: 5, ty: 15, base: 0, sweep: 1.3, speed: 0.45 }
      ]
    },
    {
      name: 'HEIST 2 — THE DIAMOND GALLERY',
      target: 9000, timeLimit: 240,
      map: [
        '################################',
        '#..L...#......h.....#....L.....#',
        '#......#............#..........#',
        '#.P....D.....C......D....J.....#',
        '#......#............#..........#',
        '###.#######..#######..#######.##',
        '#..............................#',
        '#.h.....S......h.....S......h..#',
        '#..............................#',
        '#..#######...########...######.#',
        '#..#.....#...#......#...#....#.#',
        '#..#.G...D...D.V....#...D.G..#.#',
        '#..#.....#...#......#...#....#.#',
        '#..#######...########...######.#',
        '#..............................#',
        '#......L......C.....L......J...#',
        '#..............................#',
        '###.#######..#######..#######.##',
        '#......#............#..........#',
        '#..X...#.....L......#....S.....#',
        '################################'
      ],
      guards: [
        { wp: [[3, 6], [28, 6], [28, 8], [3, 8]], speed: 86 },
        { wp: [[10, 14], [21, 14], [21, 16], [10, 16]], speed: 90 },
        { wp: [[16, 1], [16, 4], [26, 4], [26, 1]], speed: 80 },
        { wp: [[5, 18], [15, 18], [15, 16], [5, 16]], speed: 76 }
      ],
      cameras: [
        { tx: 11, ty: 3, base: Math.PI / 2, sweep: 1.2, speed: 0.6 },
        { tx: 20, ty: 15, base: -Math.PI / 2, sweep: 1.2, speed: 0.5 },
        { tx: 28, ty: 6, base: Math.PI, sweep: 1.0, speed: 0.55 }
      ]
    },
    {
      name: 'HEIST 3 — THE CASINO VAULT',
      target: 12000, timeLimit: 300,
      map: [
        '################################',
        '#.L....#....G.....#......L.....#',
        '#......#..........#............#',
        '#..P...D....C.....D......J.....#',
        '#......#..........#............#',
        '#..h...#....h.....#.....h......#',
        '###.#######..#######..#######.##',
        '#..............................#',
        '#..S......h......C.....h.....S.#',
        '#..............................#',
        '#.#######...########...#######.#',
        '#.#.....#...#......#...#.....#.#',
        '#.#.G...D...D.V....#...D.J...#.#',
        '#.#.....#...#......#...#.....#.#',
        '#.#######...########...#######.#',
        '#..............................#',
        '#..L......C......h......L......#',
        '###.#######..#######..#######.##',
        '#......#....L.....#.....G......#',
        '#..X...#..........#......S.....#',
        '################################'
      ],
      guards: [
        { wp: [[2, 7], [29, 7], [29, 9], [2, 9]], speed: 92 },
        { wp: [[8, 15], [23, 15], [23, 16], [8, 16]], speed: 96 },
        { wp: [[16, 1], [16, 5], [26, 5], [26, 1]], speed: 84 },
        { wp: [[4, 19], [14, 19], [14, 16], [4, 16]], speed: 82 },
        { wp: [[24, 11], [28, 11], [28, 13], [24, 13]], speed: 88 }
      ],
      cameras: [
        { tx: 11, ty: 3, base: Math.PI / 2, sweep: 1.3, speed: 0.65 },
        { tx: 20, ty: 8, base: -Math.PI / 2, sweep: 1.3, speed: 0.6 },
        { tx: 16, ty: 16, base: 0, sweep: 1.1, speed: 0.5 },
        { tx: 28, ty: 15, base: Math.PI, sweep: 1.0, speed: 0.55 }
      ]
    }
  ];

  var LOOT_VALUE = { L: 500, G: 1500, J: 2500, S: 1200, V: 4000 };
  var LOOT_NAME = { L: 'cash', G: 'gold', J: 'jewel', S: 'safe', V: 'VAULT' };

  // ---- audio (WebAudio bleeps, created lazily on first input) ----
  var audioCtx = null, muted = false;
  function beep(freq, dur, type, vol) {
    if (muted || !audioCtx) return;
    try {
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio unavailable */ }
  }
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  var sfx = {
    pickup: function () { beep(880, 0.12, 'sine', 0.09); setTimeout(function () { beep(1320, 0.1, 'sine', 0.07); }, 60); },
    crack: function () { beep(520, 0.1, 'square', 0.05); setTimeout(function () { beep(780, 0.14, 'square', 0.05); }, 90); },
    vault: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { beep(f, 0.16, 'triangle', 0.09); }, i * 110); }); },
    spotted: function () { beep(220, 0.25, 'sawtooth', 0.08); setTimeout(function () { beep(180, 0.3, 'sawtooth', 0.08); }, 140); },
    alarm: function () { beep(660, 0.18, 'square', 0.06); setTimeout(function () { beep(440, 0.18, 'square', 0.06); }, 200); },
    caught: function () { [400, 300, 200, 120].forEach(function (f, i) { setTimeout(function () { beep(f, 0.2, 'sawtooth', 0.09); }, i * 130); }); },
    coin: function () { beep(1500, 0.08, 'sine', 0.06); },
    win: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { setTimeout(function () { beep(f, 0.22, 'triangle', 0.09); }, i * 120); }); },
    dash: function () { beep(300, 0.1, 'sine', 0.04); }
  };

  // ---- state ----
  var game = null; // per-level state
  var mode = 'title'; // title | playing | paused | levelComplete | gameOver | victory | busted
  var levelIndex = 0;
  var score = 0, lives = 3, totalLoot = 0, ghostRun = true, alarmPeak = 0;
  var timeLeft = 0, policeTimer = 0, policeActive = false;
  var message = '', messageT = 0;
  var keys = {};
  var frame = 0, lastTs = 0;
  var particles = [];
  var coin = null; // thrown coin {x,y,tx,ty,t}
  var shotMode = null;

  function tileAt(lvl, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return lvl.map[ty][tx];
  }
  function isWall(lvl, tx, ty) {
    var t = tileAt(lvl, tx, ty);
    return t === '#' || t === 'S' || t === 'V';
  }
  function losBlocked(lvl, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, dist = Math.hypot(dx, dy);
    var steps = Math.ceil(dist / 6);
    for (var i = 1; i < steps; i++) {
      var x = x0 + (dx * i) / steps, y = y0 + (dy * i) / steps;
      if (isWall(lvl, Math.floor(x / TILE), Math.floor(y / TILE))) return true;
    }
    return false;
  }
  function rayDist(lvl, x, y, ang, maxD) {
    var step = 6;
    for (var d = step; d <= maxD; d += step) {
      var nx = x + Math.cos(ang) * d, ny = y + Math.sin(ang) * d;
      if (isWall(lvl, Math.floor(nx / TILE), Math.floor(ny / TILE))) return d;
    }
    return maxD;
  }
  function inShadow(lvl, x, y) {
    return tileAt(lvl, Math.floor(x / TILE), Math.floor(y / TILE)) === 'h';
  }
  function showMessage(t) { message = t; messageT = 3; }

  function parseLevel(idx) {
    var def = LEVELS[idx];
    var lvl = { def: def, map: def.map.slice(), loot: [], safes: [], vault: null, exit: null, start: null };
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(lvl, tx, ty), cx = tx * TILE + TILE / 2, cy = ty * TILE + TILE / 2;
        if (t === 'P') lvl.start = { x: cx, y: cy };
        else if (t === 'X') lvl.exit = { x: cx, y: cy, tx: tx, ty: ty };
        else if (t === 'L' || t === 'G' || t === 'J') lvl.loot.push({ x: cx, y: cy, kind: t, taken: false });
        else if (t === 'S') lvl.safes.push({ x: cx, y: cy, tx: tx, ty: ty, progress: 0, open: false });
        else if (t === 'V') lvl.vault = { x: cx, y: cy, tx: tx, ty: ty, progress: 0, open: false };
      }
    }
    lvl.guards = def.guards.map(function (g) {
      var wp = g.wp.map(function (p) { return { x: p[0] * TILE + TILE / 2, y: p[1] * TILE + TILE / 2 }; });
      return {
        x: wp[0].x, y: wp[0].y, dir: 0, wp: wp, wi: 0, speed: g.speed,
        suspicion: 0, state: 'patrol', lastSeen: null, investigate: null, alerted: false
      };
    });
    lvl.cameras = def.cameras.map(function (c) {
      return { x: c.tx * TILE + TILE / 2, y: c.ty * TILE + TILE / 2, base: c.base, sweep: c.sweep, speed: c.speed, phase: rng() * Math.PI * 2, spotting: false };
    });
    return lvl;
  }

  function startLevel(idx) {
    levelIndex = idx;
    game = parseLevel(idx);
    game.player = {
      x: game.start.x, y: game.start.y, r: 13, dir: -Math.PI / 2,
      speed: 0, sneaking: false, dashT: 0, dashCd: 0, stamina: 100,
      cracking: null, moving: false
    };
    timeLeft = game.def.timeLimit;
    policeTimer = 0; policeActive = false;
    game.alarm = 0; game.lootValue = 0; game.lootCount = 0;
    game.exitOpen = false;
    particles = []; coin = null;
    mode = 'playing';
    showMessage(game.def.name + ' — steal $' + game.def.target.toLocaleString() + ', crack the vault, reach the getaway car!');
  }

  function newRun() {
    score = 0; lives = 3; totalLoot = 0; ghostRun = true; alarmPeak = 0;
    startLevel(0);
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = rng() * Math.PI * 2, sp = 40 + rng() * 120;
      particles.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0.6 + rng() * 0.4, color: color });
    }
  }

  // ---- collision: move a circle, slide along walls ----
  function moveCircle(ent, dx, dy, lvl) {
    var nx = ent.x + dx, ny = ent.y + dy, r = ent.r || 13;
    if (!circleHitsWall(lvl, nx, ent.y, r)) ent.x = nx;
    if (!circleHitsWall(lvl, ent.x, ny, r)) ent.y = ny;
  }
  function circleHitsWall(lvl, x, y, r) {
    var pts = [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]];
    for (var i = 0; i < pts.length; i++) {
      if (isWall(lvl, Math.floor((x + pts[i][0]) / TILE), Math.floor((y + pts[i][1]) / TILE))) return true;
    }
    return false;
  }

  function angDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }
  function canSee(lvl, ox, oy, dir, range, fov, tx, ty) {
    var dx = tx - ox, dy = ty - oy, d = Math.hypot(dx, dy);
    if (d > range) return 0;
    var ang = Math.atan2(dy, dx);
    if (Math.abs(angDiff(ang, dir)) > fov / 2) return 0;
    if (losBlocked(lvl, ox, oy, tx, ty)) return 0;
    return 1 - d / range; // 0..1, closer = clearer
  }

  function raiseAlarm(amount, why) {
    if (!game || game.alarm >= 100) return;
    game.alarm = Math.min(100, game.alarm + amount);
    alarmPeak = Math.max(alarmPeak, game.alarm);
    if (game.alarm >= 100 && !policeActive) {
      policeActive = true; policeTimer = 45;
      showMessage('ALARM TRIPPED — POLICE INBOUND! Get to the car!');
      sfx.alarm();
    }
  }

  function bustPlayer(reason) {
    lives -= 1; ghostRun = false;
    sfx.caught();
    burst(game.player.x, game.player.y, '#ff4444', 26);
    if (lives <= 0) { mode = 'gameOver'; return; }
    mode = 'busted';
    showMessage(reason + ' — ' + lives + (lives === 1 ? ' life' : ' lives') + ' left');
    game.player.x = game.start.x; game.player.y = game.start.y;
    game.player.dashT = 0; game.player.cracking = null;
    game.alarm = Math.max(0, game.alarm - 30);
    if (policeActive) { policeActive = false; policeTimer = 0; }
    game.guards.forEach(function (g) {
      g.suspicion = 0; g.state = 'patrol'; g.lastSeen = null; g.investigate = null; g.alerted = false;
      g.x = g.wp[0].x; g.y = g.wp[0].y; g.wi = 0;
    });
  }

  function update(dt) {
    if (mode !== 'playing') return;
    frame++;
    var lvl = game, p = game.player;
    timeLeft -= dt;
    if (timeLeft <= 0) { bustPlayer('TIME UP — the crew left without you'); return; }
    if (messageT > 0) messageT -= dt;
    if (policeActive) {
      policeTimer -= dt;
      if (Math.floor(policeTimer * 2) !== Math.floor((policeTimer + dt) * 2)) sfx.alarm();
      if (policeTimer <= 0) { bustPlayer('THE POLICE ARRIVED'); return; }
    }

    // ---- player movement ----
    var mx = 0, my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) my += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    var moving = (mx !== 0 || my !== 0);
    p.moving = moving;
    p.sneaking = !!keys['ShiftLeft'] || !!keys['ShiftRight'];
    if (moving) {
      var len = Math.hypot(mx, my); mx /= len; my /= len;
      p.dir = Math.atan2(my, mx);
      var speed = p.sneaking ? 95 : 175;
      if (p.dashT > 0) { speed = 350; p.dashT -= dt; }
      moveCircle(p, mx * speed * dt, my * speed * dt, lvl);
    }
    if (p.dashCd > 0) p.dashCd -= dt;
    p.stamina = Math.min(100, p.stamina + (p.dashT > 0 ? -55 : 22) * dt);
    if (p.stamina <= 0) p.dashT = 0;

    // ---- loot pickup ----
    lvl.loot.forEach(function (it) {
      if (it.taken) return;
      if (Math.hypot(p.x - it.x, p.y - it.y) < 30) {
        it.taken = true;
        var v = LOOT_VALUE[it.kind];
        game.lootValue += v; game.lootCount++; totalLoot += v; score += v;
        burst(it.x, it.y, it.kind === 'J' ? '#66e0ff' : '#ffd94d', 12);
        sfx.pickup();
        showMessage('Grabbed ' + LOOT_NAME[it.kind] + ' +$' + v.toLocaleString());
        checkExitOpen();
      }
    });

    // ---- cracking safes / vault (hold E) ----
    var target = null, crackTime = 0;
    lvl.safes.forEach(function (s) {
      if (!s.open && Math.hypot(p.x - s.x, p.y - s.y) < 62) { target = s; crackTime = 2.2; }
    });
    if (lvl.vault && !lvl.vault.open && Math.hypot(p.x - lvl.vault.x, p.y - lvl.vault.y) < 62) {
      target = lvl.vault; crackTime = 4.0;
    }
    if (target && keys['KeyE'] && !moving) {
      p.cracking = target;
      target.progress += dt / crackTime;
      if (Math.floor(target.progress * 10) !== Math.floor((target.progress - dt / crackTime) * 10)) sfx.crack();
      if (target.progress >= 1) {
        target.open = true; p.cracking = null;
        var isVault = target === lvl.vault;
        var v = LOOT_VALUE[isVault ? 'V' : 'S'];
        game.lootValue += v; totalLoot += v; score += v;
        burst(target.x, target.y, isVault ? '#ff9d4d' : '#ffd94d', 22);
        if (isVault) { sfx.vault(); showMessage('VAULT CRACKED! +$' + v.toLocaleString() + ' — the getaway car is ready!'); }
        else { sfx.crack(); showMessage('Safe cracked! +$' + v.toLocaleString()); }
        checkExitOpen();
      }
    } else {
      if (p.cracking) p.cracking.progress = Math.max(0, p.cracking.progress - dt * 0.05);
      p.cracking = null;
    }

    // ---- thrown coin ----
    if (coin) {
      coin.t += dt;
      var cd = Math.hypot(coin.tx - coin.x, coin.ty - coin.y);
      var step = 420 * dt;
      if (cd <= step) { coin.x = coin.tx; coin.y = coin.ty; coin.landed = true; }
      else { coin.x += ((coin.tx - coin.x) / cd) * step; coin.y += ((coin.ty - coin.y) / cd) * step; }
      if (coin.landed && coin.t > coin.landT + 0.05) {
        lvl.guards.forEach(function (g) {
          if (Math.hypot(g.x - coin.x, g.y - coin.y) < 320 && g.state !== 'chase') {
            g.investigate = { x: coin.x, y: coin.y }; g.state = 'investigate';
          }
        });
        coin = null;
      }
    }

    // ---- guards ----
    var playerVisible = false;
    lvl.guards.forEach(function (g) {
      var see = canSee(lvl, g.x, g.y, g.dir, 230, 1.25, p.x, p.y);
      var shadow = inShadow(lvl, p.x, p.y);
      if (see > 0) {
        var rate = 1.1 * (0.35 + see);
        if (p.sneaking) rate *= 0.45;
        if (p.dashT > 0) rate *= 1.6;
        if (shadow) rate *= 0.25;
        if (p.cracking) rate *= 1.3;
        g.suspicion = Math.min(1, g.suspicion + rate * dt);
        g.lastSeen = { x: p.x, y: p.y };
        playerVisible = true;
      } else {
        g.suspicion = Math.max(0, g.suspicion - 0.22 * dt);
      }
      if (g.suspicion >= 0.5 && !g.radioed) {
        g.radioed = true;
        raiseAlarm(10, 'guard');
        showMessage('A guard radioed in — the alarm is rising!');
      }
      if (g.suspicion < 0.2) g.radioed = false;
      if (g.suspicion >= 1 && g.state !== 'chase') {
        g.state = 'chase'; g.alerted = true;
        raiseAlarm(25, 'guard');
        sfx.spotted();
        showMessage('SPOTTED! Run — or hide in the shadows!');
      }
      if (g.state === 'patrol') {
        var wp = g.wp[g.wi];
        var d = Math.hypot(wp.x - g.x, wp.y - g.y);
        if (d < 8) { g.wi = (g.wi + 1) % g.wp.length; }
        else {
          var a = Math.atan2(wp.y - g.y, wp.x - g.x);
          g.dir = turnToward(g.dir, a, 5 * dt);
          moveCircle(g, Math.cos(g.dir) * g.speed * dt, Math.sin(g.dir) * g.speed * dt, lvl);
        }
        if (g.suspicion > 0.35 && g.lastSeen) { g.state = 'investigate'; g.investigate = { x: g.lastSeen.x, y: g.lastSeen.y }; }
      } else if (g.state === 'investigate') {
        var tgt = g.investigate || g.lastSeen;
        if (!tgt) { g.state = 'patrol'; }
        else {
          var dd = Math.hypot(tgt.x - g.x, tgt.y - g.y);
          if (dd < 14) { g.investigate = null; g.state = 'return'; }
          else {
            var aa = Math.atan2(tgt.y - g.y, tgt.x - g.x);
            g.dir = turnToward(g.dir, aa, 6 * dt);
            moveCircle(g, Math.cos(g.dir) * g.speed * 1.25 * dt, Math.sin(g.dir) * g.speed * 1.25 * dt, lvl);
          }
        }
      } else if (g.state === 'chase') {
        var a2 = Math.atan2(p.y - g.y, p.x - g.x);
        g.dir = turnToward(g.dir, a2, 8 * dt);
        moveCircle(g, Math.cos(g.dir) * 205 * dt, Math.sin(g.dir) * 205 * dt, lvl);
        if (Math.hypot(p.x - g.x, p.y - g.y) < 28) { bustPlayer('CAUGHT by a guard'); return; }
        if (g.suspicion < 0.25) { g.state = 'return'; }
      } else if (g.state === 'return') {
        var wp0 = g.wp[g.wi];
        var d0 = Math.hypot(wp0.x - g.x, wp0.y - g.y);
        if (d0 < 10) { g.state = 'patrol'; }
        else {
          var a3 = Math.atan2(wp0.y - g.y, wp0.x - g.x);
          g.dir = turnToward(g.dir, a3, 5 * dt);
          moveCircle(g, Math.cos(g.dir) * g.speed * dt, Math.sin(g.dir) * g.speed * dt, lvl);
        }
      }
    });
    if (game.alarm < 100 && !playerVisible && game.alarm > 0) game.alarm = Math.max(0, game.alarm - 1.2 * dt);

    // ---- cameras ----
    lvl.cameras.forEach(function (c) {
      c.phase += c.speed * dt;
      var ang = c.base + Math.sin(c.phase) * c.sweep;
      var see = canSee(lvl, c.x, c.y, ang, 270, 0.9, p.x, p.y);
      c.spotting = see > 0;
      c.ang = ang;
      if (see > 0) {
        raiseAlarm(30 * dt * (0.5 + see), 'camera');
        if (game.alarm >= 50 && !c.warned) { c.warned = true; showMessage('CAMERA SPOTTED YOU — alarm rising!'); sfx.alarm(); }
      } else if (game.alarm < 30) c.warned = false;
    });

    // ---- exit / getaway car ----
    if (game.exitOpen && Math.hypot(p.x - game.exit.x, p.y - game.exit.y) < 44) {
      var timeBonus = Math.max(0, Math.round(timeLeft)) * 10;
      var ghostBonus = (ghostRun && alarmPeak < 50) ? 1500 : 0;
      score += timeBonus + ghostBonus;
      sfx.win();
      burst(game.exit.x, game.exit.y, '#7dff8a', 40);
      if (levelIndex >= LEVELS.length - 1) { mode = 'victory'; }
      else {
        mode = 'levelComplete';
        game.completeInfo = { timeBonus: timeBonus, ghostBonus: ghostBonus };
      }
      return;
    }

    // ---- particles ----
    particles.forEach(function (pt) { pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.t -= dt; });
    particles = particles.filter(function (pt) { return pt.t > 0; });
  }

  function turnToward(cur, target, maxStep) {
    var d = angDiff(target, cur);
    if (Math.abs(d) <= maxStep) return target;
    return cur + Math.sign(d) * maxStep;
  }

  function checkExitOpen() {
    if (!game) return;
    if (!game.exitOpen && game.lootValue >= game.def.target && game.vault.open) {
      game.exitOpen = true;
      showMessage('TARGET REACHED — get to the getaway car!');
      sfx.vault();
    }
  }

  // ---- rendering ----
  function drawCone(lvl, x, y, dir, range, fov, color) {
    var rays = 26;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (var i = 0; i <= rays; i++) {
      var a = dir - fov / 2 + (fov * i) / rays;
      var d = rayDist(lvl, x, y, a, range);
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!game && mode === 'title') { drawTitle(); return; }
    var lvl = game;
    // floor + tiles
    for (var ty = 0; ty < ROWS; ty++) {
      for (var tx = 0; tx < COLS; tx++) {
        var t = tileAt(lvl, tx, ty), px = tx * TILE, py = ty * TILE;
        if (t === '#') {
          ctx.fillStyle = '#23233a'; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = '#2e2e4a'; ctx.fillRect(px, py, TILE, 5);
          ctx.fillStyle = '#1a1a2c'; ctx.fillRect(px, py + TILE - 4, TILE, 4);
        } else {
          ctx.fillStyle = (tx + ty) % 2 === 0 ? '#14141f' : '#12121c';
          ctx.fillRect(px, py, TILE, TILE);
          if (t === 'h') { ctx.fillStyle = 'rgba(40,60,120,0.35)'; ctx.fillRect(px, py, TILE, TILE); }
          if (t === 'D') {
            ctx.fillStyle = '#3a2f1a'; ctx.fillRect(px, py, TILE, TILE);
            ctx.fillStyle = '#6b5222'; ctx.fillRect(px + 4, py + TILE / 2 - 2, TILE - 8, 4);
          }
        }
      }
    }
    // getaway car zone
    if (lvl.exit) {
      var ex = lvl.exit;
      ctx.save();
      ctx.translate(ex.x, ex.y);
      ctx.fillStyle = game.exitOpen ? 'rgba(80,255,140,0.18)' : 'rgba(255,255,255,0.06)';
      ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
      // car body (top-down)
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = game.exitOpen ? '#37d67a' : '#5a5a6e';
      roundRect(-16, -26, 32, 52, 8); ctx.fill();
      ctx.fillStyle = '#101018';
      roundRect(-12, -14, 24, 12, 3); ctx.fill();
      roundRect(-12, 6, 24, 10, 3); ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(-14, -26, 5, 4); ctx.fillRect(9, -26, 5, 4);
      ctx.restore();
      ctx.fillStyle = game.exitOpen ? '#7dff8a' : '#8a8aa0';
      ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(game.exitOpen ? 'GETAWAY CAR — GO!' : 'GETAWAY CAR (locked)', ex.x, ex.y - 56);
    }
    // loot
    lvl.loot.forEach(function (it) {
      if (it.taken) return;
      ctx.save(); ctx.translate(it.x, it.y);
      if (it.kind === 'L') {
        ctx.fillStyle = '#2f7d3a'; ctx.fillRect(-11, -7, 22, 14);
        ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 4);
      } else if (it.kind === 'G') {
        ctx.fillStyle = '#c9a227';
        ctx.beginPath(); ctx.moveTo(-10, 6); ctx.lineTo(-6, -6); ctx.lineTo(6, -6); ctx.lineTo(10, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffe98a'; ctx.beginPath(); ctx.moveTo(-6, 4); ctx.lineTo(-3, -3); ctx.lineTo(3, -3); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#66e0ff';
        ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(9, 0); ctx.lineTo(0, 11); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8fbff'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(4, 0); ctx.lineTo(0, 5); ctx.lineTo(-4, 0); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });
    // safes + vault
    lvl.safes.forEach(function (s) { drawSafe(s, false); });
    if (lvl.vault) drawSafe(lvl.vault, true);
    // camera cones + cameras
    lvl.cameras.forEach(function (c) {
      var ang = c.ang !== undefined ? c.ang : c.base;
      drawCone(lvl, c.x, c.y, ang, 270, 0.9, c.spotting ? 'rgba(255,60,60,0.30)' : 'rgba(255,220,90,0.13)');
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(ang);
      ctx.fillStyle = c.spotting ? '#ff4444' : '#d8c25a';
      roundRect(-4, -4, 16, 8, 3); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(12, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#888'; ctx.fillRect(c.x - 2, c.y - 2, 4, 4);
    });
    // guard vision cones
    lvl.guards.forEach(function (g) {
      var col = g.state === 'chase' ? 'rgba(255,60,60,0.32)' : (g.suspicion > 0.35 ? 'rgba(255,180,60,0.28)' : 'rgba(255,220,120,0.15)');
      drawCone(lvl, g.x, g.y, g.dir, 230, 1.25, col);
    });
    // thrown coin
    if (coin) {
      ctx.fillStyle = '#ffe98a';
      ctx.beginPath(); ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,233,138,0.5)'; ctx.beginPath(); ctx.arc(coin.x, coin.y, 12, 0, Math.PI * 2); ctx.stroke();
    }
    // guards
    lvl.guards.forEach(function (g) {
      ctx.save(); ctx.translate(g.x, g.y);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(g.dir);
      ctx.fillStyle = g.state === 'chase' ? '#c0392b' : '#3a5a8c';
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#dfe8ff';
      ctx.beginPath(); ctx.arc(7, -5, 2.5, 0, Math.PI * 2); ctx.arc(7, 5, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1c2f4d'; ctx.fillRect(8, -3, 8, 6);
      ctx.restore();
      // suspicion bar
      if (g.suspicion > 0.02) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(g.x - 16, g.y - 26, 32, 6);
        ctx.fillStyle = g.suspicion > 0.7 ? '#ff4444' : '#ffb43c';
        ctx.fillRect(g.x - 15, g.y - 25, 30 * g.suspicion, 4);
        if (g.state === 'chase') {
          ctx.fillStyle = '#ff5555'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('!', g.x, g.y - 32);
        }
      }
    });
    // player
    var p = game.player;
    ctx.save(); ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(0, 9, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (inShadow(lvl, p.x, p.y)) {
      ctx.strokeStyle = 'rgba(120,160,255,0.8)'; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    ctx.rotate(p.dir);
    ctx.fillStyle = p.sneaking ? '#2f6b3a' : '#1f8a4c';
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0d0d12';
    ctx.beginPath(); ctx.arc(6, -5, 3, 0, Math.PI * 2); ctx.arc(6, 5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe9a8'; ctx.fillRect(9, -2, 6, 4); // mask strap / torch hint
    ctx.restore();
    if (p.cracking) {
      var t = p.cracking;
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(t.x - 30, t.y - 40, 60, 10);
      ctx.fillStyle = '#ffd94d'; ctx.fillRect(t.x - 29, t.y - 39, 58 * Math.min(1, t.progress), 8);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('CRACKING…', t.x, t.y - 46);
    }
    // particles
    particles.forEach(function (pt) {
      ctx.globalAlpha = Math.max(0, pt.t);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;

    drawHUD();
    if (mode === 'paused') drawOverlay('PAUSED', 'Press P to resume — R restarts the level');
    if (mode === 'levelComplete') drawLevelComplete();
    if (mode === 'busted') drawOverlay('BUSTED!', 'Press Enter to retry the level (' + lives + (lives === 1 ? ' life' : ' lives') + ' left)');
    if (mode === 'gameOver') drawGameOver();
    if (mode === 'victory') drawVictory();
    if (mode === 'title') drawTitle();
  }

  function drawSafe(s, isVault) {
    ctx.save(); ctx.translate(s.x, s.y);
    ctx.fillStyle = isVault ? '#4a3a12' : '#3a3a4a';
    ctx.fillRect(-17, -17, 34, 34);
    ctx.fillStyle = isVault ? '#8a6d1f' : '#565664';
    ctx.fillRect(-14, -14, 28, 28);
    ctx.fillStyle = s.open ? '#7dff8a' : '#ffd94d';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    if (s.open) {
      ctx.strokeStyle = '#7dff8a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    if (!s.open) {
      ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(isVault ? 'VAULT — hold E' : 'SAFE — hold E', s.x, s.y + 30);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(5,5,12,0.82)';
    ctx.fillRect(0, 0, W, 46);
    ctx.fillStyle = '#e8e8f0'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('SCORE ' + score.toLocaleString(), 14, 29);
    ctx.fillStyle = '#ffd94d';
    ctx.fillText('LOOT $' + game.lootValue.toLocaleString() + ' / $' + game.def.target.toLocaleString(), 190, 29);
    ctx.fillStyle = game.exitOpen ? '#7dff8a' : '#8a8aa0';
    ctx.fillText(game.exitOpen ? '➤ GETAWAY CAR OPEN' : '➤ crack the VAULT + reach target', 480, 29);
    // alarm meter
    ctx.fillStyle = '#8a8aa0'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText('ALARM', 800, 29);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(860, 18, 140, 12);
    ctx.fillStyle = game.alarm > 66 ? '#ff4444' : (game.alarm > 33 ? '#ffb43c' : '#7dff8a');
    ctx.fillRect(860, 18, 140 * (game.alarm / 100), 12);
    // timer / police
    ctx.fillStyle = policeActive ? '#ff5555' : '#e8e8f0';
    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'right';
    var mm = Math.floor(Math.max(0, timeLeft) / 60), ss = Math.floor(Math.max(0, timeLeft) % 60);
    ctx.fillText(policeActive ? 'POLICE ' + Math.ceil(policeTimer) + 's!' : '⏱ ' + mm + ':' + (ss < 10 ? '0' : '') + ss, 1150, 29);
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText('♥'.repeat(lives) + '♡'.repeat(Math.max(0, 3 - lives)), 1270, 29);
    ctx.textAlign = 'left';
    // level name + message
    ctx.fillStyle = '#8a8aa0'; ctx.font = '13px sans-serif';
    ctx.fillText(game.def.name + '   ·   Level ' + (levelIndex + 1) + '/3', 14, PLAY_H - 4);
    if (messageT > 0) {
      ctx.fillStyle = policeActive ? '#ff8888' : '#ffe9a8';
      ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(message, W / 2, 74);
      ctx.textAlign = 'left';
    }
    // stamina bar
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(14, PLAY_H - 34, 90, 6);
    ctx.fillStyle = '#66c2ff'; ctx.fillRect(14, PLAY_H - 34, 90 * (game.player.stamina / 100), 6);
    ctx.fillStyle = '#8a8aa0'; ctx.font = '11px sans-serif';
    ctx.fillText('DASH', 110, PLAY_H - 28);
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(5,5,12,0.78)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff8a8a'; ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(title, W / 2, H / 2 - 10);
    ctx.fillStyle = '#e8e8f0'; ctx.font = '20px sans-serif';
    ctx.fillText(sub, W / 2, H / 2 + 34);
    ctx.textAlign = 'left';
  }

  function drawTitle() {
    ctx.fillStyle = '#0a0a12'; ctx.fillRect(0, 0, W, H);
    // vault door backdrop
    ctx.save(); ctx.translate(W / 2, 300);
    ctx.fillStyle = '#1c1c30'; ctx.beginPath(); ctx.arc(0, 0, 190, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a3a55'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 190, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd94d'; ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0a12'; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      ctx.fillStyle = '#c9a227';
      ctx.beginPath(); ctx.arc(Math.cos(a) * 130, Math.sin(a) * 130, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 72px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('THE MIDNIGHT VAULT', W / 2, 130);
    ctx.fillStyle = '#e8e8f0'; ctx.font = '24px sans-serif';
    ctx.fillText('A heist game — case the building, dodge the guards, crack the vault,', W / 2, 560);
    ctx.fillText('grab the loot and escape to the getaway car before the police arrive.', W / 2, 594);
    ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Press ENTER to start the job', W / 2, 660);
    ctx.fillStyle = '#8a8aa0'; ctx.font = '16px sans-serif';
    ctx.fillText('3 heists  ·  guards with vision cones  ·  cameras  ·  safes & a vault  ·  alarms & police countdown', W / 2, 710);
    ctx.fillText('WASD move · Shift sneak · Space dash · E (hold) crack · Q throw coin · blue shadows hide you', W / 2, 738);
    ctx.textAlign = 'left';
  }

  function drawLevelComplete() {
    ctx.fillStyle = 'rgba(5,5,12,0.82)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 56px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY!', W / 2, 300);
    var info = game.completeInfo || { timeBonus: 0, ghostBonus: 0 };
    ctx.fillStyle = '#e8e8f0'; ctx.font = '22px sans-serif';
    ctx.fillText('Heist ' + (levelIndex + 1) + ' complete — loot $' + game.lootValue.toLocaleString(), W / 2, 370);
    ctx.fillText('Time bonus +$' + info.timeBonus.toLocaleString() + '   ·   Ghost bonus +$' + info.ghostBonus.toLocaleString(), W / 2, 410);
    ctx.fillText('Total score ' + score.toLocaleString(), W / 2, 450);
    ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Press ENTER for the next heist', W / 2, 520);
    ctx.textAlign = 'left';
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(5,5,12,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff5555'; ctx.font = 'bold 64px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, 330);
    ctx.fillStyle = '#e8e8f0'; ctx.font = '22px sans-serif';
    ctx.fillText('The crew got pinched. Final score ' + score.toLocaleString() + ' — loot $' + totalLoot.toLocaleString(), W / 2, 390);
    ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Press ENTER to plan the next job', W / 2, 470);
    ctx.textAlign = 'left';
  }

  function drawVictory() {
    ctx.fillStyle = 'rgba(5,5,12,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 60px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('THE PERFECT HEIST', W / 2, 280);
    var rank = score >= 45000 ? 'LEGENDARY CREW' : (score >= 35000 ? 'MASTER THIEF' : (score >= 25000 ? 'PROFESSIONAL' : 'ROOKIE WITH LUCK'));
    ctx.fillStyle = '#7dff8a'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText('Rank: ' + rank, W / 2, 350);
    ctx.fillStyle = '#e8e8f0'; ctx.font = '22px sans-serif';
    ctx.fillText('All three heists done — total loot $' + totalLoot.toLocaleString() + '   ·   final score ' + score.toLocaleString(), W / 2, 410);
    ctx.fillText(ghostRun && alarmPeak < 50 ? 'Never once raised a real alarm — a true ghost.' : 'The police knew your name by the end.', W / 2, 448);
    ctx.fillStyle = '#ffd94d'; ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Press ENTER to run it back', W / 2, 520);
    ctx.textAlign = 'left';
  }

  // ---- input ----
  function onKey(e, down) {
    keys[e.code] = down;
    if (down) ensureAudio();
    if (!down) return;
    if (e.code === 'Enter') {
      if (mode === 'title') newRun();
      else if (mode === 'levelComplete') startLevel(levelIndex + 1);
      else if (mode === 'busted') startLevel(levelIndex);
      else if (mode === 'gameOver' || mode === 'victory') { mode = 'title'; game = null; }
    }
    if (e.code === 'KeyP' && (mode === 'playing' || mode === 'paused')) {
      mode = mode === 'playing' ? 'paused' : 'playing';
    }
    if (e.code === 'KeyR' && mode === 'playing') startLevel(levelIndex);
    if (e.code === 'KeyM') { muted = !muted; showMessage(muted ? 'Sound off' : 'Sound on'); }
    if (e.code === 'Space' && mode === 'playing' && game) {
      var p = game.player;
      if (p.dashCd <= 0 && p.stamina > 30) { p.dashT = 0.28; p.dashCd = 0.9; sfx.dash(); }
      e.preventDefault();
    }
    if (e.code === 'KeyQ' && mode === 'playing' && game && !coin) {
      var p2 = game.player;
      coin = { x: p2.x, y: p2.y, tx: p2.x + Math.cos(p2.dir) * 200, ty: p2.y + Math.sin(p2.dir) * 200, t: 0, landT: 0.45, landed: false };
      sfx.coin();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].indexOf(e.code) >= 0) e.preventDefault();
  }
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

  // ---- main loop ----
  function loop(ts) {
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // ---- screenshot states (?shot=start|play|alarm|win) ----
  function applyShot() {
    var q = new URLSearchParams(location.search).get('shot');
    if (!q) return;
    shotMode = q;
    if (q === 'start') { game = null; mode = 'title'; return; }
    if (q === 'play') {
      newRun();
      game.player.x = 640; game.player.y = 380;
      game.guards[0].x = 640; game.guards[0].y = 260; game.guards[0].dir = Math.PI / 2; game.guards[0].suspicion = 0.5;
      game.loot[0].taken = true; game.lootValue += 500; totalLoot += 500; score += 500;
      game.loot[1].taken = true; game.lootValue += 500; totalLoot += 500; score += 500;
      game.safes[0].open = true; game.safes[0].progress = 1; game.lootValue += 1200; score += 1200;
      showMessage('Guard on patrol — stay out of the yellow cone!');
      return;
    }
    if (q === 'alarm') {
      newRun();
      game.player.x = 700; game.player.y = 500;
      game.alarm = 78; alarmPeak = 78; policeActive = true; policeTimer = 32;
      var g = game.guards[0];
      // Guard closing in from a distance: suspicious, investigating the
      // player's last-seen spot — far enough not to catch anyone before
      // the screenshot is taken.
      g.x = 460; g.y = 300; g.dir = Math.PI / 3; g.state = 'investigate';
      g.suspicion = 0.85; g.alerted = true;
      g.lastSeen = { x: 700, y: 500 }; g.investigate = { x: 700, y: 500 };
      game.cameras[0].spotting = true;
      game.lootValue = 4200; score = 4200; totalLoot = 4200;
      showMessage('ALARM TRIPPED — POLICE INBOUND! Get to the car!');
      return;
    }
    if (q === 'win') {
      newRun();
      game.lootValue = 12000; totalLoot = 36500; score = 42180;
      game.vault.open = true; game.exitOpen = true;
      mode = 'victory';
      return;
    }
  }

  // ---- debug / test hooks ----
  window.__heist = {
    state: function () {
      if (!game) return { mode: mode, score: score, lives: lives };
      return {
        mode: mode, score: score, lives: lives, level: levelIndex + 1,
        lootValue: game.lootValue, target: game.def.target, alarm: Math.round(game.alarm),
        timeLeft: Math.round(timeLeft), policeActive: policeActive, policeTimer: Math.round(policeTimer),
        exitOpen: game.exitOpen, vaultOpen: game.vault.open,
        player: { x: Math.round(game.player.x), y: Math.round(game.player.y), stamina: Math.round(game.player.stamina), cracking: !!game.player.cracking },
        guards: game.guards.map(function (g) {
          return { x: Math.round(g.x), y: Math.round(g.y), dir: +g.dir.toFixed(2), suspicion: +g.suspicion.toFixed(2), state: g.state };
        }),
        cameras: game.cameras.map(function (c) { return { spotting: c.spotting }; }),
        safesOpen: game.safes.filter(function (s) { return s.open; }).length
      };
    },
    teleport: function (x, y) { if (game) { game.player.x = x; game.player.y = y; } },
    giveLoot: function (n) { if (game) { game.lootValue += n; score += n; totalLoot += n; checkExitOpen(); } },
    crackVault: function () { if (game) { game.vault.open = true; checkExitOpen(); } },
    setAlarm: function (n) { if (game) { game.alarm = n; if (n >= 100 && !policeActive) { policeActive = true; policeTimer = 45; } } },
    startLevel: function (i) { startLevel(i); },
    aimCamera: function (i, ang) {
      if (!game || !game.cameras[i]) return;
      game.cameras[i].base = ang; game.cameras[i].sweep = 0; game.cameras[i].phase = Math.PI / 2;
    },
    calm: function () {
      if (!game) return;
      game.guards.forEach(function (g) {
        g.suspicion = 0; g.state = 'patrol'; g.lastSeen = null; g.investigate = null; g.alerted = false;
        g.x = g.wp[0].x; g.y = g.wp[0].y; g.wi = 0;
      });
    },
    newRun: newRun
  };

  applyShot();
  if (!game && mode !== 'title') { game = parseLevel(0); }
  requestAnimationFrame(loop);
})();
