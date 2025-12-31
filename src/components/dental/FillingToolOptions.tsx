import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useFillingOptions } from '@/contexts/FillingOptionsContext';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function FillingToolOptions() {
  const { options, setOptions } = useFillingOptions();
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  const materialInfo = {
    composite: { color: 'from-blue-200 to-blue-400', icon: '💎', codes: 'F11-F14' },
    glasionomeer: { color: 'from-purple-200 to-purple-400', icon: '🔮', codes: 'F21-F24' },
    amalgam: { color: 'from-gray-200 to-gray-500', icon: '🥈', codes: 'F31-F34' }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 w-80 shadow-2xl border-2 border-gradient-to-r from-blue-400/80 to-cyan-500/80 bg-gradient-to-br">
        {/* Beautiful Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-full p-2 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg items-center justify-center">
            <h3 className="text-lg font-bold text-gray-800 leading-none">Dental Fillings</h3>
            <p className="text-xs text-gray-600">Restorative Materials</p>
          </div>
        </div>

        {/* Material Selection with Visual Icons */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-400 rounded-full"></span>
            Material Selection
          </p>
          <div className="grid grid-cols-1 gap-2">
            {(['composite', 'glasionomeer', 'amalgam'] as const).map((mat) => (
              <button
                key={mat}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${options.material === mat
                  ? `bg-gradient-to-r ${materialInfo[mat].color} border-opacity-80 text-white shadow-lg transform scale-105`
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                  }`}
                onClick={() => setOptions({ ...options, material: mat })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{materialInfo[mat].icon}</span>
                    <div className="text-left">
                      <div className="font-semibold">
                        {mat === 'glasionomeer' ? 'Glass Ionomer' : mat.charAt(0).toUpperCase() + mat.slice(1)}
                      </div>
                      <div className="text-xs opacity-75">
                        {materialInfo[mat].codes}
                      </div>
                    </div>
                  </div>
                  {options.material === mat && (
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
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-4 h-4 bg-green-400 rounded-full"></span>
            Additional Procedures
          </p>

          <div className="space-y-3 pl-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="opt-anesthesia"
                  checked={options.anesthesia}
                  onCheckedChange={c => setOptions({ ...options, anesthesia: c as boolean })}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <Label htmlFor="opt-anesthesia" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Local Anesthesia
                </Label>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded">A10</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="opt-c022"
                  checked={options.c022}
                  onCheckedChange={c => setOptions({ ...options, c022: c as boolean })}
                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <Label htmlFor="opt-c022" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Additional Code
                </Label>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">C022</span>
            </div>
          </div>
        </div>

        {/* Filling Info Banner - Collapsible */}
        <div className="mt-4">
          <button
            onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200 hover:from-cyan-100 hover:to-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-cyan-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">Filling Instructions</span>
            </div>
            {isInstructionsExpanded ? (
              <ChevronUp className="w-4 h-4 text-cyan-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-cyan-700" />
            )}
          </button>

          {isInstructionsExpanded && (
            <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
              <p className="text-xs text-cyan-600 mt-1 leading-relaxed">
                Click on individual tooth surfaces or drag across multiple surfaces. Surface count determines procedure code (1-5 surfaces).
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
