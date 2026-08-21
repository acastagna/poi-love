-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Le connessioni AI, tutte in un posto.
-- Fino a oggi il motore di ILLI si sceglieva fra due nomi scritti nel codice, e
-- il copilota non si sceglieva affatto. Qui ogni fornitore ha la sua riga: come
-- si chiama, quanto costa, dove si prende la chiave, se e' acceso o spento.
-- Se ne aggiunge uno domani, si aggiunge una riga, non si tocca il codice.

create table if not exists public.ai_fornitori (
  chiave        text primary key,               -- openai, anthropic, google, groq...
  nome          text not null,
  modello       text not null,                  -- quello in uso adesso
  modelli       text[] not null default '{}',   -- fra quali si puo scegliere
  acceso        boolean not null default false, -- lo vuoi usare?
  ordine        int not null default 100,       -- chi si prova per primo
  prezzo_nota   text,                           -- il costo, in parole
  indirizzo_chiave text,                        -- dove si va a prenderla
  nome_segreto  text,                           -- come si chiama il segreto sul server
  fa_testo      boolean not null default true,
  fa_voce       boolean not null default false,
  note          text,
  aggiornato    timestamptz not null default now()
);

alter table public.ai_fornitori enable row level security;
drop policy if exists ai_forn_leggo on public.ai_fornitori;
create policy ai_forn_leggo on public.ai_fornitori for select using (public.sono_admin());
drop policy if exists ai_forn_admin on public.ai_fornitori;
create policy ai_forn_admin on public.ai_fornitori for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.ai_fornitori to authenticated;
grant all on public.ai_fornitori to service_role;

-- Il catalogo di partenza. I prezzi sono quelli letti il 21/08/2026: sono una
-- indicazione per scegliere, non un contratto, e vanno riguardati ogni tanto.
insert into public.ai_fornitori (chiave, nome, modello, modelli, acceso, ordine, prezzo_nota, indirizzo_chiave, nome_segreto, fa_testo, fa_voce, note) values
  ('openai','OpenAI','gpt-4o-mini',
   array['gpt-4o-mini','gpt-4.1-mini','gpt-4o'], true, 10,
   'gpt-4o-mini circa 0,15 e 0,60 dollari per milione di gettoni: fra i piu economici che scrivono bene',
   'https://platform.openai.com/api-keys','OPENAI_KEY', true, false,
   'Oggi e il motore di ILLI e del copilota.'),

  ('anthropic','Anthropic (Claude)','claude-3-5-haiku-latest',
   array['claude-3-5-haiku-latest','claude-sonnet-4-6'], false, 20,
   'Haiku circa 0,80 e 4 dollari per milione; Sonnet piu caro e piu bravo',
   'https://console.anthropic.com/settings/keys','ANTHROPIC_KEY', true, false,
   'E lo stesso fornitore dell abbonamento di Alessandro: la coda passa di li senza chiave.'),

  ('google','Google Gemini','gemini-2.5-flash',
   array['gemini-2.5-flash','gemini-2.5-flash-lite','gemini-2.5-pro'], false, 30,
   'Flash Lite e fra i piu economici in assoluto; Flash costa poco e ragiona bene',
   'https://aistudio.google.com/apikey','GOOGLE_AI_KEY', true, true,
   'La stessa chiave serve per la voce delle audioguide (POI-VOICE).'),

  ('groq','Groq','llama-3.3-70b-versatile',
   array['llama-3.3-70b-versatile','llama-3.1-8b-instant'], false, 40,
   'Ha un livello gratuito vero, ed e velocissimo: buono come riserva',
   'https://console.groq.com/keys','GROQ_KEY', true, false,
   'Era il motore di POI-LOVE fino a giugno.'),

  ('mistral','Mistral','mistral-small-latest',
   array['mistral-small-latest','mistral-large-latest'], false, 50,
   'Small circa 0,20 e 0,60 dollari per milione: economico, europeo',
   'https://console.mistral.ai/api-keys','MISTRAL_KEY', true, false,
   'Fornitore francese: i dati restano in Europa.'),

  ('deepseek','DeepSeek','deepseek-chat',
   array['deepseek-chat','deepseek-reasoner'], false, 60,
   'Fra i piu economici del mercato, circa dieci volte meno di OpenAI',
   'https://platform.deepseek.com/api_keys','DEEPSEEK_KEY', true, false,
   'Server in Cina: da valutare per i dati delle persone.'),

  ('openrouter','OpenRouter','openai/gpt-4o-mini',
   array['openai/gpt-4o-mini','anthropic/claude-3.5-haiku','google/gemini-2.5-flash','meta-llama/llama-3.3-70b-instruct'], false, 70,
   'Una chiave sola per decine di modelli, con un piccolo ricarico',
   'https://openrouter.ai/keys','OPENROUTER_KEY', true, false,
   'Comodo per provare un modello nuovo senza aprire un altro conto.')
on conflict (chiave) do nothing;

-- La coda: quando il pannello chiede una cosa all'AI e la fa fare a chi sta
-- girando sul Mac di Alessandro, invece che a una chiave a pagamento.
create table if not exists public.ai_coda (
  id          uuid primary key default gen_random_uuid(),
  chiesto_da  uuid references public.profiles(id) on delete set null,
  fase        text not null check (fase in ('ricerca','copione','voce','altro')),
  contesto    jsonb not null default '{}'::jsonb,   -- su quale luogo, quale tappa
  domanda     text not null,
  risposta    text,
  stato       text not null default 'in_attesa' check (stato in ('in_attesa','in_corso','fatta','fallita','annullata')),
  motivo      text,
  chiesto_il  timestamptz not null default now(),
  presa_il    timestamptz,
  finita_il   timestamptz
);
create index if not exists ai_coda_da_fare on public.ai_coda(stato, chiesto_il) where stato = 'in_attesa';

alter table public.ai_coda enable row level security;
drop policy if exists ai_coda_admin on public.ai_coda;
create policy ai_coda_admin on public.ai_coda for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.ai_coda to authenticated;
grant all on public.ai_coda to service_role;

notify pgrst, 'reload schema';
