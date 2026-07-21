# Formulários e Validação

Ver [ADR-0004](../adr/0004-rhf-zod-forms.md).

## Regra Principal

**Sempre RHF + Zod.** Schema Zod único, compartilhado entre o formulário e a
rota BFF que valida o mesmo payload — nunca duplicar a regra ("senha mín. 6
caracteres") em dois lugares.

```typescript
// modules/auth/schemas/auth.schema.ts — importado pelo form E pela rota
export const cadastroSchema = z.object({
  documento: z.string().min(11, "Informe um CPF ou CNPJ válido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});
```

## ⚠️ `<Button type="submit">` é obrigatório

O `Button` do shadcn (style `base-nova`, sobre `@base-ui/react`) **não** herda
o default nativo do HTML — um `<button>` sem `type` dentro de um `<form>` já é
`submit`, mas o primitivo do base-ui renderiza `type="button"` por padrão.
Sem `type="submit"` explícito, o clique **não dispara** `handleSubmit` (só
Enter no input funciona) — e isso passa batido em typecheck, lint e qualquer
smoke test via `curl`. Foi um bug real nesta base de código, corrigido em 8
formulários, só descoberto por um teste de componente simulando o clique de
verdade.

```tsx
<Button type="submit" disabled={isSubmitting}>Salvar</Button>
```

**Sempre escreva um teste que clica no botão de submit**, não só um teste que
renderiza e verifica o DOM estático — é a única forma prática de pegar essa
classe de bug.

## Sem `Form`/`FormField` do shadcn

Diferente de outros styles do shadcn, `base-nova` não tem os componentes
`Form`/`FormField`/`FormItem`/`FormControl`/`FormMessage`. O padrão real
(confirmado no código do `gpd-web-tributario-front`,
`modules/auth/components/login-form.tsx`) é `register()` direto no
`Input`/`Label` do shadcn, com erro exibido a partir de `formState.errors`:

```tsx
<div>
  <Label>Nome</Label>
  <Input {...register("nome")} />
  {errors.nome && <p role="alert">{errors.nome.message}</p>}
</div>
```

## `z.input` vs `z.output` com `.default()`

Se o schema usa `.default(...)` em algum campo (comum nos formulários de
CRUD do admin), `z.infer` reflete o tipo de **saída** (defaults já aplicados),
mas `useForm`/`defaultValues` esperam o tipo de **entrada** (campos com
default ficam opcionais). Use os dois:

```typescript
export type AlgoFormInput = z.input<typeof algoSchema>;   // para useForm/defaultValues
export type AlgoOutput = z.output<typeof algoSchema>;      // para handleSubmit

useForm<AlgoFormInput, unknown, AlgoOutput>({ resolver: zodResolver(algoSchema), ... });
```

## Fluxos multi-etapa

Login por OTP, parcelamento (simular → aderir → termo) etc.: um `useForm` por
etapa, cada um com seu próprio schema — não um form gigante com campos
condicionais e um único schema complexo.
