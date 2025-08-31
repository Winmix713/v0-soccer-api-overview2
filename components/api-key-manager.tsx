"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Key, Save, Eye, EyeOff, CheckCircle, XCircle, Wifi } from "lucide-react"

interface ApiKeyManagerProps {
  currentApiKey: string
  onApiKeyChange: (apiKey: string) => void
  isConnected: boolean
}

export function ApiKeyManager({ currentApiKey, onApiKeyChange, isConnected }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState(currentApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [testMessage, setTestMessage] = useState<string | null>(null)

  useEffect(() => {
    setApiKey(currentApiKey)
  }, [currentApiKey])

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestMessage("Kérlek add meg az API kulcsot először!")
      setTimeout(() => setTestMessage(null), 3000)
      return
    }

    setIsTesting(true)
    setTestMessage(null)

    try {
      const response = await fetch(`/api/sportradar/competitions?api_key=${encodeURIComponent(apiKey.trim())}`)

      if (response.ok) {
        const data = await response.json()
        if (data.competitions && data.competitions.length > 0) {
          setTestMessage("✅ Kapcsolat sikeres! API működik.")
        } else {
          setTestMessage("⚠️ API válaszolt, de nincs adat.")
        }
      } else {
        setTestMessage(`❌ API hiba: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setTestMessage(`❌ Kapcsolódási hiba: ${(error as Error).message}`)
    } finally {
      setIsTesting(false)
      setTimeout(() => setTestMessage(null), 5000)
    }
  }

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setSaveMessage("Az API kulcs nem lehet üres!")
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setIsSaving(true)

    try {
      localStorage.setItem("sportradar_api_key", apiKey.trim())

      onApiKeyChange(apiKey.trim())

      setSaveMessage("API kulcs sikeresen mentve!")
      setTimeout(() => {
        setSaveMessage(null)
        setIsOpen(false)
      }, 2000)
    } catch (error) {
      setSaveMessage("Hiba történt a mentés során!")
      setTimeout(() => setSaveMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    const defaultKey = "pVjDZHDlwNvnHgzvAYFzZYu4ncRylXL80s5DL1KD"
    setApiKey(defaultKey)
  }

  const getConnectionStatus = () => {
    if (!apiKey.trim()) {
      return { icon: XCircle, text: "Nincs API kulcs", color: "text-destructive" }
    }
    if (isConnected) {
      return { icon: CheckCircle, text: "Kapcsolódva", color: "text-green-600" }
    }
    return { icon: XCircle, text: "Kapcsolódási hiba", color: "text-yellow-600" }
  }

  const status = getConnectionStatus()
  const StatusIcon = status.icon

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">API Beállítások</span>
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Sportradar API Kulcs Kezelő
          </DialogTitle>
          <DialogDescription>
            Add meg vagy módosítsd a Sportradar Soccer API kulcsot. Az API kulcs biztonságosan tárolódik a böngésződben.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${status.color}`} />
                <span className={`font-medium ${status.color}`}>{status.text}</span>
              </div>
              {apiKey.trim() && (
                <p className="text-sm text-muted-foreground mt-1">
                  API kulcs: {showApiKey ? apiKey : `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Sportradar API Kulcs</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Add meg az API kulcsot..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Az API kulcsot a Sportradar fejlesztői portálról szerezheted be.
            </p>
          </div>

          {/* Test Connection */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="w-full bg-transparent"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Kapcsolat tesztelése...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Kapcsolat tesztelése
                </>
              )}
            </Button>
            {testMessage && (
              <Alert
                className={
                  testMessage.includes("✅")
                    ? "border-green-500"
                    : testMessage.includes("⚠️")
                      ? "border-yellow-500"
                      : "border-destructive"
                }
              >
                <AlertDescription>{testMessage}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Save Message */}
          {saveMessage && (
            <Alert className={saveMessage.includes("sikeresen") ? "border-green-500" : "border-destructive"}>
              <AlertDescription>{saveMessage}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Mentés...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Mentés
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              Alapértelmezett
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <p>
              <strong>Tipp:</strong> Az API kulcs automatikusan mentődik a böngésződbe.
            </p>
            <p>
              <strong>Biztonság:</strong> Az API kulcs csak a te gépeden tárolódik.
            </p>
            <p>
              <strong>Probléma esetén:</strong> Próbáld ki az alapértelmezett kulcsot.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
