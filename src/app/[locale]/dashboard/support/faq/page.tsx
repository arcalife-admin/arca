'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SUPPORT_REMOTE_SETUP_PATH } from '@/lib/support-config'

const faqItems = [
  {
    question: 'Cum contactez suportul tehnic?',
    answer:
      'Apasă butonul de suport (colț stânga jos) și trimite un mesaj pe WhatsApp.',
  },
  {
    question: 'Când primesc răspuns?',
    answer:
      'Verifică programul afișat în widget (NL / RO). Trimite mesajul pe WhatsApp cu o descriere și captură de ecran dacă e posibil.',
  },
  {
    question: 'Cum primesc ajutor la distanță?',
    answer:
      'Deschide AnyDesk, trimite ID-ul pe WhatsApp și rămâi la calculator. Detalii complete în ghidul de acces la distanță.',
  },
  {
    question: 'Ce fac dacă aplicația nu se încarcă?',
    answer:
      'Reîmprospătează pagina, încearcă alt browser (Chrome recomandat), verifică internetul. Dacă persistă, raportează problema din widget.',
  },
  {
    question: 'Unde găsesc instrucțiuni pentru pacienți?',
    answer: 'Meniul Instrucțiuni conține videoclipuri și imagini pentru tratamente.',
  },
]

export default function SupportFaqPage() {
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Panou principal
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          Întrebări frecvente — Suport
        </h1>
        <p className="text-muted-foreground mt-2">
          Răspunsuri rapide pentru personalul clinicii
        </p>
      </div>

      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ghid acces la distanță</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href={SUPPORT_REMOTE_SETUP_PATH}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Deschide ghidul
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
