# Instituto Médico Atlántico Sur · Espacio Terapéutico del Sur

Demo del **Plan Bellatrix**: sitio institucional con solicitud de turnos online, confirmación automática por correo y panel de administración con doble factor.

> Esta versión es una **demostración** con datos ficticios. El backend y el panel real no forman parte de este repositorio.

## Qué incluye

- **Sitio institucional:** inicio, especialidades y sedes con mapas, especialistas, solicitud de turnos, aviso de privacidad y contacto.
- **Solicitud de turnos:** formulario encadenado (sede, especialidad, profesional, fecha y franja) con validación y consentimiento de datos.
- **Confirmación automática:** el turno queda confirmado al registrarse, y se envían mails al paciente y al Instituto.
- **Panel de administración:** lista de turnos con indicadores por estado, reprogramación y cancelación, con aviso al paciente y registro de cada cambio.

## Arquitectura

| Componente | Función |
|---|---|
| Sitio estático (GitHub Pages) | HTML, CSS y JavaScript puro, sin frameworks |
| Cloudflare Turnstile | Captcha del formulario, verificado en el servidor |
| Supabase (Postgres) | Almacenamiento de turnos, reglas de acceso (RLS) y auditoría |
| Supabase Auth | Acceso de administradores con contraseña y doble factor (TOTP) |
| Funciones de servidor (Supabase Edge Functions) | Alta de turnos y cambios de turnos, con validaciones y envío de correos |
| Resend | Correo transaccional: confirmaciones, reprogramaciones y cancelaciones |
| WhatsApp Business | Previsto para avisos. Pendiente de aprobación de Meta |

## Flujo de un turno

1. El paciente completa el formulario y resuelve el captcha.
2. El servidor verifica el captcha y valida cada campo contra listas cerradas. No se acepta texto médico libre.
3. El turno se guarda como **confirmado**. Un índice único en la base impide que dos turnos ocupen el mismo horario para el mismo profesional, aunque se reserven al mismo tiempo.
4. El paciente recibe la confirmación con un número de referencia. El Instituto recibe el detalle completo.
5. Desde el panel, un administrador puede reprogramar o cancelar. El cambio queda registrado y el paciente recibe un aviso.

## Seguridad y privacidad

- Las claves secretas se guardan solo en el servidor. El sitio contiene únicamente claves públicas.
- Ningún visitante puede leer ni modificar la agenda. Solo lo hacen administradores autenticados.
- Los administradores acceden con contraseña y código de doble factor. No hay registro público de cuentas.
- Se recogen solo los datos necesarios para el turno. La especialidad y el DNI no viajan en los correos al paciente.
- Cada cambio de turno queda auditado con el usuario que lo hizo.
- Los plazos de conservación y anonimización se definen con el Instituto y su asesor legal, conforme a la Ley 25.326.

*Este documento describe el diseño técnico y no reemplaza una revisión legal.*

## Configuración del sitio

Todo lo que el sitio necesita está en `script.js`, en el objeto `CONFIG`:

- **`CONFIG.supabase.enabled`:** `false` muestra el formulario en modo demostración. `true` conecta el formulario con el backend.
- **`CONFIG.supabase.url` y `anonKey`:** dirección del proyecto y clave pública.
- **`CONFIG.supabase.turnstileSiteKey`:** clave pública del captcha.
- **`CONFIG.formEndpoint`:** destino del formulario en modo demostración (FormSubmit). Requiere activarlo la primera vez desde el correo que recibe.
- **`PROFESIONALES` y `PATRONES`:** profesionales y agenda de la demostración.
- **`FERIADOS`:** feriados nacionales. Hay que actualizarla cada año.
- **Colores:** variables `--color-*` al inicio de `styles.css`.
- **Textos y datos de contacto:** directamente en `index.html`, incluido el aviso de privacidad.

## Estructura

```
index.html      Sitio público y formulario de turnos
admin.html      Panel de ejemplo con datos ficticios (no es el panel real)
styles.css      Estilos
script.js       Filtros, carrusel, validación, configuración y envío del formulario
img/            Fotos, logos y fondo
README.md       Este archivo
```

## Publicar

1. Subí estos archivos a un repositorio público.
2. En **Settings > Pages**, elegí la rama `main` y la carpeta `/ (root)`.
3. El sitio queda disponible en `https://USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

## Antes de usar datos reales

- Reemplazar los datos de demostración por los profesionales y las fotos reales.
- Confirmar nombres de sedes, direcciones y horarios.
- Configurar el dominio del Instituto para el envío de correos.
- Revisar el aviso de privacidad y los plazos de conservación con un abogado.
