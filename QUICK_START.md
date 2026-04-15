# ⚡ Quick Start - Gastos App MVP

Tu app está lista. Estos son los próximos 15 minutos:

## 1. Crea cuenta en Supabase (5 min)

1. Ve a https://supabase.com
2. Haz login/signup
3. Crea proyecto nuevo

## 2. Obtén credenciales (2 min)

En Supabase → Settings → API, copia:
- `Project URL` 
- `anon key`
- `service_role key`

## 3. Crea `.env.local` en `apps/web/` (1 min)

```bash
NEXT_PUBLIC_SUPABASE_URL=<tu_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_key>
SUPABASE_SERVICE_ROLE_KEY=<tu_service_key>
```

## 4. Ejecuta SQL en Supabase (2 min)

Supabase → SQL Editor → New Query → pega todo de aquí:

```sql
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

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at);

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

Click en **Run** ✅

## 5. Instala y ejecuta (5 min)

```bash
cd /Users/michelleborges/Desktop/gastos-app

# Instala dependencias
pnpm install

# Ejecuta la app
pnpm dev

# Verás:
# > web@0.1.0 dev
# ▲ Next.js 14.x.x
# - Local: http://localhost:3000
```

Abre `http://localhost:3000` en tu navegador ✅

## 6. Testa (2 min)

1. Click en "Registrate"
2. Email: `test@test.com`
3. Password: `cualquiera123`
4. ¡Creado! 

En dashboard:
1. Click "➕ Nuevo Gasto"
2. Monto: 500
3. Categoría: Supermercado
4. Click "💾 Guardar"

¡Listo! Deberías ver el gasto en el dashboard. 🎉

---

## ¿Qué sigue?

### Opción A: Deploy en Vercel (5 min)
1. Push a GitHub
2. Conecta repo en Vercel
3. Agrega env vars
4. Click "Deploy"
5. ¡En producción en 2 minutos!

### Opción B: Seguir agregando features
- **Fase 2:** OCR para tickets
- **Fase 3:** Multiusuario
- **Fase 4:** Gráficos y análisis

---

## Estructura del Proyecto

```
gastos-app/
├── apps/
│   ├── web/          ← Tu app web (la que estás usando)
│   └── mobile/       ← Expo para teléfono (próximamente)
├── packages/types/   ← Types compartidos
├── SETUP.md         ← Setup detallado
└── README.md        ← Documentación completa
```

---

## Errores Comunes

### "Missing Supabase environment variables"
→ Verifica `.env.local` existe en `apps/web/` con las 3 variables

### "Can't reach Supabase"
→ Verifica tu URL y keys son correctas

### "Port 3000 ya está ocupado"
```bash
pnpm dev -- -p 3001
```

---

Cualquier pregunta, está todo en **SETUP.md** 📖

¡Vamos! 🚀

