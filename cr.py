from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/analyze-crunch", methods=["POST"])
def analyze_crunch():
    try:
        data = request.get_json()
        if not data or "volume" not in data:
            return jsonify({"status": "error", "message": "Invalid volume payload"}), 400

        volume = float(data.get("volume", 0))

        if volume <= 20:
            tier = 1
            roast = "nalllla taste unnddd"
            video = "crunch_v1.mp4"
            audio = ""
        elif volume <= 40:
            tier = 2
            roast = "kozhapilllla...saykkaam"
            video = "crunch_v2.mp4"
            audio = ""
        elif volume <= 60:
            tier = 3
            roast = ""
            video = "crunch_v3.mp4"
            audio = ""
        elif volume <= 80:
            tier = 4
            roast = ""
            video = "crunch_v4.mp4"
            audio = "tier4_dramatic.mp3"
        else:
            tier = 5
            roast = "ennnni nee vaaayi thorrnnna"
            video = "crunch_v5.mp4"
            audio = ""

        return jsonify({
            "status": "success",
            "volume_received": volume,
            "tier": tier,
            "roast": roast,
            "video": video,
            "audio": audio
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)