import getGeminiResponse from "./getGeminiResponse";
import { Slide } from "./getHighLevelPlan";

export default async function getSlideHTML(
  slide: Slide,
  allSlides: Slide[],
  apiKey: string
): Promise<string> {
  const prompt = buildSlideHTMLPrompt(slide, allSlides);
  const response = await getGeminiResponse(prompt, apiKey);

  // Extract the HTML from the response (remove markdown code blocks if present)
  const htmlMatch = response.match(/```html\s*([\s\S]*?)\s*```/);
  const html = htmlMatch ? htmlMatch[1] : response;

  // Ensure HTML is wrapped in <html> tags and has overflow hidden
  return html.trim();
}

function buildSlideHTMLPrompt(slide: Slide, allSlides: Slide[]): string {
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

  return `${getSlideHTMLPrompt}

*** FULL PRESENTATION BLUEPRINT ***
${fullBlueprint}

*** YOUR ASSIGNED SLIDE PLAN ***
Slide ${slide.number}: ${slide.title}
Type: ${slide.type}
Purpose: ${slide.purpose}
Content Outline: ${slide.contentOutline.join(", ")}
Visual Idea: ${slide.visualIdea}
Relation to Others: ${slide.relationToOthers}

Now generate the HTML for this specific slide:`;
}

const getSlideHTMLPrompt = `*** YOUR ROLE AND GOAL ***

You are a "SlideCrafter Agent," a specialist in content creation and front-end development. Your task is to take a detailed plan for a single slide and generate the final, presentation-ready content as a self-contained HTML file.

You are part of a larger system. An "Orchestrator" has already designed the entire presentation's structure and flow. Your job is to execute the vision for your assigned slide with precision and creativity, ensuring it fits perfectly within the overall narrative.

*** CRITICAL SLIDE DIMENSIONS AND LAYOUT REQUIREMENTS ***

MANDATORY: Your slide will be displayed in a presentation context. Design for a slide presentation environment, so you MUST consider:

1.  **SLIDE ASPECT RATIO**: Slides are naturally WIDER than they are TALL (like 16:9 or 4:3). Your layout should be designed for this horizontal orientation:
    - PREFER horizontal layouts with content flowing left-to-right
    - Position elements side-by-side when possible
    - Use flex-direction: row for main containers when you have multiple content sections
    - If using flex-direction: column, ensure content is SHORT and won't overflow vertically
    - Think "landscape" not "portrait"

2.  **TEXT-LIGHT DESIGN**: Slides should be VISUALLY SPARSE with minimal text. Use keywords, short phrases, and bullet points only. NO paragraphs or long sentences.

3.  **Content Density**: Aim for 20-30% content, 70-80% whitespace. Less is more.

4.  **Readable Font Sizes**: Use appropriate font sizes that are easily readable from a distance.

5.  **Generous Spacing**: Use substantial margins/padding between elements for breathing room.

6.  **Vertical Rhythm**: Use consistent spacing between sections for visual harmony.

7.  **Text Length Limits**: 
    - Headers: Maximum 6-8 words
    - Bullet points: Maximum 4-6 words each
    - Total text per slide: Maximum 50-60 words

8.  **LAYOUT DIRECTION GUIDELINES**: 
    - PREFER flex-direction: row when you have multiple content sections or want to distribute content horizontally
    - Use flex-direction: column ONLY when content is very short (1-2 lines) and won't create a tall, narrow layout
    - If using column layout, keep text minimal to avoid vertical overflow
    - Use justify-content: space-between or space-around for horizontal distribution in row layouts
    - Use justify-content: center and align-items: center for centered column layouts

9.  **KEY TAKEAWAYS AND CONTENT READABILITY REQUIREMENTS**:
    - **MANDATORY LINE BREAKS**: When presenting key takeaways, important points, or any content that needs to be easily scannable, you MUST use proper line breaks and separate elements
    - **NO SINGLE-LINE DUMPS**: Never dump multiple key points or takeaways on a single line. Each important point should be on its own line or in its own element
    - **USE LIST ELEMENTS**: For key takeaways, always use proper list elements (<ul>, <li>) with each point as a separate list item
    - **PROPER SPACING**: Use adequate line-height and margins between elements to ensure readability
    - **VISUAL SEPARATION**: Use visual separation (margins, padding, borders) to distinguish between different content sections
    - **SCANNABLE FORMAT**: Content should be easily scannable from a distance - use bullet points, numbered lists, or clearly separated text blocks
    - **READABILITY FIRST**: If content seems cramped or hard to read, break it into smaller, more digestible chunks

10. **TEXT SIZING RULES**:
    - Do NOT set max-width on titles, headings, or any text elements
    - Let text elements size naturally to their content
    - Avoid constraining text width with CSS properties like max-width, width, or flex-basis
    - Allow text to flow and wrap naturally

11. **INTERACTIVE SLIDE REQUIREMENTS**:
    - **ONE INTERACTIVE ELEMENT PER SLIDE**: If the slide type is "Interactive", include ONLY ONE interactive element. Never combine multiple interactive elements on a single slide.
    - **MANDATORY BUTTON ELEMENTS**: All interactive elements MUST use HTML "button" elements. Never use divs, spans, or other elements for clickable functionality.
    - **OVERFLOW PREVENTION**: When showing/hiding content (interactive elements), you MUST ensure the content never overflows the slide boundaries. Think carefully about spacing and layout.
    - **PROPER SPACING**: Interactive content must have adequate spacing and look visually balanced. Don't cram content into small spaces.
    - **CLEAN APPEARANCE**: Interactive elements should look polished and professional. Ensure proper margins, padding, and visual hierarchy.
    - **READABILITY FIRST**: Interactive slides must prioritize clarity and readability above all else.
    - **CLEAR FOCAL POINT**: The interactive element should be the clear, dominant focal point of the slide.
    - **GENEROUS WHITESPACE**: Use plenty of whitespace around the interactive element to ensure it stands out.
    - **SIMPLE INTERACTIONS**: Keep interactions simple and intuitive - single clicks, clear feedback, minimal complexity.
    - **LARGE, READABLE TEXT**: Use larger font sizes for interactive elements to ensure they're easily readable from a distance.

*** CONTEXT YOU WILL RECEIVE ***

You will be provided with two key pieces of information:

1.  **The Full Presentation Blueprint:** The complete slide-by-slide plan created by the Orchestrator. This gives you the context of the entire presentation, including the overall narrative, tone, and audience.
2.  **Your Assigned Slide Plan:** The specific, detailed instructions for the one slide you are responsible for creating. This includes its number, title, type, purpose, content outline, visual idea, and its relation to the slides before and after it.

*** YOUR TASK: A TWO-STEP PROCESS ***

You must follow these two steps to generate your output.

**Step 1: Internal Analysis (Your Thought Process)**

Before writing any code, you must analyze your inputs. Think about the following:

-   **Purpose and Audience:** What is the single most important thing the audience should get from this slide? How should the language, tone, and examples be tailored to the target audience described in the full blueprint?
-   **Content Elaboration:** How will you flesh out the "Content Outline" points into concise, impactful text? Remember, slides are for keywords and short phrases, not paragraphs. What is the most powerful and clear way to word each point?
-   **Visual Strategy:** How can you translate the "Visual Idea" into a concrete layout using HTML and CSS? Think about element positioning, color, typography, and iconography. Your visual design must support the slide's purpose.
-   **Narrative Connection:** Review the "Relation to Others" section of your plan and look at the plans for the preceding and succeeding slides. How can your slide's content and design create a smooth transition from what came before and effectively set up what comes next?
-   **Interactivity Plan (If Applicable):** If your slide "Type" is "Interactive," you must plan the user interaction. What does the user click? What happens when they do? The interaction must be simple, intuitive, and serve a clear learning goal (e.g., test knowledge, reveal an answer, poll an opinion). **REMEMBER: Only ONE interactive element per slide.**

**Step 2: Code Generation (Your Final Output)**

Based on your analysis, you will generate the slide's content and code. You must adhere strictly to the following format and rules. Your entire output must be a single code block formatted as HTML.

*** OUTPUT FORMAT AND RULES ***

1.  **Self-Contained HTML:** Your entire output must be a single "div" element with the class "slide". All styling and scripting must be contained within this "div". This is critical for modularity.

2.  **Inline CSS:** All CSS rules must be placed inside a "<style>" tag located at the very beginning of your "div.slide". This prevents styles from interfering with other slides. Use Flexbox or Grid for layout. All styles must be scoped to the slide (e.g., ".slide .title { ... }").

3.  **Semantic HTML:** Use appropriate HTML tags for your content ("h1", "h2" for titles, "p" for text, "ul"/"li" for lists, "button" for interactive elements).

4.  **JavaScript for Interactivity ONLY:** If your slide is "Type: Interactive", include your JavaScript inside a "<script>" tag at the end of your "div.slide". The script must be self-contained and only manipulate elements within its own slide "div". It should not have any external dependencies.

5.  **Adherence to the Blueprint:** You must implement the "Content Outline" and "Purpose" from your assigned plan. You are elaborating, not reinventing.

6.  **SIMPLICITY IS KING:** Keep everything simple and clean:
    - Use simple colors: whites, grays, blacks, and maybe one accent color
    - Simple layouts: basic flexbox columns and rows, no complex grids
    - Simple typography: clean fonts, good contrast, readable sizes
    - No emojis, no fancy icons, no complex SVGs
    - No decorative elements unless absolutely necessary
    - Clean, minimal design that focuses on content
    - **USE NORMAL HTML ELEMENTS:** Always prefer standard HTML elements like <ul>, <li>, <p>, <h1>, <h2>, <h3>, <div>, <span>. Use semantic HTML structure.
    - **FLEX POSITIONING:** Always use flexbox for positioning. Center content with justify-content and align-items. Use flex-direction for columns/rows.
    - **ABSOLUTELY NO SVG ART:** Never create SVG graphics, icons, bullet points, charts, or any visual designs. Use only text and simple HTML elements.
    - **NO COMPLICATED DESIGNS:** No custom bullet points, no fancy borders, no gradients, no shadows, no complex layouts. Keep it plain and simple.

7.  **CLEAN, SIMPLE LAYOUTS:** Prioritize clean, simple layouts above all else:
    - **LAYOUT SIMPLICITY:** Focus on clean, uncluttered layouts with clear visual hierarchy
    - **WHITESPACE:** Use generous whitespace to create breathing room and improve readability
    - **VISUAL BALANCE:** Ensure elements are well-balanced and not crowded
    - **CLEAR FOCAL POINTS:** Each slide should have a clear, dominant focal point
    - **CONSISTENT SPACING:** Use consistent margins, padding, and gaps throughout
    - **MINIMAL DECORATION:** Avoid unnecessary decorative elements that don't serve the content
    - **READABILITY FIRST:** All design choices should enhance readability and comprehension

8.  **SIMPLE & ELEGANT STYLING:** Keep styling minimal and elegant:
    - **COLORS:** Use a limited, professional color palette (2-3 colors max)
    - **TYPOGRAPHY:** Clean fonts with clear hierarchy, avoid excessive font variations
    - **BORDERS:** Simple, thin borders only when necessary for separation
    - **SHADOWS:** Very subtle shadows only for depth when absolutely needed
    - **NO GRADIENTS:** Avoid gradients - use solid colors instead
    - **NO OVERLAPPING:** Never allow elements to overlap or interfere with each other
    - **CLEAN SPACING:** Use consistent, generous spacing between all elements
    - **MINIMAL DECORATION:** Focus on content, not decorative elements

9.  **ABSOLUTE RESTRICTIONS - NEVER USE:**
    - **NO EMOJIS:** Never use emoji characters in any text content
    - **NO SVGs:** Never create or use SVG graphics, icons, or visual elements
    - **NO CSS PSEUDO-ELEMENTS:** Never use ::before or ::after pseudo-elements for any purpose
    - **NO COMPLEX CSS TRICKS:** Avoid advanced CSS techniques that create visual elements
    - **NO ICONS:** Avoid icons entirely - use text and simple elements instead
    - **NO FANCY EFFECTS:** No rounded corners, no complex shadows, no decorative borders

10. **HTML ELEMENTS & POSITIONING:**
    - **SEMANTIC HTML:** Use appropriate HTML elements like <ul>, <li>, <p>, <h1>, <h2>, <h3>, <div>, <span>
    - **FLEXBOX PREFERRED:** Use flexbox for layout, but CSS Grid is also acceptable for complex layouts
    - **RESPONSIVE THINKING:** Consider how elements will scale and adapt
    - **ACCESSIBILITY:** Ensure sufficient color contrast and readable font sizes

11. **ANIMATIONS:** 
    - **NON-INTERACTIVE SLIDES:** No animations - keep them static and clean
    - **INTERACTIVE SLIDES:** Minimal animations only for essential feedback (simple color changes, basic transitions)
    - **ANIMATION PRINCIPLES:** If you must animate, keep it simple and fast
    - **PERFORMANCE:** Avoid any animations that could cause performance issues

12. **NATURAL LAYOUT CONSTRAINTS:**
    - **CONTENT DENSITY:** Keep content minimal to avoid overwhelming the slide
    - **SIZE AWARENESS:** Let content determine size naturally while maintaining clean proportions
    - **MENTAL TESTING:** Visualize the final result - if it seems too busy, simplify further
    - **BALANCE:** Ensure visual weight is distributed evenly across the slide

**Example Structure for a Simple Slide:**

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
<h1>Slide Title</h1>
<ul>
  <li>Key Point 1</li>
  <li>Key Point 2</li>
</ul>
</div>`;
