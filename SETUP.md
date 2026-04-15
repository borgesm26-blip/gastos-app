# 🚀 Configuración del MVP - Gastos App

Este documento te guía paso a paso para tener la app funcionando localmente y en producción.

## Paso 1: Crear cuenta en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Click en "Start your project" o "Sign up"
3. Usa Google, GitHub o email/password
4. Crea un nuevo proyecto:
   - Nombre: `gastos-app` (o lo que prefieras)
   - Database password: genera una fuerte
   - Region: elige la más cercana (ej: us-east-1 para USA, eu-central-1 para Europa)

## Paso 2: Obtener credenciales de Supabase

1. En el dashboard de Supabase, ve a **Settings** (⚙️) → **API**
2. Copia estas claves:
   - `Project URL` → es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` → es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → es tu `SUPABASE_SERVICE_ROLE_KEY` (¡SECRETO!)

3. Ve a **Settings** → **Auth** → copia también el `JWT Secret`

## Paso 3: Crear las tablas en la base de datos

1. En Supabase, ve a **SQL Editor**
2. Click en **New Query**
3. Copia y pega este SQL:

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

CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

4. Click en **Run**
5. Verifica que se crearon las tablas sin errores

## Paso 4: Configurar variables de entorno

### Para la app web (Next.js)

1. En la carpeta raíz del proyecto, crea `.env.local`:

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Para la app móvil (Expo)

1. En `apps/mobile/.env.local`:

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE:** 
- Los archivos `.env.local` NO deben committearse a git (ya están en `.gitignore`)
- La `SUPABASE_SERVICE_ROLE_KEY` es secreto - nunca la expongas en el cliente
- La `EXPO_PUBLIC_*` puede ser pública (está diseñado así)

## Paso 5: Instalar dependencias

```bash
cd /Users/michelleborges/Desktop/gastos-app

# Instalar pnpm si no lo tienes
npm install -g pnpm

# Instalar todas las dependencias del monorepo
pnpm install
```

## Paso 6: Ejecutar la app localmente

### Web (Next.js)

```bash
# Desde la raíz del proyecto
pnpm dev

# O específicamente la web
cd apps/web && pnpm dev
```

Accede a `http://localhost:3000`

### Mobile (Expo)

```bash
cd apps/mobile
pnpm start

# Luego elige:
# - Presiona "i" para iOS (necesita Mac)
# - Presiona "a" para Android
# - Presiona "w" para web
# O descarga Expo Go en tu teléfono y escanea el QR
```

## Paso 7: Probar localmente

1. **Login/Signup:**
   - Ve a `http://localhost:3000`
   - Click en "Registrate"
   - Usa tu email y crea una contraseña
   - (Supabase te pedirá verificar el email, puedes saltarlo en dev)

2. **Crear un gasto:**
   - Ve al dashboard
   - Click en "➕ Nuevo Gasto"
   - Ingresa:
     - Monto: 500
     - Categoría: Supermercado
     - Descripción: Coto
     - De quién: Compartido
   - Click en "💾 Guardar"

3. **Verificar en Supabase:**
   - Ve al SQL Editor de Supabase
   - Ejecuta: `SELECT * FROM expenses;`
   - Deberías ver tu gasto registrado

## Paso 8: Deploy a Vercel (producción)

### 1. Crear repo en GitHub

```bash
# Desde la raíz del proyecto
git remote add origin https://github.com/TU_USUARIO/gastos-app.git
git branch -M main
git push -u origin main
```

### 2. Conectar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz login con GitHub
3. Click en "Add New..." → "Project"
4. Busca `gastos-app` y click en "Import"
5. En **Project Settings**, configura:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Environment Variables:** agrega
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

6. Click en "Deploy"

¡En 2 minutos tu app estará en producción! 🎉

### 3. Tu URL en producción

Vercel te dará una URL como: `https://gastos-app.vercel.app`

## Paso 9: Actualizar CORS en Supabase (si es necesario)

Si tienes errores de CORS en producción:

1. En Supabase, ve a **Settings** → **API**
2. En **URL Configuration**, asegúrate de que tu dominio de Vercel está en la lista
3. Ejemplo:
   ```
   https://gastos-app.vercel.app
   http://localhost:3000
   ```

## Troubleshooting

### ❌ Error: "Missing Supabase environment variables"
**Solución:** Verifica que `.env.local` está en la carpeta correcta y tiene las variables correctas.

### ❌ Error: "CORS error"
**Solución:** 
1. Verifica que las URLs en Supabase están en la whitelist
2. Asegúrate que es HTTPS en producción
3. Limpia el caché del navegador

### ❌ Error: "Row-level security violation"
**Solución:** Probablemente no creaste las políticas RLS. Ejecuta el SQL del Paso 3 nuevamente.

### ❌ "pnpm: command not found"
**Solución:** Instala pnpm:
```bash
npm install -g pnpm
```

### ❌ Port 3000 ya está ocupado
**Solución:**
```bash
# En macOS/Linux
lsof -i :3000
kill -9 <PID>

# O usa otro puerto
pnpm dev -- -p 3001
```

## Próximos Pasos (Fase 2)

Una vez que todo está funcionando:

1. **OCR para tickets:**
   - Instala Tesseract.js
   - Integra en la pantalla "Nuevo Gasto"
   - Detecta montos automáticamente

2. **Multiusuario:**
   - Agrega tabla `shared_expenses`
   - Implementa invitación por email
   - Crea dashboard de pareja

3. **Gráficos:**
   - Instala `recharts` o `chart.js`
   - Crea gráficos de gastos por categoría
   - Muestra tendencias

---

## Recursos Útiles

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **Expo Docs:** https://docs.expo.dev

¿Necesitas ayuda? Abre un issue en GitHub o contáctame.

Happy coding! 🚀💰
