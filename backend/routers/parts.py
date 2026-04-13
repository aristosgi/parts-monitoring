from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import PartCreate, PartUpdate, PartStatusUpdate, PartResponse, PartDetailResponse
from crud import create_part, get_part, list_parts, update_part, update_part_status, delete_part, get_part_by_number

router = APIRouter(tags=["parts"])


@router.get("/api/parts", response_model=list[PartResponse])
def list_all_parts(
    search: str = None,
    logged_by: str = None,
    urgency: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """List all parts with optional filters."""
    # Convert empty strings to None
    search = search if search else None
    logged_by = logged_by if logged_by else None
    status = status if status else None
    urgency_int = None
    if urgency and urgency.strip():
        try:
            urgency_int = int(urgency)
        except ValueError:
            urgency_int = None

    return list_parts(db, search=search, logged_by=logged_by, urgency=urgency_int, status=status)


@router.post("/api/parts", response_model=PartResponse)
def add_part(part: PartCreate, db: Session = Depends(get_db)):
    """Create a new part."""
    existing = get_part_by_number(db, part.part_number)
    if existing:
        raise HTTPException(status_code=400, detail="Part number already exists")

    return create_part(db, part, performed_by=part.logged_by)


@router.get("/api/parts/{part_id}", response_model=PartDetailResponse)
def get_part_detail(part_id: int, db: Session = Depends(get_db)):
    """Get detailed info for a single part."""
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    return db_part


@router.put("/api/parts/{part_id}", response_model=PartResponse)
def edit_part(
    part_id: int,
    part_update: PartUpdate,
    performed_by: str = None,
    db: Session = Depends(get_db)
):
    """Update part metadata."""
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")

    if not performed_by:
        performed_by = db_part.logged_by

    return update_part(db, part_id, part_update, performed_by=performed_by)


@router.patch("/api/parts/{part_id}/status", response_model=PartResponse)
def change_status(
    part_id: int,
    status_update: PartStatusUpdate,
    db: Session = Depends(get_db)
):
    """Change the status of a part."""
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")

    return update_part_status(db, part_id, status_update.status, performed_by=status_update.performed_by)


@router.delete("/api/parts/{part_id}")
def remove_part(part_id: int, performed_by: str = None, db: Session = Depends(get_db)):
    """Delete a part."""
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")

    if not performed_by:
        performed_by = db_part.logged_by

    if delete_part(db, part_id, performed_by=performed_by):
        return {"status": "deleted"}
    else:
        raise HTTPException(status_code=500, detail="Failed to delete part")
