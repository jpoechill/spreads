'use client'

import { useState } from 'react'

export default function Home() {
  const [activeTab, setActiveTab] = useState('stocks')

  // Form state for margin calculator
  const [formData, setFormData] = useState({
    principal: '',
    pctGain: '',
    time: '',
    timeUnit: 'days',
    rate: '12.575',
    tax: '24'
  })

  // Results state
  const [results, setResults] = useState({
    days: 0,
    gross: 0,
    interest: 0,
    taxOut: 0,
    net: 0,
    roi: 0,
    stockPct: 0,
    netPct: 0,
    diff: 0
  })

  // Options calculator state
  const [optionsData, setOptionsData] = useState({
    strategy: 'bull-call',
    stockPrice: '',
    longStrike: '',
    shortStrike: '',
    longPremium: '',
    shortPremium: '',
    daysToExpiry: '',
    contracts: '1'
  })

  // Options results state
  const [optionsResults, setOptionsResults] = useState({
    maxProfit: 0,
    maxLoss: 0,
    breakeven: 0,
    netDebit: 0,
    returnOnRisk: 0,
    profitAtExpiry: 0
  })

  // Yearly gains calculator state
  const [yearlyData, setYearlyData] = useState({
    initialAmount: '',
    yearlyGrowthRate: '',
    yearlyContribution: ''
  })

  const [yearlyResults, setYearlyResults] = useState<Array<{
    year: number,
    amount: number,
    profit: number,
    totalGrowth: number
  }>>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleOptionsInputChange = (field: string, value: string) => {
    setOptionsData(prev => ({ ...prev, [field]: value }))
  }

  const handleYearlyInputChange = (field: string, value: string) => {
    setYearlyData(prev => ({ ...prev, [field]: value }))
  }

  const calculateMarginTax = () => {
    const principal = parseFloat(formData.principal)
    const pctGain = parseFloat(formData.pctGain)
    const t = parseFloat(formData.time)
    const rate = parseFloat(formData.rate)
    const taxRate = parseFloat(formData.tax)

    if ([principal, pctGain, t, rate, taxRate].some(v => isNaN(v))) return

    const days = formData.timeUnit === 'months' ? t * 365 / 12 : t
    const grossProfit = principal * (pctGain / 100)
    const interest = principal * (rate / 100) * (days / 365)
    const taxOnGain = Math.max(0, grossProfit) * (taxRate / 100)
    const net = grossProfit - interest - taxOnGain
    const roi = (net / principal) * 100
    const diff = pctGain - roi

    setResults({
      days: Math.round(days),
      gross: grossProfit,
      interest,
      taxOut: taxOnGain,
      net,
      roi,
      stockPct: pctGain,
      netPct: roi,
      diff
    })
  }

  const calculateOptionsSpread = () => {
    const stockPrice = parseFloat(optionsData.stockPrice)
    const longStrike = parseFloat(optionsData.longStrike)
    const shortStrike = parseFloat(optionsData.shortStrike)
    const longPremium = parseFloat(optionsData.longPremium)
    const shortPremium = parseFloat(optionsData.shortPremium)
    const contracts = parseFloat(optionsData.contracts)

    if ([stockPrice, longStrike, shortStrike, longPremium, shortPremium, contracts].some(v => isNaN(v))) return

    let maxProfit = 0
    let maxLoss = 0
    let breakeven = 0
    let netDebit = 0
    let profitAtExpiry = 0

    if (optionsData.strategy === 'bull-call') {
      netDebit = (longPremium - shortPremium) * contracts * 100
      maxProfit = ((shortStrike - longStrike) * contracts * 100) - netDebit
      maxLoss = netDebit
      breakeven = longStrike + (longPremium - shortPremium)

      if (stockPrice <= longStrike) {
        profitAtExpiry = -netDebit
      } else if (stockPrice >= shortStrike) {
        profitAtExpiry = maxProfit
      } else {
        profitAtExpiry = ((stockPrice - longStrike) * contracts * 100) - netDebit
      }
    } else if (optionsData.strategy === 'bear-call') {
      netDebit = (shortPremium - longPremium) * contracts * 100
      maxProfit = Math.abs(netDebit)
      maxLoss = ((shortStrike - longStrike) * contracts * 100) - Math.abs(netDebit)
      breakeven = longStrike + (shortPremium - longPremium)

      if (stockPrice <= longStrike) {
        profitAtExpiry = maxProfit
      } else if (stockPrice >= shortStrike) {
        profitAtExpiry = -maxLoss
      } else {
        profitAtExpiry = maxProfit - ((stockPrice - longStrike) * contracts * 100)
      }
    }

    const returnOnRisk = maxLoss > 0 ? (maxProfit / maxLoss) * 100 : 0

    setOptionsResults({
      maxProfit,
      maxLoss,
      breakeven,
      netDebit,
      returnOnRisk,
      profitAtExpiry
    })
  }

  const calculateYearlyGains = () => {
    const initialAmount = parseFloat(yearlyData.initialAmount)
    const growthRate = parseFloat(yearlyData.yearlyGrowthRate)
    const yearlyContribution = parseFloat(yearlyData.yearlyContribution) || 0

    if (isNaN(initialAmount) || isNaN(growthRate)) return

    const results = []
    const currentYear = new Date().getFullYear()
    const rate = growthRate / 100

    for (let i = 1; i <= 25; i++) {
      const year = currentYear + i

      // Calculate compound growth with annual contributions
      // Future value of initial amount
      const futureValueInitial = initialAmount * Math.pow(1 + rate, i)

      // Future value of annual contributions (annuity formula)
      const futureValueContributions = yearlyContribution > 0
        ? rate > 0
          ? yearlyContribution * (Math.pow(1 + rate, i) - 1) / rate
          : yearlyContribution * i  // Simple sum if no growth
        : 0

      const amount = futureValueInitial + futureValueContributions
      const totalContributions = initialAmount + (yearlyContribution * i)
      const profit = amount - totalContributions
      const totalGrowth = totalContributions > 0
        ? ((amount - totalContributions) / totalContributions) * 100
        : 0

      results.push({
        year,
        amount,
        profit,
        totalGrowth
      })
    }

    setYearlyResults(results)
  }

  const formatCurrency = (n: number, p = 2) => {
    return isFinite(n) ? (n < 0 ? `-$${Math.abs(n).toFixed(p)}` : `$${n.toFixed(p)}`) : '$0.00'
  }

  const formatPercent = (n: number, p = 2) => {
    return isFinite(n) ? `${n.toFixed(p)}%` : '0.00%'
  }

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.abs(v)))

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">SpreadMaster</h1>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('stocks')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'stocks'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Stocks
              </button>
              <button
                onClick={() => setActiveTab('options')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'options'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Options
              </button>
              <button
                onClick={() => setActiveTab('yearly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'yearly'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
              >
                Yearly Gains
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stocks Tab */}
        {activeTab === 'stocks' && (
          <section>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Margin Trading Calculator</h3>
              <p className="text-sm text-gray-600 mb-6">
                Calculate net profit after margin interest and capital gains tax.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Initial Margin Used</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="10,000"
                        value={formData.principal}
                        onChange={(e) => handleInputChange('principal', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Percent Gain on Trade</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="12.5"
                        value={formData.pctGain}
                        onChange={(e) => handleInputChange('pctGain', e.target.value)}
                        className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time in Position</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="45"
                        value={formData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                      <select
                        value={formData.timeUnit}
                        onChange={(e) => handleInputChange('timeUnit', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Margin Interest Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="12.575"
                        value={formData.rate}
                        onChange={(e) => handleInputChange('rate', e.target.value)}
                        className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Capital Gains Tax Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="24"
                        value={formData.tax}
                        onChange={(e) => handleInputChange('tax', e.target.value)}
                        className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <button
                    onClick={calculateMarginTax}
                    className="w-full bg-gray-900 text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                  >
                    Calculate
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Gross Profit</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(results.gross)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Interest Cost</div>
                      <div className="text-lg font-semibold text-red-600">{formatCurrency(results.interest)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Capital Gains Tax</div>
                      <div className="text-lg font-semibold text-red-600">{formatCurrency(results.taxOut)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Net Profit</div>
                      <div className={`text-lg font-semibold ${results.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(results.net)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Net ROI</div>
                      <div className={`text-lg font-semibold ${results.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(results.roi)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Holding Period</div>
                      <div className="text-lg font-semibold text-gray-900">{results.days} days</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Performance Comparison</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Stock Gain</span>
                      <span className="text-sm font-medium">{formatPercent(results.stockPct)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(clamp(results.stockPct), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Net ROI</span>
                      <span className="text-sm font-medium">{formatPercent(results.netPct)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${results.netPct >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(clamp(Math.abs(results.netPct)), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <section>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Options Spread Calculator</h3>
              <p className="text-sm text-gray-600 mb-4">
                Calculate Bull Call and Bear Call spreads with advanced metrics.
              </p>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  🐂 Bull Call Spread
                </div>
                <div className="text-sm text-blue-800 mb-3">
                  Bullish strategy: Buy call at lower strike, sell call at higher strike. Limited profit potential with reduced cost.
                </div>
                <div className="text-sm font-medium text-blue-900 mb-1">
                  🐻 Bear Call Spread
                </div>
                <div className="text-sm text-blue-800">
                  Bearish strategy: Sell call at lower strike, buy call at higher strike. Profit when stock stays below short strike.
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Strategy Type</label>
                    <select
                      value={optionsData.strategy}
                      onChange={(e) => handleOptionsInputChange('strategy', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <option value="bull-call">Bull Call Spread</option>
                      <option value="bear-call">Bear Call Spread</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="450.00"
                        value={optionsData.stockPrice}
                        onChange={(e) => handleOptionsInputChange('stockPrice', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {optionsData.strategy === 'bull-call' ? 'Buy Strike' : 'Sell Strike'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="440"
                          value={optionsData.longStrike}
                          onChange={(e) => handleOptionsInputChange('longStrike', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {optionsData.strategy === 'bull-call' ? 'Sell Strike' : 'Buy Strike'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="460"
                          value={optionsData.shortStrike}
                          onChange={(e) => handleOptionsInputChange('shortStrike', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {optionsData.strategy === 'bull-call' ? 'Buy Premium' : 'Sell Premium'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="15.50"
                          value={optionsData.longPremium}
                          onChange={(e) => handleOptionsInputChange('longPremium', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {optionsData.strategy === 'bull-call' ? 'Sell Premium' : 'Buy Premium'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="8.75"
                          value={optionsData.shortPremium}
                          onChange={(e) => handleOptionsInputChange('shortPremium', e.target.value)}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Days to Expiry</label>
                      <input
                        type="number"
                        placeholder="30"
                        value={optionsData.daysToExpiry}
                        onChange={(e) => handleOptionsInputChange('daysToExpiry', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contracts</label>
                      <input
                        type="number"
                        placeholder="1"
                        value={optionsData.contracts}
                        onChange={(e) => handleOptionsInputChange('contracts', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    onClick={calculateOptionsSpread}
                    className="w-full bg-gray-900 text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                  >
                    Calculate Spread
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="text-xs text-green-600 mb-1">Max Profit</div>
                      <div className="text-lg font-semibold text-green-700">{formatCurrency(optionsResults.maxProfit)}</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <div className="text-xs text-red-600 mb-1">Max Loss</div>
                      <div className="text-lg font-semibold text-red-700">{formatCurrency(optionsResults.maxLoss)}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-xs text-blue-600 mb-1">Breakeven</div>
                      <div className="text-lg font-semibold text-blue-700">${optionsResults.breakeven.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Net {optionsResults.netDebit >= 0 ? 'Debit' : 'Credit'}</div>
                      <div className="text-lg font-semibold text-gray-900">{formatCurrency(Math.abs(optionsResults.netDebit))}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Return on Risk</div>
                      <div className="text-lg font-semibold text-gray-900">{formatPercent(optionsResults.returnOnRisk)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Current P&L</div>
                      <div className={`text-lg font-semibold ${optionsResults.profitAtExpiry >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(optionsResults.profitAtExpiry)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Yearly Gains Tab */}
        {activeTab === 'yearly' && (
          <section>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Yearly Gains Calculator</h3>
              <p className="text-sm text-gray-600 mb-6">
                See compound growth over 25 years with a consistent annual return.
              </p>

              <div className="space-y-6">
                {/* Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Initial Investment</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="10,000"
                        value={yearlyData.initialAmount}
                        onChange={(e) => handleYearlyInputChange('initialAmount', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yearly Contribution</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="1,200"
                        value={yearlyData.yearlyContribution}
                        onChange={(e) => handleYearlyInputChange('yearlyContribution', e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Annual Growth Rate</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="7.00"
                        value={yearlyData.yearlyGrowthRate}
                        onChange={(e) => handleYearlyInputChange('yearlyGrowthRate', e.target.value)}
                        className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={calculateYearlyGains}
                      className="w-full bg-gray-900 text-white py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
                    >
                      Calculate Growth
                    </button>
                  </div>
                </div>

                {/* Results Row */}
                {yearlyResults.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-900">25-Year Growth Projection</h4>
                    <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-4 gap-4 p-3 bg-gray-50 font-medium text-sm text-gray-700 border-b">
                        <div>Year</div>
                        <div>Total Value</div>
                        <div>Profit</div>
                        <div>Growth %</div>
                      </div>
                      {yearlyResults.map((result, index) => (
                        <div key={result.year} className={`grid grid-cols-4 gap-4 p-3 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                          <div className="font-medium text-gray-900">{result.year}</div>
                          <div className="font-semibold text-green-600">{formatCurrency(result.amount)}</div>
                          <div className="font-semibold text-blue-600">{formatCurrency(result.profit)}</div>
                          <div className="font-semibold text-purple-600">{formatPercent(result.totalGrowth)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-1">
                        📈 Compound Interest Magic
                      </div>
                      <div className="text-sm text-blue-800">
                        With {formatPercent(parseFloat(yearlyData.yearlyGrowthRate) || 0)} annual growth{(parseFloat(yearlyData.yearlyContribution) || 0) > 0 ? ` and ${formatCurrency(parseFloat(yearlyData.yearlyContribution) || 0)} yearly contributions` : ''}, your {formatCurrency(parseFloat(yearlyData.initialAmount) || 0)} initial investment could grow to {formatCurrency(yearlyResults[24]?.amount || 0)} over 25 years!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              © 2025 SpreadMaster. Professional trading tools for modern investors.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}