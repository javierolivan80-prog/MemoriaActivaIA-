# Memoria Activa

Aplicación de acompañamiento telefónico con IA para personas mayores. Los
familiares crean un perfil detallado de la persona mayor; una IA realiza
llamadas telefónicas reales, mantiene memoria persistente de las
conversaciones y genera resúmenes automáticos y alertas para la familia.

## Cómo funciona

1. Un familiar se registra y crea el perfil de la persona mayor (intereses,
   rutinas, temas favoritos, temas sensibles a evitar, etc.).
2. El sistema programa llamadas telefónicas reales mediante **Retell AI**,
   con un agente conversacional impulsado por la **API de Claude**.
3. Cada llamada se transcribe y se procesa para extraer memoria relevante
   (permanente, reciente o episódica), que alimenta futuras conversaciones.
4. Al finalizar cada llamada se genera un resumen automático y, si procede,
   una alerta con nivel de prioridad para el familiar.
5. El familiar consulta todo desde un dashboard: últimas llamadas, estado de
   ánimo detectado, resúmenes y alertas.

## Stack técnico

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes (TypeScript)
- **Base de datos**: PostgreSQL vía Supabase
- **Autenticación**: Supabase Auth
- **Pagos**: Stripe
- **Voz**: Retell AI (llamadas telefónicas con IA)
- **LLM**: Claude API (Anthropic)
- **Hosting**: Vercel (frontend + backend), Neon (BD), Retell (voz)

## Estructura del proyecto

```
src/
├── app/
│   ├── api/            # API routes: auth, onboarding, profile, memories,
│   │                    # calls, summaries, alerts, webhooks
│   ├── auth/            # Páginas de login / signup
│   ├── dashboard/        # Dashboard del familiar
│   ├── profile/          # Perfil del familiar
│   └── elderly/          # Vistas relacionadas con la persona mayor
├── components/
│   ├── ui/               # Componentes de interfaz genéricos
│   ├── auth/              # Componentes de autenticación
│   ├── onboarding/         # Formularios de onboarding
│   ├── dashboard/           # Componentes del dashboard
│   └── profile/              # Componentes de perfil
├── lib/
│   ├── supabase.ts         # Cliente de Supabase
│   ├── ai/                  # Prompts, memoria y resúmenes con Claude
│   ├── phone/                 # Integración con Retell AI
│   ├── payment/                 # Integración con Stripe
│   └── utils/
├── types/
│   └── index.ts                  # Tipos TypeScript del dominio
├── hooks/
└── styles/
```

## Base de datos (Supabase / PostgreSQL)

Tablas principales: `users`, `elderly_profiles`, `subscriptions`,
`conversation_sessions`, `conversation_messages`, `memories`,
`call_summaries`, `alerts`. Ver `src/types/index.ts` para los tipos
TypeScript correspondientes a cada tabla.

## Variables de entorno

Copia `.env.local.example` (si existe) a `.env.local` y completa los
valores. **Nunca** commitees `.env.local` ni ningún archivo con secretos.

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Retell AI
RETELL_API_KEY=
RETELL_AGENT_ID=

# Claude API
ANTHROPIC_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# General
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Desarrollo

```bash
npm install
npm run dev
```

## Roadmap (4 semanas)

- **Semana 1**: Setup del proyecto + autenticación (Supabase Auth, schema,
  RLS).
- **Semana 2**: Onboarding y perfil de la persona mayor (parsing con
  Claude, página de perfil).
- **Semana 3**: Llamadas telefónicas con Retell AI, sistema de memoria y
  generación de resúmenes.
- **Semana 4**: Dashboard del familiar, pagos con Stripe, sistema de
  alertas y testing final.
