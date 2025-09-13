'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs'

export default function TaxReportsPage() {
  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { name: 'Dashboard', href: '/merchant/dashboard' },
          { name: 'Tax Reports', href: '/merchant/tax-reports' }
        ]}
      />

      {/* Enhanced Header */}
      <div className="space-y-2">
        <h1 className="font-phonic text-3xl font-normal tracking-tight text-gray-900 mb-4">
          Tax Reports
        </h1>
        <p className="font-phonic text-base font-normal text-gray-600">
          Generate and view your cryptocurrency tax reports
        </p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="space-y-6">
          {/* Placeholder for reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
            <p className="font-capsule text-base font-normal text-gray-600 mb-4">No reports generated yet.</p>
            <Button className="bg-primary-500 text-white">Generate Report</Button>
          </div>
          {/* Add table or list here in future */}
        </CardContent>
      </Card>
    </div>
  )
}
