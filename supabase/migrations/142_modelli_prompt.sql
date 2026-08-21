-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- I modelli di prompt.
-- Le tre fasi delle audioguide (cercare, scrivere il copione, dare la voce)
-- partono da una domanda scritta bene. Quelle domande le scrive Alessandro, ne
-- tiene quante ne vuole, e le richiama con un nome. Nel codice non ne resta
-- nessuna: qui sono dati.

create table if not exists public.prompt_modelli (
  id          serial primary key,
  nome        text not null,
  fase        text not null check (fase in ('ricerca','copione','voce','altro')),
  lingua      text not null default 'it' check (lingua in ('it','sq','en','tutte')),
  testo       text not null,
  descrizione text,
  ordine      int  not null default 100,
  predefinito boolean not null default false,   -- quello che si propone per primo
  attivo      boolean not null default true,
  usato       int  not null default 0,          -- quante volte e' stato usato
  creato      timestamptz not null default now(),
  aggiornato  timestamptz not null default now()
);
create index if not exists prompt_modelli_fase on public.prompt_modelli(fase, ordine) where attivo;
-- Un solo predefinito per fase e lingua: altrimenti non si sa quale parte.
create unique index if not exists prompt_modelli_uno_predefinito
  on public.prompt_modelli(fase, lingua) where predefinito;

alter table public.prompt_modelli enable row level security;
drop policy if exists prompt_admin on public.prompt_modelli;
create policy prompt_admin on public.prompt_modelli for all
  using (public.sono_admin()) with check (public.sono_admin());
grant select, insert, update, delete on public.prompt_modelli to authenticated;
grant usage, select on sequence prompt_modelli_id_seq to authenticated;
grant all on public.prompt_modelli to service_role;

-- ── I primi modelli, da cui partire ────────────────────────────────────────
-- Sono una proposta, non un muro: si cambiano e se ne aggiungono quanti si vuole.
-- Le parole fra graffe le sostituisce il pannello con quelle del luogo vero.
insert into public.prompt_modelli (nome, fase, lingua, ordine, predefinito, descrizione, testo) values

('Storia del luogo', 'ricerca', 'tutte', 10, true,
 'La domanda di partenza: che cosa e questo posto e che cosa gli e successo',
$$Parlami di {luogo}, a {citta}, in Albania (coordinate {lat}, {lng}).

Voglio sapere:
- che cos'e' esattamente, e da quando;
- chi lo ha costruito o fondato, e perche';
- che cosa gli e' successo nei secoli: chi ci e' passato, che cosa e' cambiato;
- che cosa se ne vede oggi, e che cosa invece non c'e' piu'.

Dimmi solo cose che risultano da fonti, e per ognuna dimmi da dove viene.
Se una cosa e' incerta o contesa, dillo invece di sceglierne una.
Se di questo luogo non si sa quasi niente, dimmelo subito: e' un'informazione utile.$$),

('Chi ci e passato', 'ricerca', 'tutte', 20, false,
 'Le persone: chi ci ha vissuto, chi ci e passato, chi lo ha raccontato',
$$Su {luogo}, a {citta}: chi sono le persone legate a questo posto?

Cerco:
- chi ci ha vissuto o lavorato, e in che epoca;
- chi ci e' passato lasciando traccia scritta;
- chi lo ha dipinto, fotografato, raccontato in un libro;
- se c'e' una figura del posto che la gente del luogo associa a questo posto.

Nomi veri, con la fonte. Se non ci sono persone note, dillo: un luogo puo'
essere importante senza avere nomi famosi attaccati.$$),

('Cosa si vede oggi', 'ricerca', 'tutte', 30, false,
 'Il presente: che cosa trova chi ci arriva adesso',
$$Descrivi che cosa vede oggi una persona che arriva a {luogo}, a {citta}.

- che cosa si vede appena arrivati, e in che stato e';
- che cosa si puo' visitare e che cosa no;
- quanto ci vuole a girarlo;
- che cosa si vede da li' intorno.

Solo cose verificabili. Se le informazioni che trovi sono vecchie, dimmi di
quando sono: un luogo puo' essere cambiato o chiuso.$$),

('L aneddoto che nessuno racconta', 'ricerca', 'tutte', 40, false,
 'La cosa che rende un racconto diverso da una scheda',
$$Su {luogo}, a {citta}: cerco l'episodio che di solito non si racconta.

Non il riassunto da guida turistica, ma:
- un fatto preciso, con una data o un nome;
- una storia locale, anche minore, purche' documentata;
- un dettaglio che si vede ancora e che ha una spiegazione.

Una cosa sola, raccontata bene, vale piu' di dieci accennate.
Se e' una leggenda e non un fatto, dimmelo chiaramente: si puo' raccontare
lo stesso, ma dicendo che e' una leggenda.$$),

('Perche merita la sosta', 'ricerca', 'tutte', 50, false,
 'Il motivo per cui questo posto sta dentro un itinerario',
$${luogo}, a {citta}, e' una tappa di un itinerario culturale di POI-LOVE
dedicato a: {tema}.

Dimmi in poche righe perche' questo posto merita la sosta dentro QUESTO
itinerario, e che cosa lega questo posto al tema. Se il legame e' debole,
dimmelo: e' meglio togliere una tappa che raccontarla male.$$),

('Le fonti', 'ricerca', 'tutte', 60, false,
 'Dove si e letto quello che si e detto',
$$Per {luogo}, a {citta}: elencami le fonti su cui ti sei basato.

Per ognuna: che cos'e' (voce enciclopedica, libro, sito ufficiale, archivio),
l'indirizzo se e' in rete, e quanto e' affidabile secondo te.
Se una cosa che mi hai detto non ha una fonte, dimmi quale.$$),

('Copione POI-VOICE', 'copione', 'tutte', 10, true,
 'Dal materiale della ricerca al racconto da ascoltare',
$$Scrivi il copione di una audioguida per {luogo}, a {citta}.

Chi ascolta e' FERMO DAVANTI AL LUOGO, col telefono in mano e gli occhi sul
posto. Non sta leggendo: sta guardando. Scrivi per l'orecchio, non per la pagina.

Durata: {durata} secondi, cioe' circa {parole} parole. Rispetta la misura.
Lingua: {lingua}. Scrivi direttamente in quella lingua, non tradurre da un'altra.

Come deve essere fatto:
- si apre con qualcosa che si VEDE da li', non con una data;
- un solo fatto che resta in testa, non un elenco di anni;
- niente parole da depliant: "suggestivo", "incantevole", "gioiello", "perla";
- niente numeri in cifra: si scrivono in lettere, perche' vanno letti ad alta voce;
- frasi corte. Chi legge ad alta voce deve poter respirare;
- si chiude con una riga che fa alzare gli occhi dal telefono.

Usa solo il materiale che ti do qui sotto. Se manca qualcosa per fare un buon
racconto, scrivi il copione con quello che c'e' e dimmi alla fine che cosa
avresti voluto sapere.

MATERIALE:
{materiale}$$),

('Regia della voce', 'voce', 'tutte', 10, true,
 'Come deve recitare: e il campo separato dal testo',
$$Racconta con la calma di chi conosce questo posto da sempre e lo sta
mostrando a una persona sola.

Ritmo lento ma non solenne. Pause vere fra le frasi, come si fa parlando.
Nessuna enfasi da documentario, nessun tono da annuncio. Se c'e' un nome di
persona o di luogo, pronuncialo con cura e senza affrettarlo.
Chi ascolta e' in piedi davanti alla cosa che stai descrivendo: parlagli come
se fossi accanto a lui, non come se leggessi.$$)

on conflict do nothing;

notify pgrst, 'reload schema';
select fase, count(*) as quanti, count(*) filter (where predefinito) as predefiniti
  from public.prompt_modelli group by fase order by fase;
