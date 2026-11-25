# Instituto Médico Atlántico Sur · Espacio Terapéutico del Sur

Sitio web institucional de un instituto médico con dos sedes: especialidades médicas y terapéuticas, equipo de especialistas y solicitud de turnos online.

Sitio estático, hecho con HTML, CSS y JavaScript puro, sin frameworks ni dependencias. Está pensado para publicarse en GitHub Pages.

## Secciones

- **Inicio:** presentación del instituto y botón para solicitar turno.
- **Especialidades y sedes:** grilla de especialidades con filtro por sede, y mapas con cómo llegar a cada sede.
- **Especialistas:** carrusel con los profesionales y el equipo.
- **Solicitar turno:** formulario encadenado (sede, especialidad, profesional, fecha y franja) con validación y consentimiento de datos.
- **Aviso de privacidad:** texto basado en la Ley 25.326 de Argentina.
- **Contacto:** datos de cada sede, horarios y enlaces rápidos.

## Estructura

```
index.html      Estructura y contenido de la página
styles.css      Estilos (colores y tipografía en las variables de :root)
script.js       Filtros, carrusel, turnos, validación y envío del formulario
img/            Fotos de especialidades y especialistas, logos y fondo
```

## Configuración

- **Correo de recepción de turnos:** `CONFIG.formEndpoint` en `script.js`. Usa FormSubmit, que requiere activar el formulario la primera vez desde el correo que llega a esa casilla.
- **Profesionales y agenda:** objeto `PROFESIONALES` y rotación `PATRONES` en `script.js`.
- **Feriados:** lista `FERIADOS` en `script.js`. Hay que actualizarla cada año.
- **Textos y datos de contacto:** directamente en `index.html`, incluido el aviso de privacidad.
- **Colores:** variables `--color-*` al inicio de `styles.css`.


## Nota

Es una plantilla de demostración. Antes de usarla con datos reales, revisá los datos de contacto, los nombres y las fotos de los profesionales, y el aviso de privacidad.

