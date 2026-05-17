from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import ActivityLogResponse
from crud import get_activity_logs

router = APIRouter(tags=["activity"])


@router.get("/api/activity", response_model=list[ActivityLogResponse])
def get_global_activity(
    performed_by: str = Query(None),
    action_type: str = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return get_activity_logs(db, performed_by=performed_by, action_type=action_type, limit=limit)


@router.get("/api/activity/inquiry/{inquiry_id}", response_model=list[ActivityLogResponse])
def get_inquiry_activity(
    inquiry_id: int,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    return get_activity_logs(db, inquiry_id=inquiry_id, limit=limit)
