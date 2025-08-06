"use client"
/* eslint-disable react/no-unescaped-entities */

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Button } from '@/app/components/ui/button'
import { 
  Smartphone, 
  Download, 
  Shield, 
  Key, 
  Copy, 
  CheckCircle, 
  ArrowRight, 
  ExternalLink,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface TrustWalletGuideProps {
  onComplete: () => void
  onSkip: () => void
}

export default function TrustWalletGuide({ onComplete, onSkip }: TrustWalletGuideProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [hasWallet, setHasWallet] = useState<boolean | null>(null)

  const steps = [
    {
      id: 1,
      title: "Download Trust Wallet",
      description: "Get the official Trust Wallet app on your device",
      icon: Download,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Trust Wallet is a secure, decentralized wallet that supports all major cryptocurrencies. 
            Download it from the official app stores:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
              href="https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xs">iOS</span>
              </div>
              <div>
                <div className="font-medium">App Store</div>
                <div className="text-sm text-gray-500">For iPhone & iPad</div>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
            </a>
            
            <a 
              href="https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-xs">AND</span>
              </div>
              <div>
                <div className="font-medium">Google Play</div>
                <div className="text-sm text-gray-500">For Android</div>
              </div>
              <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
            </a>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Security Tip:</strong> Only download Trust Wallet from official app stores. 
              Never download from third-party websites or unofficial sources.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 2,
      title: "Create or Import Wallet",
      description: "Set up your wallet securely",
      icon: Key,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Once you have Trust Wallet installed, you'll need to either create a new wallet or import an existing one:
          </p>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <span className="font-medium">Open Trust Wallet</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Launch the app and agree to the terms of service</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <span className="font-medium">Choose "Create a new wallet" or "I already have a wallet"</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                If you're new to crypto, select "Create a new wallet". If you have an existing wallet, choose "I already have a wallet"
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <span className="font-medium">Secure your wallet</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                Write down your recovery phrase and store it safely. Never share this with anyone!
              </p>
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Critical:</strong> Your recovery phrase is the only way to restore your wallet. 
              Store it offline in a secure location. Cryptrac never has access to your recovery phrase.
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 3,
      title: "Find Your Wallet Addresses",
      description: "Locate addresses for each cryptocurrency",
      icon: Copy,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            For each cryptocurrency you want to accept, you'll need to find and copy the wallet address:
          </p>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <span className="font-medium">Navigate to the cryptocurrency</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                In Trust Wallet, tap on the cryptocurrency you want (e.g., Bitcoin, Ethereum, etc.)
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <span className="font-medium">Tap "Receive"</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                This will show your wallet address and QR code for that cryptocurrency
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <span className="font-medium">Copy the address</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                Tap the copy button to copy your wallet address. You'll paste this into Cryptrac
              </p>
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important:</strong> Each cryptocurrency has its own unique address. 
              Make sure you're copying the correct address for each coin type.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  ]

  const currentStepData = steps.find(step => step.id === currentStep)

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (hasWallet === null) {
    return (
      <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Crypto Wallet Setup
          </CardTitle>
          <p className="text-gray-600">
            To receive cryptocurrency payments, you'll need a crypto wallet. Do you already have Trust Wallet or another crypto wallet?
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => setHasWallet(false)}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-2 hover:bg-blue-50 hover:border-blue-200"
            >
              <Download className="w-8 h-8 text-blue-600" />
              <span className="font-medium">No, I need to set up a wallet</span>
              <span className="text-sm text-gray-500 text-center">
                We'll guide you through downloading and setting up Trust Wallet
              </span>
            </Button>
            
            <Button
              onClick={() => setHasWallet(true)}
              variant="outline"
              className="h-auto p-6 flex flex-col items-center space-y-2 hover:bg-green-50 hover:border-green-200"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="font-medium">Yes, I already have a wallet</span>
              <span className="text-sm text-gray-500 text-center">
                Skip to entering your wallet addresses
              </span>
            </Button>
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              I'll set this up later
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasWallet) {
    return (
      <Card className="max-w-2xl mx-auto shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Great! You're ready to go
          </CardTitle>
          <p className="text-gray-600">
            Since you already have a crypto wallet, you can proceed directly to entering your wallet addresses.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You'll need to provide wallet addresses for the cryptocurrencies you want to accept. 
              Make sure you have access to your wallet to copy the addresses.
            </AlertDescription>
          </Alert>

          <div className="flex justify-center">
            <Button onClick={onComplete} className="bg-[#7f5efd] hover:bg-[#6d4fd8] text-white px-8">
              Continue to Wallet Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg border-0 bg-white">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
          {currentStepData && <currentStepData.icon className="w-8 h-8 text-white" />}
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
          {currentStepData?.title}
        </CardTitle>
        <p className="text-gray-600">
          {currentStepData?.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id <= currentStep 
                  ? 'bg-[#7f5efd] text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step.id}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step.id < currentStep ? 'bg-[#7f5efd]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {currentStepData?.content}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentStep === 1}
            className="px-6"
          >
            Previous
          </Button>
          
          <div className="flex space-x-3">
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              Skip for now
            </Button>
            
            <Button
              onClick={handleNext}
              className="bg-[#7f5efd] hover:bg-[#6d4fd8] text-white px-6"
            >
              {currentStep === steps.length ? 'Complete Setup' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

