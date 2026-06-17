from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db
from schemas import PricingRuleCreate, PricingRuleUpdate, PricingRuleResponse
from crud import (
    get_pricing_rules, get_pricing_rule, create_pricing_rule,
    update_pricing_rule, delete_pricing_rule,
)

ADMIN_PASSWORD = "123"  # Keep in sync with routers/suppliers.py

router = APIRouter(tags=["pricing-rules"])


def _verify_admin(admin_password: str):
    if admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/api/pricing-rules", response_model=list[PricingRuleResponse])
def list_active_pricing_rules(db: Session = Depends(get_db)):
    """Public: list active pricing rules ordered by display_order."""
    return get_pricing_rules(db, active_only=True)


@router.get("/api/admin/pricing-rules", response_model=list[PricingRuleResponse])
def list_all_pricing_rules(
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    return get_pricing_rules(db, active_only=False)


@router.post("/api/admin/pricing-rules", response_model=PricingRuleResponse)
def add_pricing_rule(
    payload: PricingRuleCreate,
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    if payload.max_price is not None and payload.max_price <= payload.min_price:
        raise HTTPException(status_code=400, detail="max_price must be greater than min_price")
    return create_pricing_rule(db, payload)


@router.put("/api/admin/pricing-rules/{rule_id}", response_model=PricingRuleResponse)
def edit_pricing_rule(
    rule_id: int,
    payload: PricingRuleUpdate,
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    db_rule = get_pricing_rule(db, rule_id)
    if not db_rule:
        raise HTTPException(status_code=404, detail="Pricing rule not found")

    new_min = payload.min_price if payload.min_price is not None else db_rule.min_price
    new_max = payload.max_price if "max_price" in payload.model_dump(exclude_unset=True) else db_rule.max_price
    if new_max is not None and new_max <= new_min:
        raise HTTPException(status_code=400, detail="max_price must be greater than min_price")

    return update_pricing_rule(db, rule_id, payload)


@router.delete("/api/admin/pricing-rules/{rule_id}")
def remove_pricing_rule(
    rule_id: int,
    admin_password: str = Query(...),
    db: Session = Depends(get_db),
):
    _verify_admin(admin_password)
    if delete_pricing_rule(db, rule_id):
        return {"status": "deleted"}
    raise HTTPException(status_code=404, detail="Pricing rule not found")
