from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from models import Part, SupplierPrice, ActivityLog, Supplier
from schemas import PartCreate, PartUpdate, SupplierPriceCreate, SupplierPriceUpdate, ActivityLogCreate, SupplierCreate, SupplierUpdate


# ============ Activity Log CRUD ============

def create_activity_log(db: Session, action: ActivityLogCreate) -> ActivityLog:
    """Create a new activity log entry."""
    db_log = ActivityLog(**action.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def get_activity_logs(
    db: Session,
    part_id: int = None,
    performed_by: str = None,
    action_type: str = None,
    limit: int = 100
):
    """Get activity logs with optional filters."""
    query = db.query(ActivityLog)

    if part_id:
        query = query.filter(ActivityLog.part_id == part_id)
    if performed_by:
        query = query.filter(ActivityLog.performed_by == performed_by)
    if action_type:
        query = query.filter(ActivityLog.action_type == action_type)

    return query.order_by(ActivityLog.timestamp.desc()).limit(limit).all()


# ============ Part CRUD ============

def create_part(db: Session, part: PartCreate, performed_by: str) -> Part:
    """Create a new part and log the action."""
    db_part = Part(**part.model_dump())
    db.add(db_part)
    db.flush()  # Get the ID without committing yet

    # Log the action
    log_entry = ActivityLogCreate(
        part_id=db_part.id,
        part_number=db_part.part_number,
        action_type="PART_ADDED",
        action_detail=f"Part {db_part.part_number} created",
        performed_by=performed_by
    )
    create_activity_log(db, log_entry)

    db.commit()
    db.refresh(db_part)
    return db_part


def get_part(db: Session, part_id: int) -> Part:
    """Get a single part by ID."""
    return db.query(Part).filter(Part.id == part_id).first()


def get_part_by_number(db: Session, part_number: str) -> Part:
    """Get a part by part number."""
    return db.query(Part).filter(Part.part_number == part_number).first()


def list_parts(
    db: Session,
    search: str = None,
    logged_by: str = None,
    urgency: int = None,
    status: str = None
) -> list:
    """List all parts with optional filters."""
    query = db.query(Part)

    if search:
        # Search in part_number, description, requested_by
        search_filter = or_(
            Part.part_number.ilike(f"%{search}%"),
            Part.description.ilike(f"%{search}%"),
            Part.requested_by.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    if logged_by:
        query = query.filter(Part.logged_by == logged_by)

    if urgency:
        query = query.filter(Part.urgency == urgency)

    if status:
        query = query.filter(Part.status == status)

    return query.order_by(Part.created_at.desc()).all()


def update_part(
    db: Session,
    part_id: int,
    part_update: PartUpdate,
    performed_by: str
) -> Part:
    """Update a part and log changes."""
    db_part = db.query(Part).filter(Part.id == part_id).first()
    if not db_part:
        return None

    # Track what changed
    changes = []
    update_data = part_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        old_value = getattr(db_part, field)
        if old_value != value:
            setattr(db_part, field, value)
            changes.append(f"{field}: {old_value} → {value}")

    if changes:
        db_part.updated_at = datetime.utcnow()
        db.add(db_part)
        db.flush()

        # Log the action
        log_entry = ActivityLogCreate(
            part_id=db_part.id,
            part_number=db_part.part_number,
            action_type="PART_EDITED",
            action_detail=f"Updated: {', '.join(changes)}",
            performed_by=performed_by
        )
        create_activity_log(db, log_entry)

    db.commit()
    db.refresh(db_part)
    return db_part


def update_part_status(db: Session, part_id: int, status: str, performed_by: str) -> Part:
    """Update only the status and log it separately."""
    db_part = db.query(Part).filter(Part.id == part_id).first()
    if not db_part:
        return None

    old_status = db_part.status
    db_part.status = status
    db_part.updated_at = datetime.utcnow()
    db.add(db_part)
    db.flush()

    # Log the status change
    log_entry = ActivityLogCreate(
        part_id=db_part.id,
        part_number=db_part.part_number,
        action_type="STATUS_CHANGED",
        action_detail=f"Status: {old_status} → {status}",
        performed_by=performed_by
    )
    create_activity_log(db, log_entry)

    db.commit()
    db.refresh(db_part)
    return db_part


def delete_part(db: Session, part_id: int, performed_by: str) -> bool:
    """Delete a part and log the action."""
    db_part = db.query(Part).filter(Part.id == part_id).first()
    if not db_part:
        return False

    part_number = db_part.part_number
    db.delete(db_part)
    db.flush()

    # Log the deletion
    log_entry = ActivityLogCreate(
        part_id=None,  # Part is gone, so no FK
        part_number=part_number,
        action_type="PART_DELETED",
        action_detail=f"Part {part_number} deleted",
        performed_by=performed_by
    )
    create_activity_log(db, log_entry)

    db.commit()
    return True


# ============ Supplier Price CRUD ============

def create_supplier_price(db: Session, part_id: int, price: SupplierPriceCreate, performed_by: str) -> SupplierPrice:
    """Create or replace a supplier price entry for a part."""
    # Check if this supplier already has a price for this part
    existing = db.query(SupplierPrice).filter(
        and_(
            SupplierPrice.part_id == part_id,
            SupplierPrice.supplier_name == price.supplier_name
        )
    ).first()

    if existing:
        # Update the existing entry
        for field, value in price.model_dump().items():
            setattr(existing, field, value)
        existing.updated_at = datetime.utcnow()
        db_price = existing
    else:
        # Create new entry
        db_price = SupplierPrice(part_id=part_id, **price.model_dump())

    db.add(db_price)
    db.flush()

    # Get part number for logging
    db_part = db.query(Part).filter(Part.id == part_id).first()

    # Log the action
    log_entry = ActivityLogCreate(
        part_id=part_id,
        part_number=db_part.part_number if db_part else None,
        action_type="PRICE_ADDED" if not existing else "PRICE_EDITED",
        action_detail=f"Price for {price.supplier_name}: {price.price} {price.currency}",
        performed_by=performed_by
    )
    create_activity_log(db, log_entry)

    db.commit()
    db.refresh(db_price)
    return db_price


def get_supplier_prices(db: Session, part_id: int) -> list:
    """Get all supplier prices for a part."""
    return db.query(SupplierPrice).filter(SupplierPrice.part_id == part_id).all()


def get_supplier_price(db: Session, price_id: int) -> SupplierPrice:
    """Get a single supplier price entry."""
    return db.query(SupplierPrice).filter(SupplierPrice.id == price_id).first()


def update_supplier_price(
    db: Session,
    price_id: int,
    price_update: SupplierPriceUpdate,
    performed_by: str
) -> SupplierPrice:
    """Update a supplier price entry."""
    db_price = db.query(SupplierPrice).filter(SupplierPrice.id == price_id).first()
    if not db_price:
        return None

    update_data = price_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_price, field, value)

    db_price.updated_at = datetime.utcnow()
    db.add(db_price)
    db.flush()

    # Get part info for logging
    db_part = db.query(Part).filter(Part.id == db_price.part_id).first()

    # Log the action
    log_entry = ActivityLogCreate(
        part_id=db_price.part_id,
        part_number=db_part.part_number if db_part else None,
        action_type="PRICE_EDITED",
        action_detail=f"Updated price for {db_price.supplier_name}",
        performed_by=performed_by
    )
    create_activity_log(db, log_entry)

    db.commit()
    db.refresh(db_price)
    return db_price


def delete_supplier_price(db: Session, price_id: int, performed_by: str) -> bool:
    """Delete a supplier price entry."""
    db_price = db.query(SupplierPrice).filter(SupplierPrice.id == price_id).first()
    if not db_price:
        return False

    supplier_name = db_price.supplier_name
    part_id = db_price.part_id

    db.delete(db_price)
    db.flush()

    # Get part info for logging
    db_part = db.query(Part).filter(Part.id == part_id).first()

    # Log the action
    log_entry = ActivityLogCreate(
        part_id=part_id,
        part_number=db_part.part_number if db_part else None,
        action_type="PRICE_DELETED",
        action_detail=f"Deleted price for {supplier_name}",
        performed_by=performed_by
    )
    create_activity_log(db, log_entry)

    db.commit()
    return True


# ============ Supplier CRUD ============

def get_suppliers(db: Session, category: str = None, active_only: bool = True) -> list:
    """Get suppliers with optional filters."""
    query = db.query(Supplier)

    if active_only:
        query = query.filter(Supplier.is_active == True)

    if category:
        query = query.filter(Supplier.category == category)

    return query.order_by(Supplier.category, Supplier.name).all()


def get_supplier(db: Session, supplier_id: int) -> Supplier:
    """Get a single supplier by ID."""
    return db.query(Supplier).filter(Supplier.id == supplier_id).first()


def create_supplier(db: Session, supplier: SupplierCreate) -> Supplier:
    """Create a new supplier."""
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def update_supplier(db: Session, supplier_id: int, supplier_update: SupplierUpdate) -> Supplier:
    """Update a supplier."""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        return None

    update_data = supplier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)

    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


def delete_supplier(db: Session, supplier_id: int) -> bool:
    """Delete a supplier."""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        return False

    db.delete(db_supplier)
    db.commit()
    return True
