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
  Info,
  Banknote
} from 'lucide-react'
import { Alert, AlertDescription } from '@/app/components/ui/alert'

interface TrustWalletGuideProps {
  onComplete: () => void
  onSkip: () => void
}

export default function TrustWalletGuide({ onComplete, onSkip }: TrustWalletGuideProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [hasWallet, setHasWallet] = useState<boolean | null>(null)
  const [useExchange, setUseExchange] = useState(false)
  const [exchangeStep, setExchangeStep] = useState(1)

  const steps = [
    {
      id: 1,
      title: "Install Trust Wallet",
      description: "A free app to securely hold your crypto",
      icon: Download,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Trust Wallet is an easy, beginner‑friendly crypto wallet. Install it on your phone:</p>
          
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
            <AlertDescription className="text-blue-800">Download only from official stores. Never share your recovery phrase with anyone.</AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 2,
      title: "Create or import a wallet",
      description: "Save your recovery phrase somewhere safe",
      icon: Key,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Open the app and follow these simple steps:</p>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <span className="font-medium">Open Trust Wallet</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Agree to the terms to continue</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <span className="font-medium">Create a new wallet or import existing</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">New to crypto? Choose Create. Already have one? Choose Import.</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">3</span>
                </div>
                <span className="font-medium">Write down your recovery phrase</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Store it offline (paper). Anyone with it can access your funds.</p>
            </div>
          </div>

          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">Your recovery phrase is the only way to restore your wallet. Cryptrac never sees or stores it.</AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      id: 3,
      title: "Find your wallet address",
      description: "Copy the address for each coin you accept",
      icon: Copy,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">Repeat these steps for every coin you want to accept:</p>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <span className="font-medium">Open the cryptocurrency</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Example: Bitcoin, Ethereum, Solana, etc.</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <span className="font-medium">Tap “Receive”</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">You’ll see your address and QR code</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <span className="font-medium">Copy the address</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Use the copy button. You’ll paste it into Cryptrac.</p>
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">Each cryptocurrency has a different address. Always match coin and network.</AlertDescription>
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
    } else {
      // Return to option selection
      setHasWallet(null)
    }
  }

  if (hasWallet === null && !useExchange) {
    return (
      <Card interactive={false} className="w-full shadow-lg bg-white min-h-[560px]">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            Crypto Wallet Setup
          </CardTitle>
          <p className="text-gray-600">
            To receive cryptocurrency payments, choose how you want to manage your crypto addresses.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch content-stretch">
            <Button
              onClick={() => setHasWallet(false)}
              variant="outline"
              className="p-6 w-full min-h-[160px] flex flex-col items-center justify-center gap-2 whitespace-normal text-center hover:bg-blue-50 hover:border-blue-200"
            >
              <Download className="w-8 h-8 text-blue-600" />
              <span className="font-medium text-center">Use a wallet (Trust Wallet)</span>
              <span className="text-sm text-gray-500 text-center leading-snug">A simple mobile app to hold your crypto</span>
            </Button>
            
            <Button
              onClick={() => setHasWallet(true)}
              variant="outline"
              className="p-6 w-full min-h-[160px] flex flex-col items-center justify-center gap-2 whitespace-normal text-center hover:bg-green-50 hover:border-green-200"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="font-medium text-center">I already have a wallet</span>
              <span className="text-sm text-gray-500 text-center leading-snug">Go straight to adding your addresses</span>
            </Button>

            <div className="flex flex-col">
              <Button
                onClick={() => { setUseExchange(true); setExchangeStep(1); }}
                variant="outline"
                className="p-6 w-full min-h-[160px] flex flex-col items-center justify-center gap-2 whitespace-normal text-center hover:bg-indigo-50 border-[#7f5efd]"
              >
                <Banknote className="w-8 h-8 text-indigo-600" />
                <span className="font-medium text-center">Use an exchange (Coinbase Exchange)</span>
                <span className="text-sm text-gray-500 text-center leading-snug">Find the deposit address from your Coinbase account</span>
              </Button>
              <div className="mt-2 flex justify-center">
                <span className="text-[10px] font-semibold text-[#7f5efd] bg-white border border-[#7f5efd] rounded-full px-2 py-0.5">Recommended</span>
              </div>
            </div>
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={onSkip}
              variant="ghost"
              className="text-gray-500 hover:text-gray-700"
            >
              I'll set this up later
            </Button>
            <div className="mt-2 text-xs text-gray-500">
              Need help? <a href="mailto:support@cryptrac.com" className="text-[#7f5efd] underline">Email support</a> or call <a href="tel:+13476193721" className="text-[#7f5efd] underline">(347) 619-3721</a>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Exchange flow (Coinbase) guided steps
  if (useExchange) {
    const exchangeSteps = [
      {
        id: 1,
        title: 'Sign in to Coinbase',
        description: 'Use a Coinbase account to receive crypto',
        icon: Banknote,
        content: (
          <div className="space-y-4">
            <p className="text-gray-600">
              If you prefer using an exchange, Coinbase is a popular option. Log in to your Coinbase account on web or mobile.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://www.coinbase.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xs">WEB</span>
                </div>
                <div>
                  <div className="font-medium">coinbase.com</div>
                  <div className="text-sm text-gray-500">Open in your browser</div>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
              </a>
              <a
                href="https://www.coinbase.com/mobile"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-xs">APP</span>
                </div>
                <div>
                  <div className="font-medium">Coinbase Mobile</div>
                  <div className="text-sm text-gray-500">iOS & Android</div>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-gray-400" />
              </a>
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                You can also use Coinbase Advanced Trade. The steps to find deposit addresses are similar.
              </AlertDescription>
            </Alert>
          </div>
        )
      },
      {
        id: 2,
        title: 'Choose Asset & Network',
        description: 'Pick the crypto and correct network',
        icon: Key,
        content: (
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">1</span>
                </div>
                <span className="font-medium">Open Assets and select crypto</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">BTC, ETH, SOL, USDC, etc.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-bold text-sm">2</span>
                </div>
                <span className="font-medium">Confirm network matches Cryptrac</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Example: ETH vs Base, BTC vs Lightning, BSC vs BNB, etc.</p>
            </div>
          </div>
        )
      },
      {
        id: 3,
        title: 'Get Deposit Details & Paste',
        description: 'Find address, tag/memo, and add to Cryptrac',
        icon: Key,
        content: (
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <span className="font-medium">Tap Receive / Deposit</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">On web: Deposit → Crypto address</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <span className="font-medium">Copy address (and Memo/Tag)</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">XRP/XLM require a Destination Tag or Memo — copy both.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <span className="font-medium">Paste into Cryptrac</span>
              </div>
              <p className="text-sm text-gray-600 ml-11">Add the address in Wallets and save changes.</p>
            </div>
            <Alert className="border-yellow-200 bg-yellow-50">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Deposits to wrong networks can be lost. Always verify the network shown matches what you configure in Cryptrac.
              </AlertDescription>
            </Alert>
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Exchanges may change deposit rules. If an address isn’t available for a network, select a supported network.
              </AlertDescription>
            </Alert>
          </div>
        )
      }
    ]

    const currentExchangeStep = exchangeSteps.find(step => step.id === exchangeStep)

    return (
      <Card className="w-full shadow-lg bg-white">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7f5efd] to-[#9f7aea] rounded-full flex items-center justify-center mx-auto mb-4">
            {currentExchangeStep && <currentExchangeStep.icon className="w-8 h-8 text-white" />}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {currentExchangeStep?.title}
          </CardTitle>
          <p className="text-gray-600">
            {currentExchangeStep?.description}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Progress indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            {exchangeSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.id <= exchangeStep
                    ? 'bg-[#7f5efd] text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.id}
                </div>
                {index < exchangeSteps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step.id < exchangeStep ? 'bg-[#7f5efd]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentExchangeStep?.content}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              onClick={() => {
                if (exchangeStep === 1) {
                  setUseExchange(false)
                } else {
                  setExchangeStep(prev => Math.max(1, prev - 1))
                }
              }}
              variant="outline"
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
                onClick={() => {
                  if (exchangeStep < exchangeSteps.length) {
                    setExchangeStep(prev => prev + 1)
                  } else {
                    onComplete()
                  }
                }}
                className="bg-[#7f5efd] hover:bg-[#6d4fd8] text-white px-6"
              >
                {exchangeStep === exchangeSteps.length ? 'Complete Setup' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500">
            Need help? <a href="mailto:support@cryptrac.com" className="text-[#7f5efd] underline">Email support</a> or call <a href="tel:+13476193721" className="text-[#7f5efd] underline">(347) 619-3721</a>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (hasWallet) {
    return (
      <Card interactive={false} className="max-w-4xl mx-auto shadow-lg bg-white min-h-[560px]">
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
          <div className="text-center text-xs text-gray-500">
            Need help? <a href="mailto:support@cryptrac.com" className="text-[#7f5efd] underline">Email support</a> or call <a href="tel:+13476193721" className="text-[#7f5efd] underline">(347) 619-3721</a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card interactive={false} className="w-full shadow-lg bg-white min-h-[560px]">
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
          <div className="text-center text-xs text-gray-500">
            Need help? <a href="mailto:support@cryptrac.com" className="text-[#7f5efd] underline">Contact support</a>
          </div>
      </CardContent>
    </Card>
  )
}
