-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.al · https://321.al
-- 044: motore di ILLI gestibile dal pannello admin. Salviamo in gamification_config
-- (stessa tabella dei limiti AI, gia' scrivibile dall'admin via RLS) una riga
-- "illi_engine" con { provider, model }. NON e' un segreto: e' solo la SCELTA di
-- quale motore usare. Le CHIAVI API restano nei segreti Deno.env dell'edge
-- (OPENAI_KEY, ANTHROPIC_KEY), mai qui. Default: OpenAI gpt-4o-mini (comportamento
-- storico). L'edge illi-chat legge questa riga e instrada al provider giusto,
-- ripiegando su OpenAI se il provider scelto non ha la chiave.

insert into public.gamification_config (key, value)
values ('illi_engine', '{"provider":"openai","model":"gpt-4o-mini"}'::jsonb)
on conflict (key) do nothing;
