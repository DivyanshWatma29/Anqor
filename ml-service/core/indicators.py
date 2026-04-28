def generate_indicators(raw_data: dict) -> list:
    """Generate heuristic fraud indicators based on raw input values."""
    indicators = []

    total_claim = (
        float(raw_data.get('injury_claim', 0)) +
        float(raw_data.get('property_claim', 0)) +
        float(raw_data.get('vehicle_claim', 0))
    )

    if total_claim > 40000:
        indicators.append(f"Very high total claim amount (${total_claim:,.0f})")
    elif total_claim > 25000:
        indicators.append(f"High total claim amount (${total_claim:,.0f})")

    witnesses = int(raw_data.get('witnesses', 0))
    if witnesses == 0:
        indicators.append("No witnesses reported at the scene")

    police_report = str(raw_data.get('police_report_available', ''))
    if police_report in ('NO', '?'):
        indicators.append("No police report available for the incident")

    severity = str(raw_data.get('incident_severity', ''))
    if severity == 'Total Loss':
        indicators.append("Incident reported as total loss — highest severity")
    elif severity == 'Major Damage':
        indicators.append("Incident reported with major damage")

    incident_hour = int(raw_data.get('incident_hour_of_the_day', 12))
    if incident_hour >= 22 or incident_hour <= 4:
        indicators.append(f"Incident occurred during late/early hours ({incident_hour}:00)")

    months = int(raw_data.get('months_as_customer', 0))
    if months < 6:
        indicators.append(f"Very new customer ({months} months)")
    elif months < 12:
        indicators.append(f"Relatively new customer ({months} months)")

    vehicles = int(raw_data.get('number_of_vehicles_involved', 0))
    if vehicles >= 3:
        indicators.append(f"Multiple vehicles involved ({vehicles})")

    bodily = int(raw_data.get('bodily_injuries', 0))
    if bodily >= 2:
        indicators.append(f"Multiple bodily injuries reported ({bodily})")

    incident_type = str(raw_data.get('incident_type', ''))
    if incident_type == 'Vehicle Theft':
        indicators.append("Incident type is vehicle theft")

    property_damage = str(raw_data.get('property_damage', ''))
    if property_damage == '?':
        indicators.append("Property damage status is uncertain")

    collision_type = str(raw_data.get('collision_type', ''))
    if collision_type == '?':
        indicators.append("Collision type is unspecified")

    premium = float(raw_data.get('policy_annual_premium', 0))
    if premium > 2000:
        indicators.append(f"High annual premium (${premium:,.0f})")

    deductible = float(raw_data.get('policy_deductable', 0))
    if total_claim > 0 and deductible / total_claim < 0.05:
        indicators.append("Very low deductible relative to claim amount")

    capital_gains = float(raw_data.get('capital_gains', 0))
    capital_loss = float(raw_data.get('capital_loss', 0))
    if capital_loss > 50000:
        indicators.append(f"Significant capital losses (${capital_loss:,.0f})")
    if capital_gains > 80000:
        indicators.append(f"High capital gains reported (${capital_gains:,.0f})")

    # Ensure at least 1 indicator
    if not indicators:
        indicators.append("No significant fraud indicators detected")

    return indicators[:8]
