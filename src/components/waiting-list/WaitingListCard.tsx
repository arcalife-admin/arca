'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Clock } from 'lucide-react';
import { WaitingListStats } from '@/types/waiting-list';

interface WaitingListCardProps {
  stats: WaitingListStats;
  onClick: () => void;
}

export default function WaitingListCard({ stats, onClick }: WaitingListCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold">{stats.practitionerName}</span>
          </div>
          <Badge variant="secondary" className="ml-2">
            {stats.practitionerRole}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Patients waiting</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {stats.patientCount}
            </div>
            <div className="text-xs text-gray-500">
              {stats.patientCount === 1 ? 'patient' : 'patients'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 