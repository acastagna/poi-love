/**
 * © Alessandro Castagna — 321.al / EVOLAB
 * Tutti i diritti riservati. Uso non autorizzato vietato.
 * info@321.al · https://321.al
 *
 * Mail Builder POI•LOVE = involucro sottile sul MOTORE UNICO EvolabBuilder
 * (js/evolab-builder.js, sorgente canonica in • EvoLab/evolab-builder/).
 * Qui vive SOLO l'adattamento POI•LOVE: immagini via Media Manager, salvataggio
 * in email_templates (subject, body_html, body_text, design). Le migliorie al
 * builder si fanno nel motore unico e valgono per tutte le installazioni.
 */
(function () {
  function sb() { return window.sb || null; }
  function toast(m, k) { if (window.toast) window.toast(m, k); }

  function open(tpl) {
    tpl = tpl || {};
    if (!window.EvolabBuilder) { toast('Builder non caricato', 'err'); return; }
    EvolabBuilder.openModal({
      mode: 'email',
      title: 'Mail Builder',
      saveLabel: 'Salva il modello',
      doc: tpl.design || null,
      brand: { accent: '#D42B2B', footer: 'Ingegnerizzazione di Alessandro Castagna · 321.AL / EVOLAB • Tirana', name: 'POI•LOVE', linkBase: 'https://poilove.com/' },
      placeholders: '{{nome}} {{email}} {{link}}',
      pickImage: function (cb) { if (window.POIMedia && window.POIMedia.pick) window.POIMedia.pick({ kind: 'og', onPick: cb }); else cb(null); },
      headFields: [
        { key: 'key', label: 'chiave (es. benvenuto)', value: tpl.key || '', width: '150px' },
        { key: 'subject', label: 'Oggetto della mail', value: tpl.subject || '' },
        { key: 'lang', type: 'select', options: [['it', 'it'], ['sq', 'sq'], ['en', 'en']], value: tpl.lang || 'it' },
        { key: 'kind', type: 'select', options: [['send', 'Da inviare'], ['auto', 'Automatica'], ['invite', 'Invito']], value: tpl.kind || 'send' }
      ],
      onSave: function (doc, html, text, vals) {
        var db = sb(); if (!db) return false;
        var key = (vals.key || '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
        if (!key) { toast('Dai una chiave al modello (es. benvenuto)', 'err'); return false; }
        var rec = {
          key: key, lang: vals.lang, kind: vals.kind,
          subject: (vals.subject || '').trim() || key,
          body_html: html, body_text: text + '\n\nPOI•LOVE\nIngegnerizzazione di Alessandro Castagna · 321.AL / EVOLAB • Tirana',
          design: doc, active: true, updated_at: new Date().toISOString()
        };
        var q = tpl.id ? db.from('email_templates').update(rec).eq('id', tpl.id).select('id')
                       : db.from('email_templates').insert(rec).select('id');
        return q.then(function (r) {
          if (r.error || !r.data || !r.data.length) { toast((r.error && r.error.message) || 'Salvataggio non riuscito', 'err'); return false; }
          toast('Modello salvato', 'ok');
          if (window.logAudit) window.logAudit('email_template_builder', 'email_template', key, {});
          if (window.renderMediaEmail) window.renderMediaEmail();
          return true;
        });
      }
    });
  }

  window.MailBuilder = { open: open };
})();
