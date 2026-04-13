from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import ActivityLogResponse
from crud import get_activity_logs, get_part

router = APIRouter(tags=["activity"])


@router.get("/api/activity", response_model=list[ActivityLogResponse])
def get_global_activity(
    performed_by: str = Query(None),
    action_type: str = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get global activity log with optional filters."""
    return get_activity_logs(
        db,
        part_id=None,
        performed_by=performed_by,
        action_type=action_type,
        limit=limit
    )


@router.get("/api/activity/part/{part_id}", response_model=list[ActivityLogResponse])
def get_part_activity(
    part_id: int,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get activity log for a specific part."""
    db_part = get_part(db, part_id)
    if not db_part:
        # Still return empty list, don't fail
        return []

    return get_activity_logs(db, part_id=part_id, limit=limit)
