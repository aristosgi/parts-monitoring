from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from models import Inquiry, Part, SupplierPrice, ActivityLog, Supplier, Status, PricingRule
from schemas import (
    InquiryCreate, InquiryUpdate,
    PartCreate, PartUpdate,
    SupplierPriceCreate, SupplierPriceUpdate,
    SupplierCreate, SupplierUpdate,
    StatusCreate, StatusUpdate,
    PricingRuleCreate, PricingRuleUpdate,
)

FALLBACK_STATUS = "Pending"


# ============ Activity Log ============

def _log(db: Session, *, inquiry_id=None, part_id=None, part_number=None,
         action_type: str, action_detail: str, performed_by: str):
    """Append an activity log entry. Timestamp set automatically."""
    entry = ActivityLog(
        inquiry_id=inquiry_id,
        part_id=part_id,
        part_number=part_number,
        action_type=action_type,
        action_detail=action_detail,
        performed_by=performed_by,
    )
    db.add(entry)
    return entry


def get_activity_logs(db: Session, *, inquiry_id=None, part_id=None,
                     performed_by=None, action_type=None, limit=100):
    query = db.query(ActivityLog)
    if inquiry_id:
        query = query.filter(ActivityLog.inquiry_id == inquiry_id)
    if part_id:
        query = query.filter(ActivityLog.part_id == part_id)
    if performed_by:
        query = query.filter(ActivityLog.performed_by == performed_by)
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)
    return query.order_by(ActivityLog.timestamp.desc()).limit(limit).all()


# ============ Inquiry CRUD ============

def create_inquiry(db: Session, inquiry: InquiryCreate) -> Inquiry:
    db_inquiry = Inquiry(
        requested_by=inquiry.requested_by,
        notes=inquiry.notes,
        urgency=inquiry.urgency,
        status=inquiry.status,
        logged_by=inquiry.logged_by,
    )
    db.add(db_inquiry)
    db.flush()

    for part_data in inquiry.parts:
        db_part = Part(
            inquiry_id=db_inquiry.id,
            **part_data.model_dump(),
        )
        db.add(db_part)

    db.flush()

    part_numbers = [p.part_number for p in inquiry.parts]
    detail = f"Inquiry from {inquiry.requested_by} with {len(inquiry.parts)} part(s): {', '.join(part_numbers) if part_numbers else 'none'}"
    _log(db, inquiry_id=db_inquiry.id, action_type="INQUIRY_ADDED",
         action_detail=detail, performed_by=inquiry.logged_by)

    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry


def get_inquiry(db: Session, inquiry_id: int) -> Inquiry:
    return db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()


def list_inquiries(db: Session, *, search=None, logged_by=None,
                  urgency=None, status=None) -> list:
    query = db.query(Inquiry)

    if logged_by:
        query = query.filter(Inquiry.logged_by == logged_by)
    if urgency:
        query = query.filter(Inquiry.urgency == urgency)
    if status:
        query = query.filter(Inquiry.status == status)

    if search:
        # Match against requester name or any part_number/description in the inquiry
        part_match = db.query(Part.inquiry_id).filter(
            or_(
                Part.part_number.ilike(f"%{search}%"),
                Part.description.ilike(f"%{search}%"),
            )
        ).subquery()
        query = query.filter(
            or_(
                Inquiry.requested_by.ilike(f"%{search}%"),
                Inquiry.notes.ilike(f"%{search}%"),
                Inquiry.id.in_(part_match),
            )
        )

    return query.order_by(Inquiry.created_at.desc()).all()


def update_inquiry(db: Session, inquiry_id: int, update: InquiryUpdate, performed_by: str) -> Inquiry:
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        return None

    changes = []
    data = update.model_dump(exclude_unset=True)
    for field, value in data.items():
        old = getattr(db_inquiry, field)
        if old != value:
            setattr(db_inquiry, field, value)
            changes.append(f"{field}: {old} → {value}")

    if changes:
        _log(db, inquiry_id=db_inquiry.id, action_type="INQUIRY_EDITED",
             action_detail="; ".join(changes), performed_by=performed_by)

    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry


def update_inquiry_status(db: Session, inquiry_id: int, status: str, performed_by: str) -> Inquiry:
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        return None

    old = db_inquiry.status
    db_inquiry.status = status

    _log(db, inquiry_id=db_inquiry.id, action_type="INQUIRY_STATUS_CHANGED",
         action_detail=f"Status: {old} → {status}", performed_by=performed_by)

    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry


def delete_inquiry(db: Session, inquiry_id: int, performed_by: str) -> bool:
    db_inquiry = get_inquiry(db, inquiry_id)
    if not db_inquiry:
        return False

    requester = db_inquiry.requested_by
    part_count = len(db_inquiry.parts)
    db.delete(db_inquiry)

    _log(db, inquiry_id=None, action_type="INQUIRY_DELETED",
         action_detail=f"Inquiry from {requester} ({part_count} part(s)) deleted",
         performed_by=performed_by)

    db.commit()
    return True


# ============ Part CRUD (within an inquiry) ============

def add_part_to_inquiry(db: Session, inquiry_id: int, part: PartCreate, performed_by: str) -> Part:
    db_part = Part(inquiry_id=inquiry_id, **part.model_dump())
    db.add(db_part)
    db.flush()

    _log(db, inquiry_id=inquiry_id, part_id=db_part.id, part_number=db_part.part_number,
         action_type="PART_ADDED",
         action_detail=f"Added {db_part.part_number} to inquiry",
         performed_by=performed_by)

    db.commit()
    db.refresh(db_part)
    return db_part


def get_part(db: Session, part_id: int) -> Part:
    return db.query(Part).filter(Part.id == part_id).first()


def update_part(db: Session, part_id: int, update: PartUpdate, performed_by: str) -> Part:
    db_part = get_part(db, part_id)
    if not db_part:
        return None

    changes = []
    data = update.model_dump(exclude_unset=True)
    for field, value in data.items():
        old = getattr(db_part, field)
        if old != value:
            setattr(db_part, field, value)
            changes.append(f"{field}: {old} → {value}")

    if changes:
        _log(db, inquiry_id=db_part.inquiry_id, part_id=db_part.id, part_number=db_part.part_number,
             action_type="PART_EDITED", action_detail="; ".join(changes),
             performed_by=performed_by)

    db.commit()
    db.refresh(db_part)
    return db_part


def update_part_status(db: Session, part_id: int, status: str, performed_by: str) -> Part:
    db_part = get_part(db, part_id)
    if not db_part:
        return None

    old = db_part.status
    db_part.status = status

    _log(db, inquiry_id=db_part.inquiry_id, part_id=db_part.id, part_number=db_part.part_number,
         action_type="PART_STATUS_CHANGED",
         action_detail=f"Status: {old} → {status}", performed_by=performed_by)

    db.commit()
    db.refresh(db_part)
    return db_part


def delete_part(db: Session, part_id: int, performed_by: str) -> bool:
    db_part = get_part(db, part_id)
    if not db_part:
        return False

    inquiry_id = db_part.inquiry_id
    part_number = db_part.part_number
    db.delete(db_part)

    _log(db, inquiry_id=inquiry_id, part_id=None, part_number=part_number,
         action_type="PART_DELETED",
         action_detail=f"Part {part_number} deleted", performed_by=performed_by)

    db.commit()
    return True


# ============ Supplier Price CRUD ============

def create_supplier_price(db: Session, part_id: int, price: SupplierPriceCreate, performed_by: str) -> SupplierPrice:
    existing = db.query(SupplierPrice).filter(
        and_(
            SupplierPrice.part_id == part_id,
            SupplierPrice.supplier_name == price.supplier_name,
        )
    ).first()

    now = datetime.utcnow()
    db_part = get_part(db, part_id)

    if existing:
        for field, value in price.model_dump().items():
            setattr(existing, field, value)
        existing.date_checked = now
        existing.updated_at = now
        db_price = existing
        action_type = "PRICE_EDITED"
    else:
        db_price = SupplierPrice(part_id=part_id, date_checked=now, **price.model_dump())
        db.add(db_price)
        action_type = "PRICE_ADDED"

    db.flush()

    _log(db, inquiry_id=db_part.inquiry_id if db_part else None,
         part_id=part_id, part_number=db_part.part_number if db_part else None,
         action_type=action_type,
         action_detail=f"{price.supplier_name}: {price.price} {price.currency}",
         performed_by=performed_by)

    db.commit()
    db.refresh(db_price)
    return db_price


def get_supplier_prices(db: Session, part_id: int) -> list:
    return db.query(SupplierPrice).filter(SupplierPrice.part_id == part_id).all()


def get_supplier_price(db: Session, price_id: int) -> SupplierPrice:
    return db.query(SupplierPrice).filter(SupplierPrice.id == price_id).first()


def update_supplier_price(db: Session, price_id: int, update: SupplierPriceUpdate, performed_by: str) -> SupplierPrice:
    db_price = get_supplier_price(db, price_id)
    if not db_price:
        return None

    data = update.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(db_price, field, value)
    db_price.date_checked = datetime.utcnow()

    db_part = get_part(db, db_price.part_id)
    _log(db, inquiry_id=db_part.inquiry_id if db_part else None,
         part_id=db_price.part_id, part_number=db_part.part_number if db_part else None,
         action_type="PRICE_EDITED",
         action_detail=f"Updated price for {db_price.supplier_name}",
         performed_by=performed_by)

    db.commit()
    db.refresh(db_price)
    return db_price


def delete_supplier_price(db: Session, price_id: int, performed_by: str) -> bool:
    db_price = get_supplier_price(db, price_id)
    if not db_price:
        return False

    supplier_name = db_price.supplier_name
    part_id = db_price.part_id
    db_part = get_part(db, part_id)
    db.delete(db_price)

    _log(db, inquiry_id=db_part.inquiry_id if db_part else None,
         part_id=part_id, part_number=db_part.part_number if db_part else None,
         action_type="PRICE_DELETED",
         action_detail=f"Deleted price for {supplier_name}",
         performed_by=performed_by)

    db.commit()
    return True


# ============ Supplier CRUD ============

def get_suppliers(db: Session, category=None, active_only=True) -> list:
    query = db.query(Supplier)
    if active_only:
        query = query.filter(Supplier.is_active == True)
    if category:
        query = query.filter(Supplier.category == category)
    return query.order_by(Supplier.category, Supplier.name).all()


def get_supplier(db: Session, supplier_id: int) -> Supplier:
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def create_supplier(db: Session, supplier: SupplierCreate) -> Supplier:
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def update_supplier(db: Session, supplier_id: int, update: SupplierUpdate) -> Supplier:
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return None
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(db_supplier, field, value)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def delete_supplier(db: Session, supplier_id: int) -> bool:
    db_supplier = get_supplier(db, supplier_id)
    if not db_supplier:
        return False
    db.delete(db_supplier)
    db.commit()
    return True


# ============ Status CRUD ============

def get_statuses(db: Session, scope: str = None, active_only: bool = True) -> list:
    query = db.query(Status)
    if scope:
        query = query.filter(Status.scope == scope)
    if active_only:
        query = query.filter(Status.is_active == True)
    return query.order_by(Status.scope, Status.display_order, Status.name).all()


def get_status(db: Session, status_id: int) -> Status:
    return db.query(Status).filter(Status.id == status_id).first()


def create_status(db: Session, payload: StatusCreate) -> Status:
    db_status = Status(**payload.model_dump())
    db.add(db_status)
    db.commit()
    db.refresh(db_status)
    return db_status


def update_status_row(db: Session, status_id: int, payload: StatusUpdate) -> Status:
    db_status = get_status(db, status_id)
    if not db_status:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_status, field, value)
    db.commit()
    db.refresh(db_status)
    return db_status


def delete_status(db: Session, status_id: int) -> tuple[bool, int]:
    """Delete a status, resetting any inquiries/parts using it to FALLBACK_STATUS.

    Returns (success, reset_count).
    """
    db_status = get_status(db, status_id)
    if not db_status:
        return False, 0

    name = db_status.name
    scope = db_status.scope
    reset_count = 0

    if scope == "inquiry":
        affected = db.query(Inquiry).filter(Inquiry.status == name).all()
        for inq in affected:
            inq.status = FALLBACK_STATUS
        reset_count = len(affected)
    elif scope == "part":
        affected = db.query(Part).filter(Part.status == name).all()
        for p in affected:
            p.status = FALLBACK_STATUS
        reset_count = len(affected)

    db.delete(db_status)
    db.commit()
    return True, reset_count


# ============ Pricing Rule CRUD ============

def get_pricing_rules(db: Session, active_only: bool = True) -> list:
    query = db.query(PricingRule)
    if active_only:
        query = query.filter(PricingRule.is_active == True)
    return query.order_by(PricingRule.display_order, PricingRule.min_price).all()


def get_pricing_rule(db: Session, rule_id: int) -> PricingRule:
    return db.query(PricingRule).filter(PricingRule.id == rule_id).first()


def create_pricing_rule(db: Session, payload: PricingRuleCreate) -> PricingRule:
    db_rule = PricingRule(**payload.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def update_pricing_rule(db: Session, rule_id: int, payload: PricingRuleUpdate) -> PricingRule:
    db_rule = get_pricing_rule(db, rule_id)
    if not db_rule:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_rule, field, value)
    db.commit()
    db.refresh(db_rule)
    return db_rule


def delete_pricing_rule(db: Session, rule_id: int) -> bool:
    db_rule = get_pricing_rule(db, rule_id)
    if not db_rule:
        return False
    db.delete(db_rule)
    db.commit()
    return True


def compute_suggested_price(part, rules):
    """Returns (best_price, multiplier, suggested) or (None, None, None).

    best_price = lowest EUR supplier price; rule match:
    min_price <= best AND (max_price is None OR best < max_price).
    """
    eur = [p.price for p in part.supplier_prices if p.price is not None and p.currency == "EUR"]
    if not eur:
        return None, None, None
    best = min(eur)
    for r in sorted(rules, key=lambda r: r.display_order):
        if not r.is_active:
            continue
        if best >= r.min_price and (r.max_price is None or best < r.max_price):
            return best, r.multiplier, round(best * r.multiplier, 2)
    return best, None, None   # no band matched → expose best_price but no suggestion
