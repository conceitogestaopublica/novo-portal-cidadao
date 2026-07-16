-- Schema do banco do Portal do Cidadão (database próprio: `portal_cidadao`).
--
-- POR QUE UM .sql E NÃO PRISMA: o portal acessa o banco por SQL cru (`pg`), não
-- por ORM. Antes deste arquivo as tabelas existiam só porque foram criadas à
-- mão — um clone do repositório NÃO subia. Este dump é a fonte da verdade.
--
-- Criar do zero:
--   createdb portal_cidadao
--   psql -d portal_cidadao -f db/schema.sql
--
-- Ou, com o Postgres em container:
--   docker exec -i <container> psql -U postgres -c "CREATE DATABASE portal_cidadao;"
--   docker exec -i <container> psql -U postgres -d portal_cidadao < db/schema.sql

--
-- PostgreSQL database dump
--

\restrict sSSgAKgWKFjORXcoJczaJetF12gtpu71vVaXbcZvREnkFC9XknvzaX5I9kFw924


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: portal_ambientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_ambientes (
    slug text NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    dados jsonb NOT NULL
);


--
-- Name: portal_categorias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_categorias (
    slug text NOT NULL,
    ambiente_slug text NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    dados jsonb NOT NULL
);


--
-- Name: portal_contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_contas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    documento character varying(14) NOT NULL,
    nome character varying(200) NOT NULL,
    email character varying(150),
    telefone character varying(30),
    senha_hash character varying(255),
    contribuinte_id uuid,
    municipio character varying(60) NOT NULL,
    criado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portal_servicos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_servicos (
    slug text NOT NULL,
    categoria_slug text NOT NULL,
    publicado boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    dados jsonb NOT NULL
);


--
-- Name: portal_solicitacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_solicitacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    protocolo text NOT NULL,
    municipio text NOT NULL,
    conta_id uuid,
    documento text,
    nome text NOT NULL,
    contato text,
    servico_slug text NOT NULL,
    servico_titulo text NOT NULL,
    mensagem text,
    situacao text DEFAULT 'ABERTA'::text NOT NULL,
    protocolo_numero text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL,
    protocolo_id text,
    protocolo_sistema text
);


--
-- Name: portal_ambientes portal_ambientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_ambientes
    ADD CONSTRAINT portal_ambientes_pkey PRIMARY KEY (slug);


--
-- Name: portal_categorias portal_categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_categorias
    ADD CONSTRAINT portal_categorias_pkey PRIMARY KEY (slug);


--
-- Name: portal_contas portal_contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_contas
    ADD CONSTRAINT portal_contas_pkey PRIMARY KEY (id);


--
-- Name: portal_servicos portal_servicos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_servicos
    ADD CONSTRAINT portal_servicos_pkey PRIMARY KEY (slug);


--
-- Name: portal_solicitacoes portal_solicitacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_solicitacoes
    ADD CONSTRAINT portal_solicitacoes_pkey PRIMARY KEY (id);


--
-- Name: portal_contas uq_conta_doc_municipio; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_contas
    ADD CONSTRAINT uq_conta_doc_municipio UNIQUE (documento, municipio);


--
-- Name: idx_portal_cat_ambiente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_cat_ambiente ON public.portal_categorias USING btree (ambiente_slug);


--
-- Name: idx_portal_serv_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_serv_categoria ON public.portal_servicos USING btree (categoria_slug);


--
-- Name: idx_portal_solic_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_solic_conta ON public.portal_solicitacoes USING btree (conta_id, criado_em DESC);


--
-- Name: uq_portal_solic_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_portal_solic_protocolo ON public.portal_solicitacoes USING btree (municipio, protocolo);


--
-- Name: portal_seed_aplicado; Type: TABLE; Schema: public; Owner: -
--
-- Registro de qual linha da semente já foi oferecida a este banco. Garante que
-- rotina nova (ex.: DMS) chegue a quem já subiu o portal, sem ressuscitar o que
-- o município excluiu de propósito. Criada também em runtime (catalogo-repo).
--

CREATE TABLE IF NOT EXISTS public.portal_seed_aplicado (
    chave text NOT NULL,
    aplicado_em timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT portal_seed_aplicado_pkey PRIMARY KEY (chave)
);


--
-- PostgreSQL database dump complete
--

\unrestrict sSSgAKgWKFjORXcoJczaJetF12gtpu71vVaXbcZvREnkFC9XknvzaX5I9kFw924

