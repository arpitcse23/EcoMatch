from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from App.database import Item as ItemModel
from App.database import get_db

router = APIRouter()

# Static user preferences/assumptions for match scoring
USER_HOSTEL = "Azad Hall"
PREFERRED_CATEGORY = "Electronics"

# Sustainability impact scoring constants
CO2_SAVED = {
    "Electronics": 15,
    "Furniture": 25,
    "Books": 5,
}
DEFAULT_CO2_SAVED = 3


class ItemCreate(BaseModel):
    name: str
    category: str
    condition: str
    location: str


class Item(BaseModel):
    id: int
    name: str
    category: str
    condition: str
    location: str
    status: str
    created_at: datetime
    match_score: float = 0.0

    model_config = ConfigDict(from_attributes=True)


class ImpactSummary(BaseModel):
    total_items_claimed: int
    total_co2_saved: int
    total_waste_reduced: int


class LeaderboardEntry(BaseModel):
    hostel: str
    items_reused: int
    co2_saved: int


@router.post("/items", response_model=Item)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(ItemModel)
        .filter(
            ItemModel.name == item.name,
            ItemModel.category == item.category,
            ItemModel.location == item.location,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="An item with the same name, category and location already exists.",
        )

    db_item = ItemModel(
        name=item.name,
        category=item.category,
        condition=item.condition,
        location=item.location,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    return Item.from_orm(db_item).model_copy(update={"match_score": 0.0})


@router.get("/items", response_model=List[Item])
def get_items(db: Session = Depends(get_db)):
    items = db.query(ItemModel).all()

    scored_items: List[Item] = []

    for item in items:
        score = 0.0

        if item.location == USER_HOSTEL:
            score += 40
        if item.category == PREFERRED_CATEGORY:
            score += 30
        if item.status == "available":
            score += 30

        scored_items.append(
            Item.from_orm(item).model_copy(update={"match_score": score})
        )

    scored_items.sort(key=lambda x: x.match_score, reverse=True)

    return scored_items


@router.get("/items/{item_id}", response_model=Item)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return Item.from_orm(item)


@router.patch("/items/{item_id}/claim", response_model=Item)
def claim_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    if item.status == "claimed":
        raise HTTPException(status_code=400, detail="Item already claimed")

    item.status = "claimed"
    db.commit()
    db.refresh(item)

    return Item.from_orm(item)


@router.get("/impact", response_model=ImpactSummary)
def get_impact(db: Session = Depends(get_db)):
    claimed_items = (
        db.query(ItemModel)
        .filter(ItemModel.status == "claimed")
        .all()
    )

    total_items_claimed = len(claimed_items)

    total_co2_saved = 0
    for item in claimed_items:
        total_co2_saved += CO2_SAVED.get(item.category, DEFAULT_CO2_SAVED)

    total_waste_reduced = total_items_claimed * 2

    return ImpactSummary(
        total_items_claimed=total_items_claimed,
        total_co2_saved=total_co2_saved,
        total_waste_reduced=total_waste_reduced,
    )


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)):
    claimed_items = (
        db.query(ItemModel)
        .filter(ItemModel.status == "claimed")
        .all()
    )

    leaderboard_data: dict[str, dict[str, int]] = {}

    for item in claimed_items:
        hostel = item.location
        if hostel not in leaderboard_data:
            leaderboard_data[hostel] = {
                "items_reused": 0,
                "co2_saved": 0,
            }

        leaderboard_data[hostel]["items_reused"] += 1
        leaderboard_data[hostel]["co2_saved"] += CO2_SAVED.get(
            item.category, DEFAULT_CO2_SAVED
        )

    entries: List[LeaderboardEntry] = [
        LeaderboardEntry(
            hostel=hostel,
            items_reused=data["items_reused"],
            co2_saved=data["co2_saved"],
        )
        for hostel, data in leaderboard_data.items()
    ]

    entries.sort(key=lambda entry: entry.co2_saved, reverse=True)

    return entries
