import { TStoredThemeStyles } from "../../../store/types";

const escapeCsvValue = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
};

export const exportThemeToCsv = (theme: TStoredThemeStyles | null): void => {
    if (!theme || Object.keys(theme).length === 0) return;

    const rows = Object.entries(theme).map(
        ([key, value]) => `${escapeCsvValue(key)},${escapeCsvValue(value)}`
    );
    const csvContent = ["key,value", ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "site-theme.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const parseThemeCsv = (csvContent: string): TStoredThemeStyles => {
    const theme: TStoredThemeStyles = {};
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim() !== "");

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        let key = "";
        let value = "";

        if (line.startsWith('"')) {
            const endQuote = line.indexOf('",', 1);
            if (endQuote === -1) continue;
            key = line.substring(1, endQuote).replace(/""/g, '"');
            const rest = line.substring(endQuote + 2);
            value = rest.startsWith('"') && rest.endsWith('"')
                ? rest.slice(1, -1).replace(/""/g, '"')
                : rest;
        } else {
            const commaIdx = line.indexOf(",");
            if (commaIdx === -1) continue;
            key = line.substring(0, commaIdx);
            const rest = line.substring(commaIdx + 1);
            value = rest.startsWith('"') && rest.endsWith('"')
                ? rest.slice(1, -1).replace(/""/g, '"')
                : rest;
        }

        if (key) {
            theme[key] = value;
        }
    }

    return theme;
};
