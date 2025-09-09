"use client";

import { useState, useEffect } from "react";
import { Zap, Network, CheckCircle, ArrowRight, DollarSign, Copy, Globe } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export function PaymentJourneyDemo() {
  const [currentStage, setCurrentStage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-cycle through stages
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStage((prev) => (prev + 1) % 3);
        setIsAnimating(false);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const stages = [
    {
      title: "Choose Currency",
      component: <CurrencySelectionStage />
    },
    {
      title: "Scan & Pay",
      component: <QRCodeStage />
    },
    {
      title: "Payment Complete",
      component: <SuccessStage />
    }
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Stage Indicators */}
      <div className="flex justify-center mb-6 space-x-2">
        {stages.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStage
                ? 'bg-[#7f5efd] w-6'
                : index < currentStage
                ? 'bg-[#7f5efd] opacity-50'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Main Stage Display */}
      <div className={`transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#7f5efd] to-[#9b7cff]"></div>
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h3 className="font-phonic text-sm font-medium text-gray-600 uppercase tracking-wider">
                {stages[currentStage].title}
              </h3>
            </div>
            {stages[currentStage].component}
          </CardContent>
        </Card>
      </div>

      {/* Progress Indicator */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500">
          Step {currentStage + 1} of {stages.length}
        </div>
      </div>
    </div>
  );
}

function CurrencySelectionStage() {
  return (
    <div className="space-y-4">
      {/* Network Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
          <Network className="h-3 w-3 text-[#7f5efd]" />
          Network
        </label>
        <div className="h-10 bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-lg flex items-center px-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#7f5efd]" />
            <span className="text-sm font-medium text-gray-900">Ethereum</span>
          </div>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
          <DollarSign className="h-3 w-3 text-[#7f5efd]" />
          Currency
        </label>
        <div className="h-10 bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-lg flex items-center px-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[#7f5efd]" />
            <span className="text-sm font-medium text-gray-900">USDC</span>
            <span className="text-xs text-gray-500">USD Coin</span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <Button className="w-full h-10 text-sm bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-lg shadow-lg">
        Pay with USDC
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

function QRCodeStage() {
  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-gray-700">Awaiting Payment</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center">
          <svg className="w-28 h-28" viewBox="0 0 210 210" fill="none">
            <rect width="210" height="210" fill="white"/>
            
            {/* Simplified QR Code Pattern */}
            <rect x="0" y="0" width="70" height="70" fill="black"/>
            <rect x="10" y="10" width="50" height="50" fill="white"/>
            <rect x="20" y="20" width="30" height="30" fill="black"/>
            
            <rect x="140" y="0" width="70" height="70" fill="black"/>
            <rect x="150" y="10" width="50" height="50" fill="white"/>
            <rect x="160" y="20" width="30" height="30" fill="black"/>
            
            <rect x="0" y="140" width="70" height="70" fill="black"/>
            <rect x="10" y="150" width="50" height="50" fill="white"/>
            <rect x="20" y="160" width="30" height="30" fill="black"/>
            
            {/* Data patterns */}
            <rect x="80" y="60" width="10" height="10" fill="black"/>
            <rect x="100" y="60" width="10" height="10" fill="black"/>
            <rect x="120" y="60" width="10" height="10" fill="black"/>
            <rect x="80" y="80" width="10" height="10" fill="black"/>
            <rect x="100" y="80" width="10" height="10" fill="black"/>
            <rect x="120" y="80" width="10" height="10" fill="black"/>
            <rect x="90" y="90" width="10" height="10" fill="black"/>
            <rect x="110" y="90" width="10" height="10" fill="black"/>
            <rect x="130" y="90" width="10" height="10" fill="black"/>
            
            {/* Bottom patterns */}
            <rect x="80" y="160" width="10" height="10" fill="black"/>
            <rect x="100" y="160" width="10" height="10" fill="black"/>
            <rect x="120" y="160" width="10" height="10" fill="black"/>
            <rect x="140" y="160" width="10" height="10" fill="black"/>
            <rect x="160" y="160" width="10" height="10" fill="black"/>
            <rect x="180" y="160" width="10" height="10" fill="black"/>
          </svg>
        </div>
        <div className="text-center mt-2">
          <div className="text-xs text-gray-500">Scan with wallet</div>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-25 p-3 rounded-lg border border-purple-200 text-center">
        <p className="text-xs text-gray-600 mb-1">Send exactly</p>
        <p className="text-lg font-bold text-[#7f5efd]">325.49 USDC</p>
      </div>

      {/* Address (shortened) */}
      <div className="bg-white p-3 rounded-lg border border-gray-200 relative">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Wallet Address</p>
          <p className="text-xs font-mono text-[#7f5efd] font-medium">
            0x1234...abcd
          </p>
        </div>
        <button className="absolute right-2 top-2 p-1 text-[#7f5efd] hover:bg-purple-50 rounded">
          <Copy className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function SuccessStage() {
  return (
    <div className="space-y-4 text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-12 w-12 text-green-500" />
      </div>

      {/* Success Message */}
      <div>
        <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-2">Payment Complete!</h3>
        <p className="text-sm text-gray-600">Your payment has been confirmed</p>
      </div>

      {/* Transaction Details */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Amount</span>
          <span className="font-medium text-gray-900">325.49 USDC</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Status</span>
          <span className="font-medium text-green-600">Confirmed</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Transaction</span>
          <span className="font-mono text-xs text-gray-500">0x789...def</span>
        </div>
      </div>

      {/* View Transaction Button */}
      <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50">
        <Globe className="h-4 w-4 mr-2" />
        View on Blockchain
      </Button>
    </div>
  );
}