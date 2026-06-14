import Link from 'next/link'

export const metadata = {
  title: 'Politica de confidențialitate — ArcaLife',
  description: 'Informații privind prelucrarea datelor personale în platforma ArcaLife',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto prose prose-gray">
        <h1>Politica de confidențialitate</h1>
        <p className="text-sm text-gray-500">Ultima actualizare: iunie 2026</p>

        <h2>1. Cine suntem</h2>
        <p>
          ArcaLife este o platformă de management pentru clinici medicale (chirurgie plastică și
          estetică). În relația cu datele pacienților, clinica dumneavoastră este{' '}
          <strong>operatorul de date</strong>, iar ArcaLife acționează ca{' '}
          <strong>persoană împuternicită</strong> (procesor) în baza unui acord de prelucrare a
          datelor (DPA).
        </p>

        <h2>2. Ce date prelucrăm</h2>
        <ul>
          <li>Date de identificare: nume, data nașterii, CNP, adresă, telefon, e-mail</li>
          <li>Date de sănătate: istoric medical, istoric chirurgical, evaluări clinice</li>
          <li>Imagini clinice: fotografii înainte/după, documente medicale</li>
          <li>Date operaționale: programări, note clinice, consimțăminte</li>
        </ul>

        <h2>3. Temeiul legal</h2>
        <p>
          Datele sunt prelucrate în baza contractului cu clinica, consimțământului explicit pentru
          datele de sănătate (Art. 9 GDPR) și interesului legitim pentru securitate și audit.
        </p>

        <h2>4. Destinatarii datelor</h2>
        <p>Datele sunt accesibile personalului autorizat al clinicii. Subprocesorii ArcaLife:</p>
        <ul>
          <li>Vercel — găzduire aplicație</li>
          <li>Supabase — bază de date PostgreSQL</li>
          <li>Cloudinary — stocare media clinică (acces autentificat, URL-uri semnate)</li>
          <li>Sentry (opțional) — monitorizare erori (date sanitizate)</li>
        </ul>

        <h2>5. Perioada de stocare</h2>
        <p>
          Datele sunt păstrate conform politicii clinicii și legislației aplicabile. Perioadele
          implicite sunt documentate în politica de retenție ArcaLife.
        </p>

        <h2>6. Drepturile dumneavoastră</h2>
        <p>Conform GDPR, aveți dreptul la:</p>
        <ul>
          <li>Acces la date (Art. 15)</li>
          <li>Rectificare (Art. 16)</li>
          <li>Ștergere (Art. 17)</li>
          <li>Restricționare a prelucrării (Art. 18)</li>
          <li>Portabilitate (Art. 20)</li>
          <li>Opoziție (Art. 21)</li>
        </ul>
        <p>
          Pentru exercitarea drepturilor, contactați clinica la care sunteți înregistrat ca pacient.
          Clinica poate solicita asistență tehnică ArcaLife pentru exportul sau ștergerea datelor.
        </p>

        <h2>7. Securitatea datelor</h2>
        <p>
          ArcaLife implementează controale de securitate aliniate cu SOC 2 și GDPR: autentificare,
          control acces bazat pe roluri, izolare multi-tenant, criptare în tranzit, media clinică
          protejată prin URL-uri semnate, autentificare multi-factor pentru rolurile privilegiate.
        </p>
        <p>
          Detalii tehnice:{' '}
          <a href="https://github.com/arcalife/arca/blob/main/docs/security/compliance-status.md">
            documentația de conformitate
          </a>
          .
        </p>

        <h2>8. Autoritatea de supraveghere</h2>
        <p>
          Aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a
          Prelucrării Datelor cu Caracter Personal (ANSPDCP):{' '}
          <a href="https://www.dataprotection.ro">www.dataprotection.ro</a>.
        </p>

        <h2>9. Contact</h2>
        <p>
          Pentru întrebări privind prelucrarea datelor în ArcaLife:{' '}
          <a href="mailto:security@arcalife.ro">security@arcalife.ro</a>
        </p>

        <p className="mt-8">
          <Link href="/login" className="text-red-500 hover:text-red-600">
            ← Înapoi la autentificare
          </Link>
        </p>
      </article>
    </div>
  )
}
