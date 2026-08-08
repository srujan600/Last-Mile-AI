from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RiskFactor(BaseModel):
    factor: str
    impact: str
    severity: str  # "high", "medium", "low"

class UncertaintyBounds(BaseModel):
    prob_lower: float = Field(..., description="Lower bound of 95% calibrated confidence interval")
    prob_upper: float = Field(..., description="Upper bound of 95% calibrated confidence interval")
    confidence_interval: str = Field(default="95%", description="Confidence level")

class PolicyDecision(BaseModel):
    selected_action: str = Field(..., description="Action selected by Expected Financial Loss Minimization Policy")
    expected_cost_inr: float = Field(..., description="Expected financial loss under selected mitigation")
    baseline_cost_inr: float = Field(..., description="Baseline expected financial loss under standard dispatch")
    savings_inr: float = Field(..., description="Net financial savings achieved by policy decision")
    action_cost_inr: float = Field(default=0.0, description="Direct cost to execute mitigation action")
    rationale: str = Field(..., description="Mathematical loss minimization rationale")

class PredictionRequest(BaseModel):
    parcel_weight: float = Field(..., description="Parcel weight in kg", ge=0.1, le=100.0)
    delivery_window: int = Field(..., description="0=Morning, 1=Midday, 2=Afternoon, 3=Evening", ge=0, le=3)
    past_failures: int = Field(..., description="Number of past failed delivery attempts", ge=0, le=10)
    weather_severity: Optional[int] = Field(default=None, description="0=Clear, 1=Rain, 2=Storm, 3=Extreme", ge=0, le=3)
    weather: int = Field(default=0, description="0=Clear, 1=Rain, 2=Storm, 3=Extreme", ge=0, le=3)
    traffic_density: Optional[int] = Field(default=None, description="0=Low, 1=Moderate, 2=Heavy, 3=Gridlock", ge=0, le=3)
    traffic: int = Field(default=0, description="0=Low, 1=Moderate, 2=Heavy, 3=Gridlock", ge=0, le=3)
    is_cod: int = Field(default=1, description="0=Prepaid, 1=Cash on Delivery", ge=0, le=1)
    gated_community: int = Field(default=0, description="0=Open Access, 1=Gated Community Security", ge=0, le=1)
    customer_response_rate: float = Field(default=0.75, description="Historical response rate 0.0 to 1.0", ge=0.0, le=1.0)
    customer_confirmed: bool = Field(default=False, description="Customer WhatsApp pre-confirmed status")
    historical_rto_rate: float = Field(default=0.15, description="Historical area RTO rate 0.0 to 1.0", ge=0.0, le=1.0)
    area_density: float = Field(default=5.0, description="Urban locality density index (1.0 to 10.0)", ge=0.0, le=10.0)
    subterranean_access: int = Field(default=0, description="0=Above ground, 1=Subterranean/Basement access deadzone", ge=0, le=1)
    third_party_handoff: int = Field(default=0, description="0=Direct delivery, 1=3PL transfer handoff", ge=0, le=1)
    time_window_violation_mins: float = Field(default=0.0, description="Delivery slot time window violation margin in minutes", ge=0.0)

class CreateOrderRequest(BaseModel):
    customer_name: str = Field(..., description="Customer full name")
    customer_phone: Optional[str] = Field(default="+919876543210", description="Customer phone number")
    address: str = Field(..., description="Delivery address text")
    lat: float = Field(..., description="Target delivery latitude")
    lng: float = Field(..., description="Target delivery longitude")
    area: Optional[str] = Field(default="Hyderabad", description="Locality area name")
    parcel_weight_kg: float = Field(default=5.0, ge=0.1, le=100.0)
    delivery_window: int = Field(default=0, ge=0, le=3)
    is_cod: int = Field(default=1, ge=0, le=1)
    gated_community: int = Field(default=0, ge=0, le=1)
    subterranean_access: int = Field(default=0, ge=0, le=1)
    third_party_handoff: int = Field(default=0, ge=0, le=1)
    use_current_location: bool = Field(default=False, description="Flag indicating location was auto-detected via GPS")

class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str  # "Low", "Medium", "High"
    recommended_action: str
    applied_rule: str
    risk_factors: List[RiskFactor]
    uncertainty_bounds: Optional[UncertaintyBounds] = None
    policy_decision: Optional[PolicyDecision] = None

class FinancialMetrics(BaseModel):
    rto_costs_saved_inr: float
    rto_costs_saved_usd: float
    deliveries_preserved: int
    total_orders_evaluated: int
    fuel_saved_liters: float
    co2_reduced_kg: float
    original_failure_rate_pct: float
    mitigated_failure_rate_pct: float
    whatsapp_api_cost_inr: float = 0.0
    prepayment_incentive_cost_inr: float = 0.0
    net_roi_inr: float = 0.0
    roi_percentage: float = 0.0

class Order(BaseModel):
    order_id: str
    customer_name: str
    customer_phone: str
    address: str
    lat: float
    lng: float
    area: str
    parcel_weight_kg: float
    delivery_window: int
    delivery_window_label: str
    past_failures: int
    weather: int
    weather_severity: Optional[int] = 0
    weather_label: str
    traffic: int
    traffic_density: Optional[int] = 0
    traffic_label: str
    is_cod: int
    payment_type_label: str
    gated_community: int
    gated_community_label: str
    customer_response_rate: float
    customer_confirmed: bool
    historical_rto_rate: Optional[float] = 0.15
    area_density: Optional[float] = 5.0
    subterranean_access: Optional[int] = 0
    third_party_handoff: Optional[int] = 0
    time_window_violation_mins: Optional[float] = 0.0
    risk_score: float
    risk_level: str
    recommended_action: str
    applied_rule: str
    risk_factors: List[RiskFactor]
    mitigation_applied: Optional[str] = "None"
    original_risk_score: Optional[float] = None
    estimated_rto_cost_inr: Optional[float] = 180.0
    uncertainty_bounds: Optional[UncertaintyBounds] = None
    policy_decision: Optional[PolicyDecision] = None
    distance_from_live_location_km: Optional[float] = None

class OptimizationRequest(BaseModel):
    order_ids: Optional[List[str]] = Field(default=None, description="Optional list of specific order IDs to optimize")
    max_payload_kg: float = Field(default=150.0, description="Max vehicle payload capacity in kg")
    max_hos_shift_mins: float = Field(default=480.0, description="Driver Hours of Service shift limit in minutes (8 hrs)")

class OptimizationResponse(BaseModel):
    optimized_orders: List[Order]
    original_risk_sum: float
    optimized_risk_sum: float
    risk_reduction_pct: float
    total_stops: int
    high_risk_count: int
    execution_time_ms: float
    initial_distance_km: float = 0.0
    optimized_distance_km: float = 0.0
    distance_saved_km: float = 0.0
    cvrptw_routes: Optional[List[List[str]]] = None
    vehicles_used: Optional[int] = 1
    schedule_delay_minutes: Optional[int] = 0
    hos_violations_count: Optional[int] = 0
    financial_metrics: Optional[FinancialMetrics] = None

class BatchMitigateRequest(BaseModel):
    order_ids: Optional[List[str]] = None
    auto_apply_all: bool = True

class BatchMitigateResponse(BaseModel):
    status: str
    mitigated_orders_count: int
    original_high_risk_count: int
    new_high_risk_count: int
    original_average_risk: float
    new_average_risk: float
    risk_reduction_pct: float
    financial_metrics: FinancialMetrics
    orders: List[Order]
    twilio_renegotiation_payloads: Optional[List[Dict[str, Any]]] = None

class TelematicsEvent(BaseModel):
    driver_id: str
    lat: float
    lng: float
    speed_kmh: Optional[float] = 0.0
    battery_pct: Optional[float] = 100.0
    is_offline_buffered: bool = False
    timestamp: Optional[float] = None
    status: Optional[str] = "ACTIVE"

class OfflineSyncBatch(BaseModel):
    driver_id: str
    device_id: Optional[str] = "PWA-DRIVER-01"
    buffered_events: List[TelematicsEvent]

class OfflineSyncResponse(BaseModel):
    status: str
    synced_count: int
    queue_remaining: int
    detail: str

class SimulationRequest(BaseModel):
    scenario: str = Field(..., description="'monsoon', 'gridlock', 'subterranean_surge', or 'reset'")

class TwilioSendRequest(BaseModel):
    order_id: str
    custom_phone: Optional[str] = None

class WhatsAppWebhookPayload(BaseModel):
    From: Optional[str] = None
    Body: Optional[str] = None
    order_id: Optional[str] = None
    response_code: Optional[str] = None

class LiveWeatherRequest(BaseModel):
    lat: float
    lng: float
    order_id: Optional[str] = None
    scheduled_window: Optional[str] = None

class LogisticsImpact(BaseModel):
    risk_score_delta: str
    recommended_action: str
    is_severe_alert: bool

class LiveWeatherTelemetryResponse(BaseModel):
    order_id: Optional[str] = None
    coordinates: Dict[str, float]
    weather_code: int
    weather_severity: int
    weather_label: str
    temperature_celsius: float
    wind_speed_kmh: float
    precipitation_mm: float
    logistics_impact: LogisticsImpact
    source: str = "Open-Meteo Realtime Telemetry API"
    cached: bool = False
    timestamp: int

class RiskFactorBreakdown(BaseModel):
    traffic_pct: float = Field(..., description="Traffic delay percentage contribution")
    weather_pct: float = Field(..., description="Weather severity percentage contribution")
    driver_hours_pct: float = Field(..., description="Driver hours percentage contribution")
    notes: str = Field(..., description="Explanatory notes on risk factors")

class WindowEvaluation(BaseModel):
    window_id: int
    window_label: str
    risk_score: float
    risk_level: str
    traffic_label: str
    weather_label: str
    is_optimal: bool = False

class RescheduleRecommendationRequest(BaseModel):
    w1: Optional[float] = Field(default=0.45, description="Weight for Traffic")
    w2: Optional[float] = Field(default=0.35, description="Weight for Weather")
    w3: Optional[float] = Field(default=0.20, description="Weight for Driver Hours")
    threshold: Optional[float] = Field(default=0.50, description="High risk threshold")
    driver_hours: Optional[float] = Field(default=6.5, description="Current accumulated driver hours")

class RescheduleRecommendationResponse(BaseModel):
    order_id: str
    customer_name: str
    current_scheduled_time: str
    current_risk_score: float
    current_risk_level: str
    is_high_risk: bool
    risk_breakdown: RiskFactorBreakdown
    suggested_time_window: str
    suggested_delivery_window_id: int
    suggested_risk_score: float
    suggested_risk_level: str
    risk_reduction_pct: float
    mitigation_notes: str
    available_windows: List[WindowEvaluation]

class AcceptRescheduleRequest(BaseModel):
    accepted_time_window: str
    accepted_delivery_window_id: int
    notify_customer: bool = True

