import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useExtractionOptions } from '@/contexts/ExtractionOptionsContext';
import { getExtractionTypeLabel } from '@/lib/extractions';

export default function ExtractionToolOptions() {
  const { options, setOptions } = useExtractionOptions();

  const extractionInfo = {
    simple: { color: 'from-green-200 to-green-400', icon: '🦷', codes: 'H11', rate: '€56.90' },
    surgical: { color: 'from-red-200 to-red-400', icon: '⚕️', codes: 'H35', rate: '€91.04' },
    hemisection: { color: 'from-orange-200 to-orange-400', icon: '✂️', codes: 'H33', rate: '€91.04' },
    impacted: { color: 'from-purple-200 to-purple-400', icon: '🔍', codes: 'H34', rate: '€91.04' }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 w-80 shadow-2xl border-2 border-gradient-to-r from-red-400/80 to-pink-500/80 bg-gradient-to-br">
        {/* Beautiful Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-full p-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg items-center justify-center">
            <h3 className="text-lg font-bold text-gray-800 leading-none">Tooth Extraction</h3>
            <p className="text-xs text-gray-600">Surgical Procedures</p>
          </div>
        </div>

        {/* Extraction Type Selection with Visual Icons */}
        <div className="mb-4">
          {/* <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-red-400 rounded-full"></span>
            Extraction Type
          </p> */}
          <div className="grid grid-cols-1 gap-2">
            {(['simple', 'surgical', 'hemisection', 'impacted'] as const).map((type) => (
              <button
                key={type}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${options.type === type
                  ? `bg-gradient-to-r ${extractionInfo[type].color} border-opacity-80 text-white shadow-lg transform scale-105`
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                  }`}
                onClick={() => setOptions({ ...options, type })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{extractionInfo[type].icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">
                        {getExtractionTypeLabel(type)}
                      </div>
                      <div className="text-xs opacity-75">
                        {extractionInfo[type].codes} • {extractionInfo[type].rate}
                      </div>
                    </div>
                  </div>
                  {options.type === type && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          {/* <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-400 rounded-full"></span>
            Additional Procedures
          </p> */}

          <div className="space-y-3 pl-2">
            {/* Suturing option - only for complex procedures */}
            {options.type !== 'simple' && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="suturing"
                    checked={options.suturing}
                    onCheckedChange={c => setOptions({ ...options, suturing: c as boolean })}
                    className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                  />
                  <Label htmlFor="suturing" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Suturing & Materials
                  </Label>
                </div>
                <div className="flex gap-1">
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">H21</span>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-1 rounded">H26</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="anesthesia"
                  checked={options.anesthesia}
                  onCheckedChange={c => setOptions({ ...options, anesthesia: c as boolean })}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <Label htmlFor="anesthesia" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Local Anesthesia
                </Label>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">A10</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="c022"
                  checked={options.c022}
                  onCheckedChange={c => setOptions({ ...options, c022: c as boolean })}
                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <Label htmlFor="c022" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Additional Code
                </Label>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">C022</span>
            </div>
          </div>
        </div>


      </Card>
    </div>
  );
} 