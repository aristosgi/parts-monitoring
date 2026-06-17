from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, SessionLocal
from routers import inquiries, prices, activity, suppliers, statuses, pricing_rules
from models import Supplier, Status, PricingRule

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Part Numbers Monitoring API",
    description="API for tracking inquiries, part numbers, and supplier prices",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://127.0.0.1:5174",
                   "http://localhost:5175", "http://127.0.0.1:5175",
                   "http://localhost:5176", "http://127.0.0.1:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(inquiries.router)
app.include_router(prices.router)
app.include_router(activity.router)
app.include_router(suppliers.router)
app.include_router(statuses.router)
app.include_router(pricing_rules.router)


DEFAULT_STATUSES = [
    "Pending",
    "Waiting for Order",
    "Under Order",
    "In Transit",
    "Delivered",
    "Cancelled",
]

# (min_price, max_price, multiplier) — max_price None = no upper bound
DEFAULT_PRICING_RULES = [
    (0, 1, 3.0),
    (1, 30, 2.5),
    (30, 100, 2.0),
    (100, None, 1.5),
]


@app.on_event("startup")
async def seed_defaults():
    db = SessionLocal()
    try:
        if db.query(Supplier).count() == 0:
            db.add_all([
                Supplier(name="GR-Supplier-1", category="A"),
                Supplier(name="GR-Supplier-2", category="A"),
                Supplier(name="GR-Supplier-3", category="A"),
                Supplier(name="GR-Supplier-4", category="A"),
                Supplier(name="WEB-Supplier-A", category="B"),
                Supplier(name="WEB-Supplier-B", category="B"),
                Supplier(name="WEB-Supplier-C", category="B"),
            ])

        if db.query(Status).count() == 0:
            rows = []
            for scope in ("inquiry", "part"):
                for order, name in enumerate(DEFAULT_STATUSES):
                    rows.append(Status(name=name, scope=scope, display_order=order))
            db.add_all(rows)

        if db.query(PricingRule).count() == 0:
            db.add_all([
                PricingRule(min_price=mn, max_price=mx, multiplier=mult, display_order=order)
                for order, (mn, mx, mult) in enumerate(DEFAULT_PRICING_RULES)
            ])

        db.commit()
    finally:
        db.close()


INTERNAL_USERS = ["Simos", "Lenia", "Dimitris"]


@app.get("/api/config")
def get_config():
    """Static config. Statuses live in DB — fetch via /api/statuses?scope=..."""
    return {
        "users": INTERNAL_USERS,
        "urgency_levels": [1, 2, 3, 4, 5],
        "completed_statuses": ["Delivered", "Cancelled"],
        "fallback_status": "Pending",
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.get("/")
def root():
    return {
        "message": "Part Numbers Monitoring API",
        "docs": "/docs",
    }
