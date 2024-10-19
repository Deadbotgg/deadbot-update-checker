interface LocalisationData {
  [key: string]: string;
}

function parseLocalisation(lines: string[]): LocalisationData {
  const result: LocalisationData = {};
  let currentKey: string | null = null;
  let multiLineValue: string = '';
  let isInMultiLine: boolean = false;

  for (const line of lines) {
    const trimmedLine: string = line.trim();

    if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
      // Single line key-value pair
      const [key, value] = trimmedLine.slice(1, -1).split('"		"');
      result[key] = value;
      currentKey = key;
    } else if (trimmedLine.startsWith('"') && !trimmedLine.endsWith('"')) {
      // Start of a multi-line value
      const [key, value] = trimmedLine.slice(1).split('"		"');
      currentKey = key;
      multiLineValue = value + '\n';
      isInMultiLine = true;
    } else if (isInMultiLine && trimmedLine.endsWith('"')) {
      // End of a multi-line value
      multiLineValue += trimmedLine.slice(0, -1);
      if (currentKey) {
        result[currentKey] = multiLineValue.trim();
      }
      isInMultiLine = false;
      multiLineValue = '';
    } else if (isInMultiLine) {
      // Middle of a multi-line value
      multiLineValue += line + '\n';    
    }
  }

  return result;
}

export { parseLocalisation };
