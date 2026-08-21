-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Il modello di domanda per ragionare sui vantaggi di un livello.
-- La risposta deve tornare in righe leggibili dal programma, altrimenti il
-- pannello non puo mostrare l anteprima ne inserirle nella struttura.

insert into public.prompt_modelli (nome, fase, lingua, ordine, predefinito, descrizione, testo) values
('Vantaggi di un livello', 'altro', 'it', 10, false,
 'Propone vantaggi nuovi per un livello, gia scritti nelle tre lingue e pronti da inserire.',
$T$Sei chi progetta i livelli a pagamento di POI-LOVE, la mappa dei luoghi amati in Albania.

IL LIVELLO
Nome: {nome}
Prezzo: {prezzo}
A chi si rivolge: {descrizione}

VANTAGGI CHE HA GIA
{vantaggi}

REGOLE VERE GIA ATTIVE SU QUESTO LIVELLO
{regole}

COSA TI CHIEDO
{domanda}

COME DEVI RISPONDERE
Prima due righe di ragionamento in italiano, chiare e brevi: a chi parla questo
livello e cosa gli manca davvero.

Poi da tre a sei proposte, ognuna su una riga sola, in questo formato esatto:

VANTAGGIO | testo italiano | teksti shqip | english text | icona-phosphor | vero oppure promessa

Il testo e una riga sola, come si legge su una pagina di prezzi: corta,
concreta, in positivo, senza confronti con altri e senza negazioni.
L icona e un nome Phosphor senza il prefisso, per esempio star oppure headphones.
L ultima colonna dice "vero" se il vantaggio si puo far rispettare con un numero
o un interruttore che POI-LOVE ha gia (foto, video, secondi di voce, audioguide,
luoghi in evidenza, spunta, muro dei sostenitori, ascolto da lontano), e
"promessa" se invece e un impegno che va mantenuto a mano.
Niente trattini lunghi. Niente elenchi puntati dentro le righe.$T$)
on conflict do nothing;

notify pgrst, 'reload schema';
select id, nome, fase from public.prompt_modelli where fase = 'altro' order by id;
