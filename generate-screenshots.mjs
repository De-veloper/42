import sharp from 'sharp';
import { mkdirSync } from 'fs';

mkdirSync('./screenshots/ios/1242x2688', { recursive: true });
mkdirSync('./screenshots/ios/1284x2778', { recursive: true });

const W = 1284;
const H = 2778;

async function save(svg, name) {
  const buf = Buffer.from(svg);
  await Promise.all([
    sharp(buf).png().toFile(`./screenshots/ios/1284x2778/${name}.png`),
    sharp(buf).resize(1242, 2688).png().toFile(`./screenshots/ios/1242x2688/${name}.png`),
  ]);
  console.log(`✅ ${name}.png`);
}
const BG = '#020B18';
const TEAL = '#00E5CC';
const BLUE = '#00BFFF';
const GREEN = '#39FF14';
const BORDER = 'rgba(255,255,255,0.08)';

const defs = `<defs>
  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="${BLUE}"/>
    <stop offset="50%" stop-color="${TEAL}"/>
    <stop offset="100%" stop-color="${GREEN}"/>
  </linearGradient>
  <radialGradient id="bgGlow" cx="50%" cy="30%" r="55%">
    <stop offset="0%" stop-color="${BLUE}" stop-opacity="0.1"/>
    <stop offset="100%" stop-color="${BG}" stop-opacity="0"/>
  </radialGradient>
  <filter id="glow">
    <feGaussianBlur stdDeviation="14" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<rect width="${W}" height="${H}" fill="${BG}"/>
<rect width="${W}" height="${H}" fill="url(#bgGlow)"/>`;

const base = c => `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${defs}${c}</svg>`;

const card = (x, y, w, h, r=32, col='rgba(255,255,255,0.05)', border=BORDER) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${col}" stroke="${border}" stroke-width="2"/>`;

const t = (txt, x, y, size, fill='#fff', weight='700', anchor='middle', opacity=1) =>
  `<text x="${x}" y="${y}" font-family="Helvetica Neue,Arial,sans-serif" font-weight="${weight}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" opacity="${opacity}">${txt}</text>`;

const gText = (txt, x, y, size, anchor='middle') =>
  `<text x="${x}" y="${y}" font-family="Helvetica Neue,Arial,sans-serif" font-weight="900" font-size="${size}" text-anchor="${anchor}" fill="url(#g1)">${txt}</text>`;

const label = (txt, x, y) => `
  ${t('—', x, y, 34, TEAL, '700')}
  ${t(txt.toUpperCase(), x, y+42, 34, 'rgba(255,255,255,0.45)', '700')}
  ${t('—', x, y+84, 34, TEAL, '700')}`;

// ─── Screen 1: Home ───────────────────────────────────────────────────────────
async function screen1() {
  const cx1=W*0.28, cx2=W*0.72, cy=860, r=185, sw=18;
  const circ=2*Math.PI*r, arc=circ*0.75;
  const svg = base(`
    ${t('9:41',80,80,44,'#fff','600','start')}
    ${t('42',W/2,82,56,'#fff','900')}
    ${t('Mon, Jun 2',W/2,130,34,'rgba(255,255,255,0.4)','400')}
    ${t('Share',W-200,80,34,TEAL,'700','end')} ${t('Settings',W-70,80,34,'rgba(255,255,255,0.35)','400','end')}

    <!-- Gauge: Days Left -->
    <circle cx="${cx1}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,0.07)" stroke-width="${sw}" fill="none"
      stroke-dasharray="${arc} ${circ-arc}" stroke-linecap="round" transform="rotate(135 ${cx1} ${cy})"/>
    <circle cx="${cx1}" cy="${cy}" r="${r}" stroke="${BLUE}" stroke-width="${sw}" fill="none"
      stroke-dasharray="${arc*0.93} ${circ-arc*0.93}" stroke-linecap="round"
      transform="rotate(135 ${cx1} ${cy})" filter="url(#glow)"/>
    ${t('39',cx1,cy+22,76,BLUE,'900')}
    ${t('Days Left',cx1,cy+68,28,'rgba(255,255,255,0.45)','500')}
    ${t('Day 3 / 42',cx1,cy+102,24,'rgba(255,255,255,0.3)','400')}

    <!-- Gauge: Fitness Score -->
    <circle cx="${cx2}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,0.07)" stroke-width="${sw}" fill="none"
      stroke-dasharray="${arc} ${circ-arc}" stroke-linecap="round" transform="rotate(135 ${cx2} ${cy})"/>
    <circle cx="${cx2}" cy="${cy}" r="${r}" stroke="${TEAL}" stroke-width="${sw}" fill="none"
      stroke-dasharray="${arc*0.45} ${circ-arc*0.45}" stroke-linecap="round"
      transform="rotate(135 ${cx2} ${cy})" filter="url(#glow)"/>
    ${t('45',cx2,cy+22,76,TEAL,'900')}
    ${t('Fitness Score',cx2,cy+68,28,'rgba(255,255,255,0.45)','500')}
    ${t('Active',cx2,cy+102,28,TEAL,'700')}

    <!-- Week card -->
    ${card(60,1105,W-120,280,28,'rgba(255,255,255,0.04)')}
    ${t('Week 1',90,1162,38,'#fff','900','start')} ${t('of 6',236,1162,30,'rgba(255,255,255,0.3)','400','start')}
    ${t('Days 1-7',W-90,1162,28,'rgba(255,255,255,0.3)','400','end')}
    ${[0,1,2,3,4,5,6].map(i => {
      const x=90+i*160, act=i<3;
      return `<rect x="${x}" y="1185" width="130" height="64" rx="14"
        fill="${act?'rgba(0,229,204,0.2)':'rgba(255,255,255,0.05)'}"
        stroke="${act?TEAL:BORDER}" stroke-width="2"/>
        ${t(i+1, x+65, 1230, 28, act?TEAL:'rgba(255,255,255,0.4)', act?'700':'400')}`;
    }).join('')}
    ${t('3',220,1340,52,'#fff','900')} ${t('/7',274,1340,36,'rgba(255,255,255,0.3)','400')}
    ${t('Days active',220,1376,26,'rgba(255,255,255,0.4)','500')}
    <rect x="${W/2-1}" y="1306" width="2" height="90" fill="${BORDER}"/>
    ${t('+14',W*0.75,1340,52,GREEN,'900')}
    ${t('Score change',W*0.75,1376,26,'rgba(255,255,255,0.4)','500')}

    ${label('Track your 42-day transformation',W/2,1540)}
  `);
  await save(svg, '01-home');
}

// ─── Screen 2: Log Workout ───────────────────────────────────────────────────
async function screen2() {
  const types = ['Run','Ride','Walk','Swim','Gym','Yoga'];
  const svg = base(`
    ${t('9:41',80,80,44,'#fff','600','start')}
    ${t('Cancel',80,178,38,TEAL,'700','start')}
    ${t('Log Workout',W/2,178,42,'#fff','700')}

    ${t('WHAT DID YOU DO?',W/2,256,27,'rgba(255,255,255,0.4)','700')}
    ${types.map((tp,i) => {
      const x=80+(i%3)*394, y=280+Math.floor(i/3)*148, sel=i===0;
      return `${card(x,y,360,118,20,sel?'rgba(0,229,204,0.15)':'rgba(255,255,255,0.05)',sel?TEAL:BORDER)}
        ${t(tp,x+180,y+70,30,sel?TEAL:'rgba(255,255,255,0.6)',sel?'700':'500')}`;
    }).join('')}

    ${t('HOW LONG? (MINUTES)',W/2,640,27,'rgba(255,255,255,0.4)','700')}
    ${card(80,665,W-160,108,20,'rgba(255,255,255,0.06)')}
    ${t('45',160,745,54,'#fff','700','start')}
    ${t('min',W-120,745,34,'rgba(255,255,255,0.4)','400','end')}
    ${[15,20,30,45,60,90].map((m,i) => {
      const x=80+i*192, sel=m===45;
      return `<rect x="${x}" y="795" width="170" height="64" rx="32"
        fill="${sel?'rgba(0,229,204,0.15)':'rgba(255,255,255,0.06)'}"
        stroke="${sel?TEAL:BORDER}" stroke-width="2"/>
        ${t(m+'m',x+85,840,26,sel?TEAL:'rgba(255,255,255,0.5)',sel?'700':'500')}`;
    }).join('')}

    <!-- GPS -->
    ${card(80,884,W-160,116,20,'rgba(0,229,204,0.08)','rgba(0,229,204,0.3)')}
    ${t('3.2 km  |  00:34:12',W/2,938,34,TEAL,'700')}
    ${t('GPS Active  ●',W/2,978,26,'rgba(0,229,204,0.6)','500')}

    ${t('HOW DID IT FEEL?',W/2,1046,27,'rgba(255,255,255,0.4)','700')}
    ${[['Rough','#EF4444'],['Tired','#F97316'],['OK','#EAB308'],['Good','#22C55E'],['Great','#00E5CC']].map(([l,c],i) => {
      const x=60+i*236, sel=i===3;
      return `${card(x,1070,210,140,20,sel?`${c}22`:'rgba(255,255,255,0.05)',sel?c:BORDER)}
        ${t(l,x+105,l.length>4?1148:1158,28,sel?c:'rgba(255,255,255,0.45)',sel?'700':'500')}`;
    }).join('')}

    <rect x="80" y="1240" width="${W-160}" height="116" rx="24" fill="${TEAL}"/>
    ${t('Save Workout',W/2,1316,44,BG,'800')}

    ${label('Log every session, stay consistent',W/2,1460)}
  `);
  await save(svg, '02-log');
}

// ─── Screen 3: History + Calendar ────────────────────────────────────────────
async function screen3() {
  const worked = new Set([1,3,5,8,9,12,14,15,17,20,21,22,24,26,28,29]);
  const dayH = ['S','M','T','W','T','F','S'];
  const svg = base(`
    ${t('9:41',80,80,44,'#fff','600','start')}
    ${t('History',80,178,60,'#fff','900','start')}
    <rect x="${W-220}" y="136" width="164" height="72" rx="14" fill="${TEAL}"/>
    ${t('+ Log',W-138,190,34,BG,'800')}

    ${card(60,224,W-120,560,28,'rgba(255,255,255,0.04)')}
    ${t('June 2026',W/2,288,32,'rgba(255,255,255,0.5)','700')}
    ${dayH.map((d,i)=>t(d,100+i*160,330,27,'rgba(255,255,255,0.35)','700')).join('')}
    ${Array.from({length:30},(_,i)=>{
      const col=i%7,row=Math.floor(i/7),n=i+1;
      const x=100+col*160,y=385+row*88,done=worked.has(n);
      return `${done?`<circle cx="${x}" cy="${y-12}" r="34" fill="rgba(0,229,204,0.15)"/>`:``}
        ${t(n,x,y,30,done?TEAL:'rgba(255,255,255,0.4)',done?'700':'400')}
        ${done?`<circle cx="${x}" cy="${y+16}" r="5" fill="${TEAL}"/>`:``}`;
    }).join('')}

    ${card(60,828,W-120,370,28,'rgba(255,255,255,0.04)')}
    ${t('SCORE BREAKDOWN',W/2,890,28,'rgba(255,255,255,0.4)','700')}
    ${[['Consistency',TEAL,0.72],['Effort',BLUE,0.65],['Volume',GREEN,0.58]].map(([l,c,p],i)=>{
      const y=946+i*90,bw=(W-320)*p;
      return `${t(l,140,y+8,30,'rgba(255,255,255,0.7)','600','start')}
        <rect x="140" y="${y+20}" width="${W-320}" height="14" rx="7" fill="rgba(255,255,255,0.08)"/>
        <rect x="140" y="${y+20}" width="${bw}" height="14" rx="7" fill="${c}"/>
        ${t(Math.round(p*100),W-120,y+10,28,'rgba(255,255,255,0.5)','700','end')}`;
    }).join('')}

    ${[['16','Active Days'],['680','Total Mins'],['Active','Level']].map(([v,l],i)=>{
      const x=100+i*370;
      return `${card(x,1244,310,140,20)}
        ${gText(v,x+155,1328,44)} ${t(l,x+155,1364,26,'rgba(255,255,255,0.4)','500')}`;
    }).join('')}

    ${label('Your complete workout history',W/2,1508)}
  `);
  await save(svg, '03-history');
}

// ─── Screen 4: Milestones ────────────────────────────────────────────────────
async function screen4() {
  const badges = [
    ['Fire','First Sweat','Log first workout',true],
    ['x3','Hat Trick','3-day streak',true],
    ['7d','Week One','Reach Day 7',true],
    ['10x','Dedicated','Log 10 workouts',true],
    ['14d','Week Two','Reach Day 14',false],
    ['bolt','On Fire','7-day streak',false],
    ['half','Halfway','Reach Day 21',false],
    ['21x','Warrior','21 workouts',false],
    ['28d','Week Four','Reach Day 28',false],
    ['35d','Home Stretch','Reach Day 35',false],
    ['42d','Champion','Finish 42 days',false],
  ];
  const svg = base(`
    ${t('9:41',80,80,44,'#fff','600','start')}
    ${t('42',W/2,82,56,'#fff','900')}
    ${gText('ACHIEVEMENTS',W/2,220,60)}
    ${t('Unlock badges as you progress',W/2,272,34,'rgba(255,255,255,0.45)','400')}

    ${card(80,308,W-160,272,36,'rgba(0,229,204,0.08)','rgba(0,229,204,0.25)')}
    ${gText('ACHIEVEMENT UNLOCKED!',W/2,386,32)}
    ${t('Dedicated',W/2,456,56,'#fff','900')}
    ${t('Log 10 workouts',W/2,504,32,'rgba(255,255,255,0.45)','400')}

    ${badges.map(([sym,name,desc,done],i)=>{
      const col=i%3,row=Math.floor(i/3),x=64+col*404,y=624+row*200;
      return `${card(x,y,374,172,24,done?'rgba(0,229,204,0.1)':'rgba(255,255,255,0.04)',done?'rgba(0,229,204,0.35)':BORDER)}
        <rect x="${x+16}" y="${y+26}" width="64" height="64" rx="14"
          fill="${done?'rgba(0,229,204,0.2)':'rgba(255,255,255,0.06)'}"/>
        ${t(sym,x+48,y+70,20,done?TEAL:'rgba(255,255,255,0.25)','700')}
        ${t(name,x+100,y+60,26,done?'#fff':'rgba(255,255,255,0.3)',done?'700':'500','start')}
        ${t(desc,x+100,y+94,21,'rgba(255,255,255,0.35)','400','start')}
        ${done?`<circle cx="${x+344}" cy="${y+36}" r="18" fill="${TEAL}"/>
          ${t('✓',x+344,y+44,22,BG,'900')}`:``}`;
    }).join('')}

    ${label('Stay motivated, earn every badge',W/2,1572)}
  `);
  await save(svg, '04-milestones');
}

// ─── Screen 5: Progress Chart ────────────────────────────────────────────────
async function screen5() {
  const scores=[0,4,8,13,17,22,25,29,32,36,38,41,43,45];
  const chartL=120,chartR=W-80,chartT=440,chartB=1030;
  const cW=chartR-chartL,cH=chartB-chartT;
  const pts=scores.map((v,i)=>({
    x:chartL+i*(cW/(scores.length-1)),
    y:chartB-v*(cH/100)
  }));
  const pathD=pts.map((p,i)=>`${i===0?'M':'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fillD=`${pathD} L ${pts[pts.length-1].x} ${chartB} L ${pts[0].x} ${chartB} Z`;
  const last=pts[pts.length-1];

  const svg = base(`
    ${t('9:41',80,80,44,'#fff','600','start')}
    ${t('History',80,178,60,'#fff','900','start')}

    ${gText('FITNESS SCORE OVER TIME',W/2,330,46)}
    ${t('Your 42-day journey',W/2,380,34,'rgba(255,255,255,0.45)','400')}

    ${card(60,406,W-120,668,28,'rgba(255,255,255,0.04)')}
    ${[0,25,50,75,100].map(v=>{
      const y=chartB-v*(cH/100);
      return `<line x1="${chartL}" y1="${y}" x2="${chartR}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
        ${t(v,chartL-14,y+10,22,'rgba(255,255,255,0.3)','400','end')}`;
    }).join('')}
    <path d="${fillD}" fill="url(#g1)" fill-opacity="0.15"/>
    <path d="${pathD}" stroke="url(#g1)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last.x}" cy="${last.y}" r="18" fill="${TEAL}" opacity="0.3"/>
    <circle cx="${last.x}" cy="${last.y}" r="10" fill="${TEAL}"/>
    ${t('Score: 45',last.x+24,last.y-16,26,TEAL,'700','start')}
    ${[1,7,14,21,28,35,42].map(d=>{
      const x=chartL+(d-1)*(cW/41);
      return t(d,x,chartB+34,22,'rgba(255,255,255,0.3)','400');
    }).join('')}
    ${t('Day',chartL,chartB+34,22,'rgba(255,255,255,0.2)','400','start')}

    <!-- Stat chips -->
    ${[['45','Current Score'],['3','Day Streak'],['16','Active Days']].map(([v,l],i)=>{
      const x=100+i*370;
      return `${card(x,1118,310,140,20)}
        ${gText(v,x+155,1202,48)} ${t(l,x+155,1238,26,'rgba(255,255,255,0.4)','500')}`;
    }).join('')}

    <!-- GPS workout card -->
    ${card(60,1302,W-120,220,28,'rgba(255,255,255,0.04)')}
    ${t('Today - Day 3',90,1368,32,'rgba(255,255,255,0.5)','600','start')}
    ${t('Run  45 min  3.2 km',W/2,1420,36,'#fff','700')}
    ${t('GPS tracked  |  Feeling great',W/2,1462,28,TEAL,'600')}

    ${label('Watch your fitness score climb',W/2,1578)}
  `);
  await save(svg, '05-progress');
}

// ─── Screen 6: Journey Paths ─────────────────────────────────────────────────
async function screen6() {
  const paths = [
    { icon: '🏃', title: 'Running Goal', opts: ['5K','10K','Half Marathon'], color: TEAL, active: true },
    { icon: '🚴', title: 'Riding Goal',  opts: ['25 mi','50 mi','Century'],  color: BLUE, active: false },
    { icon: '🏊', title: 'Swimming Goal',opts: ['500m','1 km','2 km'],        color: GREEN, active: false },
  ];

  // progress arc for the active path (5K, 68% done)
  const cx = W/2, cy = 690, r = 200, sw = 20;
  const circ = 2 * Math.PI * r, arc = circ * 0.75;
  const progress = 0.68;

  const svg = base(`
    ${t('9:41', 80, 80, 44, '#fff', '600', 'start')}
    ${t('Journey Paths', W/2, 178, 52, '#fff', '900')}
    ${t('Set a goal. Train toward it.', W/2, 226, 32, 'rgba(255,255,255,0.4)', '400')}

    <!-- Active path card (Running / 5K) -->
    ${card(60, 262, W-120, 530, 32, 'rgba(0,229,204,0.08)', 'rgba(0,229,204,0.4)')}

    <!-- progress ring -->
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,0.07)" stroke-width="${sw}" fill="none"
      stroke-dasharray="${arc} ${circ-arc}" stroke-linecap="round" transform="rotate(135 ${cx} ${cy})"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${TEAL}" stroke-width="${sw}" fill="none"
      stroke-dasharray="${(arc*progress).toFixed(1)} ${(circ-arc*progress).toFixed(1)}" stroke-linecap="round"
      transform="rotate(135 ${cx} ${cy})" filter="url(#glow)"/>
    ${t('RUN', cx, cy-10, 52, TEAL, '900')}
    ${t('68%', cx, cy+52, 62, '#fff', '900')}
    ${t('toward your 5K', cx, cy+96, 28, 'rgba(255,255,255,0.45)', '500')}

    <!-- week plan label -->
    ${t('WEEK 5 OF 8', W/2, 836, 26, 'rgba(255,255,255,0.35)', '700')}
    ${t('3 runs  30 min each  push for 2.5 mi', W/2, 870, 27, 'rgba(255,255,255,0.55)', '500')}

    <!-- week day dots: 3 done -->
    ${[0,1,2].map(i => {
      const x = W/2 - 60 + i*60;
      return `<circle cx="${x}" cy="912" r="16" fill="${TEAL}" opacity="0.9"/>
        ${t('OK', x, 917, 16, BG, '900')}`;
    }).join('')}

    <!-- milestones row -->
    ${card(60, 950, W-120, 130, 24, 'rgba(255,255,255,0.04)')}
    ${[['1st','First Steps',true],['1mi','One Mile',true],['W1','Week 1',true],['1/2','Halfway',false],['3mi','3 Miles',false],['5K','5K Done',false]].map(([sym,l,done],i) => {
      const x = 100 + i*188;
      return `<rect x="${x-28}" y="966" width="56" height="38" rx="10"
          fill="${done?'rgba(0,229,204,0.2)':'rgba(255,255,255,0.06)'}"/>
        ${t(sym, x, 991, 20, done?TEAL:'rgba(255,255,255,0.25)', done?'700':'500')}
        ${t(l, x, 1046, 19, done?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.25)', done?'600':'400')}`;
    }).join('')}

    <!-- other path cards -->
    ${paths.filter((_,i)=>i>0).map((p, i) => {
      const y = 1108 + i * 190;
      return `${card(60, y, W-120, 162, 24, 'rgba(255,255,255,0.04)')}
        ${t(p.title, 140, y+62, 34, '#fff', '700', 'start')}
        ${t(p.opts.join(' / '), 140, y+104, 26, 'rgba(255,255,255,0.35)', '500', 'start')}
        ${t(i===0?'Unlock after 5K':'Unlock after 25 mi', W-90, y+80, 24, 'rgba(255,255,255,0.25)', '400', 'end')}`;
    }).join('')}

    ${label('New in v1.5 — pick your distance goal', W/2, 1500)}
  `);
  await save(svg, '06-paths');
}

await Promise.all([screen1(), screen2(), screen3(), screen4(), screen5(), screen6()]);
console.log('\nAll screenshots saved to assets/screenshots/');
