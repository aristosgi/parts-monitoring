from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import StatusCreate, StatusUpdate, StatusResponse, StatusDeleteResult
from crud import (
    get_statuses, get_status, create_status, update_status_row, delete_status,
)
from models import Status

ADMIN_PASSWORD = "123"  # Keep in sync with routers/suppliers.py

router = APIRouter(tags=["statuses"])

VALID_SCOPES = {"inquiry", "part"}


def _verify_admin(admin_password: str):
    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


def _validate_scope(scope: str):
    if scope not in VALID_SCOPES:
        raise HTTPException(status_code=400, detail="scope must be 'inquiry' or 'part'")


@router.get("/api/statuses", response_model=list[StatusResponse])
def list_active_statuses(scope: str = Query(None), db: Session = Depends(get_db)):
    """Public: list active statuses, optionally filtered by scope."""
    if scope:
        _validate_scope(scope)
    return get_statuses(db, scope=scope, active_only=True)


@router.get("/api/admin/statuses", response_model=list[StatusResponse])
def list_all_statuses(
    admin_password: str = Query(...),
    scope: str = Query(None),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    if scope:
        _validate_scope(scope)
    return get_statuses(db, scope=scope, active_only=False)


@router.post("/api/admin/statuses", response_model=StatusResponse)
def add_status(
    payload: StatusCreate,
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    _validate_scope(payload.scope)

    existing = db.query(Status).filter(
        Status.name == payload.name, Status.scope == payload.scope
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Status '{payload.name}' already exists for scope '{payload.scope}'",
        )
    return create_status(db, payload)


@router.put("/api/admin/statuses/{status_id}", response_model=StatusResponse)
def edit_status(
    status_id: int,
    payload: StatusUpdate,
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    db_status = get_status(db, status_id)
    if not db_status:
        raise HTTPException(status_code=404, detail="Status not found")

    # Name uniqueness within the same scope
    if payload.name and payload.name != db_status.name:
        clash = db.query(Status).filter(
            Status.name == payload.name,
            Status.scope == db_status.scope,
            Status.id != status_id,
        ).first()
        if clash:
            raise HTTPException(
                status_code=400,
                detail=f"Status '{payload.name}' already exists for scope '{db_status.scope}'",
            )

    return update_status_row(db, status_id, payload)


@router.delete("/api/admin/statuses/{status_id}", response_model=StatusDeleteResult)
def remove_status(
    status_id: int,
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    """Hard-delete a status. Any inquiries/parts using it are reset to 'Pending'."""
    _verify_admin(admin_password)

    target = get_status(db, status_id)
    if not target:
        raise HTTPException(status_code=404, detail="Status not found")
    if target.name == "Pending":
        raise HTTPException(
            status_code=400,
            detail="'Pending' is the fallback status and cannot be deleted",
        )

    ok, reset_count = delete_status(db, status_id)
    return {"status": "deleted", "reset_count": reset_count}
