interface LocalisationData {
  [key: string]: string;
}

function parseLocalisation(lines: string[]): LocalisationData {
  const result: LocalisationData = {};
  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmedLine: string = line.trim().replace('//"', '"');

    if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
      const parts = trimmedLine.split(/"\s+"/).map(part => part.replace(/^"|"$/g, ''));
      
      if (parts.length !== 2) {
        continue;
      }

      const [key, value] = parts;

      if (key.includes('/')) {
        const keys = key.split('/');
        for (const k of keys) {
          result[k] = value;
        }
      } else {
        result[key] = value;
      }
      currentKey = key;
    }
  }

  return result;
}

export { parseLocalisation };
