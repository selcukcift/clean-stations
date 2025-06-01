"use client"

import { useAuthStore } from "@/stores/authStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { nextJsApiClient } from '@/lib/api'
import { useState } from "react"

export default function AuthDebugPage() {
  const { user, token, isAuthenticated } = useAuthStore()
  const [testResult, setTestResult] = useState('')
  
  const testConfiguratorAPI = async () => {
    try {
      setTestResult('Testing...')
      const response = await nextJsApiClient.get('/configurator?type=sink-families')
      setTestResult(`Success: ${JSON.stringify(response.data)}`)
    } catch (error) {
      setTestResult(`Error: ${error.message}`)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Auth State:</h3>
            <div className="space-y-2 text-sm">
              <div>Is Authenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}</div>
              <div>Token: {token ? `✅ Present (${token.substring(0, 20)}...)` : "❌ Not found"}</div>
              <div>User: {user ? `✅ ${user.fullName} (${user.role})` : "❌ Not found"}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Test API Call:</h3>
            <Button onClick={testConfiguratorAPI} className="mb-2">
              Test Configurator API
            </Button>
            <div className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {testResult || "Click button to test"}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium">Raw Token Value:</h3>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {token || "No token"}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
