interface KeyTextObject {
  tagName?: string;
  style?: Record<string, string>;
  x: number;
  y: number;
  width: number;
  height: number;
  innerHTML: string;
  className?: string;
  id?: string;
  attributes?: NamedNodeMap;
  childrenStyles?: ChildStyle[];
  surfaceArea?: number;
  originalIndex?: number;
}

interface ChildStyle {
  [key: string]: string | ChildStyle[];
  children?: ChildStyle[];
}

export default function decodeToHTML(data: KeyTextObject[]): string {
  const theParent = document.createElement("div");
  // Calculate surface area for each element and add it to the data
  const elementsWithArea = data.map((item: KeyTextObject, index: number) => {
    const surfaceArea = item.width * item.height;
    return {
      ...item,
      surfaceArea,
      originalIndex: index,
    };
  });

  // Sort elements by surface area (largest first, so they get lowest z-index)
  elementsWithArea.sort(
    (a: KeyTextObject, b: KeyTextObject) =>
      (b.surfaceArea || 0) - (a.surfaceArea || 0)
  );

  elementsWithArea.forEach((item: KeyTextObject, index: number) => {
    const element = document.createElement(item.tagName || "div");

    // Copy inline styles
    if (item.style) {
      for (const prop in item.style) {
        if (item.style.hasOwnProperty(prop)) {
          element.style[prop] = item.style[prop];
        }
      }
    }

    // Set position and size
    element.style.position = "absolute";
    element.style.left = item.x + "px";
    element.style.top = item.y + "px";
    element.style.width = item.width + "px";
    element.style.height = item.height + "px";

    // Set innerHTML
    element.innerHTML = item.innerHTML;

    // Set className if it exists
    if (item.className) {
      element.className = item.className;
    }

    // Set id if it exists
    if (item.id) {
      element.id = item.id;
    }

    // Copy all attributes
    if (item.attributes) {
      for (let i = 0; i < item.attributes.length; i++) {
        const attr = item.attributes[i];
        element.setAttribute(attr.name, attr.value);
      }
    }

    // Apply styles to children after element is created
    if (item.childrenStyles && item.childrenStyles.length > 0) {
      applyStylesToChildren(element, item.childrenStyles);
    }

    // Set z-index based on sorted order (largest elements get lowest z-index)
    element.style.zIndex = index.toString();
    theParent.appendChild(element);
  });
  return theParent.innerHTML;
}

function applyStylesToChildren(
  parentElement: HTMLElement,
  childrenStyles: ChildStyle[]
): void {
  childrenStyles.forEach((childStyle: ChildStyle, childIndex: number) => {
    // Find the corresponding child element
    const childElement = parentElement.children[childIndex] as HTMLElement;

    if (childElement) {
      // Apply all style properties to the child element
      for (const prop in childStyle) {
        if (childStyle.hasOwnProperty(prop) && prop !== "children") {
          const value = childStyle[prop];
          if (typeof value === "string") {
            (childElement.style as any)[prop] = value;
          }
        }
      }

      // Recursively apply styles to grandchildren
      if (childStyle.children && childStyle.children.length > 0) {
        applyStylesToChildren(childElement, childStyle.children);
      }
    }
  });
}
