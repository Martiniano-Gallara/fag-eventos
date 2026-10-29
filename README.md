# FAG Eventos — Documentación de Entrega

> **Producción:** https://fag-eventos.vercel.app  
> **Panel de administración:** https://fag-eventos.vercel.app/admin.html  
> **Repositorio:** https://github.com/Martiniano-Gallara/fag-eventos

---

## 1. Descripción del Proyecto

Sitio web de presentación y portafolio para **FAG Eventos — Fernando Gigena**, productor integral de grandes espectáculos. El sitio incluye:

- Landing page con hero, estadísticas, galería de eventos y contacto
- Página "Quiénes somos"
- Panel de administración privado (login requerido) para editar contenido en tiempo real

---

## 2. Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 (vanilla) + JavaScript ES Modules |
| Backend (API) | Vercel Serverless Functions (Node.js ≥20) |
| Base de datos | [Neon](https://neon.tech) — PostgreSQL serverless |
| Deploy | [Vercel](https://vercel.com) — rama `main` → producción automática |
| Fuentes | Google Fonts (Montserrat, Open Sans) |
| Iconos | Font Awesome 6 (cdnjs.cloudflare.com) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

---

## 3. Variables de Entorno (Vercel)

Configurar en **Vercel Dashboard → Settings → Environment Variables**, scope: **Production**.

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string de Neon | `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | Clave para firmar cookies de sesión (≥64 chars hex) | ver comando abajo |
| `ADMIN_INITIAL_PASSWORD` | Contraseña inicial del administrador (≥12 chars) | `MiContraseñaSegura2026!` |

**Generar `SESSION_SECRET`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **⚠️ Importante:** Después de configurar las variables, ir a **Vercel → Deployments → Redeploy** para que tomen efecto.

---

## 4. Base de Datos (Neon)

El schema se aplica **automáticamente** al primer request. No se requieren migraciones manuales.

Tablas creadas:

| Tabla | Descripción |
|-------|-------------|
| `fag_site_data` | Contenido del sitio (JSON) + versión + timestamp |
| `fag_site_data_history` | Historial de hasta 50 versiones anteriores |
| `fag_admin_auth` | Hash bcrypt de la contraseña del admin |
| `fag_login_attempts` | Rate limiting de intentos de login por IP |

---

## 5. Panel de Administración

### Primer acceso

1. Ir a `https://fag-eventos.vercel.app/admin.html`
2. Ingresar la contraseña configurada en `ADMIN_INITIAL_PASSWORD`
3. En el primer login, el sistema guarda el hash de esa contraseña en la DB
4. Ir a **Seguridad** dentro del panel y cambiar la contraseña a una personal

### Qué se puede editar desde el panel

- **Hero:** título (2 líneas) y pills de características
- **Estadísticas:** los 3 contadores animados (número, prefijo, sufijo, etiquetas)
- **Galería:** agregar, editar o quitar cards de eventos (título, subtítulo, categoría, imagen, link, badge)
- **Contacto:** WhatsApp, email, Instagram (cuenta y las de Fer/Fede)
- **Seguridad:** cambio de contraseña del admin

### Publicar cambios

Los cambios son locales hasta que se hace clic en **Publicar**. El sitio público se actualiza con un caché de 60 segundos.

---

## 6. Corregir Imágenes de Galería (Fix Único)

Si las imágenes de la galería aparecen rotas, ejecutar el script de corrección de extensiones:

```bash
DATABASE_URL="postgresql://..." node scripts/fix-gallery-extensions.mjs
```

Este script convierte las rutas `.jpg`/`.png` a `.webp` en la DB. Es idempotente (se puede correr múltiples veces sin problema).

---

## 7. API Endpoints

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/data` | GET | No | Devuelve el contenido actual del sitio |
| `/api/data` | POST | ✅ Cookie | Publica nuevos datos |
| `/api/login` | POST | No | Autentica y setea cookie de sesión |
| `/api/logout` | POST | ✅ Cookie | Cierra sesión |
| `/api/session` | GET | No | Verifica si hay sesión activa |
| `/api/change-password` | POST | ✅ Cookie | Cambia la contraseña del admin |
| `/api/csp-report` | POST | No | Recibe reportes de violaciones CSP |

---

## 8. Seguridad

El sitio implementa las siguientes medidas de seguridad:

| Medida | Detalle |
|--------|---------|
| **Content Security Policy** | `script-src 'self'` — sin `unsafe-inline` ni scripts externos |
| **HSTS** | `max-age=31536000; includeSubDomains` |
| **X-Frame-Options** | `DENY` |
| **X-Content-Type-Options** | `nosniff` |
| **Referrer-Policy** | `strict-origin-when-cross-origin` |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=()` |
| **CSP Reporting** | Violaciones logueadas en `/api/csp-report` → Vercel Logs |
| **Rate limiting** | 3 intentos fallidos → bloqueo por IP |
| **Sesiones** | Cookie `HttpOnly; Secure; SameSite=Strict` firmada con HMAC |
| **Contraseñas** | Hash bcrypt (cost=12) |
| **Validación de inputs** | Payload sanitizado contra XSS antes de guardar en DB |
| **Error leakage** | Errores internos retornan `"Error interno."` sin detalles |

---

## 9. CI/CD

- **Deploy automático:** cualquier push a `main` dispara un deploy en Vercel
- **Tests automáticos (GitHub Actions):**
  - `npm test` — 14 tests unitarios sin DB real (mock in-memory)
  - Smoke tests contra producción — verifican CSP, headers, endpoints críticos

Ver `.github/workflows/ci.yml` para el detalle.

---

## 10. Comandos Útiles

```bash
# Instalar dependencias
npm install

# Correr tests localmente
npm test

# Corregir extensiones de imágenes en Neon (run único)
DATABASE_URL="postgresql://..." node scripts/fix-gallery-extensions.mjs

# Generar SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 11. Estructura del Proyecto

```
fag-eventos/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions: tests + smoke
├── api/
│   ├── _lib/
│   │   ├── auth.js             # Sesiones, cookies, HMAC
│   │   ├── db.js               # Conexión Neon + schema auto-apply
│   │   └── validate.js         # Validación y sanitización de payload
│   ├── change-password.js
│   ├── csp-report.js           # Receptor de violaciones CSP
│   ├── data.js                 # GET/POST contenido del sitio
│   ├── login.js                # Auth + rate limiting
│   ├── logout.js
│   └── session.js
├── assets/
│   └── gallery/                # Imágenes en formato .webp
├── css/
│   ├── admin.css
│   └── styles.css
├── js/
│   ├── admin.js
│   ├── data-store.js
│   └── main.js
├── scripts/
│   ├── fix-gallery-extensions.mjs  # Fix único: .jpg/.png → .webp en DB
│   ├── schema.sql
│   └── test-verification.mjs       # 14 tests unitarios
├── admin.html
├── index.html
├── quienes-somos.html
├── package.json
└── vercel.json                 # Headers de seguridad + rutas API
```

---

## 12. Soporte

Para consultas sobre el código o la infraestructura, contactar al desarrollador que entregó este proyecto.

