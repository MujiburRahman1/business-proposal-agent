import google.generativeai as genai
import os

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "gemini-2.5-flash"
)

def generate_proposal(state):

    prompt = f"""
    Create a professional proposal.

    Requirements:
    {state['requirements']}

    Similar Projects:
    {state['similar_projects']}
    """

    result = model.generate_content(prompt)

    state["proposal"] = result.text

    return state