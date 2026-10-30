const CONFIG = {
  weddingDate: '2027-10-02T13:00:00',
  calendar: {
    start: '20271002T110000Z',
    end: '20271002T200000Z',
    title: 'Boda de Isaac & Blanca',
    location: 'Villa Elisa, Paseo Pilar Coloma, 6, 12560 Benicàssim, Castellón',
    details: '¡Nos casamos! Ceremonia a las 13:00 h. Confirma tu asistencia en la invitación.'
  },
  endpoint: ''
};

(function initIntro() {
  const intro = document.getElementById('intro');
  const envelope = document.getElementById('envelope');
  const hint = document.getElementById('introHint');
  const body = document.body;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doneDelay = reduceMotion ? 150 : 1500;

  let opened = false;

  function openInvitation() {
    if (opened) return;
    opened = true;

    intro.classList.add('is-opening');
    hint.style.opacity = '0';

    tryPlayMusic();

    setTimeout(() => {
      intro.classList.add('is-done');
    }, doneDelay);

    setTimeout(() => {
      body.classList.remove('is-locked');
      body.classList.add('is-ready');
      intro.setAttribute('aria-hidden', 'true');
      window.scrollTo({ top: 0 });
    }, doneDelay + (reduceMotion ? 50 : 350));
  }

  envelope.addEventListener('click', openInvitation);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openInvitation();
    }
  });

  window.addEventListener('load', () => {
    if (window.location.hash && window.location.hash !== '#') {
      openInvitation();
    }
  });
})();

const bgm = document.getElementById('bgm');
const musicBtn = document.getElementById('musicBtn');

function tryPlayMusic() {
  if (!bgm.getAttribute('src')) return;
  const p = bgm.play();
  if (p && p.catch) {
    p.then(() => musicBtn.classList.add('is-playing')).catch(() => {});
  }
}

musicBtn.addEventListener('click', () => {
  if (bgm.paused) {
    const p = bgm.play();
    if (p && p.catch) {
      p.then(() => musicBtn.classList.add('is-playing'))
       .catch(() => {});
    }
  } else {
    bgm.pause();
    musicBtn.classList.remove('is-playing');
  }
});

(function initCountdown() {
  const target = new Date(CONFIG.weddingDate).getTime();
  const el = {
    d: document.getElementById('cd-d'),
    h: document.getElementById('cd-h'),
    m: document.getElementById('cd-m'),
    s: document.getElementById('cd-s')
  };

  const pad = (n) => String(n).padStart(2, '0');

  function tick() {
    const diff = target - Date.now();

    if (isNaN(target) || diff <= 0) {
      el.d.textContent = '00';
      el.h.textContent = '00';
      el.m.textContent = '00';
      el.s.textContent = '00';
      clearInterval(timer);
      return;
    }

    el.d.textContent = pad(Math.floor(diff / 86400000));
    el.h.textContent = pad(Math.floor(diff / 3600000) % 24);
    el.m.textContent = pad(Math.floor(diff / 60000) % 60);
    el.s.textContent = pad(Math.floor(diff / 1000) % 60);
  }

  tick();
  const timer = setInterval(tick, 1000);
})();

(function initReveal() {
  const items = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((i) => io.observe(i));
})();

(function initPetals() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const wrap = document.getElementById('petals');
  const total = window.innerWidth < 640 ? 10 : 18;

  for (let i = 0; i < total; i++) {
    const p = document.createElement('span');
    const size = 8 + Math.random() * 8;
    p.style.left = (Math.random() * 100) + '%';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.opacity = (0.2 + Math.random() * 0.4).toFixed(2);
    p.style.animationDelay = (-Math.random() * 18) + 's';
    p.style.animationDuration = (15 + Math.random() * 10) + 's';
    wrap.appendChild(p);
  }
})();

(function initCalendar() {
  const btn = document.getElementById('calendarBtn');
  if (!btn) return;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: CONFIG.calendar.title,
    dates: `${CONFIG.calendar.start}/${CONFIG.calendar.end}`,
    location: CONFIG.calendar.location,
    details: CONFIG.calendar.details
  });

  btn.href = 'https://calendar.google.com/calendar/render?' + params.toString();
})();

(function initConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationFrame = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  const colors = ['#6b7830', '#5c1311', '#a39376', '#b1a5c4', '#7b8854'];

  function createParticles() {
    const count = 80;
    for (let i = 0; i < count; i++) {
      const isLeft = i % 2 === 0;
      particles.push({
        x: isLeft ? 0 : canvas.width,
        y: canvas.height * 0.6,
        vx: (isLeft ? 1 : -1) * (Math.random() * 8 + 4),
        vy: -(Math.random() * 8 + 6),
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        life: 1
      });
    }
  }

  function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let activeParticles = 0;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;

      if (p.y > canvas.height + 50) {
        p.life = 0;
      }

      if (p.life > 0) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
    });

    particles = particles.filter((p) => p.life > 0);

    if (activeParticles > 0) {
      animationFrame = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  window.triggerConfetti = function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (animationFrame) return;
    particles = [];
    createParticles();
    update();
  };
})();

(function initRSVP() {
  const form      = document.getElementById('rsvpForm');
  const yesBlock  = document.getElementById('yesBlock');
  const success   = document.getElementById('success');
  const successT  = document.getElementById('successTitle');
  const successP  = document.getElementById('successText');
  const submitBtn = document.getElementById('submitBtn');
  const editBtn   = document.getElementById('editBtn');
  const nameInput = document.getElementById('f-name');
  const errName   = document.getElementById('err-name');
  const errAttend = document.getElementById('err-attending');

  const STORAGE_KEY = 'rsvp_boda_isaac_blanca';

  function updateConditional() {
    const checked = form.querySelector('input[name="asistencia"]:checked');
    const isYes = checked && checked.value === 'si';

    yesBlock.hidden = !isYes;
    yesBlock.querySelectorAll('input, select, textarea').forEach((el) => {
      el.disabled = !isYes;
    });
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'asistencia') {
      errAttend.classList.remove('is-visible');
      updateConditional();
    }
    if (e.target.id === 'f-name') {
      nameInput.classList.remove('is-invalid');
      errName.classList.remove('is-visible');
    }
  });

  function validate() {
    let ok = true;

    const name = nameInput.value.trim();
    if (name.length < 3) {
      nameInput.classList.add('is-invalid');
      errName.textContent = 'Escribe tu nombre completo, por favor.';
      errName.classList.add('is-visible');
      ok = false;
    } else {
      nameInput.classList.remove('is-invalid');
      errName.classList.remove('is-visible');
    }

    const attending = form.querySelector('input[name="asistencia"]:checked');
    if (!attending) {
      errAttend.textContent = 'Indícanos si podrás venir.';
      errAttend.classList.add('is-visible');
      ok = false;
    } else {
      errAttend.classList.remove('is-visible');
    }

    if (!ok) {
      const firstError = form.querySelector('.is-invalid, .error.is-visible');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return ok;
  }

  function collect() {
    const fd = new FormData(form);
    const attending = fd.get('asistencia');
    const isYes = attending === 'si';

    return {
      nombre: (fd.get('nombre') || '').toString().trim(),
      asistencia: isYes ? 'Sí' : 'No',
      acompanantes: isYes ? Number(fd.get('acompanantes') || 1) : 0,
      menu: isYes ? (fd.get('menu') || '') : '',
      alergias: isYes ? (fd.get('alergias') || '').toString().trim() : '',
      autobus: isYes && fd.get('autobus') === 'si' ? 'Sí' : 'No',
      mensaje: (fd.get('mensaje') || '').toString().trim(),
      enviado: new Date().toISOString()
    };
  }

  async function send(data) {
    if (!CONFIG.endpoint) {
      console.info('[Demo] Confirmación registrada:', data);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
      await new Promise((r) => setTimeout(r, 800));
      return { ok: true };
    }

    const res = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });

    if (res.ok) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    }
    return { ok: res.ok };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = collect();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    try {
      const result = await send(data);

      if (!result.ok) throw new Error('Respuesta no válida del servidor');

      const firstName = data.nombre.split(' ')[0];

      if (data.asistencia === 'Sí') {
        successT.textContent = `¡Gracias, ${firstName}!`;
        successP.innerHTML =
          `Hemos anotado que vendrás${data.acompanantes > 1 ? ` con ${data.acompanantes - 1} acompañante(s)` : ''}. ` +
          `Nos hace muchísima ilusión celebrarlo contigo.`;
        if (typeof window.triggerConfetti === 'function') {
          window.triggerConfetti();
        }
      } else {
        successT.textContent = `Gracias por avisarnos, ${firstName}`;
        successP.innerHTML =
          'Sentimos que no puedas acompañarnos, pero te llevaremos presentes ese día. ¡Un abrazo enorme!';
      }

      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar confirmación';
      alert('No hemos podido enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.');
    }
  });

  editBtn.addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar confirmación';
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) {
      nameInput.value = saved.nombre || '';
      const radio = form.querySelector(`input[name="asistencia"][value="${saved.asistencia === 'Sí' ? 'si' : 'no'}"]`);
      if (radio) radio.checked = true;
      updateConditional();
    }
  } catch (e) {}

  updateConditional();
})();