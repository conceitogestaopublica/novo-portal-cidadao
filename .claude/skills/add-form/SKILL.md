---
name: add-form
description: Criar formulário RHF + Zod com estados de loading, tratamento de erro da API e acessibilidade.
---

# Skill: add-form

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
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cadastroSchema, type CadastroDto } from '../schemas/cadastro.schema'
import { useCadastrar } from '../hooks/use-auth'

export function CadastroForm() {
  const router = useRouter()
  const form = useForm<CadastroDto>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: { documento: '', nome: '', email: '', senha: '' },
  })

  const { mutate, isPending } = useCadastrar()

  function onSubmit(data: CadastroDto) {
    mutate(data, {
      onSuccess: () => router.push('/'),
      onError: (err) => form.setError('root', { message: err.message ?? 'Erro ao cadastrar' }),
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
                <Input placeholder="Nome completo" {...field} />
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

### 3. Fluxos multi-etapa (OTP, parcelamento, DMS)

Vários fluxos deste portal são de mais de um passo (ex.: login por OTP: documento →
código; parcelamento: simular → aderir → termo). Modele cada etapa como seu próprio
schema Zod e mantenha o estado de qual etapa está ativa num `useState<'documento' |
'otp'>('documento')` no componente orquestrador — cada etapa em si segue o mesmo
padrão RHF+Zod acima, não um form gigante com campos condicionais.

### 4. Select / Enum fields

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

<FormField
  control={form.control}
  name="tipo"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Tipo</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="A">Opção A</SelectItem>
          <SelectItem value="B">Opção B</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Checklist

- [ ] `'use client'` no topo
- [ ] Schema Zod em `schemas/`, reaproveitado do `route.ts` quando ele já existir
- [ ] `useForm` com `zodResolver`
- [ ] `defaultValues` definidos (evita uncontrolled → controlled warning)
- [ ] Todos os campos com `FormLabel` e `FormMessage`
- [ ] Botão submit desabilitado com `isPending`
- [ ] Erro geral da API exibido com `role="alert"`, com a mensagem real do backend
- [ ] Nenhuma lógica de negócio no componente — apenas no mutation
- [ ] Fluxo multi-etapa modelado como schemas separados por etapa, não um form condicional gigante
