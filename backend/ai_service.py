import os
import json
import requests
import tempfile
from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

client = genai.Client()

class ComplaintAnalysis(BaseModel):
    category: str
    department: str
    priority: str
    severity_score: int
    fraud_score: int
    is_civic: bool


def analyze_complaint(text: str, image_path: str = None) -> dict:
    prompt = f"""
    You are the core AI intelligence layer for a Civic Operations Platform.
    Analyze the following citizen complaint.
    
    CRITICAL RULE: If the user request is NOT a civic or infrastructure issue (e.g., asking for python code, homework help, general chat, math), you MUST set is_civic to false.
    
    If it is a civic issue, set is_civic to true and provide:
    1. category (e.g., Roads, Garbage, Water, Traffic, etc.)
    2. department (e.g., Sanitation, Public Works, Transportation, etc.)
    3. priority (Low, Medium, High, Critical)
    4. severity_score (0-100, where 100 is immediate life-threatening danger)
    5. fraud_score (0-100, where 100 means the complaint is highly suspicious, bot-generated, or fake)
    
    Complaint Text: "{text}"
    """
    contents = [prompt]
    if image_path and os.path.exists(image_path):
        uploaded_file = client.files.upload(file=image_path)
        contents.append(uploaded_file)
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=contents,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ComplaintAnalysis,
            temperature=0.1
        )
    )
    return json.loads(response.text)


class ResolutionVerification(BaseModel):
    is_verified: bool
    confidence_score: int
    summary: str


def download_image_to_temp(url: str):
    if not url: return None
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        ext = url.split('.')[-1]
        if len(ext) > 5 or not ext.isalnum(): ext = 'jpg'
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}")
        for chunk in response.iter_content(chunk_size=8192):
            temp_file.write(chunk)
        temp_file.close()
        return temp_file.name
    except Exception:
        return None

def verify_resolution(description: str, original_image_url: str = None, resolution_image_url: str = None) -> dict:
    """
    Compare a worker's resolution photo to the citizen's original complaint.
    Returns: { is_verified, confidence_score (0-100), summary }
    """
    has_original = bool(original_image_url)
    has_resolution = bool(resolution_image_url)
    
    orig_temp = None
    res_temp = None

    if has_original and has_resolution:
        prompt = f"""You are a civic infrastructure inspector AI for Bhopal Municipal Corporation.

You have been given TWO images:
- IMAGE 1: A citizen's photo showing a civic problem.
- IMAGE 2: A field worker's photo claiming the problem has been resolved.

Complaint Description: "{description}"

Your task:
1. Examine IMAGE 1 to understand what the problem was (e.g., pothole, broken light, garbage pile).
2. Examine IMAGE 2 to determine if that specific problem now appears fixed or resolved.
3. Judge whether IMAGE 2 is a genuine, credible "after" photo showing the same location in a repaired state.

Be strict: If the images appear to be from completely different locations, or if the problem clearly still exists in IMAGE 2, mark is_verified as false.

Return your verdict as JSON."""
        contents = [prompt]
        try:
            orig_temp = download_image_to_temp(original_image_url)
            res_temp = download_image_to_temp(resolution_image_url)
            if orig_temp and res_temp:
                f1 = client.files.upload(file=orig_temp)
                f2 = client.files.upload(file=res_temp)
                contents.extend([f1, f2])
        except Exception as e:
            print("Gemini upload error:", e)
    elif has_resolution:
        prompt = f"""You are a civic infrastructure inspector AI for Bhopal Municipal Corporation.

A field worker has submitted a photo claiming to show a resolved civic issue.
The original complaint was: "{description}"

Look at the submitted image and determine:
1. Does the image show a civic area that looks repaired, cleaned, or maintained?
2. Is it plausible that this image represents the resolution of the described problem?

Be reasonable but not too strict since there is no original photo to compare to.

Return your verdict as JSON."""
        contents = [prompt]
        try:
            res_temp = download_image_to_temp(resolution_image_url)
            if res_temp:
                f2 = client.files.upload(file=res_temp)
                contents.append(f2)
        except Exception as e:
            print("Gemini upload error:", e)
    else:
        return {
            "is_verified": False,
            "confidence_score": 0,
            "summary": "No resolution image was provided for verification."
        }

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResolutionVerification,
                temperature=0.1
            )
        )
        return json.loads(response.text)
    except Exception as e:
        return {
            "is_verified": False,
            "confidence_score": 0,
            "summary": f"AI verification failed: {str(e)}"
        }
    finally:
        # Cleanup temporary files
        if orig_temp and os.path.exists(orig_temp): os.remove(orig_temp)
        if res_temp and os.path.exists(res_temp): os.remove(res_temp)
