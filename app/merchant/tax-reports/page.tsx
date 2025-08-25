'use client'

import React from 'react'
import { DashboardLayout } from '@/app/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'

export default function TaxReportsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8 p-8 bg-gray-50 min-h-screen">
        <Card className="shadow-soft">
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900">Tax Reports</h1>
            <p className="text-gray-600">Generate and view your cryptocurrency tax reports</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Placeholder for reports */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">No reports generated yet.</p>
              <Button className="bg-primary-500 text-white">Generate Report</Button>
            </div>
            {/* Add table or list here in future */}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
