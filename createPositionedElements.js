function createPositionedElements(data) {
  // Calculate surface area for each element and add it to the data
  const elementsWithArea = data.map((item, index) => {
    const surfaceArea = item.width * item.height;
    return {
      ...item,
      surfaceArea,
      originalIndex: index,
    };
  });

  // Sort elements by surface area (largest first, so they get lowest z-index)
  elementsWithArea.sort((a, b) => b.surfaceArea - a.surfaceArea);

  return elementsWithArea.map((item, index) => {
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
    element.style.zIndex = index;
    document.body.appendChild(element);
    return element;
  });
}

function applyStylesToChildren(parentElement, childrenStyles) {
  childrenStyles.forEach((childStyle, childIndex) => {
    // Find the corresponding child element
    const childElement = parentElement.children[childIndex];

    if (childElement) {
      // Apply all style properties to the child element
      for (const prop in childStyle) {
        if (childStyle.hasOwnProperty(prop) && prop !== "children") {
          childElement.style[prop] = childStyle[prop];
        }
      }

      // Recursively apply styles to grandchildren
      if (childStyle.children && childStyle.children.length > 0) {
        applyStylesToChildren(childElement, childStyle.children);
      }
    }
  });
}
