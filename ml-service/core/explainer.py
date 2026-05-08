"""
Anqor — Fraud Explainer
==================================
Generates a human-readable narrative explaining WHY a claim was
flagged as fraudulent (or legitimate). Combines:
  1. Rule-based indicators (from indicators.py)
  2. ML feature importance (from shap_explainer.py)
  3. Model confidence context
into a structured explanation the user can actually understand.
"""


def generate_fraud_explanation(
    prediction: str,
    probability: float,
    indicators: list,
    shap_data: dict,
    claim_data: dict,
    claim_type: str,
    confidence_info: dict,
) -> dict:
    """
    Build a complete "Why is this claim flagged?" explanation.

    Returns:
        {
            "verdict": "fraud" | "legitimate",
            "summary": "One-sentence plain-English summary",
            "risk_score": 85,
            "confidence": "high",
            "reasons": [
                {
                    "title": "Short reason title",
                    "detail": "Longer explanation with data",
                    "severity": "critical" | "high" | "medium" | "low",
                    "category": "financial" | "behavioral" | "documentation" | "statistical" | "temporal",
                    "source": "rule" | "ml" | "combined",
                    "field": "witnesses"  (optional — the input field that triggered it)
                }
            ],
            "positive_factors": [...],   # things that REDUCE fraud risk
            "recommendation": "What should happen next",
        }
    """
    is_fraud = prediction in ('Y', 'Fraud', 1, '1', True)
    risk_score = round(probability * 100, 1)
    reasons = []
    positive_factors = []

    # ── 1. Convert rule-based indicators into structured reasons ──
    for indicator in indicators:
        if indicator == "No significant fraud indicators detected":
            continue

        reason = _classify_indicator(indicator, claim_type)
        if reason:
            reasons.append(reason)

    # ── 2. Convert SHAP features into structured reasons ──
    shap_features = shap_data.get('features', [])
    for feat in shap_features:
        if feat['direction'] == 'increases_fraud_risk':
            reasons.append({
                'title': f"'{_humanize_field(feat['feature'])}' increases fraud risk",
                'detail': (
                    f"The ML model identified '{_humanize_field(feat['feature'])}' as a significant "
                    f"fraud signal in this claim. This feature pushed the fraud probability "
                    f"{'up' if feat['impact'] > 0 else 'down'} by {abs(feat['impact']) * 100:.1f}%."
                ),
                'severity': feat['magnitude'],
                'category': 'statistical',
                'source': 'ml',
                'field': feat['feature'],
            })
        else:
            positive_factors.append({
                'title': f"'{_humanize_field(feat['feature'])}' reduces fraud risk",
                'detail': (
                    f"This feature is consistent with legitimate claims and reduced "
                    f"the fraud score by {abs(feat['impact']) * 100:.1f}%."
                ),
                'field': feat['feature'],
            })

    # ── 3. Sort by severity ──
    severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
    reasons.sort(key=lambda r: severity_order.get(r.get('severity', 'low'), 3))

    # ── 4. De-duplicate (same field from rule + ML) ──
    seen_fields = set()
    deduped = []
    for r in reasons:
        field = r.get('field', r['title'])
        if field not in seen_fields:
            deduped.append(r)
            seen_fields.add(field)
    reasons = deduped[:12]  # cap

    # ── 5. Build summary ──
    if is_fraud:
        if risk_score >= 80:
            summary = (
                f"This {claim_type} claim has a {risk_score}% fraud probability and is flagged as "
                f"highly suspicious. {len(reasons)} risk factor{'s' if len(reasons) != 1 else ''} "
                f"{'were' if len(reasons) != 1 else 'was'} identified."
            )
        elif risk_score >= 50:
            summary = (
                f"This {claim_type} claim shows moderate fraud risk at {risk_score}%. "
                f"Several factors raised concern."
            )
        else:
            summary = (
                f"This {claim_type} claim was flagged, but the fraud probability is relatively low "
                f"at {risk_score}%. Review recommended."
            )
    else:
        if risk_score <= 10:
            summary = (
                f"This {claim_type} claim appears legitimate with only {risk_score}% fraud probability. "
                f"No major risk factors detected."
            )
        else:
            summary = (
                f"This {claim_type} claim is likely legitimate ({risk_score}% fraud probability), "
                f"though {len(reasons)} minor concern{'s were' if len(reasons) != 1 else ' was'} noted."
            )

    # ── 6. Recommendation ──
    if is_fraud and risk_score >= 80:
        recommendation = "Escalate to the Special Investigation Unit (SIU) for detailed review. Do not approve until investigation is complete."
    elif is_fraud and risk_score >= 50:
        recommendation = "Flag for manual review by a senior claims adjuster. Request additional documentation from the claimant."
    elif is_fraud:
        recommendation = "Add to watchlist for monitoring. Proceed with standard review but note the risk factors."
    elif risk_score > 20:
        recommendation = "Likely legitimate, but perform standard verification checks before approval."
    else:
        recommendation = "Low risk — proceed with standard approval workflow."

    reliability = confidence_info.get('reliability', 'medium')

    return {
        'verdict': 'fraud' if is_fraud else 'legitimate',
        'summary': summary,
        'risk_score': risk_score,
        'confidence': reliability,
        'reasons': reasons,
        'positive_factors': positive_factors[:5],
        'recommendation': recommendation,
        'total_risk_factors': len(reasons),
        'total_positive_factors': len(positive_factors),
    }


# ─── HELPERS ──────────────────────────────────────────────────────

def _humanize_field(field_name: str) -> str:
    """Convert snake_case field name to human-readable."""
    return field_name.replace('_', ' ').replace('-', ' ').title()


def _classify_indicator(indicator: str, claim_type: str) -> dict:
    """Convert a flat indicator string into a structured reason with category & severity."""
    text = indicator.lower()

    # ── Critical severity ──
    if '⚠️' in indicator or 'HIGH RISK' in indicator:
        return {
            'title': indicator.replace('⚠️ HIGH RISK: ', ''),
            'detail': indicator,
            'severity': 'critical',
            'category': _guess_category(text),
            'source': 'rule',
        }

    # ── Financial indicators ──
    if any(kw in text for kw in ['claim amount', 'repair estimate', 'premium', 'deductible',
                                   'commission', 'net sales', 'capital loss', 'approval ratio',
                                   'commercial property claim']):
        severity = 'high' if any(w in text for w in ['very high', 'very low', 'significant', 'exceeds']) else 'medium'
        return {
            'title': indicator,
            'detail': _expand_financial(indicator, claim_type),
            'severity': severity,
            'category': 'financial',
            'source': 'rule',
        }

    # ── Behavioral (checked before documentation to catch "total loss", "property damage" etc.) ──
    if any(kw in text for kw in ['witnesses', 'bodily injuries', 'vehicles involved',
                                   'total loss', 'major damage', 'vehicle theft',
                                   'offline', 'elderly', 'old property',
                                   'zero hospital stay', 'outpatient', 'rejected',
                                   'burglary', 'homicide', 'nominee',
                                   'highest severity', 'property damage']):
        return {
            'title': indicator,
            'detail': _expand_behavioral(indicator, claim_type),
            'severity': 'high' if any(w in text for w in ['total loss', 'theft', 'zero hospital', 'homicide', 'burglary', 'no witness']) else 'medium',
            'category': 'behavioral',
            'source': 'rule',
        }

    # ── Documentation / police ──
    if any(kw in text for kw in ['police', 'report', 'uncertain', 'unspecified', 'unknown',
                                   'undetermined', 'not disclosed']) and 'witness' not in text:
        return {
            'title': indicator,
            'detail': _expand_documentation(indicator, claim_type),
            'severity': 'high',
            'category': 'documentation',
            'source': 'rule',
        }

    # ── Temporal ──
    if any(kw in text for kw in ['new customer', 'early claim', 'contestability',
                                   'late/early hours', 'delay', 'policy only']):
        return {
            'title': indicator,
            'detail': _expand_temporal(indicator, claim_type),
            'severity': 'medium',
            'category': 'temporal',
            'source': 'rule',
        }

    # ── Fallback ──
    return {
        'title': indicator,
        'detail': indicator,
        'severity': 'medium',
        'category': _guess_category(text),
        'source': 'rule',
    }


def _guess_category(text: str) -> str:
    if any(w in text for w in ['$', 'amount', 'claim', 'premium', 'cost', 'sales', 'commission']):
        return 'financial'
    if any(w in text for w in ['report', 'police', 'document', 'history']):
        return 'documentation'
    if any(w in text for w in ['hour', 'month', 'day', 'early', 'delay', 'new']):
        return 'temporal'
    return 'behavioral'


def _expand_financial(indicator: str, claim_type: str) -> str:
    """Add context to a financial indicator."""
    base = indicator
    if 'very high' in indicator.lower():
        return (
            f"{base}. Claims of this magnitude are statistically rare and are "
            f"associated with a higher fraud rate in the training data. "
            f"The model weighs large claim amounts heavily when assessing risk."
        )
    if 'approval ratio' in indicator.lower():
        return (
            f"{base}. A large gap between the claimed amount and the approved amount "
            f"is a strong indicator of inflated or fabricated charges."
        )
    if 'deductible' in indicator.lower():
        return (
            f"{base}. A very low deductible relative to the total claim can indicate "
            f"the policy was structured to maximise payout."
        )
    return f"{base}. This financial pattern deviates from legitimate claim norms."


def _expand_documentation(indicator: str, claim_type: str) -> str:
    """Add context to a documentation indicator."""
    base = indicator
    if 'police' in indicator.lower():
        return (
            f"{base}. Legitimate claims involving significant loss or damage almost always "
            f"have a corresponding police report. Missing documentation is a classic fraud signal."
        )
    if 'unknown' in indicator.lower() or 'undetermined' in indicator.lower():
        return (
            f"{base}. Vague or missing key details reduce the verifiability of a claim "
            f"and correlate with fraudulent filings."
        )
    if 'not disclosed' in indicator.lower():
        return (
            f"{base}. Non-disclosure of relevant history at the time of policy purchase "
            f"can indicate intent to file a claim that would otherwise be excluded."
        )
    return f"{base}. Incomplete documentation raises investigation priority."


def _expand_temporal(indicator: str, claim_type: str) -> str:
    """Add context to a temporal indicator."""
    base = indicator
    if 'new customer' in indicator.lower() or 'early claim' in indicator.lower():
        return (
            f"{base}. Claims filed shortly after a policy starts are statistically more "
            f"likely to be fraudulent — the policyholder may have purchased coverage "
            f"knowing they intended to file a claim."
        )
    if 'late/early hours' in indicator.lower():
        return (
            f"{base}. Incidents reported during unusual hours (late night / early morning) "
            f"are harder to verify and more frequently associated with staged events."
        )
    if 'delay' in indicator.lower():
        return (
            f"{base}. Long delays between the service/incident date and the claim filing "
            f"can indicate the claim was fabricated after the fact or that records were altered."
        )
    return f"{base}. The timing of this event is atypical."


def _expand_behavioral(indicator: str, claim_type: str) -> str:
    """Add context to a behavioral indicator."""
    base = indicator
    if 'witnesses' in indicator.lower():
        return (
            f"{base}. Legitimate incidents typically have at least one independent witness. "
            f"Lack of witnesses makes the claim harder to verify and is a known fraud signal."
        )
    if 'total loss' in indicator.lower():
        return (
            f"{base}. Total loss claims yield the highest payouts and are therefore "
            f"more attractive targets for fraud."
        )
    if 'theft' in indicator.lower():
        return (
            f"{base}. Vehicle theft claims are among the most commonly fabricated "
            f"insurance claim types."
        )
    if 'zero hospital stay' in indicator.lower():
        return (
            f"{base}. Claiming significant medical expenses with zero hospital stay "
            f"is unusual and warrants scrutiny."
        )
    if 'burglary' in indicator.lower():
        return (
            f"{base}. A burglary claim without a police report is highly suspicious, "
            f"as filing a police report is standard practice for legitimate burglaries."
        )
    return f"{base}. This pattern is associated with higher fraud rates in historical data."
