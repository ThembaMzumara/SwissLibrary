/**
 * HTML template literal tag function
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = "";
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) result += String(values[i]);
  }
  return result;
}

/**
 * CSS template literal tag function
 */
export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  return html(strings, ...values);
}

/**
 * Converts HTML template literals to string concatenations
 */
export function convertHtmlTemplates(source: string): string {
  const htmlTemplateRegex = /html\s*`([\s\S]*?)`/g;

  return source.replace(htmlTemplateRegex, (match, content) => {
    // Process each line
    const processedLines = content.split("\n").map((line: string) => {
      // Trim the line but preserve indentation for better error messages
      const originalIndent = line.match(/^\s*/)?.[0] || "";
      let processed = line.trim();
      if (!processed) return "";

      // FIRST: Escape all quotes in the HTML (before interpolation replacement)
      // But we need to be careful not to escape quotes inside ${...}
      processed = processed.replace(/"(?![^$]*\})/g, '\\"');

      // Convert @click to onclick
      processed = processed.replace(
        /@click=\$\{([^}]+)\}/g,
        'onclick=\\"$1\\"',
      );

      // Convert ?disabled to regular disabled attribute
      processed = processed.replace(
        /\?disabled=\$\{([^}]+)\}/g,
        (_, expr) => `\\" + (${expr} ? \\" disabled\\" : \\"\\") + \\"`,
      );

      // Handle method calls in interpolations with proper spacing
      processed = processed.replace(
        /\$\{([^}]+)\(([^}]*)\)\}/g,
        (match, fn, args) => {
          // Preserve the original function call but wrap it in string concatenation
          return `\\" + (${fn}(${args})) + \\"`;
        },
      );

      // Replace simple ${...} with " + ... + " for string concatenation
      // But be careful not to match method calls we just processed
      processed = processed.replace(
        /\$\{([^}()]+)\}(?![(])/g,
        '\\" + ($1) + \\"',
      );

      // Preserve the original indentation for better readability in output
      return originalIndent + processed;
    });

    // Join all lines with newlines and proper string concatenation
    let result = processedLines
      .filter(Boolean) // Remove empty lines
      .map((line: string) => {
        // Trim the line and handle concatenation
        const trimmed = line.trim();
        if (!trimmed) return "";

        // If the line already has string concatenation, clean up the ends
        if (trimmed.includes('\\" + ') || trimmed.includes(' + \\"')) {
          let cleaned = trimmed;

          // Handle trailing + \"
          if (cleaned.endsWith(' + \\"')) {
            // Remove it as join() will add the next +
            cleaned = cleaned.slice(0, -5);
          } else {
            // Append quote to close the string
            cleaned = cleaned + '"';
          }

          // Handle leading \" +
          if (cleaned.startsWith('\\" + ')) {
            // Remove it as join() will add the previous +
            cleaned = cleaned.slice(5);
          } else {
            // Prepend quote to open the string
            cleaned = '"' + cleaned;
          }

          return cleaned;
        }

        // Otherwise, just wrap in quotes (quotes in HTML already escaped)
        return `"${trimmed}"`;
      })
      .join(" + ") // Join with + for proper concatenation
      .replace(/\s*([<>])\s*/g, "$1") // Remove spaces around angle brackets
      .replace(/\s+/g, " ") // Normalize remaining whitespace
      .trim();

    // Clean up common concatenation patterns
    const cleanUpPatterns: Array<[RegExp, string]> = [
      // Remove empty string concatenations
      [/\s*\+\s*""\s*\+\s*/g, " + "],
      [/\s*\+\s*""$/g, ""],
      [/^""\s*\+\s*/g, ""],

      // Fix spacing around concatenation operators
      [/([^ ])\s*\+\s*([^ ])/g, "$1 + $2"],

      // Fix attribute spacing
      [/(\w+)="\s*\+\s*"(\w+)"/g, '$1="$2"'],

      // Fix multiple spaces
      [/\s+/g, " "],

      // Clean up escaped characters (but preserve escaped quotes for JavaScript strings)
      [/\\\(/g, "("],
      [/\\\)/g, ")"],
      [/\\\+/g, "+"],
    ];

    // Apply all clean-up patterns
    cleanUpPatterns.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });

    // Ensure the result is properly quoted
    if (!result.startsWith('"') && !result.startsWith('" + ')) {
      result = `"${result}`;
    }
    if (!result.endsWith('"') && !result.endsWith(' + "')) {
      result = `${result}"`;
    }

    return result;
  });
}
