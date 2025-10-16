from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Stock(BaseModel):
    symbol: str
    name: str
    shares: float
    purchase_price: float
    current_price: float
    purchase_date: str

class StockCreate(BaseModel):
    symbol: str
    name: str
    shares: float
    purchase_price: float
    purchase_date: str

class StockUpdate(BaseModel):
    current_price: float

class Portfolio(BaseModel):
    id: str
    stocks: List[Stock]
    total_value: float
    total_cost: float
    total_gain_loss: float
    total_gain_loss_percent: float

portfolio_db = {}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/stocks", response_model=Stock)
async def add_stock(stock: StockCreate):
    stock_id = str(uuid.uuid4())
    new_stock = Stock(
        symbol=stock.symbol.upper(),
        name=stock.name,
        shares=stock.shares,
        purchase_price=stock.purchase_price,
        current_price=stock.purchase_price,
        purchase_date=stock.purchase_date
    )
    portfolio_db[stock_id] = new_stock.dict()
    return new_stock

@app.get("/api/stocks", response_model=List[Stock])
async def get_stocks():
    return list(portfolio_db.values())

@app.get("/api/stocks/{stock_id}", response_model=Stock)
async def get_stock(stock_id: str):
    if stock_id not in portfolio_db:
        raise HTTPException(status_code=404, detail="Stock not found")
    return portfolio_db[stock_id]

@app.put("/api/stocks/{stock_id}", response_model=Stock)
async def update_stock(stock_id: str, stock_update: StockUpdate):
    if stock_id not in portfolio_db:
        raise HTTPException(status_code=404, detail="Stock not found")
    portfolio_db[stock_id]["current_price"] = stock_update.current_price
    return portfolio_db[stock_id]

@app.delete("/api/stocks/{stock_id}")
async def delete_stock(stock_id: str):
    if stock_id not in portfolio_db:
        raise HTTPException(status_code=404, detail="Stock not found")
    del portfolio_db[stock_id]
    return {"message": "Stock deleted successfully"}

@app.get("/api/portfolio", response_model=Portfolio)
async def get_portfolio():
    stocks = list(portfolio_db.values())
    total_value = sum(stock["current_price"] * stock["shares"] for stock in stocks)
    total_cost = sum(stock["purchase_price"] * stock["shares"] for stock in stocks)
    total_gain_loss = total_value - total_cost
    total_gain_loss_percent = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0
    
    return Portfolio(
        id="main",
        stocks=stocks,
        total_value=total_value,
        total_cost=total_cost,
        total_gain_loss=total_gain_loss,
        total_gain_loss_percent=total_gain_loss_percent
    )
