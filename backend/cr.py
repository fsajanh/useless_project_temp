import random
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Sarcastic Roasts categorized by Crunch Intensity
ROASTS_HIGH = [
    "ALERT! That crunch was registered as a magnitude 6.0 seismic event!",
    "DEAFENING! The entire neighborhood now knows you're eating chips!",
    "TACTICAL THREAT DETECTED! Please apologize to everyone's eardrums immediately!",
]

ROASTS_MEDIUM = [
    "Awkward... Everyone in a 3-table radius just stopped talking.",
    "A bit aggressive, don't you think? Tone down the chewing.",
    "Not deafening, but definitely enough to ruin a quiet moment.",
]

ROASTS_LOW = [
    "Is that even a crunch? Did you just gum that chip to death?",
    "Stealth mode achieved. A respectable, polite crunch.",
    "Disappointingly quiet. Put some real effort into your chewing next time.",
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze-crunch", methods=["POST"])
def analyze_crunch():
    data = request.get_json()
    volume = data.get("volume", 0)  # Volume score (0 - 100)
    threshold = 75  # The loudness threshold limit

    if volume >= threshold:
        category = "HIGH_CRINGE"
        roast = random.choice(ROASTS_HIGH)
        trigger_scream = True
    elif volume >= 40:
        category = "MODERATE_CRINGE"
        roast = random.choice(ROASTS_MEDIUM)
        trigger_scream = False
    else:
        category = "LOW_CRINGE"
        roast = random.choice(ROASTS_LOW)
        trigger_scream = False

    return jsonify(
        {
            "volume_received": volume,
            "threshold": threshold,
            "category": category,
            "roast": roast,
            "trigger_scream": trigger_scream,
        }
    )


if __name__ == "__main_":
    app.run(debug=True, port=5000)