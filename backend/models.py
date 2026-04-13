from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    category = Column(String, nullable=False)  # 'A' or 'B'
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    part_number = Column(String, unique=True, nullable=False, index=True)
    description = Column(String, nullable=False)
    requested_by = Column(String, nullable=False)  # Free text, client/customer name
    quantity = Column(Integer, nullable=True)
    used_in = Column(String, nullable=True)
    urgency = Column(Integer, nullable=False)  # 1-5
    status = Column(String, default="Pending", nullable=False)
    logged_by = Column(String, nullable=False)  # Internal user: Simos/Lenia/Dimitris
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    supplier_prices = relationship("SupplierPrice", back_populates="part", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="part", cascade="all, delete-orphan")


class SupplierPrice(Base):
    __tablename__ = "supplier_prices"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False)
    supplier_name = Column(String, nullable=False)  # One of 7 hardcoded suppliers
    supplier_category = Column(String, nullable=False)  # 'A' or 'B'
    price = Column(Float, nullable=True)
    currency = Column(String, default="EUR", nullable=False)
    notes = Column(Text, nullable=True)
    date_checked = Column(String, nullable=True)  # YYYY-MM-DD
    checked_by = Column(String, nullable=False)  # User who entered it
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Unique constraint: one price row per supplier per part
    __table_args__ = (UniqueConstraint("part_id", "supplier_name", name="unique_part_supplier"),)

    # Relationships
    part = relationship("Part", back_populates="supplier_prices")


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="SET NULL"), nullable=True)
    part_number = Column(String, nullable=True)  # Denormalized snapshot
    action_type = Column(String, nullable=False)  # PART_ADDED, PART_EDITED, STATUS_CHANGED, PRICE_ADDED, PRICE_EDITED, PART_DELETED
    action_detail = Column(Text, nullable=True)  # Human-readable description
    performed_by = Column(String, nullable=False)  # Internal user
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    part = relationship("Part", back_populates="activity_logs")
