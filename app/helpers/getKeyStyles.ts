export default function getKeyStyles(element: Element) {
  const style = getComputedStyle(element);
  return {
    // Text styling
    color: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    textAlign: style.textAlign,
    textDecoration: style.textDecoration,
    textTransform: style.textTransform,
    textOverflow: style.textOverflow,

    // Additional text properties
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    wordSpacing: style.wordSpacing,
    textShadow: style.textShadow,
    textIndent: style.textIndent,
    whiteSpace: style.whiteSpace,
    wordBreak: style.wordBreak,
    wordWrap: style.wordWrap,
    overflowWrap: style.overflowWrap,

    // Layout and positioning
    position: style.position,
    display: style.display,
    flexDirection: style.flexDirection,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    flexWrap: style.flexWrap,
    gap: style.gap,

    // Spacing
    margin: style.margin,
    marginTop: style.marginTop,
    marginRight: style.marginRight,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    padding: style.padding,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,

    // Dimensions
    width: style.width,
    height: style.height,
    minWidth: style.minWidth,
    minHeight: style.minHeight,
    maxWidth: style.maxWidth,
    maxHeight: style.maxHeight,

    // Background
    backgroundColor: style.backgroundColor,
    background: style.background,

    // Border
    border: style.border,
    borderRadius: style.borderRadius,
    borderWidth: style.borderWidth,
    borderStyle: style.borderStyle,
    borderColor: style.borderColor,

    // Effects
    boxShadow: style.boxShadow,
    opacity: style.opacity,
    transform: style.transform,

    // Overflow
    overflow: style.overflow,
    overflowX: style.overflowX,
    overflowY: style.overflowY,
  };
}
