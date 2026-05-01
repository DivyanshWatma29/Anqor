import pytest
from core.indicators import generate_indicators

def test_no_indicators_empty_dict():
    """Test that an empty dictionary triggers zero-value edge case indicators."""
    data = {}
    result = generate_indicators(data)
    assert "No witnesses reported at the scene" in result
    assert "Very new customer (0 months)" in result

def test_no_indicators_safe_values():
    """Test with safe values that shouldn't trigger any indicators."""
    data = {
        'injury_claim': 1000,
        'property_claim': 1000,
        'vehicle_claim': 1000,
        'witnesses': 2,
        'police_report_available': 'YES',
        'incident_severity': 'Minor Damage',
        'incident_hour_of_the_day': 14,
        'months_as_customer': 24,
        'number_of_vehicles_involved': 1,
        'bodily_injuries': 0,
        'incident_type': 'Single Vehicle Collision',
        'property_damage': 'NO',
        'collision_type': 'Rear Collision',
        'policy_annual_premium': 1000,
        'policy_deductable': 500,
        'capital_gains': 0,
        'capital_loss': 0
    }
    result = generate_indicators(data)
    assert result == ["No significant fraud indicators detected"]

def test_high_claim_amount():
    """Test total claim amount thresholds."""
    data_high = {'injury_claim': 20000, 'property_claim': 6000}  # Total 26000
    assert "High total claim amount ($26,000)" in generate_indicators(data_high)

    data_very_high = {'vehicle_claim': 45000}  # Total 45000
    assert "Very high total claim amount ($45,000)" in generate_indicators(data_very_high)

def test_no_witnesses():
    """Test no witnesses indicator."""
    data = {'witnesses': 0}
    assert "No witnesses reported at the scene" in generate_indicators(data)

def test_no_police_report():
    """Test police report availability."""
    assert "No police report available for the incident" in generate_indicators({'police_report_available': 'NO'})
    assert "No police report available for the incident" in generate_indicators({'police_report_available': '?'})

def test_incident_severity():
    """Test incident severity indicators."""
    assert "Incident reported as total loss — highest severity" in generate_indicators({'incident_severity': 'Total Loss'})
    assert "Incident reported with major damage" in generate_indicators({'incident_severity': 'Major Damage'})

def test_incident_hour():
    """Test late night / early morning incident hours."""
    assert "Incident occurred during late/early hours (23:00)" in generate_indicators({'incident_hour_of_the_day': 23})
    assert "Incident occurred during late/early hours (3:00)" in generate_indicators({'incident_hour_of_the_day': 3})

def test_customer_tenure():
    """Test customer tenure indicators."""
    assert "Very new customer (3 months)" in generate_indicators({'months_as_customer': 3})
    assert "Relatively new customer (9 months)" in generate_indicators({'months_as_customer': 9})

def test_multiple_vehicles_and_injuries():
    """Test multiple vehicles and bodily injuries."""
    assert "Multiple vehicles involved (4)" in generate_indicators({'number_of_vehicles_involved': 4})
    assert "Multiple bodily injuries reported (2)" in generate_indicators({'bodily_injuries': 2})

def test_incident_type_theft():
    """Test vehicle theft incident type."""
    assert "Incident type is vehicle theft" in generate_indicators({'incident_type': 'Vehicle Theft'})

def test_uncertain_damage_and_collision():
    """Test uncertain property damage and collision type."""
    assert "Property damage status is uncertain" in generate_indicators({'property_damage': '?'})
    assert "Collision type is unspecified" in generate_indicators({'collision_type': '?'})

def test_high_premium():
    """Test high annual premium indicator."""
    assert "High annual premium ($2,500)" in generate_indicators({'policy_annual_premium': 2500})

def test_low_deductible():
    """Test very low deductible relative to claim amount."""
    data = {'injury_claim': 50000, 'policy_deductable': 1000} # 1000 / 50000 = 0.02
    assert "Very low deductible relative to claim amount" in generate_indicators(data)

def test_capital_gains_losses():
    """Test high capital gains and significant capital losses."""
    assert "Significant capital losses ($60,000)" in generate_indicators({'capital_loss': 60000})
    assert "High capital gains reported ($90,000)" in generate_indicators({'capital_gains': 90000})

def test_truncation_limit():
    """Test that the maximum number of indicators returned is 8."""
    data = {
        'injury_claim': 50000,                  # 1
        'witnesses': 0,                         # 2
        'police_report_available': 'NO',        # 3
        'incident_severity': 'Total Loss',      # 4
        'incident_hour_of_the_day': 23,         # 5
        'months_as_customer': 2,                # 6
        'number_of_vehicles_involved': 3,       # 7
        'bodily_injuries': 2,                   # 8
        'incident_type': 'Vehicle Theft',       # 9 (Should be truncated)
        'property_damage': '?',                 # 10
        'collision_type': '?'                   # 11
    }
    result = generate_indicators(data)
    assert len(result) == 8
    assert "Very high total claim amount ($50,000)" in result
    # The order is deterministic based on the function implementation
    assert "Incident type is vehicle theft" not in result
