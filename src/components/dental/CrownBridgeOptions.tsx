import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useCrownBridgeOptions } from '@/contexts/CrownBridgeOptionsContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CrownBridgeOptions({ bridgePreview = null }) {
  const { options, setOptions } = useCrownBridgeOptions();
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [isBridgePreviewExpanded, setIsBridgePreviewExpanded] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 w-80 shadow-2xl border-2 border-gradient-to-r from-yellow-400/80 to-orange-500/80 bg-gradient-to-br ">
        {/* Beautiful Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-full p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg items-center justify-center">
            <h3 className="text-lg font-bold text-gray-800 leading-none">Crown & Bridge</h3>
            <p className="text-xs text-gray-600">Prosthetic Options</p>
          </div>
        </div>

        {/* Material Selection with Visual Icons */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-yellow-400 rounded-full"></span>
            Material Selection
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['porcelain', 'gold'] as const).map(mat => (
              <button
                key={mat}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${options.material === mat
                  ? mat === 'porcelain'
                    ? 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400 text-gray-800 shadow-lg transform scale-105'
                    : 'bg-gradient-to-br from-yellow-400 to-orange-500 border-orange-600 text-white shadow-lg transform scale-105'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:shadow-md'
                  }`}
                onClick={() => setOptions({ ...options, material: mat })}
              >
                <div className="flex items-center justify-center gap-2">
                  {mat === 'porcelain' ? (
                    <div className="w-3 h-3 bg-gradient-to-br from-gray-200 to-white rounded-full border border-gray-300"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full"></div>
                  )}
                  {mat.charAt(0).toUpperCase() + mat.slice(1)}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {mat === 'porcelain' ? 'R24/R40' : 'R34/R45'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="w-4 h-4 bg-blue-400 rounded-full"></span>
            Additional Procedures
          </p>

          <div className="space-y-3 pl-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="retention"
                  checked={options.retention}
                  onCheckedChange={c => setOptions({ ...options, retention: c as boolean })}
                  className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label htmlFor="retention" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Retention Pin
                </Label>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">R14</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="anesth"
                  checked={options.anesthesia}
                  onCheckedChange={c => setOptions({ ...options, anesthesia: c as boolean })}
                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <Label htmlFor="anesth" className="text-sm font-medium text-gray-700 cursor-pointer">
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

        {/* Bridge Preview Panel - Collapsible */}
        {bridgePreview && (
          <div className="mt-4">
            {/* Always Visible Header */}
            <button className="w-full flex items-center justify-between p-2 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200" onClick={() => setIsBridgePreviewExpanded(!isBridgePreviewExpanded)}>
              <div className="flex items-center gap-2 text-emerald-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold">Bridge Preview</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bridgePreview.complexity === 'simple' ? 'bg-green-100 text-green-700' :
                  bridgePreview.complexity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                  {bridgePreview.complexity}
                </span>
              </div>
              {isBridgePreviewExpanded ? (
                <ChevronUp className="w-4 h-4 text-emerald-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-emerald-700" />
              )}
            </button>

            {/* Always Visible Content */}
            {isBridgePreviewExpanded && (
              <div className="mt-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-white/60 rounded">
                    <div className="font-semibold text-emerald-700">{bridgePreview.totalUnits}</div>
                    <div className="text-emerald-600">Total Units</div>
                  </div>
                  <div className="text-center p-2 bg-white/60 rounded">
                    <div className="font-semibold text-blue-700">{bridgePreview.abutments}</div>
                    <div className="text-blue-600">Abutments</div>
                  </div>
                  <div className="text-center p-2 bg-white/60 rounded">
                    <div className="font-semibold text-orange-700">{bridgePreview.pontics}</div>
                    <div className="text-orange-600">Pontics</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-emerald-600 font-medium text-center">
                  {bridgePreview.bridgeType}
                </div>

                {bridgePreview.needsFiveOrMore && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                    <div className="flex items-center gap-1 text-amber-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      5+ Abutment Surcharge (R49) applies
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bridge Instructions - Collapsible */}
        <div className="mt-4">
          <button
            onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold">Bridge Instructions</span>
            </div>
            {isInstructionsExpanded ? (
              <ChevronUp className="w-4 h-4 text-blue-700" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-700" />
            )}
          </button>

          {isInstructionsExpanded && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 leading-relaxed">
                Click and drag across multiple teeth to create bridge. First and last teeth become abutments, middle teeth become pontics.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 