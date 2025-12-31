'use client';

import React from 'react';
import SplitPane from '@/components/layout/SplitPane';
import TodayAppointments from '@/components/TodayAppointments';
import DynamicPane from '@/components/layout/DynamicPane';

export default function WorkspacePage() {
  return (
    <SplitPane initialPrimarySize={300} minPrimarySize={250}>
      {/* Left – today appointments */}
      <TodayAppointments />
      {/* Right – empty placeholder */}
      <DynamicPane />
    </SplitPane>
  );
} 