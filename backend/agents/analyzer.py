import google.generativeai as genai
import os

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

def analyze_transcript(state):

    transcript = state["transcript"]

    prompt = f"""
    Analyze this discovery call.

    Extract:

    - industry
    - company size
    - pain points
    - timeline
    - budget

    Return JSON.

    Transcript:
    {transcript}
    """

    response = model.generate_content(prompt)

    state["requirements"] = {
        "raw_analysis": response.text
    }

    return state