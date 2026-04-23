from typing import Generic, TypeVar, Type
from sqlalchemy.orm import Session
from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: Type[ModelT]):
        self.db = db
        self.model = model

    def get(self, id: int) -> ModelT | None:
        return self.db.get(self.model, id)

    def get_or_none(self, id: int) -> ModelT | None:
        return self.db.get(self.model, id)

    def all(self) -> list[ModelT]:
        return self.db.query(self.model).all()

    def add(self, instance: ModelT) -> ModelT:
        self.db.add(instance)
        self.db.flush()
        self.db.refresh(instance)
        return instance

    def delete(self, instance: ModelT) -> None:
        self.db.delete(instance)
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
