from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# ============ Supplier Schemas ============

class SupplierCreate(BaseModel):
    name: str
    category: str  # 'A' or 'B'


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    category: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminLogin(BaseModel):
    password: str


# ============ Status Schemas ============

class StatusCreate(BaseModel):
    name: str
    scope: str  # 'inquiry' or 'part'
    display_order: Optional[int] = 0


class StatusUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None


class StatusResponse(BaseModel):
    id: int
    name: str
    scope: str
    is_active: bool
    display_order: int
    created_at: datetime

    class Config:
        from_attributes = True


class StatusDeleteResult(BaseModel):
    status: str
    reset_count: int  # how many rows were reset to "Pending"


# ============ Part Schemas ============

class PartBase(BaseModel):
    part_number: str
    description: str
    quantity: Optional[int] = None
    used_in: Optional[str] = None
    urgency: int  # 1-5
    status: str = "Pending"


class PartCreate(PartBase):
    pass


class PartUpdate(BaseModel):
    part_number: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = None
    used_in: Optional[str] = None
    urgency: Optional[int] = None


class PartStatusUpdate(BaseModel):
    status: str
    performed_by: str


class PartResponse(PartBase):
    id: int
    inquiry_id: int
    created_at: datetime
    updated_at: datetime
    supplier_prices: List["SupplierPriceResponse"] = []

    class Config:
        from_attributes = True


# ============ Inquiry Schemas ============

class InquiryBase(BaseModel):
    requested_by: str
    notes: Optional[str] = None
    urgency: int  # 1-5
    status: str = "Pending"


class InquiryCreate(InquiryBase):
    logged_by: str
    parts: List[PartCreate] = []


class InquiryUpdate(BaseModel):
    requested_by: Optional[str] = None
    notes: Optional[str] = None
    urgency: Optional[int] = None


class InquiryStatusUpdate(BaseModel):
    status: str
    performed_by: str


class InquiryListItem(BaseModel):
    """Compact summary for the dashboard list."""
    id: int
    requested_by: str
    urgency: int
    status: str
    logged_by: str
    created_at: datetime
    updated_at: datetime
    part_count: int
    part_numbers: List[str] = []

    class Config:
        from_attributes = True


class InquiryDetailResponse(InquiryBase):
    id: int
    logged_by: str
    created_at: datetime
    updated_at: datetime
    parts: List[PartResponse] = []

    class Config:
        from_attributes = True


# ============ Supplier Price Schemas ============

class SupplierPriceCreate(BaseModel):
    supplier_name: str
    supplier_category: str
    price: Optional[float] = None
    currency: str = "EUR"
    notes: Optional[str] = None
    checked_by: str
    # date_checked auto-filled server-side


class SupplierPriceUpdate(BaseModel):
    price: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    # date_checked auto-refreshed server-side on update


class SupplierPriceResponse(BaseModel):
    id: int
    part_id: int
    supplier_name: str
    supplier_category: str
    price: Optional[float] = None
    currency: str
    notes: Optional[str] = None
    date_checked: datetime
    checked_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Activity Log Schemas ============

class ActivityLogResponse(BaseModel):
    id: int
    inquiry_id: Optional[int] = None
    part_id: Optional[int] = None
    part_number: Optional[str] = None
    action_type: str
    action_detail: Optional[str] = None
    performed_by: str
    timestamp: datetime

    class Config:
        from_attributes = True


# Resolve forward refs
PartResponse.model_rebuild()
InquiryDetailResponse.model_rebuild()
