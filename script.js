/* ==========================================================================
   script.js · Instituto Médico Atlántico Sur · Espacio Terapéutico del Sur
   Vanilla JS, sin dependencias externas.

   Módulos:
   1. Navbar móvil
   2. Filtro de la grilla por sede
   3. Carrusel de especialistas (lee data-nombre / data-especialidad)
   4. Turnos: Sede → Especialidad → Profesional → Fecha → Franja
   5. Validación del formulario
   6. Envío asíncrono a FormSubmit + estados de carga + modal de éxito

   PARA ACTUALIZAR HORARIOS:
   - PATRONES: rotación semanal (lunes a viernes) de cada patrón P1 a P5.
   - PROFESIONALES: nombre y patrón asignado de cada profesional, por especialidad.
   - FERIADOS: fechas bloqueadas (formato AAAA-MM-DD).
   ========================================================================== */

(function () {
  "use strict";

  /* Helpers de selección */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ------------------------------------------------------------------------
     CONFIGURACIÓN
     ------------------------------------------------------------------------ */
  const CONFIG = {
    // Endpoint AJAX de FormSubmit (ojoahi065@gmail.com).
    // Primer envío: FormSubmit manda un correo de activación a esa casilla.
    // Hacé clic en "Activate Form" y los envíos siguientes llegan normalmente.
    formEndpoint: "https://formsubmit.co/ajax/ojoahi065@gmail.com",
    autoplayMs: 5000,          // intervalo del carrusel
    diasVentana: 60,           // se pueden pedir turnos hasta 60 días desde hoy

    // Backend Supabase (plan Bellatrix). Mientras enabled sea false, el formulario
    // sigue usando FormSubmit. Para activarlo: crear el proyecto, ejecutar schema.sql
    // y reemplazar url y anonKey (la clave anon es pública por diseño; la seguridad
    // la dan las políticas RLS del archivo schema.sql).
    supabase: {
      enabled: false,
      url: "https://rhdswxallbaxmggxtspy.supabase.co",
      anonKey: "sb_publishable_FHXg0hM8PH4NPu46gUlEwA_0MeXfPgf",
      // Captcha Cloudflare Turnstile: clave pública del widget (el secreto va en Supabase)
      turnstileSiteKey: "0x4AAAAAAGRslXrb5737ZeYB",
    },
  };

  /* ------------------------------------------------------------------------
     AGENDA
     ------------------------------------------------------------------------ */
  const SIN_PREFERENCIA = "Sin preferencia de profesional";
  const ORDEN_FRANJAS = ["Mañana", "Tarde", "Vespertino"];

  // Horario de cada franja (solo informativo, se muestra en el selector)
  const FRANJAS = {
    "Mañana": "08:00 a 12:00",
    "Tarde": "13:00 a 18:00",
    "Vespertino": "18:00 a 21:00",
  };

  // Rotación semanal: índice 0 = lunes ... 4 = viernes
  const PATRONES = {
    P1: ["Mañana", "Tarde", "Vespertino", "Mañana", "Tarde"],
    P2: ["Tarde", "Vespertino", "Mañana", "Tarde", "Vespertino"],
    P3: ["Vespertino", "Mañana", "Tarde", "Vespertino", "Mañana"],
    P4: ["Mañana", "Vespertino", "Tarde", "Mañana", "Vespertino"],
    P5: ["Tarde", "Mañana", "Vespertino", "Tarde", "Mañana"],
  };

  // Fechas bloqueadas (feriados y días no laborables), formato AAAA-MM-DD
  const FERIADOS = [
    "2026-11-09", "2026-11-10", "2026-11-23",
    "2026-12-07", "2026-12-08", "2026-12-25",
    "2027-01-01", "2027-02-08", "2027-02-09",
  ];

  // Profesionales por especialidad: [nombre, patrón]
  // La clave es el data-especialidad de la tarjeta correspondiente.
  const PROFESIONALES = {
    // ===== SEDE 1: Instituto Médico Atlántico Sur =====
    // Los especialistas con foto van en P1; el resto son nombres de demostración.
    "cardiologia": [
      ["Dra. Lucía Fernández", "P1"],
      ["Dr. Nicolás Herrera", "P3"], ["Dra. Carolina Méndez", "P4"],
      ["Dr. Reynoso", "P5"],
    ],
    "traumatologia": [
      ["Dr. Andrés Molina", "P1"],
      ["Dra. Valentina Castro", "P2"], ["Dr. Pablo Giménez", "P3"],
      ["Dra. Mariana Torres", "P4"],
    ],
    "odontologia": [
      ["Dra. Florencia Díaz", "P1"],
      ["Dr. Santiago Pérez", "P2"], ["Dr. Tomás Aguirre", "P4"],
      ["Dr. Matías Romero", "P5"],
    ],
    "dermatologia": [
      ["Dr. Gabriel Suárez", "P1"],
      ["Dra. Natalia Cabrera", "P3"], ["Dra. Rocío Medina", "P4"],
      ["Dr. Franco Acosta", "P5"],
    ],
    "cirugia": [
      ["Dr. Gonzalo Martínez", "P1"], ["Dra. Paula Rivas", "P2"],
      ["Dr. Ricardo Álvarez", "P3"], ["Dra. Victoria Campos", "P4"],
      ["Dr. Emiliano Sosa", "P5"],
    ],
    "neurologia": [
      ["Dra. Andrea Morales", "P1"], ["Dr. Ignacio Silva", "P2"],
      ["Dra. Cecilia Vargas", "P3"], ["Dr. Ramiro Castro", "P4"],
      ["Dra. Laura Benítez", "P5"],
    ],
    "obstetricia": [
      ["Dra. Mariana González", "P1"], ["Dr. Juan Manuel Díaz", "P2"],
      ["Dra. Sofía Romero", "P3"], ["Dra. Gabriela Torres", "P4"],
      ["Dra. Belén Fernández", "P5"],
    ],
    "otorrinolaringologia": [
      ["Dr. Leonardo Ruiz", "P1"], ["Dra. Micaela Suárez", "P2"],
      ["Dr. Esteban Flores", "P3"], ["Dra. Daniela Molina", "P4"],
      ["Dr. Bruno Acosta", "P5"],
    ],
    "diabetologia": [
      ["Dra. Patricia Herrera", "P1"], ["Dr. Marcelo Rojas", "P2"],
      ["Dra. Eugenia López", "P3"], ["Dr. Diego Navarro", "P4"],
      ["Dra. Verónica Méndez", "P5"],
    ],
    "resonancia": [
      ["Lic. Agustina Pérez", "P1"], ["Tec. Nicolás Ramírez", "P2"],
      ["Lic. Carolina Sosa", "P3"], ["Tec. Martín Castro", "P4"],
      ["Lic. Julieta Romero", "P5"],
    ],
    "atencion-virtual": [
      ["Dra. Emilia Fernández", "P1"], ["Dr. Lucas Benítez", "P2"],
      ["Dra. Martina Silva", "P3"], ["Dr. Facundo Torres", "P4"],
      ["Dra. Clara Méndez", "P5"],
    ],
    "pediatria": [
      ["Dra. Pérez", "P1"], ["Dr. Mateo González", "P2"],
      ["Dra. Camila Fernández", "P3"], ["Dr. Santiago Romero", "P4"],
      ["Dra. Valentina López", "P5"],
    ],
    "clinica-medica": [
      ["Dr. Peralta", "P1"], ["Dra. Lucía Martínez", "P2"],
      ["Dr. Nicolás Fernández", "P3"], ["Dra. Carolina Benítez", "P4"],
      ["Dr. Sebastián Torres", "P5"],
    ],

    // ===== SEDE 2: Espacio Terapéutico del Sur =====
    "psicologia": [
      ["Lic. Mariana López", "P1"], ["Lic. Federico Gómez", "P2"],
      ["Lic. Camila Herrera", "P3"], ["Lic. Nicolás Rivas", "P4"],
      ["Lic. Florencia Acosta", "P5"],
    ],
    "psicopedagogia": [
      ["Lic. Julieta Martínez", "P1"], ["Lic. Santiago Morales", "P2"],
      ["Lic. Valeria Castro", "P3"], ["Lic. Tomás Medina", "P4"],
      ["Lic. Gabriela Ruiz", "P5"],
    ],
    "fonoaudiologia": [
      ["Lic. Martín Suárez", "P1"],
      ["Lic. Rocío Fernández", "P3"], ["Lic. Agustín Torres", "P4"],
      ["Lic. Carolina Díaz", "P5"],
    ],
    "terapia-ocupacional": [
      ["Lic. Paula Benítez", "P1"], ["Lic. Franco Romero", "P2"],
      ["Lic. Victoria Silva", "P3"], ["Lic. Diego Molina", "P4"],
      ["Lic. Natalia Rojas", "P5"],
    ],
    "musicoterapia": [
      ["Lic. Sofía Navarro", "P1"], ["Lic. Gabriel Méndez", "P2"],
      ["Lic. Micaela Campos", "P3"], ["Lic. Bruno Herrera", "P4"],
      ["Lic. Daniela Sosa", "P5"],
    ],
    "psicomotricidad": [
      ["Lic. Valentina González", "P1"], ["Lic. Ramiro López", "P2"],
      ["Lic. Cecilia Ramírez", "P3"], ["Lic. Ignacio Acosta", "P4"],
      ["Lic. Belén Flores", "P5"],
    ],
    "estimulacion-temprana": [
      ["Lic. Martina Díaz", "P1"], ["Lic. Juan Manuel Pérez", "P2"],
      ["Lic. Emilia Torres", "P3"], ["Lic. Andrés Morales", "P4"],
      ["Lic. Clara Romero", "P5"],
    ],
    "kinesiologia": [
      ["Lic. Agustina Cabrera", "P1"],
      ["Lic. Matías Fernández", "P3"], ["Lic. Laura Giménez", "P4"],
      ["Lic. Gonzalo Ruiz", "P5"],
    ],
  };

  /* ------------------------------------------------------------------------
     1. NAVBAR MÓVIL
     ------------------------------------------------------------------------ */
  function initNavbar() {
    const navbar = $("#navbar");
    const toggle = $("#navToggle");
    if (!navbar || !toggle) return;

    const setOpen = (isOpen) => {
      navbar.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    };

    toggle.addEventListener("click", () => {
      setOpen(!navbar.classList.contains("is-open"));
    });

    $$(".nav-link").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     2. FILTRO DE LA GRILLA POR SEDE
     ------------------------------------------------------------------------ */
  function initFilters() {
    const buttons = $$(".filter-btn");
    const cards = $$(".card[data-sede]");
    const emptyMsg = $("#cardsEmpty");
    if (!buttons.length || !cards.length) return;

    const applyFilter = (filter) => {
      let visibleCount = 0;

      cards.forEach((card) => {
        const match = filter === "todas" || card.dataset.sede === filter;
        card.classList.toggle("is-hidden", !match);
        if (match) visibleCount++;
      });

      if (emptyMsg) emptyMsg.hidden = visibleCount > 0;
    };

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-active");
        btn.setAttribute("aria-pressed", "true");
        applyFilter(btn.dataset.filter);
      });
    });

    applyFilter("todas");
  }

  /* ------------------------------------------------------------------------
     3. CARRUSEL DE ESPECIALISTAS
     ------------------------------------------------------------------------ */
  function initCarousel() {
    const carousel = $("#carousel");
    if (!carousel) return;

    const slides = $$(".carousel__slide", carousel);
    const dotsContainer = $("#carouselDots", carousel);
    const prevBtn = $("#prevBtn", carousel);
    const nextBtn = $("#nextBtn", carousel);
    if (slides.length === 0) return;

    let current = 0;
    let timer = null;
    let isPaused = false;

    /* 3.a. Leyenda dinámica a partir de data-* */
    slides.forEach((slide) => {
      const nombre = slide.dataset.nombre || "";
      const especialidad = slide.dataset.especialidad || "";

      let caption = $(".carousel__caption", slide);
      if (!caption) {
        caption = document.createElement("figcaption");
        caption.className = "carousel__caption";
        slide.appendChild(caption);
      }
      caption.innerHTML = "";

      const nameEl = document.createElement("strong");
      nameEl.className = "carousel__name";
      nameEl.textContent = nombre;
      caption.appendChild(nameEl);

      if (especialidad) {
        const specEl = document.createElement("span");
        specEl.className = "carousel__spec";
        specEl.textContent = especialidad;
        caption.appendChild(specEl);
      }

      const img = $("img", slide);
      if (img && !img.alt) img.alt = nombre;
    });

    /* 3.b. Indicadores de puntos */
    if (dotsContainer) {
      dotsContainer.innerHTML = "";
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = "carousel__dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `Ir al especialista ${index + 1}`);
        dot.addEventListener("click", () => goTo(index));
        dotsContainer.appendChild(dot);
      });
    }
    const dots = dotsContainer ? $$(".carousel__dot", dotsContainer) : [];

    /* 3.c. Cambio de slide */
    function goTo(index) {
      const total = slides.length;
      current = (index + total) % total;

      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", String(!active));
      });

      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === current));
    }

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    /* 3.d. Reproducción automática */
    function startAutoplay() {
      stopAutoplay();
      timer = setInterval(() => {
        if (!isPaused) next();
      }, CONFIG.autoplayMs);
    }

    function stopAutoplay() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    carousel.addEventListener("mouseenter", () => { isPaused = true; });
    carousel.addEventListener("mouseleave", () => { isPaused = false; });
    carousel.addEventListener("focusin", () => { isPaused = true; });
    carousel.addEventListener("focusout", () => { isPaused = false; });

    if (prevBtn) prevBtn.addEventListener("click", () => { prev(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { next(); startAutoplay(); });

    carousel.setAttribute("tabindex", "0");
    carousel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { prev(); startAutoplay(); }
      if (e.key === "ArrowRight") { next(); startAutoplay(); }
    });

    let touchStartX = 0;
    carousel.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener("touchend", (e) => {
      const delta = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(delta) > 40) {
        delta < 0 ? next() : prev();
        startAutoplay();
      }
    }, { passive: true });

    goTo(0);
    startAutoplay();
  }

  /* ------------------------------------------------------------------------
     FECHAS Y AGENDA: funciones auxiliares
     ------------------------------------------------------------------------ */

  // Convierte una fecha a texto AAAA-MM-DD (hora local)
  function toISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function parseISO(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // Un día es reservable si es lunes a viernes, no es feriado y está dentro de la ventana
  function isBookable(iso) {
    if (!iso) return false;
    const date = parseISO(iso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = new Date(today);
    max.setDate(max.getDate() + CONFIG.diasVentana);

    const dow = date.getDay(); // 0 domingo ... 6 sábado
    if (dow === 0 || dow === 6) return false;
    if (FERIADOS.includes(iso)) return false;
    return date >= today && date <= max;
  }

  // Franja que trabaja un patrón en una fecha (solo válido para días hábiles)
  function franjaPara(patron, iso) {
    const dow = parseISO(iso).getDay(); // 1 lunes ... 5 viernes
    return PATRONES[patron][dow - 1];
  }

  /* ------------------------------------------------------------------------
     4. SOLICITUD DE TURNOS
     Sede → Especialidad → Profesional → Fecha → Franja (automática)
     ------------------------------------------------------------------------ */
  function initTurnos() {
    const form = $("#turnoForm");
    if (!form) return;

    const sedeSel = $("#sede", form);
    const espSel = $("#especialidad", form);
    const profSel = $("#profesional", form);
    const fechaInp = $("#fecha", form);
    const franjaSel = $("#franja", form);
    const submitBtn = $("#submitBtn", form);
    const btnText = $(".btn__text", submitBtn);
    const statusEl = $("#formStatus");
    const modal = $("#successModal");
    const modalClose = $("#modalClose");

    /* 4.a. Límites del calendario: hoy hasta 60 días */
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const maxFecha = new Date(hoy);
    maxFecha.setDate(maxFecha.getDate() + CONFIG.diasVentana);
    fechaInp.min = toISO(hoy);
    fechaInp.max = toISO(maxFecha);

    /* 4.b. Catálogo de especialidades por sede, tomado de las tarjetas */
    const catalogo = $$(".card[data-sede]").reduce((acc, card) => {
      const title = $(".card__title", card);
      if (!title) return acc;
      (acc[card.dataset.sede] = acc[card.dataset.sede] || []).push({
        value: card.dataset.especialidad,
        label: title.textContent.trim(),
      });
      return acc;
    }, {});
    Object.values(catalogo).forEach((lista) =>
      lista.sort((a, b) => a.label.localeCompare(b.label, "es"))
    );

    /* 4.c. Helpers para llenar los selects */
    function resetSelect(select, placeholderText) {
      select.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholderText;
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
      select.disabled = true;
    }

    function addOption(select, value, text) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = text;
      select.appendChild(opt);
    }

    /* 4.d. Especialidades según la sede */
    function renderEspecialidades(sede) {
      resetSelect(espSel, "Primero elegí una sede");
      if (!sede || !catalogo[sede]) return;
      espSel.firstChild.textContent = "Seleccioná una especialidad";
      catalogo[sede].forEach((item) => addOption(espSel, item.value, item.label));
      espSel.disabled = false;
    }

    /* 4.e. Profesionales según la especialidad */
    function renderProfesionales(esp) {
      resetSelect(profSel, "Primero elegí una especialidad");
      const lista = PROFESIONALES[esp];
      if (!esp || !lista) return;
      profSel.firstChild.textContent = "Seleccioná un profesional";
      addOption(profSel, SIN_PREFERENCIA, SIN_PREFERENCIA);
      lista.forEach(([nombre]) => addOption(profSel, nombre, nombre));
      profSel.disabled = false;
    }

    /* 4.f. Franja: automática según el profesional y el día.
            Con "Sin preferencia" se muestran las franjas que atiende alguien ese día. */
    function renderFranjas() {
      resetSelect(franjaSel, "Primero elegí profesional y fecha");
      const esp = espSel.value;
      const prof = profSel.value;
      const fecha = fechaInp.value;
      if (!esp || !prof || !fecha || !isBookable(fecha)) return;

      const lista = PROFESIONALES[esp] || [];
      let franjas;

      if (prof === SIN_PREFERENCIA) {
        franjas = [...new Set(lista.map(([, patron]) => franjaPara(patron, fecha)))];
      } else {
        const encontrado = lista.find(([nombre]) => nombre === prof);
        if (!encontrado) return;
        franjas = [franjaPara(encontrado[1], fecha)];
      }

      franjas.sort((a, b) => ORDEN_FRANJAS.indexOf(a) - ORDEN_FRANJAS.indexOf(b));
      franjaSel.firstChild.textContent = "Seleccioná una franja";
      franjas.forEach((f) => addOption(franjaSel, f, `${f} (${FRANJAS[f]})`));

      // Si hay una sola franja posible, queda seleccionada automáticamente
      if (franjas.length === 1) franjaSel.value = franjas[0];
      franjaSel.disabled = false;
    }

    /* 4.g. Cambios en los campos */
    sedeSel.addEventListener("change", () => {
      renderEspecialidades(sedeSel.value);
      renderProfesionales("");
      renderFranjas();
    });

    espSel.addEventListener("change", () => {
      renderProfesionales(espSel.value);
      renderFranjas();
    });

    profSel.addEventListener("change", () => {
      renderFranjas();
    });

    fechaInp.addEventListener("change", () => {
      if (fechaInp.value && !isBookable(fechaInp.value)) {
        setError(fechaInp, "Atendemos de lunes a viernes, dentro de los próximos 60 días y fuera de feriados.");
        fechaInp.value = "";
      } else {
        clearError(fechaInp);
      }
      renderFranjas();
    });

    // Estado inicial
    renderEspecialidades("");
    renderProfesionales("");
    renderFranjas();

    /* ----- 5. VALIDACIÓN ----- */
    const validator = initValidation(form);

    /* ----- 6. ENVÍO ASÍNCRONO ----- */
    const setStatus = (message, type) => {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove("is-success", "is-error");
      if (type) statusEl.classList.add(type);
    };

    const setLoading = (isLoading) => {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle("is-loading", isLoading);
      btnText.textContent = isLoading ? "Enviando..." : "Enviar solicitud";
    };

    const openModal = () => {
      if (!modal) return;
      modal.hidden = false;
      if (modalClose) modalClose.focus();
    };

    const closeModal = () => {
      if (modal) modal.hidden = true;
    };

    if (modalClose) modalClose.addEventListener("click", closeModal);

    // Captcha Turnstile: solo se carga cuando el backend está activado.
    // Mientras tanto no aparece nada (así la demo no muestra errores de clave).
    if (CONFIG.supabase.enabled) {
      const tsScript = document.createElement("script");
      tsScript.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      tsScript.async = true;
      tsScript.defer = true;
      document.head.appendChild(tsScript);

      const tsBox = document.createElement("div");
      tsBox.className = "cf-turnstile";
      tsBox.dataset.sitekey = CONFIG.supabase.turnstileSiteKey;
      tsBox.dataset.theme = "light";
      submitBtn.parentElement.insertBefore(tsBox, submitBtn);
    }
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("", null);

      // 1) Validación
      if (!validator.validateAll()) {
        setStatus("Revisá los campos marcados en rojo.", "is-error");
        return;
      }

      // 2) Honeypot: si un bot completó el campo oculto, simulamos éxito sin enviar
      const honey = form.querySelector('input[name="_honey"]');
      if (honey && honey.value) {
        form.reset();
        openModal();
        return;
      }

      // 3) Datos legibles para el correo
      const formData = new FormData(form);
      formData.set("Sede", sedeSel.options[sedeSel.selectedIndex].text);
      formData.set("Especialidad", espSel.options[espSel.selectedIndex].text);
      formData.set("Profesional", profSel.options[profSel.selectedIndex].text);
      formData.set("Franja horaria", franjaSel.options[franjaSel.selectedIndex].text);
      formData.set("Consentimiento aceptado el", new Date().toLocaleString("es-AR"));

      // 4a) Backend Supabase: el turno queda confirmado al registrarlo.
      //     Si la franja ya fue tomada, la base responde 409 (índice único) y se avisa.
      if (CONFIG.supabase.enabled) {
        setLoading(true);
        try {
          // Captcha: el token de Turnstile lo verifica el servidor, y sirve una sola vez
          const captchaToken = window.turnstile ? window.turnstile.getResponse() : "";
          if (!captchaToken) {
            setStatus("Completá la verificación antes de enviar.", "is-error");
            return;
          }

          // Nombres que espera la base (Edge Function): el formulario guarda códigos cortos
          const SEDES_DB = { "1": "Sede 1 · La Boca", "2": "Sede 2 · Chacarita" };
          const FRANJAS_DB = {
            "Mañana": "Mañana (08:00 a 12:00)",
            "Tarde": "Tarde (13:00 a 18:00)",
            "Vespertino": "Vespertino (18:00 a 21:00)",
          };

          const turno = {
            sede: SEDES_DB[sedeSel.value] || null,
            especialidad: formData.get("Especialidad"),
            profesional: formData.get("Profesional"),
            fecha: formData.get("Fecha preferida"),
            franja: (() => {
              // formData ya reemplazó el valor por el texto de la opción; buscamos por el nombre base
              const texto = franjaSel.options[franjaSel.selectedIndex].text;
              const clave = Object.keys(FRANJAS_DB).find((k) => texto.startsWith(k));
              return clave ? FRANJAS_DB[clave] : null;
            })(),
            tipo_consulta: formData.get("Tipo de consulta") || "",
            paciente_nombre: formData.get("Nombre y apellido"),
            paciente_dni: formData.get("DNI"),
            paciente_contacto: formData.get("Teléfono - WhatsApp"),
            paciente_email: formData.get("Correo electrónico"),
            "cf-turnstile-response": captchaToken,
          };

          // La Edge Function valida, verifica el captcha y registra el turno confirmado
          const res = await fetch(CONFIG.supabase.url + "/functions/v1/crear-turno", {
            method: "POST",
            headers: {
              apikey: CONFIG.supabase.anonKey,
              Authorization: "Bearer " + CONFIG.supabase.anonKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(turno),
          });

          if (window.turnstile) window.turnstile.reset();

          if (res.status === 409) {
            setStatus("Ese horario ya fue tomado. Elegí otra franja.", "is-error");
            return;
          }
          if (res.status === 403) {
            setStatus("No pudimos verificar la solicitud. Intentá de nuevo.", "is-error");
            return;
          }
          if (!res.ok) throw new Error("La función respondió " + res.status);

          form.reset();
          renderEspecialidades("");
          renderProfesionales("");
          renderFranjas();
          setStatus("", null);
          const modalP = $("#successModal p");
          if (modalP) modalP.textContent = "Tu turno quedó confirmado. Te enviamos el detalle a tu correo.";
          openModal();
        } catch (error) {
          console.error("Error al registrar el turno:", error);
          setStatus("No pudimos registrar tu turno. Intentá de nuevo en unos minutos.", "is-error");
        } finally {
          setLoading(false);
        }
        return;
      }

      // 4) Envío asíncrono
      setLoading(true);

      try {
        const response = await fetch(CONFIG.formEndpoint, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && (data.success === "true" || data.success === true || data.success === undefined)) {
          form.reset();
          renderEspecialidades("");
          renderProfesionales("");
          renderFranjas();
          setStatus("", null);
          openModal();
        } else {
          throw new Error(data.message || "No se pudo enviar la solicitud.");
        }
      } catch (error) {
        console.error("Error al enviar el formulario:", error);
        setStatus(
          "No pudimos enviar tu solicitud. Revisá tu conexión e intentá de nuevo.",
          "is-error"
        );
      } finally {
        setLoading(false);
      }
    });
  }

  /* ------------------------------------------------------------------------
     5. VALIDACIÓN DEL FORMULARIO
     ------------------------------------------------------------------------ */
  const RULES = {
    nombre: {
      validate: (v) => v.trim().split(/\s+/).length >= 2 && v.trim().length >= 5,
      message: "Ingresá nombre y apellido.",
    },
    dni: {
      validate: (v) => /^\d{7,9}$/.test(v.replace(/[.\s]/g, "")),
      message: "Ingresá un DNI válido (7 a 9 dígitos).",
    },
    telefono: {
      validate: (v) => /^[\d\s+()-]{8,20}$/.test(v) && v.replace(/\D/g, "").length >= 8,
      message: "Ingresá un teléfono o WhatsApp válido.",
    },
    email: {
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: "Ingresá un correo electrónico válido.",
    },
    sede: {
      validate: (v) => v !== "",
      message: "Seleccioná una sede.",
    },
    especialidad: {
      validate: (v) => v !== "",
      message: "Seleccioná una especialidad.",
    },
    profesional: {
      validate: (v) => v !== "",
      message: "Seleccioná un profesional o 'Sin preferencia'.",
    },
    fecha: {
      validate: (v) => isBookable(v),
      message: "Elegí un día hábil (lunes a viernes) dentro de los próximos 60 días.",
    },
    franja: {
      validate: (v) => v !== "",
      message: "Seleccioná una franja horaria.",
    },
    privacidad: {
      validate: (v, field) => field.checked,
      message: "Para enviar la solicitud necesitás aceptar el aviso de privacidad.",
    },
  };

  function getGroup(field) {
    return field.closest(".form__group");
  }

  function setError(field, message) {
    const group = getGroup(field);
    const errorEl = group ? $(".form__error", group) : null;
    if (group) group.classList.add("has-error");
    if (errorEl) errorEl.textContent = message;
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    const group = getGroup(field);
    const errorEl = group ? $(".form__error", group) : null;
    if (group) group.classList.remove("has-error");
    if (errorEl) errorEl.textContent = "";
    field.removeAttribute("aria-invalid");
  }

  function validateField(field) {
    const rule = RULES[field.id];
    if (!rule) return true;

    if (!rule.validate(field.value, field)) {
      setError(field, rule.message);
      return false;
    }
    clearError(field);
    return true;
  }

  function initValidation(form) {
    const fields = $$("input[required], select[required]", form);

    fields.forEach((field) => {
      field.addEventListener("blur", () => {
        if (field.value !== "" || field.dataset.touched) validateField(field);
        field.dataset.touched = "true";
      });
      field.addEventListener("change", () => validateField(field));
    });

    return {
      validateAll() {
        let firstInvalid = null;
        let allValid = true;

        fields.forEach((field) => {
          if (field.disabled) return;
          if (!validateField(field)) {
            allValid = false;
            if (!firstInvalid) firstInvalid = field;
          }
        });

        if (firstInvalid) firstInvalid.focus();
        return allValid;
      },
    };
  }

  /* ------------------------------------------------------------------------
     UTILIDADES Y ARRANQUE
     ------------------------------------------------------------------------ */
  function initPrivacyDetails() {
    const details = $(".legal-details");
    if (!details) return;
    const openIfHash = () => {
      if (location.hash === "#privacidad") details.open = true;
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
  }

  function initYear() {
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initFilters();
    initCarousel();
    initTurnos();
    initYear();
    initPrivacyDetails();
  });
})();
