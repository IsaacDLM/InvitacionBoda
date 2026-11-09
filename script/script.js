const CONFIG = {
  weddingDate: '2027-10-02T13:00:00',
  supabaseUrl: '',
  supabaseAnonKey: '',
  calendar: {
    start: '20271002T110000Z',
    end: '20271002T200000Z',
    title: 'Boda de Isaac & Blanca',
    location: 'Villa Elisa, Paseo Pilar Coloma, 6, 12560 Benicàssim, Castellón',
    details: '¡Nos casamos! Ceremonia a las 13:00 h. Confirma tu asistencia en la invitación.'
  },
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
  const guestsInput = document.getElementById('f-guests');
  const attendeesList = document.getElementById('attendeesList');
  const errAttendees = document.getElementById('err-attendees');
  const errName   = document.getElementById('err-name');
  const errAttend = document.getElementById('err-attending');

  const STORAGE_KEY = 'rsvp_boda_isaac_blanca';
  const menuOptions = [
    ['1', 'Paella valenciana'],
    ['2', 'Arroz del señoret'],
    ['3', 'Fidegua de marisco']
  ];
  const validationTimers = new WeakMap();
  const validationSequences = new WeakMap();

  function normalizeGuestName(name) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLocaleLowerCase('es');
  }

  function hasBackendConfig() {
    return Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
  }

  async function callGuestService(payload) {
    if (!hasBackendConfig()) {
      throw new Error('La validación de invitados aún no está configurada.');
    }

    const response = await fetch(`${CONFIG.supabaseUrl.replace(/\/+$/, '')}/functions/v1/guest-rsvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.supabaseAnonKey,
        'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok && response.status !== 409 && response.status !== 429) {
      throw new Error(result.error || 'No se pudo contactar con el servicio de invitados.');
    }
    return result;
  }

  function getAttendeeName(row) {
    if (row.dataset.primary === 'true') return nameInput.value.trim();
    return row.querySelector('input')?.value.trim() || '';
  }

  function setAttendeeStatus(row, status, message) {
    row.dataset.validation = status;
    const statusText = row.querySelector('.attendee-menu__status');
    statusText.textContent = message;
    statusText.classList.toggle('error--success', status === 'available');
    statusText.classList.toggle('is-visible', Boolean(message));
    if (row.dataset.primary === 'true') {
      errName.textContent = message;
      errName.classList.toggle('error--success', status === 'available');
      errName.classList.toggle('is-visible', Boolean(message));
    }
    const menuSelect = row.querySelector('select');
    menuSelect.disabled = status !== 'available' || !form.querySelector('input[name="asistencia"]:checked[value="si"]');
    if (status !== 'available' && status !== 'checking') menuSelect.value = '';
  }

  async function validateAttendee(row) {
    const name = getAttendeeName(row);
    const sequence = (validationSequences.get(row) || 0) + 1;
    validationSequences.set(row, sequence);

    if (name.length < 3) {
      setAttendeeStatus(row, 'empty', '');
      return;
    }

    setAttendeeStatus(row, 'checking', 'Comprobando invitado…');

    const normalizedName = normalizeGuestName(name);
    const duplicateRows = Array.from(attendeesList.querySelectorAll('.attendee-menu'))
      .filter((otherRow) => otherRow !== row &&
        normalizeGuestName(getAttendeeName(otherRow)) === normalizedName);
    if (duplicateRows.length) {
      [row, ...duplicateRows].forEach((duplicateRow) => {
        setAttendeeStatus(duplicateRow, 'duplicate', 'Nombre repetido en esta respuesta');
      });
      return;
    }

    try {
      const result = await callGuestService({ action: 'validate', nombre: name });
      if (validationSequences.get(row) !== sequence || getAttendeeName(row) !== name) return;

      if (result.status === 'available') {
        setAttendeeStatus(row, 'available', 'Invitado validado');
      } else if (result.status === 'registered') {
        setAttendeeStatus(row, 'registered', 'Invitado ya registrado');
      } else if (result.status === 'not_found') {
        setAttendeeStatus(row, 'not_found', 'Invitado no encontrado');
      } else if (result.status === 'rate_limited') {
        setAttendeeStatus(row, 'error', 'Demasiadas consultas. Espera unos minutos e inténtalo de nuevo.');
      } else {
        setAttendeeStatus(row, 'error', 'No se pudo validar el invitado. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error(error);
      if (validationSequences.get(row) === sequence && getAttendeeName(row) === name) {
        setAttendeeStatus(row, 'error', 'No se pudo validar el invitado. Comprueba tu conexión e inténtalo de nuevo.');
      }
    }
  }

  function scheduleAttendeeValidation(row) {
    clearTimeout(validationTimers.get(row));
    setAttendeeStatus(row, 'pending', '');
    validationTimers.set(row, setTimeout(() => validateAttendee(row), 450));
  }

  function validateAllAttendees() {
    attendeesList.querySelectorAll('.attendee-menu').forEach((row) => {
      validateAttendee(row);
    });
  }

  function renderAttendees(savedAttendees = []) {
    const previous = Array.from(attendeesList.querySelectorAll('.attendee-menu')).map((row) => ({
      nombre: row.querySelector('input')?.value || '',
      menu: row.querySelector('select')?.value || ''
    }));
    const count = Number(guestsInput.value);
    attendeesList.replaceChildren();

    for (let index = 0; index < count; index += 1) {
      const row = document.createElement('div');
      row.className = 'attendee-menu';
      row.dataset.primary = String(index === 0);

      if (index === 0) {
        const name = document.createElement('p');
        name.className = 'attendee-menu__name';
        name.dataset.attendeePrimaryName = '';
        name.textContent = `Menú de ${nameInput.value.trim() || 'la persona invitada'}`;
        row.append(name);
      } else {
        const nameField = document.createElement('div');
        nameField.className = 'attendee-menu__field';

        const label = document.createElement('label');
        label.htmlFor = `f-companion-${index}`;
        label.textContent = `Nombre de la persona ${index + 1} *`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `f-companion-${index}`;
        input.autocomplete = 'off';
        input.placeholder = 'Nombre y apellidos';
        input.required = true;
        input.value = savedAttendees[index]?.nombre || previous[index]?.nombre || '';

        nameField.append(label, input);
        row.append(nameField);
      }

      const menuField = document.createElement('div');
      menuField.className = 'attendee-menu__field';

      const menuLabel = document.createElement('label');
      menuLabel.htmlFor = `f-menu-${index}`;
      menuLabel.textContent = 'Opción de menú *';

      const menuSelect = document.createElement('select');
      menuSelect.id = `f-menu-${index}`;
      menuSelect.required = true;
      menuSelect.disabled = true;

      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Elige una opción';
      placeholder.disabled = true;
      placeholder.selected = true;
      menuSelect.append(placeholder);

      menuOptions.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        menuSelect.append(option);
      });

      menuSelect.value = savedAttendees[index]?.menu || previous[index]?.menu || '';
      menuField.append(menuLabel, menuSelect);
      row.append(menuField);

      const status = document.createElement('p');
      status.className = 'error attendee-menu__status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      row.append(status);
      attendeesList.append(row);
    }

    updatePrimaryName();
  }

  function updatePrimaryName() {
    const primaryName = attendeesList.querySelector('[data-attendee-primary-name]');
    if (primaryName) {
      primaryName.textContent = `Menú de ${nameInput.value.trim() || 'la persona invitada'}`;
    }
  }

  function updateConditional() {
    const checked = form.querySelector('input[name="asistencia"]:checked');
    const isYes = checked && checked.value === 'si';

    yesBlock.hidden = !isYes;
    yesBlock.querySelectorAll('input, select, textarea').forEach((el) => {
      el.disabled = !isYes;
    });
    attendeesList.querySelectorAll('.attendee-menu').forEach((row) => {
      row.querySelector('select').disabled = !isYes || row.dataset.validation !== 'available';
    });
    const primaryRow = attendeesList.querySelector('.attendee-menu[data-primary="true"]');
    if (isYes) {
      validateAllAttendees();
    } else if (primaryRow) {
      validateAttendee(primaryRow);
    }
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'asistencia') {
      errAttend.classList.remove('is-visible');
      updateConditional();
    }
    if (e.target.id === 'f-name') {
      nameInput.classList.remove('is-invalid');
      errName.classList.remove('is-visible');
      updatePrimaryName();
    }
    if (e.target.id === 'f-guests') {
      renderAttendees();
      errAttendees.classList.remove('is-visible');
      updateConditional();
    }
    if (e.target.matches('#attendeesList input, #attendeesList select')) {
      e.target.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
      if (!attendeesList.querySelector('.is-invalid')) {
        errAttendees.classList.remove('is-visible');
      }
    }
    if (e.target.matches('#attendeesList select')) {
      e.target.classList.remove('is-invalid');
    }
  });

  form.addEventListener('input', (e) => {
    if (e.target.id === 'f-name') updatePrimaryName();
    if (e.target.id === 'f-name') {
      const primaryRow = attendeesList.querySelector('.attendee-menu[data-primary="true"]');
      if (primaryRow) scheduleAttendeeValidation(primaryRow);
    }
    if (e.target.matches('#attendeesList input')) {
      e.target.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
      if (!attendeesList.querySelector('.is-invalid')) {
        errAttendees.classList.remove('is-visible');
      }
      scheduleAttendeeValidation(e.target.closest('.attendee-menu'));
      attendeesList.querySelectorAll('.attendee-menu[data-validation="duplicate"]').forEach((row) => {
        if (row !== e.target.closest('.attendee-menu')) scheduleAttendeeValidation(row);
      });
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

    const checkedAttendance = attending && attending.value === 'si';
    let attendeesValid = true;
    let attendeeNeedsValidation = false;
    const primaryRow = attendeesList.querySelector('.attendee-menu[data-primary="true"]');
    const primaryValid = primaryRow?.dataset.validation === 'available';
    if (attending && !primaryValid) {
      nameInput.classList.add('is-invalid');
      errName.textContent = primaryRow?.querySelector('.attendee-menu__status')?.textContent ||
        'Valida tu nombre en la lista de invitados.';
      errName.classList.add('is-visible');
      attendeesValid = false;
      attendeeNeedsValidation = true;
    }

    if (checkedAttendance) {
      Array.from(attendeesList.querySelectorAll('.attendee-menu')).slice(1).forEach((row) => {
        const attendeeNameInput = row.querySelector('input');
        const nameIsValid = attendeeNameInput.value.trim().length >= 3 &&
          row.dataset.validation === 'available';
        attendeeNameInput.classList.toggle('is-invalid', !nameIsValid);
        attendeeNameInput.toggleAttribute('aria-invalid', !nameIsValid);
        if (!nameIsValid) {
          attendeesValid = false;
          attendeeNeedsValidation = true;
        }

        const menuSelect = row.querySelector('select');
        const menuIsValid = Boolean(menuSelect.value) && !menuSelect.disabled;
        menuSelect.classList.toggle('is-invalid', !menuIsValid);
        menuSelect.toggleAttribute('aria-invalid', !menuIsValid);
        if (!menuIsValid) attendeesValid = false;
      });
    }

    if (!attendeesValid) {
      errAttendees.textContent = attendeeNeedsValidation
        ? 'Valida el nombre de cada asistente antes de elegir su menú.'
        : 'Elige una opción de menú para cada asistente validado.';
      errAttendees.classList.add('is-visible');
      ok = false;
    } else {
      errAttendees.classList.remove('is-visible');
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
    const nombre = (fd.get('nombre') || '').toString().trim();
    const invitados = isYes
      ? [
          {
            nombre,
            menu: attendeesList.querySelector('#f-menu-0').value
          },
          ...Array.from(attendeesList.querySelectorAll('.attendee-menu')).slice(1).map((row) => ({
            nombre: row.querySelector('input').value.trim(),
            menu: row.querySelector('select').value
          }))
        ]
      : [];

    return {
      nombre,
      asistencia: isYes ? 'Sí' : 'No',
      acompanantes: isYes ? Number(fd.get('acompanantes') || 1) : 0,
      menu: invitados[0]?.menu || '',
      invitados,
      alergias: isYes ? (fd.get('alergias') || '').toString().trim() : '',
      autobus: isYes && fd.get('autobus') === 'si' ? 'Sí' : 'No',
      mensaje: (fd.get('mensaje') || '').toString().trim(),
      enviado: new Date().toISOString()
    };
  }

  async function send(data) {
    const result = await callGuestService({ action: 'submit', respuesta: data });
    if (result.status !== 'ok') return { ok: false, result };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    return { ok: true };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data = collect();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    try {
      const result = await send(data);

      if (!result.ok) {
        const status = result.result?.status;
        if (status === 'not_found' || status === 'registered') {
          const invalidName = result.result.nombre || '';
          const invalidKey = normalizeGuestName(invalidName);
          const row = Array.from(attendeesList.querySelectorAll('.attendee-menu'))
            .find((attendeeRow) => normalizeGuestName(getAttendeeName(attendeeRow)) === invalidKey);
          if (row) {
            setAttendeeStatus(
              row,
              status,
              status === 'registered' ? 'Invitado ya registrado' : 'Invitado no encontrado'
            );
          }
          throw new Error(status === 'registered'
            ? 'Uno de los invitados ya fue registrado por otra persona.'
            : 'Uno de los invitados no aparece en la lista.');
        }
        if (status === 'duplicate') {
          throw new Error('No repitas el nombre de una persona en la lista de asistentes.');
        }
        if (status === 'rate_limited') {
          throw new Error('Demasiadas consultas. Espera unos minutos e inténtalo de nuevo.');
        }
        throw new Error(result.result?.message || 'No se pudo registrar la respuesta.');
      }

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
      alert(err.message || 'No hemos podido enviar tu respuesta. Revisa tu conexión e inténtalo de nuevo.');
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
      if (saved.acompanantes >= 1 && saved.acompanantes <= 5) {
        guestsInput.value = String(saved.acompanantes);
      }
      renderAttendees(Array.isArray(saved.invitados)
        ? saved.invitados
        : [{ nombre: saved.nombre, menu: saved.menu }]);
      updateConditional();
    }
  } catch (e) {}

  renderAttendees();
  updateConditional();
})();