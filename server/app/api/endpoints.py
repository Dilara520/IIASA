from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from typing import List, Optional, Any
from ..services import data_service, ai_service

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@router.get("/data")
async def get_dashboard_data():
    """
    Returns the cleaned CSV data for the dashboard charts.
    """
    data = data_service.get_csv_data()
    if not data:
        raise HTTPException(status_code=500, detail="Failed to load CSV data")
    return data

@router.get("/map")
async def get_map_layer():
    """
    Returns the processed Raster image as a PNG.
    Directly renderable in <img src="..."> tags.
    """
    image_bytes = data_service.get_raster_image()
    if not image_bytes:
        raise HTTPException(status_code=500, detail="Failed to process Raster image")
    
    return Response(content=image_bytes, media_type="image/png")

@router.post("/chat", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """
    AI Endpoint that reasons over the dataset.
    """
    ai_reply = ai_service.generate_ai_response(request.message)
    return ChatResponse(response=ai_reply)