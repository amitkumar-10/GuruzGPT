import "dotenv/config";

const getGeminiAPIResponse = async (message) => {
  const API_KEY = process.env.GEMINI_API_KEY; 


  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: message }],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return "Gemini API Error: " + (data.error?.message || "Unknown error");
    }

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response content"
    );
  } catch (err) {
    console.error("Fetch failed:", err);
    return "Failed to connect to Gemini API";
  }
};

export default getGeminiAPIResponse;
