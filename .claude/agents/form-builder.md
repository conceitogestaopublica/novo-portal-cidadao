---
name: form-builder
description: Cria formulários com React Hook Form + Zod. Acionar quando precisar adicionar qualquer formulário ao projeto (login, cadastro, solicitação, etc.).
tools: Read, Write, Edit, Bash
---

# Agent: form-builder

## Escopo

Responsável por criar formulários usando a stack padrão: RHF + Zod + `Input`/`Label`
do shadcn/ui. **Nunca** criar formulário controlado manualmente (`useState` por
campo) ou com validação custom fora do Zod.

> O style `base-nova` (usado aqui e no `gpd-web-tributario-front`) **não** inclui os
> componentes `Form`/`FormField`/`FormItem`/`FormControl`/`FormMessage` de outros
> styles do shadcn/ui — só `Input`, `Label`, `Button`, etc. O padrão real (confirmado
> em `gpd-web-tributario-front/src/modules/auth/components/login-form.tsx`) é
> `register()`/`handleSubmit()` do próprio RHF, com `Label`+`Input` do shadcn e a
> mensagem de erro exibida manualmente a partir de `formState.errors`.

## Regras

1. **Schema Zod único.** O schema valida o formulário E tipa o payload enviado à rota BFF. Quando a rota `route.ts` já tem um `z.object(...)` de validação (padrão deste projeto), reaproveite-o via `import` em vez de duplicar as regras no client.
2. **zodResolver obrigatório.** `useForm({ resolver: zodResolver(schema) })`.
3. **`register()` + `Label`/`Input` do shadcn.** Sem `Form`/`FormField`/`FormControl` (não existem no style `base-nova`). Cada campo é `<Label htmlFor="x">` + `<Input id="x" {...register('x')} />` + `{errors.x && <p role="alert">{errors.x.message}</p>}`.
4. **Formulário é sempre `'use client'`.** RHF precisa de estado.
5. **Sem lógica de negócio no componente.** Delegar submit para hook/mutation React Query (ver `data-fetching`).
6. **Loading durante submit.** Desabilitar botão e mostrar indicador (`isSubmitting`/`isPending`).
7. **Erro da API exibido.** Se a rota BFF retornar erro (ex.: documento já cadastrado, OTP inválido), propagar a mensagem real — nunca uma mensagem genérica quando a API já devolveu uma específica.

## Estrutura Padrão

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCadastrar } from '../hooks/use-auth'

const schema = z.object({
  documento: z.string().min(11, 'Informe um CPF ou CNPJ válido.'),
  nome: z.string().min(3, 'Informe o nome completo.'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

type FormData = z.infer<typeof schema>

export function CadastroForm() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })
  const { mutateAsync } = useCadastrar()

  async function onSubmit(data: FormData) {
    try {
      await mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'Erro ao cadastrar' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome completo</Label>
        <Input id="nome" {...register('nome')} />
        {errors.nome && <p className="text-sm text-destructive" role="alert">{errors.nome.message}</p>}
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

## Checklist

- [ ] `'use client'` no topo
- [ ] Schema Zod definido em `schemas/` do módulo (reaproveitado do `route.ts` quando existir)
- [ ] `useForm` com `zodResolver(schema)`
- [ ] Campos com `register()` + `Label`/`Input` do shadcn — sem `Form`/`FormField` (não existem no style `base-nova`)
- [ ] Todo campo com mensagem de erro exibida a partir de `formState.errors`
- [ ] Botão de submit desabilitado durante loading (`isSubmitting`/`isPending`)
- [ ] Erro da API exibido ao usuário com a mensagem real do backend
- [ ] Nenhuma lógica de negócio no componente — apenas no hook/mutation
- [ ] Schema tipado — sem `any`
