---
name: form-builder
description: Cria formulários com React Hook Form + Zod. Acionar quando precisar adicionar qualquer formulário ao projeto (login, cadastro, solicitação, etc.).
tools: Read, Write, Edit, Bash
---

# Agent: form-builder

## Escopo

Responsável por criar formulários usando a stack padrão: RHF + Zod + shadcn/ui Form.
**Nunca** criar formulário controlado manualmente (`useState` por campo) ou com validação custom fora do Zod.

## Regras

1. **Schema Zod único.** O schema valida o formulário E tipa o payload enviado à rota BFF. Quando a rota `route.ts` já tem um `z.object(...)` de validação (padrão deste projeto), reaproveite-o via `import` em vez de duplicar as regras no client.
2. **zodResolver obrigatório.** `useForm({ resolver: zodResolver(schema) })`.
3. **Componentes Form do shadcn.** Usar `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` — nunca criar estrutura de form própria (o padrão antigo do projeto, com `<div>{erro}</div>` manual, está sendo descontinuado).
4. **Formulário é sempre `'use client'`.** RHF precisa de estado.
5. **Sem lógica de negócio no componente.** Delegar submit para hook/mutation React Query (ver `data-fetching`).
6. **Loading durante submit.** Desabilitar botão e mostrar indicador (`isPending`/`isSubmitting`).
7. **Erro da API exibido.** Se a rota BFF retornar erro (ex.: documento já cadastrado, OTP inválido), propagar a mensagem via `form.setError('root', ...)` ou `toast.error(...)` — nunca uma mensagem genérica quando a API já devolveu uma específica.

## Estrutura Padrão

```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useCadastrar } from '../hooks/use-auth'

const schema = z.object({
  documento: z.string().min(11, 'Informe um CPF ou CNPJ válido.'),
  nome: z.string().min(3, 'Informe o nome completo.'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
})

type FormData = z.infer<typeof schema>

export function CadastroForm() {
  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  const { mutate, isPending } = useCadastrar()

  function onSubmit(data: FormData) {
    mutate(data, {
      onError: (err) => form.setError('root', { message: err.message }),
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Cadastrar'}
        </Button>
      </form>
    </Form>
  )
}
```

## Checklist

- [ ] `'use client'` no topo
- [ ] Schema Zod definido em `schemas/` do módulo (reaproveitado do `route.ts` quando existir)
- [ ] `useForm` com `zodResolver(schema)`
- [ ] Componentes Form/FormField/FormItem/FormLabel/FormControl/FormMessage usados
- [ ] Todo campo tem `FormLabel` e `FormMessage`
- [ ] Botão de submit desabilitado durante loading
- [ ] Erro da API exibido ao usuário com a mensagem real do backend
- [ ] Nenhuma lógica de negócio no componente — apenas no hook/mutation
- [ ] Schema tipado — sem `any`
