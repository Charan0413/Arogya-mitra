import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
print("Looking for .env at:", env_path)

load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GROQ_API_KEY")
print("API Key:", api_key)

client = Groq(api_key=api_key)

import re


def _extract_days(message):
    """Extract the number of days from a user message. Defaults to 5."""
    m = re.search(r"(\d+)\s*-?\s*day", message, re.IGNORECASE)
    if m:
        n = int(m.group(1))
        if 1 <= n <= 14:
            return n
    return 5


def generate_workout(profile, user_message=""):
    days = _extract_days(user_message)
    prompt = f"""
You are an expert fitness coach.

Generate a personalized {days}-day workout plan.

User Details:
Age: {profile.age}
Gender: {profile.gender}
Height: {profile.height}
Weight: {profile.weight}
Fitness Goal: {profile.fitness_goal}
Activity Level: {profile.activity_level}
Workout Preference: {profile.workout_preference}
Daily Time: {profile.available_time}
Medical Conditions: {profile.medical_conditions}
Allergies: {profile.allergies}
Injuries: {profile.injuries}

For each day include:
- Warm-up
- Main exercises
- Sets and reps
- Cool-down

Format the answer clearly.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content

def generate_nutrition(profile, user_message=""):
    days = _extract_days(user_message)
    prompt = f"""
You are an expert nutritionist.

Create a personalized {days}-day healthy meal plan.

User Details:
Age: {profile.age}
Gender: {profile.gender}
Height: {profile.height}
Weight: {profile.weight}
Fitness Goal: {profile.fitness_goal}
Activity Level: {profile.activity_level}
Allergies: {profile.allergies}
Medical Conditions: {profile.medical_conditions}

For each day include:

Breakfast
Lunch
Dinner
Healthy Snack

Mention approximate calories for each meal.

Format it day-wise.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content

def generate_chat(profile, message):

    prompt = f"""
You are AROMI, an expert AI Health Coach, Certified Nutritionist, Fitness Trainer, and Wellness Mentor.

Your job is to provide personalized advice based on the user's health profile.

User Profile
--------------------
Age: {profile.age}
Gender: {profile.gender}
Height: {profile.height}
Weight: {profile.weight}

Fitness Goal: {profile.fitness_goal}

Activity Level: {profile.activity_level}

Workout Preference: {profile.workout_preference}

Available Workout Time: {profile.available_time}

Medical Conditions:
{profile.medical_conditions}

Allergies:
{profile.allergies}

Injuries:
{profile.injuries}

Rules:
- Always personalize every answer.
- Never recommend foods listed in allergies.
- Consider injuries before suggesting exercises.
- Consider medical conditions before giving advice.
- Recommend sustainable and healthy habits.
- Be encouraging and motivating.
- Explain your recommendations clearly.
- If you don't know something, say so honestly.

User Question:
{message}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.7,
    )

    return response.choices[0].message.content

def modify_workout_plan(current_plan, instruction):

    prompt = f"""
You are an expert fitness coach.

Below is the user's CURRENT workout plan.

-------------------------
{current_plan}
-------------------------

Modify according to this request:

{instruction}

Rules:
- Return the COMPLETE updated plan — nothing omitted.
- If the user asks to reduce or increase the number of days, actually add or remove day sections. Do NOT keep all original days.
- If the user asks to change exercises, replace them in-place.
- Keep the same heading format (Day 1, Day 2, etc.) renumbered if days changed.
- Do NOT include any text outside the plan itself — no greetings, no explanations, no markdown.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.4,
    )

    return response.choices[0].message.content

def modify_nutrition_plan(current_plan, instruction):

    prompt = f"""
You are an expert nutritionist.

Below is the user's CURRENT nutrition plan.

-------------------------
{current_plan}
-------------------------

Modify according to this request:

{instruction}

Rules:
- Return the COMPLETE updated plan — nothing omitted.
- If the user asks to reduce or increase the number of days, actually add or remove day sections. Do NOT keep all original days.
- If the user asks to change meals, replace them in-place.
- Keep the same heading format (Day 1, Day 2, etc.) renumbered if days changed.
- Do NOT include any text outside the plan itself — no greetings, no explanations, no markdown.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.4,
    )

    return response.choices[0].message.content

import re

_VALID_INTENTS = [
    "general_chat",
    "generate_workout",
    "modify_workout",
    "generate_nutrition",
    "modify_nutrition",
]


def classify_intent(message):

    prompt = f"""
You are an intent classifier for an AI Health Coach.

Classify the user's request into EXACTLY ONE of these intents.

Return ONLY the intent name — no quotes, no explanation, no punctuation.

general_chat
generate_workout
modify_workout
generate_nutrition
modify_nutrition

Examples:

Create a workout plan
-> generate_workout

Generate a gym routine
-> generate_workout

Replace squats with lunges
-> modify_workout

Make Day 3 easier
-> modify_workout

Increase protein
-> modify_nutrition

Generate a meal plan
-> generate_nutrition

Remove eggs from breakfast
-> modify_nutrition

How much protein do I need?
-> general_chat

User:
{message}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0,
    )

    raw = response.choices[0].message.content.strip().lower()

    # ── Robust cleaning ──────────────────────────────
    # Strip common LLM formatting: backticks, quotes,
    # asterisks, trailing periods/colons, leading labels.
    cleaned = re.sub(r"[*`\"']", "", raw).strip()
    cleaned = re.sub(r"[.:;]+$", "", cleaned).strip()
    cleaned = re.sub(r"^(intent|answer|output|response)\s*:\s*", "", cleaned).strip()

    # Exact match (most common case)
    if cleaned in _VALID_INTENTS:
        return cleaned

    # Fallback: check if any valid intent appears as a substring
    for intent in _VALID_INTENTS:
        if intent in cleaned:
            return intent

    # Nothing matched — default to general chat
    return "general_chat"