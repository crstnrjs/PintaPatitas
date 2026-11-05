# Encargo: administrar desde el panel el contenido oculto de la landing

> Brief para otro agente (claude-omni). Todo lo necesario para empezar sin repetir la investigación.
> Escrito el 2026-11-05. Antes de confiar en una ruta o función, verifica que siga existiendo.

## Objetivo

Hoy el contenido "real" de la landing vive en un archivo estático: `client/src/pages/landing/contenido.js`.
Hay que pasarlo a Supabase y crear una sección **Contenido** en el panel admin. Desde ahí el artista podrá subir y administrar:

1. **Galería**: obras terminadas.
2. **Foto → obra**: pares de foto original + pintura terminada.
3. **Testimonios**: reales y con autorización del cliente.
4. **Ajustes**: enlace de Instagram y frase de confianza (p. ej. "Más de 100 mascotas convertidas en arte").

Cada sección de la landing debe **aparecer sola** cuando tenga al menos un elemento visible, y **ocultarse** si no tiene.

## Estado actual (lo que ya existe)

- **Stack**: React 19 + Vite 8 + Tailwind 4, React Router 7. JS/JSX, **no** TypeScript. Alias `@/` → `client/src`.
  - **No es Next.js.**
- **Ramas y PRs**:
  - La landing nueva está en `main` (PR #4 fusionado).
  - El rediseño del panel admin está en el PR #5 (rama `feat/admin-redesign`), **todavía abierto**.
  - **Recomendado:** esperar a que se fusione el PR #5, o crear la rama nueva desde `feat/admin-redesign`, porque la sección nueva debe usar su sistema visual.

### Cómo consume hoy la landing el contenido (`client/src/pages/landing/contenido.js`)

| Export | Estado actual | Lo usa |
|---|---|---|
| `obras` | 2 imágenes en `public/img` (banner, Mqumascota), con `src`, `variantes:[480,720]`, `ancho`, `alto`, `alt`, `tecnica` | `Galeria.jsx`, y la portada usa `obras[0]` en `landingPage.jsx` |
| `comparaciones` | `[]` → la sección se oculta | `FotoAObra.jsx` (`{ foto, obra, ancho, alto, alt, tecnica }`) |
| `testimonios` | `[]` → oculta | `Testimonios` dentro de `landingPage.jsx` (`{ texto, autor, mascota, foto }`) |
| `INSTAGRAM_URL` | `""` → oculto | `components/Footer.jsx` |
| `FRASE_CONFIANZA` | `null` → oculta | Portada en `landingPage.jsx` |
| `MOSTRAR_AVISOS` | `false` | `FaltaMaterial` en `landing/ui.jsx` (recuadros solo de desarrollo) |
| `estilosInfo`, `TIEMPO_PRODUCCION` | textos fijos | `Estilos.jsx`, `Preguntas.jsx` (pueden quedarse en el archivo) |

- **Imagen responsive:** `Imagen` en `landing/ui.jsx` arma el `srcset` a partir de `src` + `variantes`, reemplazando `.webp` por `-480.webp` y `-720.webp`.
  - Si las variantes se guardan con otro esquema (por ejemplo URLs separadas en columnas), adapta `Imagen` para que acepte ese formato.
- **Filtros de la galería:** ya filtra por técnica (slug de `techniques`) cuando hay obras con `tecnica`, y tiene visor (`<dialog>`).

### Patrón que ya usa el panel (copiarlo, no inventar otro)

- **Acceso**:
  - `client/src/admin/auth/AdminRoute.jsx` comprueba la sesión de Supabase y que el usuario esté en la tabla `admins` (`user_id`).
  - El catálogo escribe **directo desde el cliente** con la sesión del admin; la seguridad la ponen las políticas RLS.
  - **No hace falta tocar `server/`.**
- **Subida de fotos** (`client/src/admin/catalog/ProductModal.jsx`):
  - `aWebp(file, maxLado = 1600, calidad = 0.82)` convierte la imagen a WebP con canvas en el navegador.
  - Se sube a Storage con `supabase.storage.from("catalog").upload(\`products/${crypto.randomUUID()}.webp\`, blob, { contentType: "image/webp", cacheControl: "31536000" })`.
  - La URL pública se obtiene con `getPublicUrl(path).data.publicUrl`.
  - Si falla el insert, borra la foto subida para no dejarla huérfana. Al reemplazar una foto, borra la anterior.
  - **Reusar este patrón.** Lo ideal es mover `aWebp` a un helper compartido y generar también las copias de 480 y 720 px.
- **Lectura pública:** `client/src/pages/pedido/useCatalogoPublico.js` lee `price_list` con la anon key filtrando `is_active = true`. Hacer un hook equivalente (p. ej. `useContenidoLanding`).
- **Sistema visual del admin** (`client/src/admin/shared/ui.jsx`, PR #5):
  - Componentes: `PageHeader`, `Panel`, `StatCard`, `EmptyState`, `Skeleton`, `Aviso`, `Toast`, `btn.{primary,secondary,ghost,danger}`, `inputClass`, `modalOverlay`, `modalPanel`, `StatusBadge`.
  - Tomar como referencia de UI `admin/catalog/AdminCatalog.jsx`: tarjetas con imagen, filtros tipo chip, toast y menú "•••".
- **Ruta ya creada:**
  - `routes.jsx` tiene `/admin/contenido` → `admin/content/ContentEditor.jsx`, que hoy es un stub vacío.
  - Falta agregarla al arreglo `menu` de `admin/layout/AdminPanel.jsx`, con un icono lucide como `Images`.

## Propuesta de implementación

### 1. Migración (`supabase/migrations/<fecha>_contenido_landing.sql`)

En el repo **no** está el esquema base ni las políticas RLS actuales; solo existe `202611040001_add_payment_idempotency.sql`.

- **Antes de escribir políticas, revisa en Supabase:**
  - cómo están hechas las de `price_list` y del bucket `catalog`;
  - si ya existe una función tipo `is_admin()`.
- Copia ese mismo criterio. Si no existe, la condición es `exists (select 1 from public.admins a where a.user_id = auth.uid())`.

**Tablas sugeridas** (todas con `id uuid default gen_random_uuid()`, `sort_order int default 0`, `is_visible bool default false`, `created_at` y `updated_at`):

- **`gallery_items`**: `image_path text not null`, `width int`, `height int`, `alt text not null`, `technique_id uuid null references techniques(id)`.
- **`before_after_items`**: `photo_path text not null`, `artwork_path text not null`, `width int`, `height int`, `alt text not null`, `technique_id uuid null`.
- **`testimonials`**:
  - campos: `quote text not null`, `author_name text null`, `pet_name text null`, `image_path text null`, `consent_confirmed bool not null default false`;
  - restricción: `check (not is_visible or consent_confirmed)`, para que **nunca** se publique un testimonio sin autorización.
- **`site_settings`**: clave/valor (`key text primary key`, `value text`) o una sola fila con `instagram_url` y `trust_phrase`.

**RLS:**
- `select` para `anon` y `authenticated` solo `where is_visible` (en `site_settings`, lectura pública);
- `insert`, `update` y `delete` solo para admins.

**Storage:**
- bucket **`landing`** público de lectura;
- escritura y borrado solo para admins.

**Cómo aplicarla:** la migración **la aplica el usuario**, pegándola en el editor SQL de Supabase. Si se usa `npx supabase`, pedir confirmación antes.

### 2. Panel: `admin/content/ContentEditor.jsx`

Pestañas: **Galería · Foto → obra · Testimonios · Ajustes**.

- **Acciones:** subir con vista previa, editar, mostrar/ocultar, reordenar (subir/bajar o un campo de orden), eliminar con confirmación y borrar también el archivo en Storage.
- **Galería y Foto → obra:** campo obligatorio de descripción (sirve de `alt`) y selector de técnica opcional, que lee `techniques`.
- **Testimonios:** casilla obligatoria "El cliente autorizó publicar este testimonio (y su nombre/foto)". Sin ella no se puede marcar como visible.
- **Ajustes:** Instagram (validar que sea `https://`) y frase de confianza.
  - Dejar a la vista un texto de ayuda: "solo publica cifras verificables".
- **Estados de la interfaz:** vacíos, de carga y de error amigables, usando los componentes del sistema visual.
- **Accesibilidad:** foco visible y destinos táctiles de 44 px o más.

### 3. Landing

- Crear un hook para leer las cuatro fuentes y conectarlo a:
  - `Galeria.jsx`, la portada (`obras[0]`) y `FotoAObra.jsx`;
  - `Testimonios` en `landingPage.jsx`;
  - `Footer.jsx` (Instagram) y la portada (frase de confianza).
- **Respaldo:** si la galería en la base está vacía o falla la carga, usar las 2 obras estáticas de `contenido.js`, porque la portada necesita una imagen. Las demás secciones se ocultan.
- **Rendimiento:**
  - no bloquear la portada mientras carga;
  - `loading="lazy"` fuera de la portada;
  - `width` y `height` puestos para evitar saltos de layout.
- **Fuera de alcance:** el borrador `client/src/pages/Terminos.jsx` y su ruta.

## Reglas del proyecto (de CLAUDE.md)

- **Idioma:** textos de UI, errores y commits en español, con Conventional Commits.
- **Archivos `.env`:** no leerlos ni editarlos. Si agregas variables, actualiza `.env.example`.
- **Claves:** `SUPABASE_SERVICE_ROLE_KEY` solo en el server. El cliente usa la anon key.
- **Hosting:** no borrar `client/public/.htaccess`.
- **No inventar:** testimonios, cifras, nombres ni fotos.
- **Ramas:** trabajar en una rama nueva (p. ej. `feat/contenido-landing`) con su propio PR. No hacer push sin confirmar.

## Verificación antes de dar por terminado

1. En `client/`: `npm run lint` y `npm run build` sin errores.
2. Con la migración aplicada, sin sesión (anon):
   - se ven solo los elementos visibles;
   - no se puede insertar ni borrar; probar con el cliente de Supabase en la consola y esperar un error de RLS.
3. Con sesión admin, que lo inicia el usuario: subir una foto de prueba a la galería, marcarla visible, verla en la landing, ocultarla y eliminarla. Confirmar que el archivo se borró de Storage.
4. Testimonio sin autorización: no se puede publicar (ni desde la UI ni por la restricción de la base).
5. Responsive en 375 px y 1280 px, y la consola sin errores.
6. El flujo de pedido (`/catalogo`) y el catálogo admin siguen igual.
