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


class Status(Base):
    __tablename__ = "statuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    scope = Column(String, nullable=False, index=True)  # 'inquiry' or 'part'
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("name", "scope", name="unique_status_per_scope"),)


class PricingRule(Base):
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True, index=True)
    min_price = Column(Float, nullable=False)          # inclusive lower bound (EUR)
    max_price = Column(Float, nullable=True)           # exclusive upper bound; NULL = no upper limit
    multiplier = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    requested_by = Column(String, nullable=False, index=True)  # Client/customer name
    notes = Column(Text, nullable=True)
    urgency = Column(Integer, nullable=True)  # 1-5, overall inquiry urgency (optional)
    status = Column(String, default="Pending", nullable=False)
    logged_by = Column(String, nullable=False)  # Internal user
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    parts = relationship("Part", back_populates="inquiry", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="inquiry", cascade="all, delete-orphan")


class Part(Base):
    __tablename__ = "parts"

    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    part_number = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    quantity = Column(Integer, nullable=True)
    used_in = Column(String, nullable=True)
    urgency = Column(Integer, nullable=True)  # 1-5, per-part (optional)
    status = Column(String, default="Pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    inquiry = relationship("Inquiry", back_populates="parts")
    supplier_prices = relationship("SupplierPrice", back_populates="part", cascade="all, delete-orphan")


class SupplierPrice(Base):
    __tablename__ = "supplier_prices"

    id = Column(Integer, primary_key=True, index=True)
    part_id = Column(Integer, ForeignKey("parts.id", ondelete="CASCADE"), nullable=False)
    supplier_name = Column(String, nullable=False)
    supplier_category = Column(String, nullable=False)  # 'A' or 'B'
    price = Column(Float, nullable=True)
    currency = Column(String, default="EUR", nullable=False)
    notes = Column(Text, nullable=True)
    date_checked = Column(DateTime, default=datetime.utcnow, nullable=False)  # Auto-filled
    checked_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("part_id", "supplier_name", name="unique_part_supplier"),)

    part = relationship("Part", back_populates="supplier_prices")


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="SET NULL"), nullable=True)
    part_id = Column(Integer, nullable=True)  # No FK — survives part deletion
    part_number = Column(String, nullable=True)
    action_type = Column(String, nullable=False)
    action_detail = Column(Text, nullable=True)
    performed_by = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    inquiry = relationship("Inquiry", back_populates="activity_logs")
