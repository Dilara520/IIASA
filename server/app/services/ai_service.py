import os
from openai import OpenAI
from .data_service import get_csv_summary, get_raster_stats

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_ai_response(user_message: str):
    """
    Generates a response using RAG (Retrieval Augmented Generation) logic.
    Injects data stats into the System Prompt.
    """
    try:
        csv_context = get_csv_summary()
        raster_context = get_raster_stats()
        
        system_prompt = f"""
        You are an expert Data Analyst assistant.
        
        Current Dataset Context:
        1. CSV Data Summary:
        {csv_context}
        
        2. Geospatial Raster Stats:
        {raster_context}
        
        User Question: {user_message}
        
        Instructions:
        - Answer based on the data provided above.
        - Be concise and professional.
        - If the user asks about the map, refer to the Raster Stats.
        - If the user asks about trends, refer to the CSV Summary.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
        )
        
        return response.choices[0].message.content

    except Exception as e:
        print(f"AI Service Error: {e}")
        return "I'm sorry, I cannot access the intelligence engine right now. Please check your API Key."