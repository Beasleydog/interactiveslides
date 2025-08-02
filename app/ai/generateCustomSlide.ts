import getGeminiResponse from "./getGeminiResponse";
import { Slide, SlideType } from "./getHighLevelPlan";

export interface CustomSlideResult {
  slide: Slide;
  html: string;
}

export default async function generateCustomSlide(
  userPrompt: string,
  insertAfterIndex: number,
  allSlides: Slide[],
  apiKey: string
): Promise<CustomSlideResult> {
  const prompt = buildCustomSlidePrompt(
    userPrompt,
    insertAfterIndex,
    allSlides
  );
  const response = await getGeminiResponse(prompt, apiKey, "gemini-2.5-pro");

  // Parse the response to extract both slide data and HTML
  const result = parseCustomSlideResponse(response, insertAfterIndex + 2);

  return result;
}

function buildCustomSlidePrompt(
  userPrompt: string,
  insertAfterIndex: number,
  allSlides: Slide[]
): string {
  const fullBlueprint = allSlides
    .map(
      (s) => `
Slide ${s.number}: ${s.title}
Type: ${s.type}
Purpose: ${s.purpose}
Content Outline: ${s.contentOutline.join(", ")}
Visual Idea: ${s.visualIdea}
Relation to Others: ${s.relationToOthers}
`
    )
    .join("\n");

  const nearbySlides = allSlides
    .filter((s) => Math.abs(s.number - (insertAfterIndex + 1)) <= 2)
    .map(
      (s) => `
Slide ${s.number}: ${s.title}
Type: ${s.type}
Purpose: ${s.purpose}
Content Outline: ${s.contentOutline.join(", ")}
Visual Idea: ${s.visualIdea}
Relation to Others: ${s.relationToOthers}
`
    )
    .join("\n");

  return `${getCustomSlidePrompt}

*** FULL PRESENTATION BLUEPRINT ***
${fullBlueprint}

*** NEARBY SLIDES CONTEXT ***
${nearbySlides}

*** USER REQUEST ***
The user wants to insert a new slide after slide ${
    insertAfterIndex + 1
  }. Here's their description:

${userPrompt}

*** YOUR TASK ***
Based on the user's description and the context of nearby slides, you need to:

1. Determine the appropriate slide type (Title, Learning Objectives, Informative, Transitional, Interactive, Summary, Key Takeaway, Q&A, Thank You)
2. Create a complete slide plan with title, purpose, content outline, visual idea, and relation to others
3. Generate the HTML for this slide

The new slide will be slide number ${insertAfterIndex + 2}.

Now generate both the slide plan and HTML:`;
}

function parseCustomSlideResponse(
  response: string,
  slideNumber: number
): CustomSlideResult {
  // Extract slide data section
  const slideDataMatch = response.match(/```slide-data\s*([\s\S]*?)\s*```/);
  if (!slideDataMatch) {
    throw new Error("Could not parse slide data from response");
  }

  const slideDataText = slideDataMatch[1].trim();

  // Parse slide data
  const slide: Slide = {
    number: slideNumber,
    title: extractField(slideDataText, "Title"),
    type: extractField(slideDataText, "Type") as SlideType,
    purpose: extractField(slideDataText, "Purpose"),
    contentOutline: extractField(slideDataText, "Content Outline").split(", "),
    visualIdea: extractField(slideDataText, "Visual Idea"),
    relationToOthers: extractField(slideDataText, "Relation to Others"),
  };

  // Extract HTML section
  const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/);
  const html = htmlMatch ? htmlMatch[1].trim() : response;

  return { slide, html };
}

function extractField(text: string, fieldName: string): string {
  const regex = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

const getCustomSlidePrompt = `*** YOUR ROLE AND GOAL ***

You are a "CustomSlideGenerator Agent," a specialist in creating individual slides that fit seamlessly into existing presentations. Your task is to take a user's description and generate both a complete slide plan AND the final HTML content.

*** CRITICAL REQUIREMENTS ***

1. **SLIDE TYPE DETERMINATION**: You must intelligently determine the most appropriate slide type based on the user's description and context:
   - "Title" - For opening slides, main titles
   - "Learning Objectives" - For slides that outline what will be learned
   - "Informative" - For slides that present facts, data, or explanations
   - "Transitional" - For slides that bridge between topics
   - "Interactive" - For slides that require user interaction (quizzes, polls, etc.)
   - "Summary" - For slides that summarize key points
   - "Key Takeaway" - For slides highlighting main insights
   - "Q&A" - For question and answer slides
   - "Thank You" - For closing slides

2. **CONTEXT AWARENESS**: Consider the nearby slides to ensure your new slide fits naturally in the flow.

3. **SLIDE DIMENSIONS AND LAYOUT REQUIREMENTS**:
   - Design for horizontal orientation (16:9 aspect ratio)
   - Use flexbox for layout with flex-direction: row preferred
   - Keep content minimal (20-30% content, 70-80% whitespace)
   - Use readable font sizes and generous spacing
   - Text limits: Headers max 6-8 words, bullet points max 4-6 words each

4. **INTERACTIVE SLIDE REQUIREMENTS** (if type is Interactive):
   - Include ONLY ONE interactive element per slide
   - Use HTML button elements for clickable functionality
   - Ensure content never overflows slide boundaries
   - Keep interactions simple and intuitive

*** OUTPUT FORMAT ***

You must provide your response in this exact format:

\`\`\`slide-data
Title: [Your slide title]
Type: [Determined slide type]
Purpose: [Clear purpose statement]
Content Outline: [Key points, comma separated]
Visual Idea: [Layout and visual approach]
Relation to Others: [How it connects to nearby slides]
\`\`\`

\`\`\`html
[Your complete HTML for the slide]
\`\`\`

*** HTML REQUIREMENTS ***

Your HTML must be a self-contained div with class "slide" containing:
- Inline CSS in a <style> tag at the beginning
- Semantic HTML structure
- JavaScript for interactivity (if needed)
- Clean, simple design with minimal decoration
- No SVGs, emojis, or complex visual elements
- Professional color palette (2-3 colors max)

*** EXAMPLE STRUCTURE ***

\`\`\`slide-data
Title: Understanding User Needs
Type: Informative
Purpose: To explain the importance of user research in design
Content Outline: User research methods, Benefits of understanding users, Common pitfalls
Visual Idea: Clean two-column layout with key points on the left and supporting details on the right
Relation to Others: Builds on the previous slide about design principles and sets up the next slide about research techniques
\`\`\`

\`\`\`html
<div class="slide">
<style>
  .slide { 
    background: white; 
    padding: 5rem; 
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 4rem;
    box-sizing: border-box;
  }
  .slide h1 { 
    color: #333; 
    font-size: 3rem; 
    margin: 0;
    line-height: 1.2;
    flex: 1;
  }
  .slide ul {
    color: #555;
    line-height: 1.8;
    font-size: 1.5rem;
    flex: 1;
  }
  .slide li {
    margin-bottom: 1.5rem;
  }
</style>
<h1>Understanding User Needs</h1>
<ul>
  <li>User research methods</li>
  <li>Benefits of understanding users</li>
  <li>Common pitfalls</li>
</ul>
</div>
\`\`\`

Now generate both the slide plan and HTML based on the user's request:`;
