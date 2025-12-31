'use client';

import React, { useState } from 'react';
import { DentalChart } from '@/components/dental/DentalChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function TestDentalPage() {
  const [activeTool, setActiveTool] = useState('filling');
  const [procedures, setProcedures] = useState([]);
  const [toothTypes, setToothTypes] = useState({});

  const handleProcedureCreated = () => {
    console.log('✅ Procedure created successfully!');
  };

  const handleProcedureDeleted = () => {
    console.log('🗑️ Procedure deleted successfully!');
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Dental Chart Subsurface Mapping Test</CardTitle>
          <p className="text-sm text-gray-600">
            Test the new subsurface mapping system. Click on different surfaces and check the console for debugging output.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-x-2">
            <Button
              variant={activeTool === 'filling' ? 'default' : 'outline'}
              onClick={() => setActiveTool('filling')}
            >
              Filling Tool
            </Button>
            <Button
              variant={activeTool === 'crown' ? 'default' : 'outline'}
              onClick={() => setActiveTool('crown')}
            >
              Crown Tool
            </Button>
            <Button
              variant={activeTool === 'bridge' ? 'default' : 'outline'}
              onClick={() => setActiveTool('bridge')}
            >
              Bridge Tool
            </Button>
            <Button
              variant={activeTool === 'extraction' ? 'default' : 'outline'}
              onClick={() => setActiveTool('extraction')}
            >
              Extraction Tool
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <DentalChart
              patientId="test-patient"
              procedures={procedures}
              toothTypes={toothTypes}
              activeTool={activeTool}
              onToolChange={setActiveTool}
              onProcedureCreated={handleProcedureCreated}
              onProcedureDeleted={handleProcedureDeleted}
              currentStatus="PENDING"
            />
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Testing Instructions:</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Normal Click:</strong> Fill all subsurfaces for the main surface</li>
              <li>• <strong>Shift + Click:</strong> Fill only the specific subsurface clicked</li>
              <li>• <strong>Drag:</strong> Fill multiple teeth/surfaces by dragging</li>
              <li>• <strong>Bridge Tool:</strong> Click multiple teeth to create a bridge (healthy teeth = abutments, disabled/extracted = pontics)</li>
              <li>• <strong>Console:</strong> Check browser console for detailed debugging output</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 