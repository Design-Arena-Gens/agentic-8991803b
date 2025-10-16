import { useState, useEffect } from 'react'
import './App.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PlusCircle, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Stock {
  symbol: string
  name: string
  shares: number
  purchase_price: number
  current_price: number
  purchase_date: string
}

interface Portfolio {
  id: string
  stocks: Stock[]
  total_value: number
  total_cost: number
  total_gain_loss: number
  total_gain_loss_percent: number
}

function App() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStock, setNewStock] = useState({
    symbol: '',
    name: '',
    shares: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0]
  })

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`${API_URL}/api/portfolio`)
      if (!response.ok) throw new Error('Failed to fetch portfolio')
      const data = await response.json()
      setPortfolio(data)
      setError(null)
    } catch (err) {
      setError('Failed to load portfolio')
      console.error(err)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  const handleAddStock = async () => {
    if (!newStock.symbol || !newStock.name || !newStock.shares || !newStock.purchase_price) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: newStock.symbol,
          name: newStock.name,
          shares: parseFloat(newStock.shares),
          purchase_price: parseFloat(newStock.purchase_price),
          purchase_date: newStock.purchase_date
        })
      })

      if (!response.ok) throw new Error('Failed to add stock')

      setNewStock({
        symbol: '',
        name: '',
        shares: '',
        purchase_price: '',
        purchase_date: new Date().toISOString().split('T')[0]
      })
      setIsAddDialogOpen(false)
      await fetchPortfolio()
      setError(null)
    } catch (err) {
      setError('Failed to add stock')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePrice = async (stockIndex: number, newPrice: number) => {
    if (!portfolio) return

    try {
      const stocks = await fetch(`${API_URL}/api/stocks`).then(r => r.json())
      const stockId = Object.keys(stocks)[stockIndex]
      
      const response = await fetch(`${API_URL}/api/stocks/${stockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_price: newPrice })
      })

      if (!response.ok) throw new Error('Failed to update price')
      
      await fetchPortfolio()
      setError(null)
    } catch (err) {
      setError('Failed to update stock price')
      console.error(err)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return value.toFixed(2) + '%'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Stock Portfolio Tracker</h1>
            <p className="text-slate-600 mt-2">Monitor your investments in real-time</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Add New Stock</DialogTitle>
                <DialogDescription>
                  Enter the details of your stock purchase
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="symbol">Stock Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="AAPL"
                    value={newStock.symbol}
                    onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="Apple Inc."
                    value={newStock.name}
                    onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="shares">Number of Shares</Label>
                  <Input
                    id="shares"
                    type="number"
                    placeholder="10"
                    value={newStock.shares}
                    onChange={(e) => setNewStock({ ...newStock, shares: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Purchase Price per Share</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="150.00"
                    value={newStock.purchase_price}
                    onChange={(e) => setNewStock({ ...newStock, purchase_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date">Purchase Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newStock.purchase_date}
                    onChange={(e) => setNewStock({ ...newStock, purchase_date: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={handleAddStock} 
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Adding...' : 'Add Stock'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {portfolio && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-lg border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-slate-600">
                    <Wallet className="h-4 w-4" />
                    Total Value
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-slate-900">
                    {formatCurrency(portfolio.total_value)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white shadow-lg border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-slate-600">
                    <DollarSign className="h-4 w-4" />
                    Total Cost
                  </CardDescription>
                  <CardTitle className="text-3xl font-bold text-slate-900">
                    {formatCurrency(portfolio.total_cost)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className={`bg-white shadow-lg border-l-4 ${portfolio.total_gain_loss >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-slate-600">
                    {portfolio.total_gain_loss >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    Gain/Loss
                  </CardDescription>
                  <CardTitle className={`text-3xl font-bold ${portfolio.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(portfolio.total_gain_loss)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className={`bg-white shadow-lg border-l-4 ${portfolio.total_gain_loss_percent >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2 text-slate-600">
                    {portfolio.total_gain_loss_percent >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    Return
                  </CardDescription>
                  <CardTitle className={`text-3xl font-bold ${portfolio.total_gain_loss_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(portfolio.total_gain_loss_percent)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Your Holdings</CardTitle>
                <CardDescription>Track and manage your stock positions</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolio.stocks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-lg">No stocks in portfolio yet</p>
                    <p className="text-sm mt-2">Click "Add Stock" to get started</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Shares</TableHead>
                        <TableHead className="text-right">Purchase Price</TableHead>
                        <TableHead className="text-right">Current Price</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead className="text-right">Gain/Loss</TableHead>
                        <TableHead className="text-right">Return</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.stocks.map((stock, index) => {
                        const totalValue = stock.current_price * stock.shares
                        const totalCost = stock.purchase_price * stock.shares
                        const gainLoss = totalValue - totalCost
                        const gainLossPercent = (gainLoss / totalCost) * 100

                        return (
                          <TableRow key={index}>
                            <TableCell className="font-bold text-blue-600">{stock.symbol}</TableCell>
                            <TableCell>{stock.name}</TableCell>
                            <TableCell className="text-right">{stock.shares}</TableCell>
                            <TableCell className="text-right">{formatCurrency(stock.purchase_price)}</TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                value={stock.current_price}
                                onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value))}
                                className="w-24 text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(totalValue)}</TableCell>
                            <TableCell className={`text-right font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(gainLoss)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={gainLoss >= 0 ? 'default' : 'destructive'} className={gainLoss >= 0 ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                                {formatPercent(gainLossPercent)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

export default App
