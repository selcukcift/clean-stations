"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import ConfigurationStep from "@/components/order/ConfigurationStep"
import ConfigurationStepV2 from "@/components/order/ConfigurationStepV2-revised"
import ConfigurationStepCompact from "@/components/order/ConfigurationStepCompact"

export default function PreviewConfigsPage() {
  const [activeView, setActiveView] = useState<'current' | 'sidebar' | 'compact'>('sidebar')
  const mockBuildNumbers = ['BUILD-001']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Configuration Interface Comparison</h1>
          <p className="text-gray-600 mt-1">Compare different sink configuration UI designs</p>
        </div>
      </div>

      {/* View Selector */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Design to Preview:</h2>
          <div className="grid grid-cols-3 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${activeView === 'current' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveView('current')}
            >
              <CardHeader>
                <CardTitle className="text-base">Current Design</CardTitle>
                <CardDescription className="text-sm">Tabbed interface with vertical scrolling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>✓ Familiar tab navigation</p>
                  <p>✗ Requires scrolling</p>
                  <p>✗ Can't see all options at once</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${activeView === 'sidebar' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveView('sidebar')}
            >
              <CardHeader>
                <CardTitle className="text-base">Sidebar Design</CardTitle>
                <CardDescription className="text-sm">Sidebar with collapsible sections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>✓ All sections visible</p>
                  <p>✓ Progress indicators</p>
                  <p>✓ Live preview area</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${activeView === 'compact' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
              onClick={() => setActiveView('compact')}
            >
              <CardHeader>
                <CardTitle className="text-base">Compact Grid</CardTitle>
                <CardDescription className="text-sm">Ultra-compact grid layout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p>✓ No scrolling needed</p>
                  <p>✓ Everything on one screen</p>
                  <p>✓ Modal dialogs for details</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b px-6 py-3 bg-gray-50">
            <h3 className="font-medium">
              {activeView === 'current' && 'Current Design - Tabbed Interface'}
              {activeView === 'sidebar' && 'New Design - Sidebar Layout'}
              {activeView === 'compact' && 'New Design - Compact Grid'}
            </h3>
          </div>
          
          <div className="p-6">
            {activeView === 'current' && (
              <div className="text-center py-12 text-gray-500">
                <p>Current design preview not available</p>
                <p className="text-sm mt-2">Please select one of the new designs</p>
              </div>
            )}
            {activeView === 'sidebar' && (
              <ConfigurationStepV2 buildNumbers={mockBuildNumbers} />
            )}
            {activeView === 'compact' && (
              <ConfigurationStepCompact buildNumbers={mockBuildNumbers} />
            )}
          </div>
        </div>

        {/* Design Notes */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sidebar Design Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• <strong>Fixed sidebar navigation</strong> - Always visible, no hunting for options</p>
              <p>• <strong>Visual progress tracking</strong> - Green checkmarks show completed sections</p>
              <p>• <strong>Collapsible sections</strong> - Manage screen space efficiently</p>
              <p>• <strong>Live configuration preview</strong> - See your sink build in real-time</p>
              <p>• <strong>No tab switching</strong> - Faster workflow, everything accessible</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compact Grid Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>• <strong>Everything visible at once</strong> - No scrolling or tab switching</p>
              <p>• <strong>Quick status overview</strong> - Visual rings show completion</p>
              <p>• <strong>Space-efficient cards</strong> - More content in less space</p>
              <p>• <strong>Modal dialogs</strong> - Complex configs don't clutter main view</p>
              <p>• <strong>One-click access</strong> - Jump to any configuration instantly</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}