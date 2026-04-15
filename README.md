# 💰 Gastos App - MVP

App de monitoreo de gastos hogareños que resuelve el problema de **fricción**. Si registrar un gasto toma >5 segundos, la abandonas. Este MVP está diseñado para ser rápido y simple.

## Stack

- **Frontend:** Next.js 14 + React
- **Mobile:** Expo (React Native) - próximamente
- **Backend:** API routes de Next.js
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel + Supabase

## Instalación

### 1. Clonar el repo y instalar dependencias

```bash
cd gastos-app
pnpm install
```

### 2. Configurar Supabase

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear un nuevo proyecto
3. Copiar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Crear archivo `.env.local` en `apps/web/`:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_key_aqui
```

### 3. Crear las tablas en Supabase

En Supabase, ir a **SQL Editor** y ejecutar:

```sql
-- Tabla de gastos
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL CHECK (owner IN ('yo', 'vos', 'compartido')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);

-- RLS (Row Level Security) - Cada usuario solo ve sus gastos
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 4. Ejecutar el dev server

```bash
pnpm dev
```

Accede a `http://localhost:3000`

## Features del MVP (Fase 1)

✅ **Login/Signup** - Auth con Supabase
✅ **Nuevo Gasto** - Registro rápido (<5 segundos)
- Monto
- Categoría
- Descripción (opcional)
- De quién (Yo / Vos / Compartido)

✅ **Dashboard** - Resumen de gastos
- Total este mes
- Total general
- Gastos por categoría
- Últimos 10 gastos

## Roadmap

### Fase 2: OCR
- Capturar foto de ticket
- Detectar monto automáticamente con Tesseract.js
- Categorización inteligente

### Fase 3: Multiusuario Real
- Invitar pareja por email
- Ver gastos del otro
- Gestionar deudas/saldos

### Fase 4: Inflación & Precios
- Gráficos de evolución de precios
- Comparar en ARS vs USD (MEP/Blue)
- Alertas si pasas presupuesto

### Fase 5: Suscripciones
- Detectar gastos recurrentes (Netflix, Spotify)
- Alertas de vencimiento

## Tech Details

- **Monorepo:** pnpm workspaces
- **TypeScript:** Strict mode
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL en Supabase
- **Auth:** Supabase Auth (Magic Link o Email/Password)

## Deploy a Producción

### Web (Vercel)

```bash
# 1. Pushear código a GitHub
git push origin main

# 2. Conectar repo en Vercel
# https://vercel.com/new

# 3. Configurar env vars en Vercel:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### Mobile (Expo)

```bash
# Proximamente: setup Expo Go y EAS Build
```

## Estructura del Proyecto

```
gastos-app/
├── apps/
│   ├── web/                 # Next.js app
│   │   ├── app/
│   │   │   ├── page.tsx     # Home (redirect a login/dashboard)
│   │   │   ├── auth/        # Auth pages
│   │   │   ├── dashboard/   # Dashboard principal
│   │   │   ├── nuevo/       # Nuevo gasto
│   │   │   └── api/         # API routes
│   │   └── lib/
│   │       ├── supabase.ts  # Cliente Supabase
│   │       └── auth-guard.tsx
│   └── mobile/              # Expo app (próximamente)
└── packages/
    └── types/               # Types compartidos
```

## Notas

- **Velocidad primero:** Cada pantalla está optimizada para <5 segundos
- **Mobile-first:** Diseño responsivo que funciona en cualquier dispositivo
- **Real-time:** Los cambios se sincronizan automáticamente con Supabase
- **Privacidad:** Cada usuario solo ve sus propios gastos (RLS en DB)

---

¿Preguntas? Abre un issue en GitHub o me contactas.

Happy spending tracking! 💸
