'use client'

import React, { useState } from 'react'

export default function PharmaGuide() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<any>(null)
  const [questions, setQuestions] = useState<{ [key: string]: string }>({})
  const [answer, setAnswer] = useState<string | null>(null)
  const [qaLoading, setQaLoading] = useState(false)
  const [showQaModal, setShowQaModal] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setAnswer(null)
    setSelectedResult(null)
    setQuestions({})

    try {
      const res = await fetch(`/api/pharma-search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      setResults(data.results)
    } catch (err) {
      console.error('Search failed:', err)
      alert('Zoekopdracht mislukt. Controleer je verbinding of API instellingen.')
    } finally {
      setLoading(false)
    }
  }

  const handleAskQuestion = async (result: any) => {
    const question = questions[result.link]
    if (!question?.trim()) return
    setQaLoading(true)
    setShowQaModal(true)
    setAnswer(null)
    setSelectedResult(result)

    try {
      const res = await fetch('/api/webpage-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: result.link,
          question: question,
        }),
      })

      if (!res.ok) throw new Error(`HTTP error ${res.status}`)
      const data = await res.json()
      setAnswer(data.answer)
    } catch (err) {
      console.error('Question answering failed:', err)
      setAnswer('Sorry, er ging iets mis bij het beantwoorden van je vraag.')
    } finally {
      setQaLoading(false)
    }
  }

  const handleQuestionChange = (link: string, value: string) => {
    setQuestions(prev => ({
      ...prev,
      [link]: value
    }))
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Farmacotherapeutisch Kompas Zoeker</h1>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="Zoek een medicijn of medicijngroep..."
          className="flex-1 border border-gray-300 px-4 py-2 rounded"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Zoek
        </button>
      </div>

      {loading && <p>Zoeken...</p>}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, idx) => (
            <div key={idx} className="border-b pb-4">
              <div className="flex justify-between items-start">
                <a
                  href={r.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline text-left block flex-1"
                >
                  <h2 className="text-lg font-semibold">{r.title}</h2>
                </a>
              </div>
              <p className="text-sm text-gray-600">{r.snippet}</p>
              <p className="text-xs text-gray-400 mb-2">{r.link}</p>

              {/* Question input for this result */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={questions[r.link] || ''}
                  onChange={(e) => handleQuestionChange(r.link, e.target.value)}
                  placeholder="Stel een vraag over deze pagina..."
                  className="flex-1 border border-gray-300 px-4 py-2 rounded text-sm"
                />
                <button
                  onClick={() => handleAskQuestion(r)}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                >
                  Vraag
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QA Modal */}
      {showQaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">Vraag & Antwoord</h3>
                {selectedResult && (
                  <p className="text-sm text-gray-600 mt-1">
                    Over: {selectedResult.title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowQaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="font-medium">Vraag:</p>
              <p className="text-gray-700">{selectedResult && questions[selectedResult.link]}</p>
            </div>

            {qaLoading ? (
              <p>Bezig met zoeken naar antwoord...</p>
            ) : (
              <div className="prose max-w-none">
                <p className="font-medium">Antwoord:</p>
                {answer ? (
                  <p className="text-gray-700">{answer}</p>
                ) : (
                  <p>Er is een fout opgetreden bij het beantwoorden van de vraag.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
