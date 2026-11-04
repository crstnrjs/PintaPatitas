# PintaPatitas 🐾

Plataforma web para solicitud y gestión de retratos personalizados de mascotas hechos en Chile.

## 🚀 Arquitectura

El proyecto está organizado como un monorepositorio con dos carpetas principales:

* **`client/`**: Aplicación web frontend en React (Vite, Tailwind CSS, Lucide Icons, React Router v7).
  * Catálogo dinámico y formulario de pedido en pasos (selección de técnica, tamaño, mascotas, subida de fotos y datos de entrega).
  * Panel administrativo privado (`/admin`) para gestión de solicitudes, métricas, seguimiento de pedidos y catálogo.
* **`server/`**: API backend construida con Express 5 (Node.js).
  * Cálculo dinámico de precios y validación de archivos.
  * Almacenamiento seguro de fotos en Supabase Storage.
  * Integración con Mercado Pago (Checkout Pro y Webhooks para confirmación de pagos).
  * Envío de correos transaccionales automáticos vía Nodemailer.

---

## 🛠️ Requisitos previos

* Node.js (v18 o superior recomendado)
* Cuenta en Supabase (Base de datos PostgreSQL, Storage y Auth)
* Credenciales de Mercado Pago (Pruebas / Producción)
* Cuenta de correo con contraseña de aplicación (para envíos SMTP)

---

## ⚙️ Configuración inicial

### 1. Clonar el repositorio
```bash
git clone https://github.com/<tu-usuario>/PintaPatitas.git
cd PintaPatitas
```

### 2. Configurar variables de entorno
Copia los archivos de ejemplo y completa los valores con tus credenciales:

**Cliente (`client/`):**
```bash
cp client/.env.example client/.env
```

**Servidor (`server/`):**
```bash
cp server/.env.example server/.env
```

> ⚠️ **Importante:** Nunca compartas ni subas al repositorio los archivos `.env` reales.

### 3. Instalación de dependencias

**En el cliente:**
```bash
cd client
npm install
npm run dev
```

**En el servidor:**
```bash
cd server
npm install
npm run dev
```

---

## 📄 Licencia
Privado / PintaPatitas. Todos los derechos reservados.
