from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from App.Routers import items
from App.database import Base, engine


def create_app():
    app = FastAPI(
        title="EcoMatch API",
        description="AI-powered circular economy backend",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        # Ensure all database tables are created when the app starts
        Base.metadata.create_all(bind=engine)

    @app.get("/")
    def root():
        return {"message": "EcoMatch backend is running 🚀"}

    app.include_router(items.router)

    return app
