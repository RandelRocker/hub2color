type FlatInput = {
    [path: string]: {
        isEnabled: boolean;
        value: unknown;
    };
};

export const prepareThemeData = <T extends FlatInput>(
    flatObj: T
): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [path, { isEnabled, value }] of Object.entries(flatObj)) {
        if (!isEnabled) continue;

        const keys = path.split(".");
        let current: Record<string, unknown> = result;

        keys.forEach((key, idx) => {
            if (idx === keys.length - 1) {
                current[key] = value;
            } else {
                if (!(key in current)) {
                    current[key] = {};
                }
                current = current[key] as Record<string, unknown>;
            }
        });
    }

    return result;
};

export const prepareCssVariables = (
    cssVariables: FlatInput
): string => {
    const variables: string[] = [];

    for (const [cssVarName, { isEnabled, value }] of Object.entries(cssVariables)) {
        if (!isEnabled) continue;

        // Format the CSS variable value
        let formattedValue: string;
        if (typeof value === "string") {
            // If it's already a string, use it as-is (could be color, unit, etc.)
            formattedValue = value;
        } else if (typeof value === "number") {
            formattedValue = String(value);
        } else {
            // For other types, convert to string
            formattedValue = String(value);
        }

        // Ensure CSS variable name starts with --
        const varName = cssVarName.startsWith("--") ? cssVarName : `--${cssVarName}`;
        variables.push(`  ${varName}: ${formattedValue};`);
    }

    if (variables.length === 0) {
        return "";
    }

    return `:root {\n${variables.join("\n")}\n}`;
};
