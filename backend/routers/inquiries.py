from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from schemas import (
    InquiryCreate, InquiryUpdate, InquiryStatusUpdate,
    InquiryListItem, InquiryDetailResponse,
    PartCreate, PartUpdate, PartStatusUpdate, PartResponse,
)
from crud import (
    create_inquiry, get_inquiry, list_inquiries, update_inquiry,
    update_inquiry_status, delete_inquiry,
    add_part_to_inquiry, get_part, update_part, update_part_status, delete_part,
)

router = APIRouter(tags=["inquiries"])


# ============ Inquiry endpoints ============

@router.get("/api/inquiries", response_model=list[InquiryListItem])
def list_all_inquiries(
    search: str = None,
    logged_by: str = None,
    urgency: str = None,
    status: str = None,
    db: Session = Depends(get_db),
):
    """List all inquiries with optional filters. Returns compact list w/ part summary."""
    search = search if search else None
    logged_by = logged_by if logged_by else None
    status = status if status else None
    urgency_int = None
    if urgency and urgency.strip():
        try:
            urgency_int = int(urgency)
        except ValueError:
            urgency_int = None

    inquiries = list_inquiries(db, search=search, logged_by=logged_by,
                              urgency=urgency_int, status=status)
    return [
        InquiryListItem(
            id=inq.id,
            requested_by=inq.requested_by,
            urgency=inq.urgency,
            status=inq.status,
            logged_by=inq.logged_by,
            created_at=inq.created_at,
            updated_at=inq.updated_at,
            part_count=len(inq.parts),
            part_numbers=[p.part_number for p in inq.parts],
        )
        for inq in inquiries
    ]


@router.post("/api/inquiries", response_model=InquiryDetailResponse)
def add_inquiry(inquiry: InquiryCreate, db: Session = Depends(get_db)):
    """Create a new inquiry with its parts."""
    return create_inquiry(db, inquiry)


@router.get("/api/inquiries/{inquiry_id}", response_model=InquiryDetailResponse)
def get_inquiry_detail(inquiry_id: int, db: Session = Depends(get_db)):
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return db_inquiry


@router.put("/api/inquiries/{inquiry_id}", response_model=InquiryDetailResponse)
def edit_inquiry(
    inquiry_id: int,
    update: InquiryUpdate,
    performed_by: str = None,
    db: Session = Depends(get_db),
):
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    if not performed_by:
        performed_by = db_inquiry.logged_by
    return update_inquiry(db, inquiry_id, update, performed_by=performed_by)


@router.patch("/api/inquiries/{inquiry_id}/status", response_model=InquiryDetailResponse)
def change_inquiry_status(
    inquiry_id: int,
    payload: InquiryStatusUpdate,
    db: Session = Depends(get_db),
):
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return update_inquiry_status(db, inquiry_id, payload.status, performed_by=payload.performed_by)


@router.delete("/api/inquiries/{inquiry_id}")
def remove_inquiry(inquiry_id: int, performed_by: str = None, db: Session = Depends(get_db)):
    """Delete an inquiry (with all its parts and prices). Use when order completed."""
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    if not performed_by:
        performed_by = db_inquiry.logged_by
    if delete_inquiry(db, inquiry_id, performed_by=performed_by):
        return {"status": "deleted"}
    raise HTTPException(status_code=500, detail="Failed to delete inquiry")


# ============ Part endpoints (nested under inquiry) ============

@router.post("/api/inquiries/{inquiry_id}/parts", response_model=PartResponse)
def add_part(
    inquiry_id: int,
    part: PartCreate,
    performed_by: str = None,
    db: Session = Depends(get_db),
):
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    if not performed_by:
        performed_by = db_inquiry.logged_by
    return add_part_to_inquiry(db, inquiry_id, part, performed_by=performed_by)


@router.get("/api/parts/{part_id}", response_model=PartResponse)
def get_part_detail(part_id: int, db: Session = Depends(get_db)):
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    return db_part


@router.put("/api/parts/{part_id}", response_model=PartResponse)
def edit_part(
    part_id: int,
    update: PartUpdate,
    performed_by: str = None,
    db: Session = Depends(get_db),
):
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    if not performed_by:
        performed_by = db_part.inquiry.logged_by if db_part.inquiry else "system"
    return update_part(db, part_id, update, performed_by=performed_by)


@router.patch("/api/parts/{part_id}/status", response_model=PartResponse)
def change_part_status(
    part_id: int,
    payload: PartStatusUpdate,
    db: Session = Depends(get_db),
):
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    return update_part_status(db, part_id, payload.status, performed_by=payload.performed_by)


@router.delete("/api/parts/{part_id}")
def remove_part(part_id: int, performed_by: str = None, db: Session = Depends(get_db)):
    db_part = get_part(db, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    if not performed_by:
        performed_by = db_part.inquiry.logged_by if db_part.inquiry else "system"
    if delete_part(db, part_id, performed_by=performed_by):
        return {"status": "deleted"}
    raise HTTPException(status_code=500, detail="Failed to delete part")
