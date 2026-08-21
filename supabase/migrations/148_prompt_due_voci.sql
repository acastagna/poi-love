-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- Due cambi ai modelli di prompt, decisi il 21/08/2026.
--
-- 1. Il copione non e' piu' un monologo: e' un DIALOGO a due voci, nel formato
--    che Google vuole per far parlare due persone (Speaker 1: / Speaker 2:).
--    E' anche il motivo per cui servono una voce femminile e una maschile:
--    sono i due che parlano, non due opzioni fra cui scegliere.
--
-- 2. Nasce la ricerca libera dei luoghi: si scrive cosa si cerca, l'AI propone
--    da tre a sei luoghi veri con la spiegazione, e se ne spunta uno. La
--    risposta ha un formato fisso perche' il pannello la sappia leggere.

insert into public.prompt_modelli (nome, fase, lingua, ordine, predefinito, descrizione, testo) values
('Trova luoghi', 'altro', 'tutte', 10, true,
 'Ricerca libera: propone luoghi con la spiegazione, si spunta quello giusto',
$$Sto cercando luoghi in Albania per farne una audioguida. La mia richiesta e':

{richiesta}

Proponimi da tre a sei luoghi VERI che rispondono a questa richiesta.
Solo luoghi che esistono davvero e che si possono visitare.

Rispondi in questo formato esatto, una riga per luogo, niente altro:

LUOGO | nome del luogo | citta o zona | una riga che spiega perche' merita

Esempio:
LUOGO | Kalaja e Beratit | Berat | Un castello del tredicesimo secolo dove la gente abita ancora dentro le mura.

Se un luogo che proponi e' poco noto, dillo dentro la spiegazione.
Se non trovi niente che risponda davvero alla richiesta, scrivi una riga sola:
NIENTE | non ho trovato luoghi che rispondano a questa richiesta$$)
on conflict do nothing;

update public.prompt_modelli set testo = $$Scrivi il copione di una audioguida per {luogo}, a {citta}.

E' un DIALOGO FRA DUE VOCI, non un monologo. Una voce femminile e una maschile
che si raccontano il posto a vicenda, come due persone che lo conoscono e lo
stanno mostrando a chi ascolta.

Formato obbligatorio, una battuta per riga, niente altro:

Speaker 1: la battuta della prima voce
Speaker 2: la battuta della seconda voce
Speaker 1: ...

Chi ascolta e' FERMO DAVANTI AL LUOGO, col telefono in mano e gli occhi sul
posto. Non sta leggendo: sta guardando. Scrivi per l'orecchio.

Durata: circa {durata} secondi, cioe' circa {parole} parole in tutto.
Lingua: {lingua}. Scrivi direttamente in quella lingua, non tradurre da un'altra.

Come deve essere fatto:
- si apre con qualcosa che si VEDE da li', non con una data;
- le due voci non si ripetono: una porta il fatto, l'altra la reazione o il dettaglio;
- battute corte, come si parla davvero. Nessuna delle due fa conferenze;
- un solo fatto che resta in testa, non un elenco di anni;
- niente parole da depliant: "suggestivo", "incantevole", "gioiello", "perla";
- niente numeri in cifra: si scrivono in lettere, perche' vanno letti ad alta voce;
- si chiude con una riga che fa alzare gli occhi dal telefono.

Usa solo il materiale che ti do qui sotto. Se manca qualcosa per fare un buon
racconto, scrivi il copione con quello che c'e' e dimmi alla fine, dopo una riga
vuota e la parola NOTA, che cosa avresti voluto sapere.

MATERIALE:
{materiale}$$
where fase = 'copione' and nome = 'Copione POI-VOICE';

-- Accorciare e allungare: si chiede di rifare lo stesso copione piu' corto o
-- piu' lungo di una percentuale, senza perdere quello che conta.
insert into public.prompt_modelli (nome, fase, lingua, ordine, predefinito, descrizione, testo) values
('Rifai piu corto o piu lungo', 'copione', 'tutte', 20, false,
 'Stesso copione, {segno}{percento} per cento di parole',
$$Questo e' un copione di audioguida gia' scritto. Rifallo {verso} del {percento}
per cento, mantenendo il formato a due voci (Speaker 1: / Speaker 2:).

{istruzione}

Non aggiungere fatti nuovi che non siano gia' nel copione o nel materiale.
Non cambiare la lingua. Non cambiare chi parla per primo.

COPIONE ATTUALE:
{copione}$$)
on conflict do nothing;

notify pgrst, 'reload schema';
