'use client'

import React from 'react'
import { Card, CardContent } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { Breadcrumbs } from '@/app/components/ui/breadcrumbs'

export default function TaxReportsPage() {
  return (
    <div className="space-y-8 max-md:space-y-6 max-md:px-4 max-md:py-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { name: 'Dashboard', href: '/merchant/dashboard' },
          { name: 'Tax Reports', href: '/merchant/tax-reports' }
        ]}
      />

      {/* Enhanced Header */}
      <div className="space-y-2">
        <h1 className="font-phonic text-3xl max-md:text-2xl font-normal tracking-tight text-gray-900 mb-4 max-md:mb-2">
          Tax Reports
        </h1>
        <p className="font-phonic text-base max-md:text-sm font-normal text-gray-600">
          Generate and view your cryptocurrency tax reports
        </p>
      </div>

      <Card className="shadow-soft max-md:shadow-sm">
        <CardContent className="space-y-6 max-md:space-y-4 max-md:p-5">
          {/* Placeholder for reports */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-md:p-4 text-center">
            <p className="font-capsule text-base max-md:text-sm font-normal text-gray-600 mb-4">
              No reports generated yet.
            </p>
            <div className="flex flex-col max-md:gap-3 items-center">
              <Button
                className="bg-primary-500 text-white hover:bg-primary-600 max-md:w-full max-md:h-12"
              >
                Generate Report
              </Button>
              <a
                href="/merchant/dashboard/tax-reports"
                className="text-sm max-md:text-xs text-primary-500 hover:text-primary-600 mt-3 max-md:mt-0 underline"
              >
                View full tax reports dashboard →
              </a>
            </div>
          </div>
          {/* Add table or list here in future */}
        </CardContent>
      </Card>
    </div>
  )
}
