import pandas as pd
import numpy as np

def generate_health_data(n_samples=2000):
    np.random.seed(42)
    data = {
        'provider_id': np.random.randint(1000, 9999, n_samples),
        'patient_age': np.random.randint(18, 90, n_samples),
        'patient_gender': np.random.choice(['MALE', 'FEMALE'], n_samples),
        'diagnosis_code': np.random.choice(['D01', 'D02', 'D03', 'D04', 'D05'], n_samples),
        'procedure_code': np.random.choice(['P01', 'P02', 'P03', 'P04'], n_samples),
        'claim_amount': np.round(np.random.uniform(500, 50000, n_samples), 2),
        'deductible_paid': np.round(np.random.uniform(0, 2000, n_samples), 2),
        'hospital_stay_days': np.random.randint(0, 30, n_samples)
    }
    df = pd.DataFrame(data)

    # Introduce Fraud Patterns (e.g., massive claims for minor procedures, 0 hospital days but huge claim)
    df['fraud_probability'] = 0.05
    df.loc[(df['claim_amount'] > 30000) & (df['hospital_stay_days'] < 2), 'fraud_probability'] = 0.8
    df.loc[(df['procedure_code'] == 'P04') & (df['claim_amount'] > 20000), 'fraud_probability'] = 0.6

    df['is_fraud'] = np.random.binomial(1, df['fraud_probability'])
    df = df.drop(columns=['fraud_probability'])
    return df

def generate_travel_data(n_samples=2000):
    np.random.seed(42)
    data = {
        'agency_type': np.random.choice(['Travel Agency', 'Airlines'], n_samples),
        'distribution_channel': np.random.choice(['Online', 'Offline'], n_samples),
        'product_name': np.random.choice(['Cancellation Plan', 'Comprehensive Plan', 'Rental Vehicle'], n_samples),
        'duration': np.random.randint(1, 365, n_samples),
        'destination': np.random.choice(['USA', 'UK', 'EUROPE', 'ASIA', 'OTHER'], n_samples),
        'net_sales': np.round(np.random.uniform(-50, 500, n_samples), 2),
        'commission': np.round(np.random.uniform(0, 200, n_samples), 2),
        'age': np.random.randint(18, 85, n_samples)
    }
    df = pd.DataFrame(data)

    # Introduce Fraud Patterns (e.g., high net sales but negative duration, or high commission offline)
    df['fraud_probability'] = 0.02
    df.loc[(df['duration'] > 300) & (df['net_sales'] < 0), 'fraud_probability'] = 0.9
    df.loc[(df['agency_type'] == 'Airlines') & (df['commission'] > 150), 'fraud_probability'] = 0.5

    df['is_fraud'] = np.random.binomial(1, df['fraud_probability'])
    df = df.drop(columns=['fraud_probability'])
    return df

def generate_property_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'property_type': np.random.choice(['Residential', 'Commercial', 'Industrial'], n),
        'home_age': np.random.randint(0, 100, n),
        'claim_type': np.random.choice(['Fire', 'Water', 'Burglary', 'Structural'], n),
        'weather_conditions': np.random.choice(['Normal', 'Storm', 'Hurricane'], n),
        'police_report': np.random.choice(['YES', 'NO'], n),
        'repair_estimate': np.round(np.random.uniform(1000, 100000, n), 2)
    })
    df['is_fraud'] = np.where((df['repair_estimate'] > 50000) & (df['police_report'] == 'NO'), 1, 0)
    # Add noise
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

def generate_life_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'policy_duration_months': np.random.randint(1, 360, n),
        'cause_of_death': np.random.choice(['Natural', 'Accident', 'Homicide', 'Unknown'], n),
        'nominee_relationship': np.random.choice(['Spouse', 'Child', 'Other', 'None'], n),
        'medical_history_disclosed': np.random.choice(['YES', 'NO'], n)
    })
    # Fraud if death soon after policy start and no medical history disclosed
    df['is_fraud'] = np.where((df['policy_duration_months'] < 12) & (df['medical_history_disclosed'] == 'NO'), 1, 0)
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df

def generate_auto_data(n=2000):
    np.random.seed(42)
    df = pd.DataFrame({
        'months_as_customer': np.random.randint(1, 240, n),
        'insured_sex': np.random.choice(['MALE', 'FEMALE'], n),
        'insured_education_level': np.random.choice(['MD', 'PhD', 'High School', 'College'], n),
        'insured_occupation': np.random.choice(['exec-managerial', 'prof-specialty', 'sales', 'farming'], n),
        'insured_relationship': np.random.choice(['husband', 'wife', 'unmarried'], n),
        'policy_deductable': np.random.choice([500, 1000, 2000], n),
        'policy_annual_premium': np.round(np.random.uniform(500, 3000, n), 2),
        'umbrella_limit': np.random.choice([0, 1000000, 2000000], n),
        'policy_csl': np.random.choice(['100/300', '250/500', '500/1000'], n),
        'capital_gains': np.random.randint(0, 100000, n),
        'capital_loss': np.random.randint(-100000, 0, n),
        'incident_hour_of_the_day': np.random.randint(0, 24, n),
        'incident_type': np.random.choice(['Single Vehicle Collision', 'Multi-vehicle Collision', 'Parked Car', 'Vehicle Theft'], n),
        'collision_type': np.random.choice(['Side Collision', 'Rear Collision', 'Front Collision', '?'], n),
        'incident_severity': np.random.choice(['Major Damage', 'Minor Damage', 'Total Loss'], n),
        'authorities_contacted': np.random.choice(['Police', 'Fire', 'Ambulance', 'None'], n),
        'number_of_vehicles_involved': np.random.randint(1, 5, n),
        'bodily_injuries': np.random.randint(0, 3, n),
        'witnesses': np.random.randint(0, 4, n),
        'injury_claim': np.round(np.random.uniform(0, 20000, n), 2),
        'property_claim': np.round(np.random.uniform(0, 20000, n), 2),
        'vehicle_claim': np.round(np.random.uniform(0, 50000, n), 2),
        'property_damage': np.random.choice(['YES', 'NO', '?'], n),
        'police_report_available': np.random.choice(['YES', 'NO', '?'], n)
    })
    df['is_fraud'] = np.where((df['incident_severity'] == 'Total Loss') & (df['witnesses'] == 0), 1, 0)
    noise = np.random.binomial(1, 0.05, n)
    df['is_fraud'] = np.abs(df['is_fraud'] - noise)
    return df
