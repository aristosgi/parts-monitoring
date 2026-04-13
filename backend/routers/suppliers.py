from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import SupplierCreate, SupplierUpdate, SupplierResponse
from crud import get_suppliers, get_supplier, create_supplier, update_supplier, delete_supplier
from models import Supplier

ADMIN_PASSWORD = "123"

router = APIRouter(tags=["suppliers"])


def verify_admin(admin_password: str = Query(None)) -> bool:
    """Simple admin verification."""
    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True


@router.get("/api/suppliers", response_model=list[SupplierResponse])
def list_active_suppliers(db: Session = Depends(get_db)):
    """Get all active suppliers (public endpoint)."""
    return get_suppliers(db, active_only=True)


@router.get("/api/admin/suppliers", response_model=list[SupplierResponse])
def list_all_suppliers(
    admin_password: str = Query(...),
    db: Session = Depends(get_db)
):
    """Get all suppliers including inactive (admin only)."""
    verify_admin(admin_password)
    return get_suppliers(db, active_only=False)


@router.post("/api/admin/suppliers", response_model=SupplierResponse)
def add_supplier(
    supplier: SupplierCreate,
    admin_password: str = Query(...),
    db: Session = Depends(get_db)
):
    """Create a new supplier (admin only)."""
    verify_admin(admin_password)

    existing = db.query(Supplier).filter(Supplier.name == supplier.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Supplier name already exists")

    return create_supplier(db, supplier)


@router.put("/api/admin/suppliers/{supplier_id}", response_model=SupplierResponse)
def edit_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    admin_password: str = Query(...),
    db: Session = Depends(get_db)
):
    """Update a supplier (admin only)."""
    verify_admin(admin_password)

    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    return update_supplier(db, supplier_id, supplier_update)


@router.delete("/api/admin/suppliers/{supplier_id}")
def remove_supplier(
    supplier_id: int,
    admin_password: str = Query(...),
    db: Session = Depends(get_db)
):
    """Delete a supplier (admin only)."""
    verify_admin(admin_password)

    if delete_supplier(db, supplier_id):
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=404, detail="Supplier not found")


@router.post("/api/admin/login")
def admin_login(credentials: dict):
    """Admin login endpoint."""
    password = credentials.get("password")
    if password == ADMIN_PASSWORD:
        return {"success": True}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")
