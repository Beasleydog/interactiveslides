import getKeyStyles from "./getKeyStyles";

interface KeyTextObject {
  text: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  innerHTML: string;
  className: string;
  tagName: string;
  id: string;
  style: Record<string, string>;
  attributes: NamedNodeMap;
  childrenStyles: ChildStyle[];
  fromBackground: boolean;
}

interface ChildStyle {
  children?: ChildStyle[];
  [key: string]: string | ChildStyle[] | undefined;
}

interface ReturnObject {
  objects: KeyTextObject[];
  slideWidth: number | undefined;
  slideHeight: number | undefined;
}

const cache = new Map<string, ReturnObject>();
export default function htmlToKeyTextObjects(
  html: string
): Promise<ReturnObject> {
  if (cache.has(html)) {
    return Promise.resolve(cache.get(html)!);
  }

  // Create an iframe element
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "100%"; // Set a reasonable width
  iframe.style.height = "100%"; // Set a reasonable height
  document.body.appendChild(iframe);

  // Set the HTML content via srcdoc
  iframe.srcdoc = html;

  // Wait for iframe to load and then process the content
  return new Promise<ReturnObject>((resolve) => {
    iframe.onload = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) {
          resolve({
            objects: [],
            slideWidth: undefined,
            slideHeight: undefined,
          });
          return;
        }

        // Wait a bit for rendering to complete
        setTimeout(() => {
          const textNodes = returnNodes(doc.body);
          console.log("textNodes", textNodes);
          const keyTextObjects = textNodes.map(highestSameTextParent);
          console.log("keyTextObjects", keyTextObjects);

          // Get all elements with background colors
          const backgroundElements = getAllElementsWithBackground(doc.body);

          // Combine key text objects and background elements
          const allElements = [...keyTextObjects, ...backgroundElements];

          // Remove duplicates and serialize
          const result = [
            ...new Set(
              allElements
                .map((x) => serializedInfo(x, keyTextObjects))
                .filter((x): x is KeyTextObject => x !== null)
            ),
          ];

          const firstElementOfIframe = iframe.contentDocument?.body.children[0];

          const returnObject: ReturnObject = {
            objects: result,
            slideWidth: firstElementOfIframe?.getBoundingClientRect().width,
            slideHeight: firstElementOfIframe?.getBoundingClientRect().height,
          };

          // Clean up the iframe
          document.body.removeChild(iframe);
          cache.set(html, returnObject);
          resolve(returnObject);
        }, 100); // Small delay to ensure rendering
      } catch (error) {
        console.error("Error processing HTML in iframe:", error);
        // document.body.removeChild(iframe);
        resolve({ objects: [], slideWidth: undefined, slideHeight: undefined });
      }
    };
  });
}

function getAllElementsWithBackground(element: Element): Element[] {
  const elements: Element[] = [];

  // Check if current element has background color
  const style = getComputedStyle(element);
  const hasBackground: boolean = !!(
    style.backgroundColor &&
    style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
    style.backgroundColor !== "transparent"
  );

  if (hasBackground) {
    elements.push(element);
  }

  // Recursively check children
  for (const child of element.children) {
    if (child.tagName !== "STYLE" && child.tagName !== "SCRIPT") {
      elements.push(...getAllElementsWithBackground(child));
    }
  }

  return elements;
}

function returnNodes(x: Node): Node[] {
  const result: Node[] = [];

  for (const child of x.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      if (element.tagName === "STYLE" || element.tagName === "SCRIPT") {
        continue;
      }
    }

    const childrenNodes = returnNodes(child);
    if (childrenNodes.length > 0) {
      result.push(...childrenNodes);
    } else {
      // Only add text nodes that have actual content
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        result.push(child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        result.push(child);
      }
    }
  }
  return result;
}

function highestSameTextParent(textNode: Node): Node {
  const currentText = textNode.textContent;
  let maxIter = 10;
  let currentNode = textNode;

  while (maxIter > 0) {
    const element = currentNode as Element;
    if (
      element.tagName === "LI" ||
      (currentNode.parentElement &&
        currentNode.parentElement.textContent?.trim() === currentText)
    ) {
      currentNode = currentNode.parentElement!;
    } else {
      break;
    }
    maxIter--;
  }
  return currentNode;
}

function serializedInfo(node: Node, keyTexts: Node[]): KeyTextObject | null {
  // Only call getBoundingClientRect on Element objects
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null; // Skip non-element nodes
  }

  const element = node as Element;
  const boundingRect = element.getBoundingClientRect();

  // Check if this element is a key text object (has text content)
  let cleanText = element.textContent?.replaceAll("\n", "").trim();
  keyTexts.forEach((x) => {
    cleanText = cleanText?.replace(x.textContent || "", "").trim();
  });
  const hasTextContent = cleanText && cleanText.length > 0;

  // Check if this element has background color
  const style = getComputedStyle(element);
  const hasBackground: boolean = !!(
    style.backgroundColor &&
    style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
    style.backgroundColor !== "transparent"
  );

  // If element only has background (no text content), set innerHTML to empty
  const innerHTML =
    (hasBackground && !hasTextContent) ||
    element.innerHTML.includes("<style>") ||
    element.innerHTML.includes("<script>")
      ? ""
      : element.innerHTML;

  return {
    text: hasBackground ? "" : node.textContent,
    x: boundingRect.x,
    y: boundingRect.y,
    width: boundingRect.width,
    height: boundingRect.height,
    innerHTML: innerHTML,
    className: element.className,
    tagName: element.tagName,
    id: element.id,
    style: getKeyStyles(element),
    attributes: element.attributes,
    childrenStyles: getChildrenStyles(element),
    fromBackground: hasBackground,
  };
}

function getChildrenStyles(node: Node) {
  const childrenStyles: ChildStyle[] = [];

  // Recursively process all child nodes
  for (const child of node.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;

      // Skip style and script elements
      if (element.tagName === "STYLE" || element.tagName === "SCRIPT") {
        continue;
      }

      // Get styles for this child element
      const childStyles = getKeyStyles(element);

      // Add child styles with recursive children styles
      childrenStyles.push({
        ...childStyles,
        children: getChildrenStyles(element), // Recursive call
      });
    }
  }

  return childrenStyles;
}
