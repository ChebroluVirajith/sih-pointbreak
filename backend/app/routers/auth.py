from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List
from app.core.security import DEMO_USERS, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Federated Authentication & SSO"])

class LoginRequest(BaseModel):
    username: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    user = DEMO_USERS.get(req.username)
    if not user:
        raise HTTPException(status_code=404, detail="Demo persona not found in Keycloak Identity Provider")
    
    token = create_access_token({
        "sub": user["username"],
        "user_id": user["user_id"],
        "name": user["name"],
        "role": user["role"],
        "global_citizen_id": user.get("global_citizen_id", "")
    })

    return TokenResponse(
        access_token=token,
        user=user
    )

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

@router.get("/personas")
async def list_demo_personas():
    """
    Returns available demo accounts for seamless judging and switching in the React UI
    """
    return [
        {
            "username": u["username"],
            "name": u["name"],
            "role": u["role"],
            "description": u.get("department", "Registered Citizen")
        }
        for u in DEMO_USERS.values()
    ]
