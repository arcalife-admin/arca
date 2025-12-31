import { NextRequest } from 'next/server'

// Medical terminology and their variations
const MEDICAL_TERMS = {
  extractie: ['extractie', 'extracties', 'trekken', 'getrokken', 'verwijderen', 'verwijderd', 'verwijdering', 'chirurgie', 'operatie', 'ingreep'],
  contra: ['contra', 'contra-indicatie', 'contraindicatie', 'niet gebruiken', 'niet toedienen', 'niet geven', 'vermijden', 'vermijd', 'verboden'],
  bloed: ['bloed', 'bloeding', 'bloedverlies', 'hemorragie', 'stolling', 'antistolling', 'trombose'],
  tand: ['tand', 'tanden', 'kies', 'kiezen', 'element', 'elementen', 'mond', 'orale'],
  medicatie: ['medicijn', 'medicatie', 'geneesmiddel', 'geneesmiddelen', 'preparaat', 'preparaten', 'dosis', 'dosering']
}

function findRelevantSections(text: string, question: string): string[] {
  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/)

  // Find sentences that contain medical terms related to the question
  const relevantSentences = sentences.filter(sentence => {
    const lowerSentence = sentence.toLowerCase()
    const lowerQuestion = question.toLowerCase()

    // Check if sentence contains terms from the question
    const questionTerms = lowerQuestion.split(/\s+/)
    const hasQuestionTerms = questionTerms.some(term =>
      term.length > 3 && lowerSentence.includes(term)
    )

    // Check for medical terms
    const hasMedicalTerms = Object.values(MEDICAL_TERMS).some(terms =>
      terms.some(term => lowerSentence.includes(term))
    )

    return hasQuestionTerms || hasMedicalTerms
  })

  return relevantSentences
}

function analyzeMedicalText(text: string, question: string) {
  // Find relevant sections
  const relevantSentences = findRelevantSections(text, question)

  // Determine question type
  const lowerQuestion = question.toLowerCase()
  const isSafetyQuestion = lowerQuestion.includes('mag') ||
    lowerQuestion.includes('veilig') ||
    lowerQuestion.includes('contra') ||
    lowerQuestion.includes('risico')

  const isInfoQuestion = lowerQuestion.includes('wat') ||
    lowerQuestion.includes('doet') ||
    lowerQuestion.includes('werking') ||
    lowerQuestion.includes('effect') ||
    lowerQuestion.includes('gebruik')

  if (isSafetyQuestion) {
    // Find sentences that explicitly mention contraindications
    const contraindicationSentences = relevantSentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return MEDICAL_TERMS.contra.some(term => lowerSentence.includes(term)) ||
        (lowerSentence.includes('bloed') &&
          (lowerSentence.includes('risico') ||
            lowerSentence.includes('gevaar') ||
            lowerSentence.includes('waarschuwing')))
    })

    return {
      type: 'safety',
      assessment: contraindicationSentences.length > 0 ?
        '❌ NEE, dit is NIET veilig.' :
        '✅ JA, dit is veilig.',
      contraindicationSentences
    }
  } else if (isInfoQuestion) {
    // Find sentences that describe the medication's action
    const infoSentences = relevantSentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase()
      return lowerSentence.includes('werking') ||
        lowerSentence.includes('effect') ||
        lowerSentence.includes('doet') ||
        lowerSentence.includes('veroorzaakt') ||
        lowerSentence.includes('remt') ||
        lowerSentence.includes('stimuleert')
    })

    return {
      type: 'info',
      infoSentences: infoSentences.length > 0 ? infoSentences : relevantSentences.slice(0, 2)
    }
  } else {
    // Default to showing relevant information
    return {
      type: 'info',
      infoSentences: relevantSentences.slice(0, 2)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url, question } = await req.json()

    // Fetch the webpage content
    const response = await fetch(url)
    const html = await response.text()

    // Extract text and clean it
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      // Remove navigation and menu items
      .replace(/Farmacotherapeutisch Kompas.*?Inhoudsopgave/g, '')
      .replace(/U bevindt zich hier:.*?Inhoudsopgave/g, '')
      .replace(/Geneesmiddel.*?Inhoudsopgave/g, '')
      .replace(/Samenstelling.*?Inhoudsopgave/g, '')
      .replace(/Advies.*?Inhoudsopgave/g, '')
      .replace(/Indicaties.*?Inhoudsopgave/g, '')
      .replace(/Doseringen.*?Inhoudsopgave/g, '')
      .replace(/Bijwerkingen.*?Inhoudsopgave/g, '')
      .replace(/Interacties.*?Inhoudsopgave/g, '')
      .replace(/Zwangerschap.*?Inhoudsopgave/g, '')
      .replace(/Lactatie.*?Inhoudsopgave/g, '')
      .replace(/Contra-indicaties.*?Inhoudsopgave/g, '')
      .replace(/Waarschuwingen.*?Inhoudsopgave/g, '')
      .replace(/Overdosering.*?Inhoudsopgave/g, '')
      .replace(/Eigenschappen.*?Inhoudsopgave/g, '')
      .replace(/Groepsinformatie.*?Inhoudsopgave/g, '')
      .replace(/Kosten.*?Inhoudsopgave/g, '')
      .replace(/Zie ook.*?Inhoudsopgave/g, '')
      // Remove other unwanted content
      .replace(/XGVS.*$/g, '')
      .replace(/Uitleg symbolen.*$/g, '')
      .replace(/Verpakkingsvorm.*$/g, '')
      .replace(/Toedieningsvorm.*$/g, '')
      .replace(/Sterkte.*$/g, '')
      .replace(/Diverse fabrikanten.*$/g, '')
      .replace(/Zie voor hulpstoffen.*$/g, '')
      .replace(/raadpleeg een apotheker.*$/g, '')
      .replace(/B01AC08.*$/g, '')
      .replace(/salicylaten.*$/g, '')
      .replace(/antitromboticum.*$/g, '')
      .replace(/trombocytenaggregatieremmer.*$/g, '')
      // Remove ATC codes and classifications
      .replace(/C\d{2}[A-Z]\d{2}.*$/g, '')
      .replace(/adrenerge.*$/g, '')
      .replace(/dopaminerge.*$/g, '')
      // Remove navigation items that might appear in the text
      .replace(/\b(Samenstelling|Advies|Indicaties|Doseringen|Bijwerkingen|Interacties|Zwangerschap|Lactatie|Contra-indicaties|Waarschuwingen|Overdosering|Eigenschappen|Groepsinformatie|Kosten|Zie ook)\b/g, '')
      .trim()

    // Clean up any remaining navigation-like content
    const cleanText = textContent
      .split('\n')
      .filter(line => {
        const lowerLine = line.toLowerCase()
        return !lowerLine.includes('farmacotherapeutisch kompas') &&
          !lowerLine.includes('u bevindt zich hier') &&
          !lowerLine.includes('geneesmiddel') &&
          !lowerLine.includes('inhoudsopgave') &&
          !lowerLine.includes('zoek') &&
          !lowerLine.includes('wis invoer') &&
          line.trim().length > 0
      })
      .join('\n')
      .trim()

    // Analyze the content
    const analysis = analyzeMedicalText(cleanText, question)

    // Build the response
    let answer = ''

    if (analysis.type === 'safety') {
      answer = analysis.assessment

      if (analysis.contraindicationSentences.length > 0) {
        answer += '\n\nContra-indicatie gevonden:\n' +
          analysis.contraindicationSentences.map(s => `- ${s}`).join('\n')
      }
    } else {
      // For info questions, show the relevant information
      if (analysis.infoSentences.length > 0) {
        answer = analysis.infoSentences.map(s => s.trim()).join('\n\n')
      } else {
        answer = 'Geen specifieke informatie gevonden over deze vraag.'
      }
    }

    // Add a note about consulting a healthcare provider
    answer += '\n\nLet op: Raadpleeg altijd een arts of apotheker voor definitief advies.'

    return new Response(
      JSON.stringify({
        answer: answer.trim(),
        source: url
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Webpage QA error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process the webpage' }),
      { status: 500 }
    )
  }
} 