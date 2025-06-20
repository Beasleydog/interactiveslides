export default async function getGeminiResponse(
  prompt: string,
  apiKey: string,
  model: string = "gemini-2.5-flash"
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gemini API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
