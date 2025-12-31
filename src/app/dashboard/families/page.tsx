'use client';

import { useSession } from 'next-auth/react';
import FamilyManagement from '@/components/families/FamilyManagement';
import { Card, CardContent } from '@/components/ui/card';

export default function FamiliesPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session?.user?.organizationId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need to be part of an organization to manage families.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <FamilyManagement organizationId={session.user.organizationId} />
    </div>
  );
} 