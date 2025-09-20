'use client'

import React from 'react'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs'
import { EmptyState } from '@/app/components/ui/empty-state'
import { Receipt } from 'lucide-react'

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
        <CardContent className="p-6">
          <EmptyState
            variant="no-data"
            icon={<Receipt className="h-[48px] w-[48px]" />}
            title="No reports generated yet"
            description="Generate your first tax report to see your transaction summary"
            action={
              <Button className="bg-[#7f5efd] hover:bg-[#7c3aed] text-white">
                Generate Report
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
