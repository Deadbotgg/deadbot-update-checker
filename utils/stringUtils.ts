export function formatDescription(
    description: string,
    ...formatVars: Array<{ [key: string]: any }>
): string {
    if (!description) return '';

    // Combine all format variables into a single object
    const combinedVars = formatVars.reduce((acc, curr) => ({ ...acc, ...curr }), {});

    // Replace all variables in the description
    let formattedDesc = description;
    for (const [key, value] of Object.entries(combinedVars)) {
        if (typeof value === 'string' || typeof value === 'number') {
            formattedDesc = formattedDesc.replace(new RegExp(`{${key}}`, 'g'), String(value));
            // Also replace %key% format
            formattedDesc = formattedDesc.replace(new RegExp(`%${key}%`, 'g'), String(value));
        }
    }

    return formattedDesc;
}
