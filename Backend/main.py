from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from App.core import create_app
from App.database import Item as ItemModel
from App.database import get_db

app = create_app()


@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(ItemModel).filter(ItemModel.id == item_id).first()
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()

    return {"message": "Item deleted"}