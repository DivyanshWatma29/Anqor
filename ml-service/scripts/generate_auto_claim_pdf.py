import random
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def generate_pdf(filename):
    c = canvas.Canvas(filename, pagesize=letter)
    width, height = letter

    # Header
    c.setFillColor(HexColor("#1e3a8a"))
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, height - 50, "Anqor - Auto Claim Report")
    
    c.setStrokeColor(HexColor("#1e3a8a"))
    c.setLineWidth(2)
    c.line(50, height - 60, width - 50, height - 60)

    # Random Data Generation
    data = {
        "Customer Profile": {
            "Months as Customer": random.randint(12, 120),
            "Insured Sex": random.choice(["MALE", "FEMALE"]),
            "Insured Education Level": random.choice(["MD", "PhD", "Associate", "Masters", "High School", "College", "JD"]),
            "Insured Occupation": random.choice(["exec-managerial", "prof-specialty", "sales", "craft-repair", "tech-support", "adm-clerical"]),
            "Insured Relationship": random.choice(["husband", "wife", "own-child", "not-in-family", "unmarried"])
        },
        "Policy Details": {
            "Policy Deductable": random.choice([500, 1000, 2000]),
            "Policy Annual Premium": round(random.uniform(800, 2500), 2),
            "Umbrella Limit": random.choice([0, 1000000, 2000000]),
            "Policy CSL": random.choice(["100/300", "250/500", "500/1000"])
        },
        "Financial Indicators": {
            "Capital Gains": random.randint(0, 50000),
            "Capital Loss": random.randint(-50000, 0)
        },
        "Incident Information": {
            "Incident Hour Of The Day": random.randint(0, 23),
            "Incident Type": random.choice(["Single Vehicle Collision", "Multi-vehicle Collision", "Parked Car", "Vehicle Theft"]),
            "Collision Type": random.choice(["Front Collision", "Rear Collision", "Side Collision", "?"]),
            "Incident Severity": random.choice(["Minor Damage", "Major Damage", "Total Loss", "Trivial Damage"]),
            "Authorities Contacted": random.choice(["Police", "Fire", "Ambulance", "None"]),
            "Number Of Vehicles Involved": random.randint(1, 4),
            "Bodily Injuries": random.randint(0, 3),
            "Witnesses": random.randint(0, 3)
        },
        "Claim Details": {
            "Injury Claim": random.randint(0, 20000),
            "Property Claim": random.randint(1000, 30000),
            "Vehicle Claim": random.randint(2000, 50000),
            "Property Damage": random.choice(["YES", "NO", "?"]),
            "Police Report Available": random.choice(["YES", "NO", "?"])
        }
    }

    y_position = height - 100
    c.setFont("Helvetica", 12)
    c.setFillColor(HexColor("#000000"))

    for section, fields in data.items():
        # Section Title
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(HexColor("#2563eb"))
        c.drawString(50, y_position, section.upper())
        y_position -= 20

        # Fields
        c.setFont("Helvetica", 12)
        c.setFillColor(HexColor("#333333"))
        for key, value in fields.items():
            text = f"{key}: {value}"
            c.drawString(70, y_position, text)
            y_position -= 20
        
        y_position -= 10 # Extra spacing between sections

        # Page break if running out of space
        if y_position < 50:
            c.showPage()
            y_position = height - 50

    c.save()
    print(f"Generated {filename}")

if __name__ == "__main__":
    import os
    output_path = "/home/divyansh/Desktop/INS/fraud.ai/sample_auto_claim.pdf"
    generate_pdf(output_path)
