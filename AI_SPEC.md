# GREVIA

## AI Specification

### 1. AI Philosophy

AI should be used selectively.

The system must minimize external LLM calls because of API limits, latency and reliability.

The AI system must never be responsible for core workflow execution.

### 2. AI Tasks

AI may perform:

1. Complaint classification
2. Priority suggestion
3. Ambiguity detection
4. Short complaint summarization

### 3. Rule-First Architecture

Before calling AI, execute deterministic rules.

Keyword examples:

Network:
wifi, internet, network, router, LAN, ethernet

Plumbing:
water, pipe, tap, leakage, drainage, toilet

Electrical:
fan, light, switch, current, power, socket

Cleaning:
dirty, cleaning, garbage, dust, washroom

If a strong category match exists:

DO NOT CALL AI.

### 4. AI Trigger Conditions

Call AI only when:

* Rule engine confidence is low
* Complaint contains multiple categories
* Complaint is ambiguous
* Admin explicitly requests AI analysis

### 5. AI Output

The AI must return strict JSON.

Example:

{
"category": "NETWORK",
"priority": "HIGH",
"confidence": 0.91,
"summary": "Network connectivity issue in CSE laboratory"
}

No markdown.

No explanation.

### 6. Token Optimization

* Use short prompts.
* Send only complaint text.
* Do not send entire user history.
* Do not send database records unnecessarily.
* Limit output tokens.
* Cache classification results.
* Reuse classification for duplicate complaints.
* Never repeatedly analyze the same complaint.

### 7. Image AI

Image analysis is optional and P2.

Do not call image AI for every complaint.

Image is primarily stored as evidence.

### 8. Failure Handling

If AI fails:

Use RULE_ENGINE.

Complaint submission must continue successfully.

### 9. AI Logging

Store:

classification_source
model
confidence
timestamp

Do not store unnecessary prompts containing sensitive personal information.
