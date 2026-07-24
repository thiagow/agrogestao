# CLAUDE.md — AgroGestão

Sistema de gestão financeira e controle agrícola (fornecedores, safras, bancos, cotações, arrendamentos, comercialização). Exportado originalmente do Google AI Studio.

## Stack

- React 19 + TypeScript + Vite 6 + Tailwind CSS v4 (config CSS-first via `@tailwindcss/vite`, **sem** `tailwind.config.js`)
- `lucide-react` para ícones, `motion` para animação
- Sem router: navegação é feita via state (`activeTab: ActiveTab` em `src/types.ts`), trocado pelo `Sidebar`
- Sem state manager: todo estado vive em `App.tsx` (`useState`) e desce por props
- Sem lib de formulário/validação (react-hook-form, zod, etc.) — forms usam `useState` por campo + `required` HTML nativo
- Sem backend/persistência real — dados mock em `src/data/initialData.ts`; CRUD é só em memória

Essas ausências são deliberadas por ora (fora de escopo até segunda ordem). Não introduza router, state manager ou lib de forms sem alinhar antes — é mudança de arquitetura, não detalhe de implementação.

## Estrutura

```
src/
  types.ts                 # todos os tipos de domínio centralizados aqui
  data/initialData.ts      # mocks + helpers puros (formatCurrency, formatDateBR, isCurtoPrazo...)
  components/
    ui/                    # design system — primitivos reutilizáveis (ver abaixo)
    Sidebar.tsx             # menu oficial da aplicação — já registra TODAS as abas (ActiveTab)
    Header.tsx
    <Entity>Table.tsx        # listagem de uma tela (ex: SupplierTable)
    <Entity>Drawer.tsx       # drawer lateral de cadastro/edição (ex: SupplierDrawer)
    MetricCards.tsx
    views/
      <Nome>View.tsx        # "página" de uma aba (ResumoView, BancosView, QuadroSafraView, CotacoesView...)
      GenericView.tsx       # placeholder para abas ainda não implementadas
  App.tsx                   # orquestra estado + roteamento por activeTab
```

Convenção: componentes em PascalCase, `export const Nome: React.FC<Props> = ...` (named export, não default — exceção é `App.tsx`).

## Design System (`src/components/ui/`)

Extraído do padrão validado na tela **Fornecedores** (tela-molde do projeto) e dos tokens em `DESIGN.md` (paleta "Agro-Industrial Precision": primary lime `#a3e635`, sidebar dark forest `#0b2310`, radius 8px padrão/16px cards grandes, tipografia Manrope).

Componentes disponíveis (`import { X } from './ui'` ou de arquivo individual):
- `Button` — variantes `primary` (lime, CTA principal), `secondary` (ghost slate, cancelar), `ghost` (dark, usado em footer de modal), `icon` (ação inline em tabela)
- `Input`, `Select`, `Textarea` — campos de formulário com label/hint opcionais, estilo `bg-slate-50 border-slate-200 rounded-xl focus:ring-emerald-600/30`
- `Card` — casca branca `rounded-2xl border shadow-xs`, usada como container de tabelas/painéis
- `Badge` — pill de status/categoria, tones: `amber`, `emerald`, `rose`, `blue`, `slate`
- `Drawer` — slide-over lateral (backdrop + painel branco à direita) para criar/editar entidades — **é o padrão de cadastro do app, não modal central**
- `Modal` — casca de modal central, para ações que não são CRUD de entidade (ex: gerador de link de imagem)

**Regra de padronização**: toda nova tela do menu (`Sidebar.tsx` já lista todas as `ActiveTab` oficiais) deve seguir a estrutura da tela Fornecedores:
1. `Header` da página (já compartilhado)
2. `MetricCards` no topo, se fizer sentido para a entidade
3. Listagem em `Card` com tabela própria (colunas variam por entidade, não abstraia a tabela em si)
4. `Drawer` lateral para criar/editar (não modal central)
5. Toda a UI usa os primitivos de `src/components/ui/` — não reimplemente botão/input/select do zero

Para ativar uma nova tela: criar `views/<Nome>View.tsx`, registrar a condição em `App.tsx` (substituindo o fallback em `GenericView`). O `id` da aba já existe em `ActiveTab` (`src/types.ts`) e em `navItems` (`Sidebar.tsx`) — não precisa mexer no menu.

## Referência visual

`DESIGN.md` na raiz é a fonte de verdade dos tokens (cores, tipografia, espaçamento, elevação, shapes). Qualquer componente novo deriva dali — não inventar valores de cor/espaçamento ad-hoc.
