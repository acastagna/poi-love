-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I vantaggi dei livelli: un catalogo, e la verita su cosa fanno davvero.
--
-- Un vantaggio scritto in una pagina puo essere due cose molto diverse:
--   - una REGOLA vera, legata a una colonna che l'app fa rispettare;
--   - una PROMESSA, cioe una frase che descrive qualcosa che facciamo a mano.
-- Confonderle e il modo piu veloce per vendere una cosa che non esiste. Qui
-- ogni voce dice quale delle due e.

create table if not exists public.vantaggi_preset (
  chiave     text primary key,
  nome       text not null,          -- come si chiama qui dentro
  testo_it   text not null,          -- come si legge nella pagina
  testo_sq   text,
  testo_en   text,
  icona      text not null default 'ph-check-circle',
  gruppo     text not null,          -- per raggrupparli nella scelta
  colonna    text,                   -- la colonna di `livelli` che lo fa rispettare
  tipo       text not null check (tipo in ('regola','promessa')),
  cosa_fa    text not null,          -- in parole normali: cosa succede davvero
  ordine     int not null default 100
);
alter table public.vantaggi_preset enable row level security;
drop policy if exists preset_leggo on public.vantaggi_preset;
create policy preset_leggo on public.vantaggi_preset for select using (public.sono_admin());
drop policy if exists preset_admin on public.vantaggi_preset;
create policy preset_admin on public.vantaggi_preset for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.vantaggi_preset to authenticated;
grant all on public.vantaggi_preset to service_role;

insert into public.vantaggi_preset (chiave, nome, testo_it, testo_sq, testo_en, icona, gruppo, colonna, tipo, cosa_fa, ordine) values

-- ── Quelle vere: una colonna le fa rispettare ──
('foto','Foto per luogo','Fino a {n} foto su ogni luogo','Deri ne {n} foto per cdo vend','Up to {n} photos on every place',
 'ph-images','Quanto puoi caricare','foto_max','regola',
 'Il server rifiuta la foto in piu. Il numero e quello della colonna foto_max.',10),

('video','Video sul luogo','Video sul tuo luogo, fino a {n}','Video mbi vendin tend, deri ne {n}','Video on your place, up to {n}',
 'ph-video','Quanto puoi caricare','video_max','regola',
 'Sopra il numero, il caricamento del video viene rifiutato. Colonna video_max.',20),

('video_durata','Durata del video','Video lunghi fino a {n} secondi','Video deri ne {n} sekonda','Videos up to {n} seconds',
 'ph-timer','Quanto puoi caricare','video_secondi','regola',
 'Un video piu lungo viene rifiutato prima di essere convertito. Colonna video_secondi.',30),

('voce','La tua voce sul luogo','La tua voce sul luogo, fino a {n} secondi','Zeri yt mbi vendin, deri ne {n} sekonda','Your voice on the place, up to {n} seconds',
 'ph-microphone','Quanto puoi caricare','audio_secondi','regola',
 'Il database rifiuta un audio piu lungo. Colonna audio_secondi. A zero, la voce non si puo mettere.',40),

('audioguide','Audioguide POI-VOICE','{n} audioguide sui tuoi luoghi','{n} audioguida mbi vendet e tua','{n} audio guides on your places',
 'ph-headphones','Quanto puoi caricare','audioguide_max','regola',
 'Quante audioguide spettano. A zero non se ne fanno.',50),

('evid_luoghi','Luoghi in evidenza','Metti in evidenza {n} luoghi','Vendos ne pah {n} vende','Feature {n} places',
 'ph-star','Come ti fai vedere','evidenze_luoghi','regola',
 'Oltre il numero, l app non lascia mettere altro in evidenza. Colonna evidenze_luoghi.',60),

('evid_itin','Itinerari in evidenza','Metti in evidenza {n} itinerari','Vendos ne pah {n} itinerare','Feature {n} itineraries',
 'ph-path','Come ti fai vedere','evidenze_itinerari','regola',
 'Come sopra, per gli itinerari.',70),

('ascolto','Audioguide da lontano','Ascolti le audioguide anche da lontano','Degjon audioguidat edhe nga larg','Listen to the audio guides from anywhere',
 'ph-broadcast','Cosa puoi fare','ascolta_audioguide','regola',
 'Senza questo si sentono solo stando vicini al luogo. Colonna ascolta_audioguide.',80),

('muro','Muro dei Sostenitori','Il tuo nome sul Muro dei Sostenitori','Emri yt ne Murin e Mbeshtetesve','Your name on the Supporters Wall',
 'ph-hand-heart','Come ti fai vedere','muro','regola',
 'Compari nella pagina del Muro. Colonna muro.',90),

('spunta','La spunta','La spunta accanto al tuo nome','Shenja prane emrit tend','The check mark next to your name',
 'ph-seal-check','Come ti fai vedere','spunta','regola',
 'Il segno di riconoscimento accanto al nome, ovunque compaia. Colonna spunta.',100),

-- ── Quelle che sono promesse: le manteniamo a mano ──
('qr_business','QR per la vetrina','Il codice QR della tua attivita, pronto da stampare','Kodi QR i aktivitetit tend, gati per shtyp','Your business QR code, ready to print',
 'ph-qr-code','Cosa puoi fare',null,'promessa',
 'Il QR si genera gia per tutti: qui e una promessa di assistenza, non una regola che qualcuno fa rispettare.',110),

('assistenza','Assistenza diretta','Ti rispondiamo noi, non un modulo','Te pergjigjemi ne, jo nje formular','A person answers you, not a form',
 'ph-chat-circle-text','Come ti trattiamo',null,'promessa',
 'Nessuna colonna la fa rispettare: e un impegno che prendiamo e che va mantenuto a mano.',120),

('prima_fila','Prima fila sulle novita','Provi le cose nuove prima degli altri','I provon gjerat e reja para te tjereve','You try the new things first',
 'ph-flag-banner','Come ti trattiamo',null,'promessa',
 'Promessa. Perche sia vera serve ricordarsi di avvisarli davvero.',130),

('dedica','La dedica sulla rotta','Adotti una rotta storica e la dedichi a chi vuoi','Adopton nje rrugetim historik dhe ia dedikon kujt te duash','Adopt a historic route and dedicate it',
 'ph-hand-heart','Come ti fai vedere',null,'promessa',
 'La funzione esiste nell app, ma nessuna colonna la lega al livello: oggi la si concede a mano.',140),

('nome_itinerario','Il tuo nome su un itinerario','Un itinerario culturale porta il tuo nome','Nje itinerar kulturor mban emrin tend','A cultural route carries your name',
 'ph-signature','Come ti fai vedere',null,'promessa',
 'Promessa forte: va onorata scegliendo davvero un itinerario e mettendoci il nome.',150),

('quindici','I quindici luoghi in omaggio','Quindici luoghi che scegli tu, fatti da noi','Pesembedhjete vende qe i zgjedh ti, te bera nga ne','Fifteen places you choose, made by us',
 'ph-gift','Cosa ricevi',null,'promessa',
 'Impegno di lavoro nostro. Va contato, altrimenti si promette piu di quanto si puo fare.',160)

on conflict (chiave) do nothing;

notify pgrst, 'reload schema';
select tipo, count(*) from public.vantaggi_preset group by tipo;
