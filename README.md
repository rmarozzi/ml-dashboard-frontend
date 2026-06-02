# ML Dashboard — Frontend

Dashboard SaaS para vendedores do Mercado Livre. Next.js 14 + Tailwind CSS.

## Stack
- Next.js 14.2 (App Router)
- TypeScript 5
- Tailwind CSS 3.4
- Recharts 2
- Lucide React

## Estrutura
```
app/
  login/            → Página de login
  dashboard/        → Área do cliente
    page.tsx        → Visão geral
    orders/         → Pedidos
    shipments/      → Envios
    analytics/      → Analytics (Ouro+)
    costs/          → Preços de custo (Prata+)
    employees/      → Funcionários (Prata+)
    profile/        → Perfil e contas ML
    settings/       → Configurações
    sync-debug/     → Debug sync (Premium)
  admin/            → Área administrativa
    page.tsx        → Overview da plataforma
    clients/        → Lista e perfil de clientes
    subscriptions/  → Assinaturas e cohort
    financial/      → Financeiro e MRR
    monitoring/     → Monitoramento de syncs
    alerts/         → Central de alertas
  api/              → BFF routes (proxy para Express)

contexts/           → AuthContext, PlanContext, PermissionsContext
components/
  ui/               → Badge, Button, KPICard, Modal, Input, Toggle, UpgradeGate...
  layout/           → Sidebar, Topbar
lib/
  api.ts            → Cliente axios para cada módulo
  types.ts          → Todos os tipos TypeScript
  constants.ts      → PLAN_RANK, PERMISSION_LABELS, etc.
  utils.ts          → formatCurrency, timeAgo, hasPlan...
  backendFetch.ts   → Helper das API Routes (BFF)
```

## Setup local

```bash
npm install
cp .env.example .env.local
# Edite .env.local com a URL do seu backend

npm run dev
```

## Deploy no Vercel

1. Crie um projeto no Vercel apontando para este repositório
2. Adicione as variáveis de ambiente:
   - `BACKEND_URL` → URL do seu backend no Render (ex: `https://ml-dash-api.onrender.com`)
   - `NEXT_PUBLIC_BACKEND_URL` → mesma URL
3. Deploy automático a cada push na main

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `BACKEND_URL` | URL do backend Express (server-side) | `https://ml-dash-api.onrender.com` |
| `NEXT_PUBLIC_BACKEND_URL` | URL do backend (client-side) | mesma URL acima |
