-- © Alessandro Castagna — 321.al / EVOLAB
-- Tutti i diritti riservati. Uso non autorizzato vietato.
-- info@321.it · https://321.al
--
-- La durata non si ordina: esce dal testo.
--
-- Nel pannello c erano tre caselle (luoghi famosi 360 secondi, medi 180,
-- normali 60) e il modello di domanda diceva "Durata: circa N secondi, cioe
-- circa M parole". Cioe la lunghezza si imponeva prima di scrivere, e questo
-- e l opposto di come deve funzionare: si scrive quello che il luogo merita,
-- si legge quanto dura, e da li si accorcia o si allunga.
--
-- Delle tre caselle, poi, una non la leggeva nessuno: "luoghi famosi" si
-- salvava e non entrava in nessuna domanda.

update public.prompt_modelli
   set testo = replace(testo,
'Durata: circa {durata} secondi, cioe'' circa {parole} parole in tutto.
Lingua: {lingua}. Scrivi direttamente in quella lingua, non tradurre da un''altra.',
'Quanto deve essere lungo: quello che il luogo merita, non un numero deciso
prima. Se il materiale racconta poco, il copione e corto e va benissimo. Se il
posto ha secoli di storia vera, prenditi lo spazio. Non allungare mai con frasi
di riempimento per arrivare a una durata: si sente subito, e chi ascolta se ne va.
Lingua: {lingua}. Scrivi direttamente in quella lingua, non tradurre da un''altra.')
 where fase = 'copione' and predefinito;

select nome, (testo like '%{durata}%') as impone_ancora_la_durata,
       (testo like '%quello che il luogo merita%') as decide_dal_materiale
  from public.prompt_modelli where fase = 'copione';
