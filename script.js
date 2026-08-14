const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ OCEAN INTRO CANVAS ============ */
(function(){
  const canvas = document.getElementById('ocean-canvas');
  const ctx = canvas.getContext('2d');
  let w,h,particles=[],rays=[];
  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PCOUNT = window.innerWidth < 700 ? 34 : 70;
  for(let i=0;i<PCOUNT;i++){
    particles.push({
      x: Math.random()*w,
      y: h + Math.random()*h,
      r: Math.random()*3+1,
      speed: Math.random()*0.6+0.25,
      drift: Math.random()*0.6-0.3,
      alpha: Math.random()*0.5+0.15
    });
  }
  const RCOUNT = 5;
  for(let i=0;i<RCOUNT;i++){
    rays.push({
      x: Math.random()*w,
      width: Math.random()*120+60,
      speed: Math.random()*0.15+0.05,
      offset: Math.random()*1000
    });
  }

  let start = performance.now();
  let running = true;
  function draw(t){
    if(!running) return;
    ctx.clearRect(0,0,w,h);

    // light rays
    ctx.save();
    ctx.filter = 'blur(28px)';
    ctx.globalCompositeOperation = 'lighter';
    rays.forEach(r=>{
      const sway = Math.sin((t/2000)+r.offset)*50;
      const grad = ctx.createLinearGradient(r.x+sway,0,r.x+sway+r.width,h*0.9);
      grad.addColorStop(0,'rgba(140,200,215,0.09)');
      grad.addColorStop(0.6,'rgba(140,200,215,0.03)');
      grad.addColorStop(1,'rgba(140,200,215,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(r.x+sway-r.width*0.25,0);
      ctx.lineTo(r.x+sway+r.width*0.25,0);
      ctx.lineTo(r.x+sway+r.width*0.85,h);
      ctx.lineTo(r.x+sway-r.width*0.85,h);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // bubbles / particles
    particles.forEach(p=>{
      p.y -= p.speed;
      p.x += p.drift*0.3;
      if(p.y < -10){ p.y = h+10; p.x = Math.random()*w; }
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(190,225,235,${p.alpha})`;
      ctx.fill();
    });

    if(running) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* sequence text */
  const words = document.querySelectorAll('.ocean-word');
  const progress = document.getElementById('ocean-progress');
  const introEl = document.getElementById('ocean-intro');
  const skipBtn = document.getElementById('skip-intro');

  const stepTimes = [0, 900, 1750, 2600];
  const totalDuration = reduceMotion ? 300 : 3600;

  function showStep(i){
    words.forEach(w=>{
      const step = parseInt(w.dataset.step);
      w.classList.remove('show','hide');
      if(step === i) w.classList.add('show');
      else if(step === i-1) w.classList.add('hide');
    });
  }

  function endIntro(){
    running = false;
    introEl.classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('depth-gauge').classList.add('ready');
    startTerminal();
    setTimeout(()=>{ introEl.remove(); }, 1100);
  }

  if(reduceMotion){
    document.body.style.overflow='';
    endIntro();
  } else {
    document.body.style.overflow='hidden';
    stepTimes.forEach((t,i)=> setTimeout(()=>showStep(i), t));
    let progInterval = setInterval(()=>{
      const elapsed = performance.now()-start;
      const pct = Math.min(100, (elapsed/totalDuration)*100);
      progress.style.width = pct+'%';
      if(pct>=100) clearInterval(progInterval);
    },30);
    setTimeout(endIntro, totalDuration);
  }

  skipBtn.addEventListener('click', endIntro);
})();

/* ============ NAVBAR ============ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', ()=>{
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

const navToggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');
navToggle.addEventListener('click', ()=>{
  navToggle.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click', ()=>{
  navToggle.classList.remove('open'); mobileMenu.classList.remove('open');
}));

/* ============ TERMINAL TYPING ============ */
function startTerminal(){
  const body = document.getElementById('term-body');
  const lines = [
    {p:'$ ', c:'whoami', out:false},
    {p:'', c:'Aashish Thapa', out:true},
    {p:'$ ', c:'role', out:false},
    {p:'', c:'Full Stack Developer', out:true},
    {p:'$ ', c:'location', out:false},
    {p:'', c:'Kupandole, Lalitpur, Nepal', out:true},
    {p:'$ ', c:'status', out:false},
    {p:'', c:'Learning • Building • Improving', out:true},
  ];
  if(reduceMotion){
    body.innerHTML = lines.map(l=> l.out ? `<div class="term-out">${l.c}</div>` : `<div><span class="term-prompt">${l.p}</span>${l.c}</div>`).join('');
    return;
  }
  let li=0;
  function typeLine(){
    if(li>=lines.length) return;
    const l = lines[li];
    const div = document.createElement('div');
    if(!l.out) div.innerHTML = `<span class="term-prompt">${l.p}</span><span class="tl"></span>`;
    else { div.classList.add('term-out'); div.innerHTML = `<span class="tl"></span>`; }
    body.appendChild(div);
    const target = div.querySelector('.tl');
    let ci=0;
    const speed = l.out ? 14 : 45;
    const interval = setInterval(()=>{
      target.textContent += l.c[ci];
      ci++;
      if(ci>=l.c.length){
        clearInterval(interval);
        li++;
        setTimeout(typeLine, l.out ? 260 : 120);
      }
    }, speed);
  }
  typeLine();
}

/* ============ DEPTH GAUGE SCROLL SYNC ============ */
const gaugeDot = document.getElementById('gauge-dot');
const gaugeDepth = document.getElementById('gauge-depth');
const depthSections = [
  {id:'home', m:0},
  {id:'about', m:12},
  {id:'skills', m:28},
  {id:'education', m:45},
  {id:'certifications', m:60},
  {id:'contact', m:80},
];
function updateGauge(){
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight>0 ? scrollTop/docHeight : 0;
  gaugeDot.style.top = (pct*100)+'%';

  let current = depthSections[0];
  for(const s of depthSections){
    const el = document.getElementById(s.id);
    if(el && el.getBoundingClientRect().top < window.innerHeight*0.5) current = s;
  }
  gaugeDepth.textContent = current.m;
}
window.addEventListener('scroll', updateGauge);
updateGauge();

/* ============ CONTACT FORM ============ */
const cform = document.getElementById('contact-form');
if(cform){
  cform.addEventListener('submit', function(e){
    e.preventDefault();
    const name = document.getElementById('f-name');
    const email = document.getElementById('f-email');
    const message = document.getElementById('f-message');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let valid = true;

    [ ['row-name', name.value.trim().length>0],
      ['row-email', emailRe.test(email.value.trim())],
      ['row-message', message.value.trim().length>3] ].forEach(([id,ok])=>{
        const row = document.getElementById(id);
        row.classList.toggle('invalid', !ok);
        if(!ok) valid=false;
      });

    const status = document.getElementById('form-status');
    const btn = document.getElementById('form-submit-btn');

    if(!valid){
      status.textContent = 'Please fix the highlighted fields.';
      status.className = 'form-status show';
      return;
    }

    btn.textContent = 'Opening your email app…';
    btn.disabled = true;
    status.className = 'form-status show';
    status.textContent = 'Preparing your message…';

    const subject = encodeURIComponent(`Portfolio inquiry from ${name.value.trim()}`);
    const body = encodeURIComponent(`${message.value.trim()}\n\n— ${name.value.trim()} (${email.value.trim()})`);
    const mailto = `mailto:aashish19787@gmail.com?subject=${subject}&body=${body}`;

    setTimeout(()=>{
      window.location.href = mailto;
      btn.textContent = 'Send Message';
      btn.disabled = false;
      status.className = 'form-status show success';
      status.textContent = 'Your email app should now be open with the message ready to send.';
    }, 500);
  });
}

/* ============ SCROLL REVEALS ============ */
const revealEls = document.querySelectorAll('[data-reveal]');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); }
  });
},{threshold:0.15});
revealEls.forEach(el=>io.observe(el));
