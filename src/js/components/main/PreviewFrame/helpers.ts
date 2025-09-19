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
