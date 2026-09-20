(function(){
  // ---------- construir el simbolo del girasol reutilizable ----------
  function petalPath(rOuter, rInner){
    return `M50,50 Q44,${(50-rInner).toFixed(1)} 50,${(50-rOuter).toFixed(1)} Q56,${(50-rInner).toFixed(1)} 50,50 Z`;
  }
  function buildPetals(count, rOuter, rInner, color, angleOffset){
    let s = '';
    for(let i=0;i<count;i++){
      const a = (360/count)*i + angleOffset;
      s += `<path d="${petalPath(rOuter,rInner)}" fill="${color}" stroke="#d98c00" stroke-width="0.5" transform="rotate(${a} 50 50)"/>`;
    }
    return s;
  }
  function buildCenterDots(count, maxR){
    let s = '';
    const golden = 137.508 * Math.PI/180;
    for(let i=0;i<count;i++){
      const r = maxR * Math.sqrt(i/count);
      const a = i*golden;
      const x = 50 + r*Math.cos(a);
      const y = 50 + r*Math.sin(a);
      const c = (i%2===0) ? '#6b4423' : '#2e1a0d';
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="${c}"/>`;
    }
    return s;
  }
  const sunflowerMarkup =
    buildPetals(14,48,24,'#ffb300',0) +
    buildPetals(14,35,18,'#ffca28',12.857) +
    `<circle cx="50" cy="50" r="22" fill="#3e2415" stroke="#2a170c" stroke-width="1"/>` +
    buildCenterDots(46,19);
  document.getElementById('sunflowerSymbol').innerHTML = sunflowerMarkup;

  // ---------- referencias ----------
  const stage = document.getElementById('stage');
  const bigFlower = document.getElementById('bigFlower');
  const clickHint = document.getElementById('clickHint');
  const groundLine = stage.querySelector('.ground-line');
  const treeTrunk = document.getElementById('treeTrunk');
  const treeBranches = document.getElementById('treeBranches');
  const canopy = document.getElementById('canopy');
  const messagePanel = document.getElementById('messagePanel');

  const FLOWER_COUNT = 190; // 180-200 girasoles formando el corazon
  let petalInterval = null;
  let flowerEls = [];

  // Ecuacion parametrica clasica del corazon:
  // x = 16 sin^3(t) ; y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
  function heartPoint(t, r){
    const x = r * 16 * Math.pow(Math.sin(t), 3);
    const y = r * (13*Math.cos(t) - 5*Math.cos(2*t) - 2*Math.cos(3*t) - Math.cos(4*t));
    return {x, y, r};
  }
  function buildHeartPoints(n){
    const pts = [];
    for(let i=0;i<n;i++){
      const t = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.45); // mas densidad hacia el borde
      pts.push(heartPoint(t, r));
    }
    // de adentro hacia afuera: orden ascendente por radio
    pts.sort((a,b)=> a.r - b.r);
    return pts;
  }

  function sunflowerHTML(){
    return `<svg viewBox="0 0 100 100" width="100%" height="100%"><use href="#sunflowerSymbol"></use></svg>`;
  }

  // ---------- paso 1: click en el girasol ----------
  function onFlowerClick(){
    bigFlower.removeEventListener('click', onFlowerClick);
    clickHint.classList.add('fade-out');

    const flowerRect = bigFlower.getBoundingClientRect();
    const groundRect = groundLine.getBoundingClientRect();
    const fallDistance = groundRect.top - flowerRect.top - flowerRect.height*0.1;
    bigFlower.style.setProperty('--fall-distance', fallDistance + 'px');
    bigFlower.classList.add('falling');

    bigFlower.addEventListener('animationend', function handler(){
      bigFlower.removeEventListener('animationend', handler);
      bigFlower.classList.add('hidden');
      growTrunk();
    });
  }

  // ---------- paso 2: nace el tronco ----------
  function growTrunk(){
    void treeTrunk.getBoundingClientRect();
    treeTrunk.classList.add('grow');
    treeTrunk.addEventListener('transitionend', function handler(){
      treeTrunk.removeEventListener('transitionend', handler);
      growBranches();
    });
  }

  // ---------- paso 3: crecen las ramas ----------
  function growBranches(){
    void treeBranches.getBoundingClientRect();
    treeBranches.classList.add('grow');
    treeBranches.addEventListener('transitionend', function handler(){
      treeBranches.removeEventListener('transitionend', handler);
      bloomHeart();
    });
  }

  // ---------- paso 4: florece el corazon (de adentro hacia afuera, pop/bloom) ----------
  function bloomHeart(){
    const pts = buildHeartPoints(FLOWER_COUNT);
    let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
    pts.forEach(p=>{
      if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x;
      if(p.y<minY)minY=p.y; if(p.y>maxY)maxY=p.y;
    });

    flowerEls = [];
    pts.forEach((p,i)=>{
      const left = (p.x - minX)/(maxX-minX)*100;
      const top  = 100 - (p.y - minY)/(maxY-minY)*100;
      const size = 14 + Math.random()*12;
      const delay = i * (1600/FLOWER_COUNT) + Math.random()*80;

      const el = document.createElement('div');
      el.className = 'flower';
      el.style.left = left+'%';
      el.style.top = top+'%';
      el.style.width = size+'px';
      el.style.height = size+'px';
      el.style.animationDelay = delay+'ms';
      el.innerHTML = sunflowerHTML();
      canopy.appendChild(el);
      flowerEls.push(el);
    });

    const totalTime = 1600 + 700;
    setTimeout(()=> canopy.classList.add('sway'), totalTime);
    setTimeout(windEffect, totalTime);
  }

  // ---------- paso 5: viento hacia los lados + lluvia de petalos + carta ----------
  function windEffect(){
    const shuffled = flowerEls.slice().sort(()=>Math.random()-0.5);
    const toBlow = shuffled.slice(0, Math.floor(shuffled.length*0.20));

    toBlow.forEach((el,i)=>{
      const side = Math.random() < 0.5 ? -1 : 1; // vuelan hacia la izquierda o la derecha
      const wx = side * (140 + Math.random()*160);
      const wy = -(20 + Math.random()*70);
      const wrot = (Math.random()*260-130) + 'deg';
      el.style.setProperty('--wx', wx+'px');
      el.style.setProperty('--wy', wy+'px');
      el.style.setProperty('--wrot', wrot);
      el.style.animationDelay = (Math.random()*600)+'ms';
      setTimeout(()=> el.classList.add('windaway'), i*20);
    });

    setTimeout(()=>{
      messagePanel.classList.add('show');
    }, 350);

    setTimeout(startAmbientPetals, 800);
  }

  // lluvia constante y lenta de petalos, se mantiene indefinidamente
  function startAmbientPetals(){
    clearInterval(petalInterval);
    petalInterval = setInterval(()=>{
      const petal = document.createElement('div');
      petal.className = 'falling-petal';
      petal.style.left = (10+Math.random()*80)+'%';
      petal.style.animationDuration = (4+Math.random()*2.5)+'s';
      petal.innerHTML = sunflowerHTML();
      canopy.appendChild(petal);
      petal.addEventListener('animationend', ()=> petal.remove());
    }, 1600);
  }

  // ---------- boton "ver de nuevo": reinicia todo desde cero ----------
  function resetAll(){
    clearInterval(petalInterval);
    canopy.innerHTML = '';
    canopy.classList.remove('sway');
    flowerEls = [];

    messagePanel.classList.remove('show');

    treeTrunk.classList.remove('grow');
    treeBranches.classList.remove('grow');

    bigFlower.classList.remove('falling','hidden');
    bigFlower.style.removeProperty('--fall-distance');
    void bigFlower.offsetWidth;
    clickHint.classList.remove('fade-out');

    bigFlower.addEventListener('click', onFlowerClick);
  }

  document.getElementById('replay').addEventListener('click', resetAll);
  bigFlower.addEventListener('click', onFlowerClick);
})();
