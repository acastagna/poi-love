-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I MODELLI, RIMESSI SUL PIU' ECONOMICO DI OGNI MARCA.
--
-- Ordine di Alessandro del 29/08/2026: ogni marca deve partire dal suo modello
-- piu' economico, e dal pannello si deve poter scegliere anche il modello, non
-- solo la marca. La scelta della marca c'era gia'; qui si rifa' l'elenco fra
-- cui scegliere, perche' era fermo ai modelli di giugno.
--
-- I prezzi sono letti dai listini ufficiali il 29/08/2026, in dollari per
-- milione di gettoni. Sono una indicazione per scegliere, non un contratto.
-- Groq e xAI non hanno prezzo scritto: il loro listino cambia spesso e non
-- l'ho misurato, quindi si guarda sul loro sito invece di scrivere un numero
-- che poi resta li' e mente.
--
-- Il primo nome dentro `modelli` e' sempre il piu' economico ed e' quello che
-- finisce in `modello`. Chi vuole spendere di piu' per avere di piu' scende
-- nella fila, dal pannello.

update public.ai_fornitori set
  modello = 'gpt-5-nano',
  modelli = array['gpt-5-nano','gpt-5.6-luna','gpt-5.4-nano','gpt-4o-mini'],
  prezzo_nota = 'gpt-5-nano 0,05 e 0,40 dollari per milione di gettoni: il piu economico in circolazione',
  aggiornato = now()
 where chiave = 'openai';

update public.ai_fornitori set
  modello = 'claude-haiku-4-5',
  modelli = array['claude-haiku-4-5','claude-sonnet-5','claude-opus-5','claude-fable-5'],
  prezzo_nota = 'Haiku 4.5 1 e 5 dollari per milione; Sonnet 5 costa il doppio e ragiona di piu',
  aggiornato = now()
 where chiave = 'anthropic';

update public.ai_fornitori set
  modello = 'gemini-2.5-flash-lite',
  modelli = array['gemini-2.5-flash-lite','gemini-3.1-flash-lite','gemini-2.5-flash','gemini-2.5-pro'],
  prezzo_nota = 'Flash Lite 2.5 0,10 e 0,40 dollari per milione: il piu economico di Google',
  aggiornato = now()
 where chiave = 'google';

update public.ai_fornitori set
  modello = 'llama-3.1-8b-instant',
  modelli = array['llama-3.1-8b-instant','llama-3.3-70b-versatile','openai/gpt-oss-20b'],
  prezzo_nota = 'ha un livello gratuito vero ed e velocissimo: il prezzo si guarda su groq.com',
  aggiornato = now()
 where chiave = 'groq';

update public.ai_fornitori set
  modello = 'ministral-3b-latest',
  modelli = array['ministral-3b-latest','mistral-small-latest','mistral-large-latest'],
  prezzo_nota = 'Ministral 3B 0,10 dollari per milione in entrata e in uscita: europeo ed economico',
  aggiornato = now()
 where chiave = 'mistral';

-- I nomi deepseek-chat e deepseek-reasoner sono di una generazione fa: oggi il
-- loro listino porta v4-flash e v4-pro.
update public.ai_fornitori set
  modello = 'deepseek-v4-flash',
  modelli = array['deepseek-v4-flash','deepseek-v4-pro'],
  prezzo_nota = 'V4 Flash 0,22 e 0,66 dollari per milione, e fuori dalle ore di punta costa la meta',
  aggiornato = now()
 where chiave = 'deepseek';

update public.ai_fornitori set
  modello = 'openai/gpt-5-nano',
  modelli = array['openai/gpt-5-nano','google/gemini-2.5-flash-lite','anthropic/claude-haiku-4.5','meta-llama/llama-3.3-70b-instruct'],
  prezzo_nota = 'una chiave sola per decine di modelli, col listino di ognuno piu un piccolo ricarico',
  aggiornato = now()
 where chiave = 'openrouter';

-- La voce delle audioguide. Il Pro recita meglio, ma costa di piu e la
-- differenza si sente solo su testi lunghi: si parte dal Flash e si sale se
-- serve, dalla tendina nel pannello delle voci.
update public.voce_impostazioni set
  modello = 'gemini-2.5-flash-preview-tts',
  aggiornato = now()
 where id = 1 and modello in ('gemini-2.5-pro-tts', 'gemini-2.5-pro-preview-tts');
