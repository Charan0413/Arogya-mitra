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

def generate_workout(profile):
    prompt = f"""
You are an expert fitness coach.

Generate a personalized 7-day workout plan.

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

def generate_nutrition(profile):

    prompt = f"""
You are an expert nutritionist.

Create a personalized 7-day healthy meal plan.

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

Modify ONLY according to this request:

{instruction}

Rules:
- Keep the same format.
- Modify only what the user requested.
- Return the COMPLETE updated workout plan.
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

Modify ONLY according to this request:

{instruction}

Rules:
- Keep the same format.
- Change only what the user requested.
- Return the COMPLETE updated nutrition plan.
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

def classify_intent(message):

    prompt = f"""
You are an intent classifier for an AI Health Coach.

Classify the user's request into EXACTLY ONE of these intents.

Return ONLY the intent name.

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

    return response.choices[0].message.content.strip().lower()