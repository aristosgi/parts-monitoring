from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import SupplierPriceCreate, SupplierPriceUpdate, SupplierPriceResponse
from crud import create_supplier_price, get_supplier_prices, get_supplier_price, update_supplier_price, delete_supplier_price, get_part

router = APIRouter(tags=["prices"])


@router.get("/api/prices/part/{part_id}", response_model=list[SupplierPriceResponse])
def get_part_prices(part_id: int, db: Session = Depends(get_db)):
    """Get all supplier prices for a part."""
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")

    return get_supplier_prices(db, part_id)


@router.post("/api/prices/part/{part_id}", response_model=SupplierPriceResponse)
def add_price(
    part_id: int,
    price: SupplierPriceCreate,
    performed_by: str = None,
    db: Session = Depends(get_db)
):
    """Add or update a supplier price for a part."""
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")

    if not performed_by:
        performed_by = db_part.logged_by

    return create_supplier_price(db, part_id, price, performed_by=performed_by)


@router.put("/api/prices/{price_id}", response_model=SupplierPriceResponse)
def edit_price(
    price_id: int,
    price_update: SupplierPriceUpdate,
    performed_by: str = None,
    db: Session = Depends(get_db)
):
    """Update a supplier price entry."""
    db_price = get_supplier_price(db, price_id)
    if not db_price:
        raise HTTPException(status_code=404, detail="Price entry not found")

    if not performed_by:
        performed_by = db_price.checked_by

    return update_supplier_price(db, price_id, price_update, performed_by=performed_by)


@router.delete("/api/prices/{price_id}")
def remove_price(price_id: int, performed_by: str = None, db: Session = Depends(get_db)):
    """Delete a supplier price entry."""
    db_price = get_supplier_price(db, price_id)
    if not db_price:
        raise HTTPException(status_code=404, detail="Price entry not found")

    if not performed_by:
        performed_by = db_price.checked_by

    if delete_supplier_price(db, price_id, performed_by=performed_by):
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete price entry")
