from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.financial import CanIBuyRequest, CanIBuyResponse
from app.services.purchase_analysis_service import PurchaseAnalysisService

router = APIRouter(prefix="/financial-analysis", tags=["financial-analysis"])


@router.post("/can-i-buy", response_model=CanIBuyResponse)
def can_i_buy(
    payload: CanIBuyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CanIBuyResponse:
    return PurchaseAnalysisService(db).can_i_buy(current_user, payload)
