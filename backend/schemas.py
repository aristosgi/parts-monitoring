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


# ============ Admin Schemas ============

class AdminLogin(BaseModel):
    password: str


# ============ Part Schemas ============

class PartBase(BaseModel):
    part_number: str
    description: str
    requested_by: str
    quantity: Optional[int] = None
    used_in: Optional[str] = None
    urgency: int  # 1-5
    status: str = "Pending"


class PartCreate(PartBase):
    logged_by: str  # Internal user


class PartUpdate(BaseModel):
    description: Optional[str] = None
    requested_by: Optional[str] = None
    quantity: Optional[int] = None
    used_in: Optional[str] = None
    urgency: Optional[int] = None


class PartStatusUpdate(BaseModel):
    status: str
    performed_by: str  # User making the change


class PartResponse(PartBase):
    id: int
    logged_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PartDetailResponse(PartResponse):
    supplier_prices: List["SupplierPriceResponse"] = []
    activity_logs: List["ActivityLogResponse"] = []


# ============ Supplier Price Schemas ============

class SupplierPriceBase(BaseModel):
    supplier_name: str
    supplier_category: str  # 'A' or 'B'
    price: Optional[float] = None
    currency: str = "EUR"
    notes: Optional[str] = None
    date_checked: Optional[str] = None
    checked_by: str


class SupplierPriceCreate(SupplierPriceBase):
    pass


class SupplierPriceUpdate(BaseModel):
    price: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    date_checked: Optional[str] = None


class SupplierPriceResponse(SupplierPriceBase):
    id: int
    part_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Activity Log Schemas ============

class ActivityLogBase(BaseModel):
    action_type: str
    action_detail: Optional[str] = None
    performed_by: str
    part_id: Optional[int] = None
    part_number: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True


# ============ Supplier Info ============

class SupplierInfo(BaseModel):
    name: str
    category: str  # 'A' or 'B'


class SuppliersResponse(BaseModel):
    suppliers: List[SupplierInfo]


# Update forward references
PartDetailResponse.model_rebuild()
