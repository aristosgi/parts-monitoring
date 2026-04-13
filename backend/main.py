from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine, SessionLocal
from routers import parts, prices, activity, suppliers
from models import Supplier

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Part Numbers Monitoring API",
    description="API for tracking part numbers and supplier prices",
    version="1.0.0"
)

# Add CORS middleware (allow frontend on any port)
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

# Include routers
app.include_router(parts.router)
app.include_router(prices.router)
app.include_router(activity.router)
app.include_router(suppliers.router)


# ============ Seed Suppliers on Startup ============

@app.on_event("startup")
async def seed_suppliers():
    """Seed default suppliers on first startup."""
    db = SessionLocal()
    try:
        supplier_count = db.query(Supplier).count()
        if supplier_count == 0:
            defaults = [
                Supplier(name="GR-Supplier-1", category="A"),
                Supplier(name="GR-Supplier-2", category="A"),
                Supplier(name="GR-Supplier-3", category="A"),
                Supplier(name="GR-Supplier-4", category="A"),
                Supplier(name="WEB-Supplier-A", category="B"),
                Supplier(name="WEB-Supplier-B", category="B"),
                Supplier(name="WEB-Supplier-C", category="B"),
            ]
            db.add_all(defaults)
            db.commit()
    finally:
        db.close()


# ============ Static Data Endpoints ============

ALLOWED_STATUSES = [
    "Pending",
    "Waiting for Order",
    "Under Order",
    "In Transit",
    "Delivered",
    "Cancelled"
]

INTERNAL_USERS = ["Simos", "Lenia", "Dimitris"]


@app.get("/api/config")
def get_config():
    """Get static configuration."""
    return {
        "statuses": ALLOWED_STATUSES,
        "users": INTERNAL_USERS,
        "urgency_levels": [1, 2, 3, 4, 5]
    }


@app.get("/api/health")
def health_check():
    """Simple health check."""
    return {"status": "ok"}


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Part Numbers Monitoring API",
        "docs": "/docs",
        "openapi": "/openapi.json"
    }
