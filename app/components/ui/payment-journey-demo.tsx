"use client";

import { useState, useEffect } from "react";
import { Bitcoin, Zap, Network, CheckCircle, ArrowRight, DollarSign, Copy, Globe, ShoppingBag, Play, Pause, ChevronLeft, ChevronRight, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { QRCode } from "@/app/components/ui/qr-code";

export function PaymentJourneyDemo() {
  const [currentStage, setCurrentStage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through stages
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStage((prev) => (prev + 1) % 3);
        setIsAnimating(false);
      }, 200);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToStage = (stageIndex: number) => {
    if (stageIndex === currentStage) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStage(stageIndex);
      setIsAnimating(false);
    }, 200);
  };

  const nextStage = () => {
    const nextIndex = (currentStage + 1) % 3;
    goToStage(nextIndex);
  };

  const prevStage = () => {
    const prevIndex = currentStage === 0 ? 2 : currentStage - 1;
    goToStage(prevIndex);
  };

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
      {/* Stage Indicators and Controls */}
      <div className="flex justify-center items-center mb-6 space-x-4">
        {/* Previous Button */}
        <button
          onClick={prevStage}
          className="p-1.5 rounded-full hover:bg-purple-100 transition-colors group"
          title="Previous step"
        >
          <ChevronLeft className="h-4 w-4 text-gray-400 group-hover:text-[#7f5efd]" />
        </button>

        {/* Stage Indicators */}
        <div className="flex space-x-2">
          {stages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToStage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-125 ${
                index === currentStage
                  ? 'bg-[#7f5efd] w-6'
                  : index < currentStage
                  ? 'bg-[#7f5efd] opacity-50'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              title={`Go to ${stages[index].title}`}
            />
          ))}
        </div>

        {/* Pause/Play Button */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="p-1.5 rounded-full hover:bg-purple-100 transition-colors group"
          title={isPaused ? "Resume auto-play" : "Pause auto-play"}
        >
          {isPaused ? (
            <Play className="h-4 w-4 text-gray-400 group-hover:text-[#7f5efd]" />
          ) : (
            <Pause className="h-4 w-4 text-gray-400 group-hover:text-[#7f5efd]" />
          )}
        </button>

        {/* Next Button */}
        <button
          onClick={nextStage}
          className="p-1.5 rounded-full hover:bg-purple-100 transition-colors group"
          title="Next step"
        >
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-[#7f5efd]" />
        </button>
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
      {/* Fee Breakdown */}
      <div className="bg-gradient-to-br from-purple-50 to-white p-3 rounded-xl border border-purple-100">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingBag className="h-3 w-3 text-[#7f5efd]" />
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Summary</span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold text-gray-900">$299.99</span>
          </div>
          <div className="flex justify-between items-center text-[#7f5efd]">
            <span>Tax (6%)</span>
            <span className="font-medium">+$18.00</span>
          </div>
          <div className="flex justify-between items-center text-[#7f5efd]">
            <span>Gateway fee (0.5%)</span>
            <span className="font-medium">+$1.50</span>
          </div>
          <div className="flex justify-between items-center font-bold border-t border-purple-100 pt-1">
            <span className="text-gray-700">Total</span>
            <span className="text-[#7f5efd]">$319.49</span>
          </div>
        </div>
      </div>

      {/* Network Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
          <Network className="h-3 w-3 text-[#7f5efd]" />
          Network
        </label>
        <div className="h-10 bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-lg flex items-center px-3">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-4 w-4 text-[#f7931a]" />
            <span className="text-sm font-medium text-gray-900">Bitcoin</span>
          </div>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 uppercase tracking-wider flex items-center gap-1">
          <Bitcoin className="h-3 w-3 text-[#7f5efd]" />
          Currency
        </label>
        <div className="h-10 bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-lg flex items-center px-3">
          <div className="flex items-center gap-2">
            <Bitcoin className="h-4 w-4 text-[#f7931a]" />
            <span className="text-sm font-medium text-gray-900">BTC</span>
            <span className="text-xs text-gray-500">Bitcoin</span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <Button className="w-full h-10 text-sm bg-gradient-to-r from-[#7f5efd] to-[#9b7cff] hover:from-[#7c3aed] hover:to-[#8b6cef] text-white rounded-lg shadow-lg">
        Pay with BTC
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
          <Clock className="h-5 w-5 text-[#7f5efd] animate-spin" />
          <span className="text-sm font-medium text-gray-700">Awaiting Payment</span>
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="mx-auto">
          <QRCode
            currency="BTC"
            address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh9w8r5t"
            size={128}
            hideDetails
            className="mx-auto"
          />
        </div>
        <div className="text-center mt-2">
          <div className="text-xs text-gray-500">Scan with wallet</div>
        </div>
      </div>

      {/* Amount */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-25 p-3 rounded-lg border border-purple-200 text-center">
        <p className="text-xs text-gray-600 mb-1">Send exactly</p>
        <p className="text-lg font-bold text-[#7f5efd]">0.00748 BTC</p>
      </div>

      {/* Address - Full Address with Gradient */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-25 p-3 rounded-lg border border-purple-200 relative">
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Wallet Address</p>
          <p className="text-xs font-mono text-[#7f5efd] font-medium break-all leading-relaxed">
            bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh9w8r5t
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
  const [receiptEmail, setReceiptEmail] = useState("");
  const [receiptSent, setReceiptSent] = useState(false);

  const handleSendReceipt = () => {
    if (receiptEmail) {
      setReceiptSent(true);
      setTimeout(() => setReceiptSent(false), 3000); // Reset after 3 seconds
    }
  };

  return (
    <div className="space-y-4 text-center">
      {/* Success Icon */}
      <div className="w-12 h-12 bg-[#f5f3ff] rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="h-7 w-7 text-[#7f5efd]" />
      </div>

      {/* Success Message */}
      <div>
        <h3 className="font-phonic text-lg font-semibold text-gray-900 mb-2">Payment Complete!</h3>
        <p className="text-sm text-gray-600">Your Bitcoin payment has been confirmed</p>
      </div>

      {/* Transaction Details - Purple Background */}
      <div className="bg-gradient-to-br from-purple-50 to-[#f8f7ff] border border-purple-200 rounded-lg p-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Amount</span>
          <span className="font-medium text-gray-900">0.00748 BTC</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">USD Value</span>
          <span className="font-medium text-gray-900">$319.49</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Status</span>
          <span className="font-medium text-green-600">Confirmed</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Transaction Hash</span>
          <span className="font-mono text-xs text-gray-500">
            a1b2c3d...x9y8z7
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* View Transaction Button - Purple */}
        <Button variant="outline" size="sm" className="w-full border-[#7f5efd] text-[#7f5efd] hover:bg-purple-50">
          <Globe className="h-4 w-4 mr-2" />
          View on Blockchain
        </Button>

        {/* Receipt Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-[#7f5efd]" />
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Send Receipt</span>
          </div>
          
          {!receiptSent ? (
            <div className="space-y-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={receiptEmail}
                onChange={(e) => setReceiptEmail(e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#7f5efd] focus:border-[#7f5efd]"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSendReceipt}
                disabled={!receiptEmail}
                className={`w-full h-7 text-xs transition-colors ${
                  receiptEmail 
                    ? 'border-[#7f5efd] text-[#7f5efd] hover:bg-purple-50' 
                    : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                Send Receipt
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Receipt sent!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}