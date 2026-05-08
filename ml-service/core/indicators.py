"""
Anqor — Fraud Indicators
===================================
Generate human-readable fraud risk indicators for each insurance category.
"""


def _auto_indicators(data: dict) -> list:
    """Generate fraud indicators for auto insurance claims."""
    indicators = []
    
    total_claim = (
        float(data.get('injury_claim', 0)) +
        float(data.get('property_claim', 0)) +
        float(data.get('vehicle_claim', 0))
    )
    
    if total_claim > 40000:
        indicators.append(f"Very high total claim amount (${total_claim:,.0f})")
    elif total_claim > 25000:
        indicators.append(f"High total claim amount (${total_claim:,.0f})")
    
    witnesses = int(data.get('witnesses', 0))
    if witnesses == 0:
        indicators.append("No witnesses reported at the scene")
    
    police = str(data.get('police_report_available', ''))
    if police in ('NO', '?', 'No'):
        indicators.append("No police report available")
    
    severity = str(data.get('incident_severity', ''))
    if severity == 'Total Loss':
        indicators.append("Incident reported as total loss — highest severity")
    elif severity == 'Major Damage':
        indicators.append("Incident reported with major damage")
    
    hour = int(data.get('incident_hour_of_the_day', 12))
    if hour >= 22 or hour <= 4:
        indicators.append(f"Incident occurred during late/early hours ({hour}:00)")
    
    months = int(data.get('months_as_customer', 0))
    if months < 6:
        indicators.append(f"Very new customer ({months} months)")
    elif months < 12:
        indicators.append(f"Relatively new customer ({months} months)")
    
    vehicles = int(data.get('number_of_vehicles_involved', 0))
    if vehicles >= 3:
        indicators.append(f"Multiple vehicles involved ({vehicles})")
    
    bodily = int(data.get('bodily_injuries', 0))
    if bodily >= 2:
        indicators.append(f"Multiple bodily injuries reported ({bodily})")
    
    incident_type = str(data.get('incident_type', ''))
    if incident_type == 'Vehicle Theft':
        indicators.append("Incident type is vehicle theft")
    
    prop_damage = str(data.get('property_damage', ''))
    if prop_damage == '?':
        indicators.append("Property damage status is uncertain")
    
    collision = str(data.get('collision_type', ''))
    if collision == '?':
        indicators.append("Collision type is unspecified")
    
    premium = float(data.get('policy_annual_premium', 0))
    if premium > 2000:
        indicators.append(f"High annual premium (${premium:,.0f})")
    
    deductible = float(data.get('policy_deductable', 0))
    if total_claim > 0 and deductible / total_claim < 0.05:
        indicators.append("Very low deductible relative to claim")
    
    cap_loss = float(data.get('capital_loss', data.get('capital-loss', 0)))
    if cap_loss > 50000:
        indicators.append(f"Significant capital losses (${cap_loss:,.0f})")
    
    return indicators


def _health_indicators(data: dict) -> list:
    """Generate fraud indicators for health insurance claims."""
    indicators = []
    
    claim_amt = float(data.get('Claim_Amount', data.get('claim_amount', 0)))
    approved = float(data.get('Approved_Amount', data.get('approved_amount', 0)))
    stay = int(data.get('Length_of_Stay', data.get('length_of_stay', data.get('hospital_stay_days', 0))))
    provider_claims = int(data.get('Number_of_Claims_Per_Provider_Monthly', 0))
    days_gap = int(data.get('Days_Between_Service_and_Claim', 0))
    
    if claim_amt > 30000:
        indicators.append(f"Very high claim amount (${claim_amt:,.0f})")
    elif claim_amt > 15000:
        indicators.append(f"High claim amount (${claim_amt:,.0f})")
    
    if approved > 0 and claim_amt > 0:
        ratio = approved / claim_amt
        if ratio < 0.5:
            indicators.append(f"Low approval ratio ({ratio:.0%}) — large discrepancy")
    
    if stay == 0 and claim_amt > 5000:
        indicators.append("Zero hospital stay with significant claim")
    
    if provider_claims > 80:
        indicators.append(f"High-volume provider ({provider_claims} claims/month)")
    
    if days_gap > 60:
        indicators.append(f"Long delay between service and claim ({days_gap} days)")
    
    visit_type = str(data.get('Visit_Type', data.get('visit_type', '')))
    if visit_type == 'Outpatient' and claim_amt > 10000:
        indicators.append("Outpatient visit with unusually high claim")
    
    status = str(data.get('Claim_Status', data.get('claim_status', '')))
    if status == 'Rejected':
        indicators.append("Claim was previously rejected")
    
    return indicators


def _travel_indicators(data: dict) -> list:
    """Generate fraud indicators for travel insurance claims."""
    indicators = []
    
    duration = int(data.get('duration', 0))
    net_sales = float(data.get('net_sales', 0))
    commission = float(data.get('commission', 0))
    age = int(data.get('age', 30))
    
    if duration > 300:
        indicators.append(f"Extremely long trip duration ({duration} days)")
    
    if net_sales < 0:
        indicators.append(f"Negative net sales (${net_sales:,.2f})")
    
    if commission > 150:
        indicators.append(f"High commission amount (${commission:,.2f})")
    
    if net_sales > 0 and commission / net_sales > 0.5:
        indicators.append(f"Commission exceeds 50% of net sales")
    
    agency_type = str(data.get('agency_type', ''))
    channel = str(data.get('distribution_channel', ''))
    if agency_type == 'Airlines' and channel == 'Offline':
        indicators.append("Offline airline booking — unusual pattern")
    
    if age > 80 and duration > 60:
        indicators.append(f"Elderly traveler ({age}) with extended trip")
    
    return indicators


def _life_indicators(data: dict) -> list:
    """Generate fraud indicators for life insurance claims."""
    indicators = []
    
    months = int(data.get('policy_duration_months', 0))
    cause = str(data.get('cause_of_death', ''))
    nominee = str(data.get('nominee_relationship', ''))
    medical = str(data.get('medical_history_disclosed', ''))
    
    if months < 6:
        indicators.append(f"Very early claim — policy only {months} months old")
    elif months < 24:
        indicators.append(f"Claim within contestability period ({months} months)")
    
    if cause == 'Unknown':
        indicators.append("Cause of death is unknown/undetermined")
    elif cause == 'Homicide':
        indicators.append("Death by homicide — requires investigation")
    
    if medical in ('NO', 'No'):
        indicators.append("Medical history was not disclosed at policy inception")
    
    if nominee in ('None', 'Unknown', '', 'nan'):
        indicators.append("No clear nominee relationship established")
    elif nominee == 'Other':
        indicators.append("Nominee relationship is 'Other' — non-standard")
    
    if months < 12 and medical in ('NO', 'No'):
        indicators.append("⚠️ HIGH RISK: Early claim with undisclosed medical history")
    
    return indicators


def _property_indicators(data: dict) -> list:
    """Generate fraud indicators for property insurance claims."""
    indicators = []
    
    estimate = float(data.get('repair_estimate', 0))
    home_age = int(data.get('home_age', 0))
    claim_type = str(data.get('claim_type', ''))
    weather = str(data.get('weather_conditions', ''))
    police = str(data.get('police_report', ''))
    prop_type = str(data.get('property_type', ''))
    
    if estimate > 75000:
        indicators.append(f"Very high repair estimate (${estimate:,.0f})")
    elif estimate > 50000:
        indicators.append(f"High repair estimate (${estimate:,.0f})")
    
    if police in ('NO', 'No'):
        indicators.append("No police report filed")
    
    if estimate > 50000 and police in ('NO', 'No'):
        indicators.append("⚠️ HIGH RISK: Large claim without police report")
    
    if weather == 'Normal' and claim_type in ('Weather', 'Storm'):
        indicators.append("Weather damage claimed during normal conditions")
    
    if home_age > 80:
        indicators.append(f"Very old property ({home_age} years)")
    
    if prop_type == 'Commercial' and estimate > 60000:
        indicators.append("High commercial property claim")
    
    if claim_type == 'Burglary' and police in ('NO', 'No'):
        indicators.append("Burglary claim without police report — suspicious")
    
    return indicators


# Dispatcher
_INDICATOR_FUNCS = {
    'auto': _auto_indicators,
    'health': _health_indicators,
    'travel': _travel_indicators,
    'life': _life_indicators,
    'property': _property_indicators,
}


def generate_indicators(raw_data: dict, claim_type: str = 'auto') -> list:
    """Generate fraud indicators for any claim type."""
    func = _INDICATOR_FUNCS.get(claim_type, _auto_indicators)
    indicators = func(raw_data)
    
    if not indicators:
        indicators.append("No significant fraud indicators detected")
    
    return indicators[:10]  # Cap at 10
