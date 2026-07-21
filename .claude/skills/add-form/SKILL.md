---
name: add-form
description: Criar formulário RHF + Zod com estados de loading, tratamento de erro da API e acessibilidade.
---

# Skill: add-form

> O style shadcn `base-nova` deste projeto não tem `Form`/`FormField`/`FormControl`/
> `FormMessage` — só `Input`, `Label`, `Button`. O padrão real é `register()` do RHF
> direto no `Input`, com erro exibido a partir de `formState.errors` (ver
> `gpd-web-tributario-front/src/modules/auth/components/login-form.tsx` como
> referência cruzada).

## ⚠️ Antes de tudo: `<Button type="submit">` é obrigatório

O `Button` do shadcn (style `base-nova`, sobre `@base-ui/react`) renderiza `type="button"`
por padrão — diferente do `<button>` nativo, que dentro de um `<form>` já é `submit` por
default. Todo `<Button>` que deveria submeter o formulário precisa de `type="submit"`
explícito, senão o clique não faz nada (só Enter no input funciona) e nem typecheck, nem
lint, nem um teste de rota via `curl` pegam isso — só um teste de componente que simula o
clique. Escreva esse teste (passo 5) para qualquer formulário novo.

## Passos

### 1. Definir (ou reaproveitar) o schema Zod

Se a rota BFF (`route.ts`) já valida o payload com `z.object(...)`, mova esse schema
para `src/modules/<modulo>/schemas/<modulo>.schema.ts` e importe-o dos dois lados
(form e `route.ts`) — não duplique as regras:

```typescript
// src/modules/auth/schemas/cadastro.schema.ts
import { z } from 'zod'

export const cadastroSchema = z.object({
  documento: z.string().min(11, 'Informe um CPF ou CNPJ válido.'),
  nome: z.string().min(3, 'Informe o nome completo.'),
  email: z.string().email('E-mail inválido.').optional().or(z.literal('')),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

export type CadastroDto = z.infer<typeof cadastroSchema>
```

### 2. Criar o componente de formulário

`src/modules/<modulo>/components/<entidade>-form.tsx`

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cadastroSchema, type CadastroDto } from '../schemas/cadastro.schema'
import { useCadastrar } from '../hooks/use-auth'

export function CadastroForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CadastroDto>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { documento: '', nome: '', email: '', senha: '' },
  })

  const { mutateAsync } = useCadastrar()

  async function onSubmit(data: CadastroDto) {
    try {
      await mutateAsync(data)
      router.push('/')
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Erro ao cadastrar' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" placeholder="Nome completo" {...register('nome')} />
        {errors.nome && (
          <p className="text-sm text-destructive" role="alert">{errors.nome.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="text-sm text-destructive" role="alert">{errors.root.message}</p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Cadastrar'}
      </Button>
    </form>
  )
}
```

### 3. Fluxos multi-etapa (OTP, parcelamento, DMS)

Vários fluxos deste portal são de mais de um passo (ex.: login por OTP: documento →
código; parcelamento: simular → aderir → termo). Modele cada etapa como seu próprio
schema Zod e mantenha o estado de qual etapa está ativa num `useState<'documento' |
'otp'>('documento')` no componente orquestrador — cada etapa em si segue o mesmo
padrão RHF+Zod acima, não um form gigante com campos condicionais.

### 4. Select / Enum fields

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'

<div className="space-y-1.5">
  <Label htmlFor="tipo">Tipo</Label>
  <Controller
    control={control}
    name="tipo"
    render={({ field }) => (
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <SelectTrigger id="tipo"><SelectValue placeholder="Selecione" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="A">Opção A</SelectItem>
          <SelectItem value="B">Opção B</SelectItem>
        </SelectContent>
      </Select>
    )}
  />
  {errors.tipo && <p className="text-sm text-destructive" role="alert">{errors.tipo.message}</p>}
</div>
```

## Checklist

- [ ] `'use client'` no topo
- [ ] Schema Zod em `schemas/`, reaproveitado do `route.ts` quando ele já existir
- [ ] `useForm` com `zodResolver`
- [ ] `defaultValues` definidos (evita uncontrolled → controlled warning)
- [ ] Campos com `register()` + `Label`/`Input` do shadcn — sem `Form`/`FormField`
- [ ] `<Button type="submit">` explícito no botão de submit (sem isso o clique não faz nada)
- [ ] Teste de componente (RTL) clicando no botão de submit — não só verificando a renderização
- [ ] Todo campo com erro exibido a partir de `formState.errors`
- [ ] Botão submit desabilitado com `isSubmitting`/`isPending`
- [ ] Erro geral da API exibido com `role="alert"`, com a mensagem real do backend
- [ ] Nenhuma lógica de negócio no componente — apenas no mutation
- [ ] Fluxo multi-etapa modelado como schemas separados por etapa, não um form condicional gigante
