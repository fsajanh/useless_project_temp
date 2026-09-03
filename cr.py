from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enables cross-origin requests if frontend/backend run separately

@app.route("/")
def home():
    # Renders the HTML template from templates/index.html
    return render_template("index.html")

@app.route("/analyze-crunch", methods=["POST"])
def analyze_crunch():
    try:
        data = request.get_json()
        if not data or "volume" not in data:
            return jsonify({"status": "error", "message": "Invalid volume payload"}), 400

        volume = float(data.get("volume", 0))

        # Core logic: generate feedback based on detected volume
        if volume > 80:
            roast = "Are you chewing on gravel? Tone it down!"
        elif volume > 40:
            roast = "Decent crunch, but everyone in a 10-mile radius hears you."
        else:
            roast = "Is that even a crunch? Try harder."

        return jsonify({
            "status": "success",
            "volume_received": volume,
            "roast": roast
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)