interface LocalisationData {
  [key: string]: string;
}

function parseLocalisation(lines: string[]): LocalisationData {
  const result: LocalisationData = {};
  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmedLine: string = line.trim().replace('//"', '"');

    if (trimmedLine.startsWith('"') && trimmedLine.endsWith('"')) {
      const [key, value] = trimmedLine.match(/(?<!\\)".*?(?<!\\)"/g) ?? [];

      if(!key || !value) {
        continue;
      }
      if (key?.includes('/')) {
        const keys = key.split('/');
        for (const key of keys) {
          result[key] = value;
        }
        continue;
      }
      result[key] = value;
      currentKey = key;
    }
  }

  return result;
}

export { parseLocalisation };
