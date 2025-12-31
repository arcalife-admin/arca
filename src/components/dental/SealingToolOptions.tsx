import React from 'react';
import { Card } from '@/components/ui/card';

const sealingInfo = {
  first: {
    icon: '🛡️',
    code: 'V30',
    rate: '€34.14',
    description: 'Eerste fissuurlak'
  },
  additional: {
    icon: '🛡️',
    code: 'V35',
    rate: '€18.97',
    description: 'Volgende fissuurlak (zelfde zitting)'
  }
};

export default function SealingToolOptions() {
  return (
    <Card className="fixed bottom-4 right-4 w-80 p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 shadow-xl border-2 border-emerald-200 z-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-emerald-700">Fissuurlak</h3>
        </div>

        {/* Instructions */}
        <div className="text-sm text-emerald-600">
          <p className="mb-2">💡 <strong>How to use:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• Click and drag over teeth to seal them</li>
            <li>• First tooth gets V30 (if no V30 today)</li>
            <li>• Additional teeth get V35</li>
            <li>• Max 1 sealing per tooth</li>
          </ul>
        </div>

        {/* Sealing Information */}
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200">
            <div className="flex items-center gap-2 text-teal-700 mb-1">
              <span className="text-lg">{sealingInfo.first.icon}</span>
              <span className="text-sm font-semibold">{sealingInfo.first.description}</span>
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                {sealingInfo.first.code}
              </span>
            </div>
            <div className="text-xs text-teal-600 font-medium">{sealingInfo.first.rate}</div>
          </div>

          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <span className="text-lg">{sealingInfo.additional.icon}</span>
              <span className="text-sm font-semibold">{sealingInfo.additional.description}</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {sealingInfo.additional.code}
              </span>
            </div>
            <div className="text-xs text-green-600 font-medium">{sealingInfo.additional.rate}</div>
          </div>
        </div>
      </div>
    </Card>
  );
} 