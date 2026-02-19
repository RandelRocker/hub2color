import { ServerResponsesMockConfig } from "../../../../store/types";

import { ServerResponseFormItem } from "./types";

export const formatResponseForEditor = (response: unknown): string => {
    if (response === undefined) {
        return "null";
    }

    try {
        return JSON.stringify(response, null, 2);
    } catch {
        return "null";
    }
};

export const isValidDelayInput = (value: string): boolean => {
    return /^\d*$/.test(value);
};

export const parseDelay = (value: string): number | undefined => {
    if (!value.trim()) {
        return undefined;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return undefined;
    }

    return parsed;
};

export const validateJsonString = (value: string): string | null => {
    try {
        JSON.parse(value);
        return null;
    } catch {
        return "Response body must be valid JSON";
    }
};

export const buildServerResponsePayload = (
    items: ServerResponseFormItem[]
): ServerResponsesMockConfig[] => {
    const enabledItems = items.filter((item) => item.isEnabled);

    return enabledItems.reduce<ServerResponsesMockConfig[]>((acc, item) => {
        try {
            const parsedBody = JSON.parse(item.responseBody);
            const parsedDelay = parseDelay(item.responseDelay);

            acc.push({
                requestId: item.requestId,
                response: parsedBody,
                responseType: item.responseType,
                ...(parsedDelay ? { delay: parsedDelay } : {})
            });
        } catch {
            // Ignore invalid JSON items until user fixes payload.
        }

        return acc;
    }, []);
};
