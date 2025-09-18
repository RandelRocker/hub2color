import { useEffect, useRef, useState, useCallback } from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    Switch,
    Select,
    MenuItem,
    FormControl,
    Slider,
    RadioGroup,
    FormControlLabel,
    Radio
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setControlValue } from "../../../../store/actions";
import { StyleField, StyleGroup } from "../../../../store/types";

export const StylingTab = () => {
    const dispatch = useDispatch();
    const { styleSchema, styleSchemaDefaults } = useSelector(
        (state: RootState) => state.app
    );
    const { control, subscribe } = useForm({
        defaultValues: styleSchemaDefaults
    });
    const [activeFields, setActiveFields] = useState<Record<string, boolean>>(
        {}
    );
    const lastThemeValues = useRef<Record<string, unknown>>({});

    const buildThemeObject = useCallback((themeKey: string, value: unknown) => {
        const keys = themeKey.split(".");
        const result: Record<string, unknown> = {};
        let current: Record<string, unknown> = result;

        for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = current[keys[i]] || {};
            current = current[keys[i]] as Record<string, unknown>;
        }

        current[keys[keys.length - 1]] = value;
        return result;
    }, []);

    const mergeThemeObjects = useCallback(
        (
            target: Record<string, unknown>,
            source: Record<string, unknown>
        ): Record<string, unknown> => {
            const result = { ...target };
            for (const key in source) {
                if (
                    source[key] &&
                    typeof source[key] === "object" &&
                    !Array.isArray(source[key])
                ) {
                    result[key] = mergeThemeObjects(
                        (result[key] as Record<string, unknown>) || {},
                        source[key] as Record<string, unknown>
                    );
                } else {
                    result[key] = source[key];
                }
            }
            return result;
        },
        []
    );

    const findFieldById = useCallback(
        (items: (StyleField | StyleGroup)[], id: string): StyleField | null => {
            for (const item of items) {
                if ("id" in item && item.id === id) {
                    return item as StyleField;
                }
                if ("fields" in item && item.fields) {
                    const found = findFieldById(item.fields, id);
                    if (found) return found;
                }
            }
            return null;
        },
        []
    );

    useEffect(() => {
        const callback = subscribe({
            formState: {
                values: true
            },
            callback: ({ values }) => {
                const filteredValues = Object.entries(values).filter(
                    ([fieldId, value]) =>
                        activeFields[fieldId] &&
                        value !== undefined &&
                        value !== ""
                );

                let newThemeValues: Record<string, unknown> = {};
                let hasActiveFields = false;

                filteredValues.forEach(([fieldId, value]) => {
                    const field = findFieldById(
                        styleSchema?.style || [],
                        fieldId
                    );
                    if (field?.themeKey) {
                        hasActiveFields = true;
                        const themeObj = buildThemeObject(
                            field.themeKey,
                            value
                        );
                        newThemeValues = mergeThemeObjects(
                            newThemeValues,
                            themeObj
                        );
                    }
                });

                // Only dispatch if the theme actually changed
                const themeString = JSON.stringify(newThemeValues);
                const lastThemeString = JSON.stringify(lastThemeValues.current);

                if (themeString !== lastThemeString) {
                    lastThemeValues.current = newThemeValues;

                    if (hasActiveFields) {
                        dispatch(
                            setControlValue("themeOverrides", newThemeValues)
                        );
                    } else {
                        dispatch(setControlValue("themeOverrides", {}));
                    }
                }
            }
        });

        return () => callback();
    }, [
        activeFields,
        buildThemeObject,
        dispatch,
        findFieldById,
        mergeThemeObjects,
        styleSchema?.style,
        subscribe
    ]);

    const handleActiveChange = useCallback(
        (fieldId: string, isActive: boolean) => {
            setActiveFields((prev) => ({ ...prev, [fieldId]: isActive }));
        },
        []
    );

    if (!styleSchema) {
        return (
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No style schema available for this page
                </Typography>
            </Box>
        );
    }

    const renderControl = (field: StyleField) => {
        const {
            id,
            type,
            options,
            min,
            max,
            step,
            checkedValue,
            defaultValue = "",
            uncheckedValue
        } = field;

        switch (type) {
            case "text":
                return (
                    <Controller
                        name={id}
                        control={control}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                value={fieldProps.value || ""}
                                size="small"
                                fullWidth
                                disabled={!activeFields[id]}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem" }
                                    }
                                }}
                                variant="outlined"
                            />
                        )}
                    />
                );

            case "number":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                type="number"
                                size="small"
                                fullWidth
                                disabled={!activeFields[id]}
                                variant="outlined"
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem" }
                                    }
                                }}
                            />
                        )}
                    />
                );

            case "boolean":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={
                            defaultValue
                                ? checkedValue || true
                                : uncheckedValue || false
                        }
                        render={({ field: fieldProps }) => {
                            const actualCheckedValue =
                                checkedValue !== undefined
                                    ? checkedValue
                                    : true;
                            const actualUncheckedValue =
                                uncheckedValue !== undefined
                                    ? uncheckedValue
                                    : false;

                            const isChecked =
                                fieldProps.value === actualCheckedValue;

                            const handleChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const newValue = e.target.checked
                                    ? actualCheckedValue
                                    : actualUncheckedValue;
                                fieldProps.onChange(newValue);
                            };

                            return (
                                <Switch
                                    checked={isChecked}
                                    onChange={handleChange}
                                    size="small"
                                    disabled={!activeFields[id]}
                                />
                            );
                        }}
                    />
                );

            case "select":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <FormControl size="small" fullWidth>
                                <Select
                                    {...fieldProps}
                                    value={fieldProps.value ?? ""}
                                    variant="outlined"
                                    disabled={!activeFields[id]}
                                    sx={{ fontSize: "0.875rem" }}
                                >
                                    {options?.map((option: string) => (
                                        <MenuItem
                                            key={option}
                                            sx={{ fontSize: "0.875rem" }}
                                            value={option}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                    />
                );

            case "radio":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <RadioGroup {...fieldProps} row sx={{ gap: 1 }}>
                                {options?.map((option: string) => (
                                    <FormControlLabel
                                        key={option}
                                        value={option}
                                        control={
                                            <Radio
                                                size="small"
                                                disabled={!activeFields[id]}
                                            />
                                        }
                                        slotProps={{
                                            typography: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        label={option}
                                        sx={{ mr: 1 }}
                                    />
                                ))}
                            </RadioGroup>
                        )}
                    />
                );

            case "slider":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue ?? 0}
                        render={({ field: fieldProps }) => (
                            <Box sx={{ px: 1 }}>
                                <Slider
                                    {...fieldProps}
                                    value={
                                        typeof fieldProps.value === "number"
                                            ? fieldProps.value
                                            : 0
                                    }
                                    min={min}
                                    max={max}
                                    step={step}
                                    size="small"
                                    disabled={!activeFields[id]}
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        )}
                    />
                );

            case "color":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "#000000"}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                type="color"
                                size="small"
                                disabled={!activeFields[id]}
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem" }
                                    }
                                }}
                                sx={{ width: 60 }}
                            />
                        )}
                    />
                );

            case "units":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const parseValue = (value: string) => {
                                const match = value.match(/^(\d*\.?\d*)(.*)$/);
                                return {
                                    number: match?.[1] || "",
                                    unit: match?.[2] || "px"
                                };
                            };

                            const { number, unit } = parseValue(
                                (fieldProps.value as string) || ""
                            );

                            const handleNumberChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const inputValue = e.target.value;
                                const validPattern = /^(\d*\.?\d*)$/;

                                if (validPattern.test(inputValue)) {
                                    const newValue = `${inputValue.trim()}${unit}`;
                                    fieldProps.onChange(newValue);
                                }
                            };

                            const handleUnitChange = (e: {
                                target: { value: string };
                            }) => {
                                const newUnit = e.target.value;
                                const newValue = `${number.trim()}${newUnit}`;
                                fieldProps.onChange(newValue);
                            };

                            const fontUnits = ["px", "rem", "em", "%"];

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={number || ""}
                                        onChange={handleNumberChange}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: 80 }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="16"
                                    />
                                    <FormControl
                                        size="small"
                                        sx={{ minWidth: 60 }}
                                    >
                                        <Select
                                            value={unit}
                                            onChange={handleUnitChange}
                                            variant="outlined"
                                            disabled={!activeFields[id]}
                                            sx={{ fontSize: "0.875rem" }}
                                        >
                                            {fontUnits.map((unitOption) => (
                                                <MenuItem
                                                    key={unitOption}
                                                    value={unitOption}
                                                    sx={{
                                                        fontSize: "0.875rem"
                                                    }}
                                                >
                                                    {unitOption}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            );
                        }}
                    />
                );

            case "textShadow":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px #000000"}
                        render={({ field: fieldProps }) => {
                            const parseTextShadow = (value: string) => {
                                const match = value.match(
                                    /^(-?\d*\.?\d*px)\s+(-?\d*\.?\d*px)\s+(\d*\.?\d*px)\s+(#[0-9a-fA-F]{6}|rgba?\([^)]+\)|[a-zA-Z]+)$/
                                );
                                return {
                                    horizontalPosition: match?.[1] || "0px",
                                    verticalPosition: match?.[2] || "0px",
                                    blurRadius: match?.[3] || "0px",
                                    color: match?.[4] || "#000000"
                                };
                            };

                            const {
                                horizontalPosition,
                                verticalPosition,
                                blurRadius,
                                color
                            } = parseTextShadow(
                                (fieldProps.value as string) || ""
                            );

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseTextShadow(
                                    (fieldProps.value as string) || ""
                                );
                                const updated = { ...current, [field]: value };
                                const newValue = `${updated.horizontalPosition} ${updated.verticalPosition} ${updated.blurRadius} ${updated.color}`;
                                fieldProps.onChange(newValue);
                            };

                            const handleNumberFieldChange =
                                (field: string) =>
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const inputValue = e.target.value;
                                    const validPattern = /^-?\d*\.?\d*$/;

                                    if (validPattern.test(inputValue)) {
                                        const valueWithUnit = inputValue
                                            ? `${inputValue}px`
                                            : "0px";
                                        handleFieldChange(field, valueWithUnit);
                                    }
                                };

                            const extractNumber = (value: string) => {
                                const match = value.match(/^(-?\d*\.?\d*)/);
                                return match?.[1] || "0";
                            };

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={extractNumber(
                                            horizontalPosition
                                        )}
                                        onChange={handleNumberFieldChange(
                                            "horizontalPosition"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="H"
                                        title="Horizontal Position"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(verticalPosition)}
                                        onChange={handleNumberFieldChange(
                                            "verticalPosition"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="V"
                                        title="Vertical Position"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(blurRadius)}
                                        onChange={handleNumberFieldChange(
                                            "blurRadius"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="Blur"
                                        title="Blur Radius"
                                    />
                                    <TextField
                                        type="color"
                                        value={color}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        size="small"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        title="Color"
                                    />
                                </Box>
                            );
                        }}
                    />
                );

            case "boxShadow":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={
                            defaultValue || "0px 0px 0px 0px rgba(0, 0, 0, 0.5)"
                        }
                        render={({ field: fieldProps }) => {
                            const parseBoxShadow = (value: string) => {
                                const match = value.match(
                                    /^(-?\d*\.?\d*px)\s+(-?\d*\.?\d*px)\s+(\d*\.?\d*px)\s+(\d*\.?\d*px)\s+(#[0-9a-fA-F]{6}|rgba?\([^)]+\)|[a-zA-Z]+)$/
                                );
                                return {
                                    horizontalPosition: match?.[1] || "0px",
                                    verticalPosition: match?.[2] || "0px",
                                    blurRadius: match?.[3] || "0px",
                                    spreadRadius: match?.[4] || "0px",
                                    color: match?.[5] || "rgba(0, 0, 0, 0.5)"
                                };
                            };

                            const {
                                horizontalPosition,
                                verticalPosition,
                                blurRadius,
                                spreadRadius,
                                color
                            } = parseBoxShadow(
                                (fieldProps.value as string) || ""
                            );

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseBoxShadow(
                                    (fieldProps.value as string) || ""
                                );
                                const updated = { ...current, [field]: value };
                                const newValue = `${updated.horizontalPosition} ${updated.verticalPosition} ${updated.blurRadius} ${updated.spreadRadius} ${updated.color}`;
                                fieldProps.onChange(newValue);
                            };

                            const handleNumberFieldChange =
                                (field: string) =>
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const inputValue = e.target.value;
                                    const validPattern = /^-?\d*\.?\d*$/;

                                    if (validPattern.test(inputValue)) {
                                        const valueWithUnit = inputValue
                                            ? `${inputValue}px`
                                            : "0px";
                                        handleFieldChange(field, valueWithUnit);
                                    }
                                };

                            const extractNumber = (value: string) => {
                                const match = value.match(/^(-?\d*\.?\d*)/);
                                return match?.[1] || "0";
                            };

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={extractNumber(
                                            horizontalPosition
                                        )}
                                        onChange={handleNumberFieldChange(
                                            "horizontalPosition"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "20%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="H"
                                        title="Horizontal Position"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(verticalPosition)}
                                        onChange={handleNumberFieldChange(
                                            "verticalPosition"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "20%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="V"
                                        title="Vertical Position"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(blurRadius)}
                                        onChange={handleNumberFieldChange(
                                            "blurRadius"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "20%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="Blur"
                                        title="Blur Radius"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(spreadRadius)}
                                        onChange={handleNumberFieldChange(
                                            "spreadRadius"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "20%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="Spread"
                                        title="Spread Radius"
                                    />
                                    <TextField
                                        type="color"
                                        value={color}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        size="small"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "20%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        title="Color"
                                    />
                                </Box>
                            );
                        }}
                    />
                );

            case "padding":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px 0px"}
                        render={({ field: fieldProps }) => {
                            const parsePadding = (
                                value: string
                            ): {
                                top: string;
                                right: string;
                                bottom: string;
                                left: string;
                            } => {
                                const parts = value.split(/\s+/);
                                return {
                                    top: parts[0] || "0px",
                                    right: parts[1] || parts[0] || "0px",
                                    bottom: parts[2] || parts[0] || "0px",
                                    left:
                                        parts[3] ||
                                        parts[1] ||
                                        parts[0] ||
                                        "0px"
                                };
                            };

                            const { top, right, bottom, left } = parsePadding(
                                (fieldProps.value as string) || ""
                            );

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parsePadding(
                                    (fieldProps.value as string) || ""
                                );
                                const updated = { ...current, [field]: value };
                                const newValue = `${updated.top} ${updated.right} ${updated.bottom} ${updated.left}`;
                                fieldProps.onChange(newValue);
                            };

                            const handleNumberFieldChange =
                                (field: string) =>
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const inputValue = e.target.value;
                                    const validPattern = /^\d*\.?\d*$/;

                                    if (validPattern.test(inputValue)) {
                                        const valueWithUnit = inputValue
                                            ? `${inputValue}px`
                                            : "0px";
                                        handleFieldChange(field, valueWithUnit);
                                    }
                                };

                            const extractNumber = (value: string) => {
                                const match = value.match(/^(\d*\.?\d*)/);
                                return match?.[1] || "0";
                            };

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={extractNumber(top)}
                                        onChange={handleNumberFieldChange(
                                            "top"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="T"
                                        title="Top Padding"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(right)}
                                        onChange={handleNumberFieldChange(
                                            "right"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="R"
                                        title="Right Padding"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(bottom)}
                                        onChange={handleNumberFieldChange(
                                            "bottom"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="B"
                                        title="Bottom Padding"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(left)}
                                        onChange={handleNumberFieldChange(
                                            "left"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="L"
                                        title="Left Padding"
                                    />
                                </Box>
                            );
                        }}
                    />
                );

            case "border":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "1px solid #000000"}
                        render={({ field: fieldProps }) => {
                            const parseBorder = (
                                value: string
                            ): {
                                width: string;
                                style: string;
                                color: string;
                            } => {
                                const parts = value.split(/\s+/);
                                return {
                                    width: parts[0] || "1px",
                                    style: parts[1] || "solid",
                                    color: parts[2] || "#000000"
                                };
                            };

                            const { width, style, color } = parseBorder(
                                (fieldProps.value as string) || ""
                            );

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseBorder(
                                    (fieldProps.value as string) || ""
                                );
                                const updated = { ...current, [field]: value };
                                const newValue = `${updated.width} ${updated.style} ${updated.color}`;
                                fieldProps.onChange(newValue);
                            };

                            const handleWidthChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const inputValue = e.target.value;
                                const validPattern = /^\d*\.?\d*$/;

                                if (validPattern.test(inputValue)) {
                                    const valueWithUnit = inputValue
                                        ? `${inputValue}px`
                                        : "0px";
                                    handleFieldChange("width", valueWithUnit);
                                }
                            };

                            const handleStyleChange = (e: {
                                target: { value: string };
                            }) => {
                                handleFieldChange("style", e.target.value);
                            };

                            const extractNumber = (value: string) => {
                                const match = value.match(/^(\d*\.?\d*)/);
                                return match?.[1] || "1";
                            };

                            const borderStyles = [
                                "solid",
                                "dashed",
                                "dotted",
                                "double",
                                "groove",
                                "ridge",
                                "inset",
                                "outset",
                                "none",
                                "hidden"
                            ];

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={extractNumber(width)}
                                        onChange={handleWidthChange}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "33%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="Width"
                                        title="Border Width"
                                    />
                                    <FormControl
                                        size="small"
                                        sx={{ width: "33%" }}
                                    >
                                        <Select
                                            value={style}
                                            onChange={handleStyleChange}
                                            variant="outlined"
                                            disabled={!activeFields[id]}
                                            sx={{ fontSize: "0.875rem" }}
                                        >
                                            {borderStyles.map((styleOption) => (
                                                <MenuItem
                                                    key={styleOption}
                                                    value={styleOption}
                                                    sx={{
                                                        fontSize: "0.875rem"
                                                    }}
                                                >
                                                    {styleOption}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        type="color"
                                        value={color}
                                        onChange={(e) =>
                                            handleFieldChange(
                                                "color",
                                                e.target.value
                                            )
                                        }
                                        size="small"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "33%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        title="Border Color"
                                    />
                                </Box>
                            );
                        }}
                    />
                );

            case "borderRadius":
                return (
                    <Controller
                        name={id}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px 0px"}
                        render={({ field: fieldProps }) => {
                            const parseBorderRadius = (
                                value: string
                            ): {
                                topLeft: string;
                                topRight: string;
                                bottomRight: string;
                                bottomLeft: string;
                            } => {
                                const parts = value.split(/\s+/);
                                return {
                                    topLeft: parts[0] || "0px",
                                    topRight: parts[1] || parts[0] || "0px",
                                    bottomRight: parts[2] || parts[0] || "0px",
                                    bottomLeft:
                                        parts[3] ||
                                        parts[1] ||
                                        parts[0] ||
                                        "0px"
                                };
                            };

                            const {
                                topLeft,
                                topRight,
                                bottomRight,
                                bottomLeft
                            } = parseBorderRadius(
                                (fieldProps.value as string) || ""
                            );

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseBorderRadius(
                                    (fieldProps.value as string) || ""
                                );
                                const updated = { ...current, [field]: value };
                                const newValue = `${updated.topLeft} ${updated.topRight} ${updated.bottomRight} ${updated.bottomLeft}`;
                                fieldProps.onChange(newValue);
                            };

                            const handleNumberFieldChange =
                                (field: string) =>
                                (e: React.ChangeEvent<HTMLInputElement>) => {
                                    const inputValue = e.target.value;
                                    const validPattern = /^\d*\.?\d*$/;

                                    if (validPattern.test(inputValue)) {
                                        const valueWithUnit = inputValue
                                            ? `${inputValue}px`
                                            : "0px";
                                        handleFieldChange(field, valueWithUnit);
                                    }
                                };

                            const extractNumber = (value: string) => {
                                const match = value.match(/^(\d*\.?\d*)/);
                                return match?.[1] || "0";
                            };

                            return (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gap: 1,
                                        alignItems: "center"
                                    }}
                                >
                                    <TextField
                                        type="text"
                                        value={extractNumber(topLeft)}
                                        onChange={handleNumberFieldChange(
                                            "topLeft"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="TL"
                                        title="Top Left Radius"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(topRight)}
                                        onChange={handleNumberFieldChange(
                                            "topRight"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="TR"
                                        title="Top Right Radius"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(bottomRight)}
                                        onChange={handleNumberFieldChange(
                                            "bottomRight"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="BR"
                                        title="Bottom Right Radius"
                                    />
                                    <TextField
                                        type="text"
                                        value={extractNumber(bottomLeft)}
                                        onChange={handleNumberFieldChange(
                                            "bottomLeft"
                                        )}
                                        size="small"
                                        variant="outlined"
                                        disabled={!activeFields[id]}
                                        sx={{ width: "25%" }}
                                        slotProps={{
                                            input: {
                                                sx: { fontSize: "0.875rem" }
                                            }
                                        }}
                                        placeholder="BL"
                                        title="Bottom Left Radius"
                                    />
                                </Box>
                            );
                        }}
                    />
                );

            default:
                return (
                    <Typography variant="caption" color="error">
                        Unsupported control type: {type}
                    </Typography>
                );
        }
    };

    const renderField = (field: StyleField) => (
        <TableRow key={field.id}>
            <TableCell>
                <Checkbox
                    checked={activeFields[field.id] || false}
                    onChange={(e) =>
                        handleActiveChange(field.id, e.target.checked)
                    }
                    size="small"
                />
            </TableCell>
            <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {field.label}
                </Typography>
            </TableCell>
            <TableCell>{renderControl(field)}</TableCell>
        </TableRow>
    );

    const renderGroupAsSection = (group: StyleGroup) => (
        <Box key={group.id}>
            <Accordion
                sx={{
                    boxShadow: "none",
                    "&:before": { display: "none" },
                    "&.Mui-expanded": { margin: 0 }
                }}
                disableGutters
            >
                <AccordionSummary
                    sx={{
                        minHeight: 40,
                        borderBottom: "1px solid #e0e0e0",
                        "&.Mui-expanded": { minHeight: 40 },
                        px: 2
                    }}
                    expandIcon={<ExpandMoreIcon />}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {group.label}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ backgroundColor: "#f8f9fa" }}>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "15%" }}
                                    >
                                        Enable
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "35%" }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "50%" }}
                                    >
                                        Control
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {group.fields?.map((field) => {
                                    if ("type" in field) {
                                        const fieldOrGroup = field as
                                            | StyleField
                                            | StyleGroup;
                                        if (fieldOrGroup.type === "group") {
                                            return renderNestedGroupAsTableRow(
                                                fieldOrGroup as StyleGroup
                                            );
                                        } else {
                                            return renderField(
                                                fieldOrGroup as StyleField
                                            );
                                        }
                                    } else {
                                        return renderField(field as StyleField);
                                    }
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </AccordionDetails>
            </Accordion>
        </Box>
    );

    const renderSectionTitleAsSection = (group: StyleGroup) => (
        <Box
            key={`section-${group.label}`}
            sx={{
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f8f9fa"
            }}
        >
            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 600,
                    color: "primary.main",
                    padding: "12px 16px"
                }}
            >
                {group.label}
            </Typography>
        </Box>
    );

    const renderGroupTitleAsSection = (group: StyleGroup) => (
        <Box key={`group-title-${group.label}`} sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, py: 1 }}>
                {group.label}
            </Typography>
        </Box>
    );

    const renderNestedGroupAsTableRow = (group: StyleGroup) => (
        <TableRow key={group.id}>
            <TableCell colSpan={3} sx={{ p: 0 }}>
                <Accordion disableGutters>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                        >
                            {group.label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "15%" }}
                                    >
                                        Enable
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "35%" }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "50%" }}
                                    >
                                        Control
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {group.fields?.map((field) => {
                                    if ("type" in field) {
                                        const fieldOrGroup = field as
                                            | StyleField
                                            | StyleGroup;
                                        if (fieldOrGroup.type === "group") {
                                            return renderNestedGroupAsTableRow(
                                                fieldOrGroup as StyleGroup
                                            );
                                        } else {
                                            return renderField(
                                                fieldOrGroup as StyleField
                                            );
                                        }
                                    } else {
                                        return renderField(field as StyleField);
                                    }
                                })}
                            </TableBody>
                        </Table>
                    </AccordionDetails>
                </Accordion>
            </TableCell>
        </TableRow>
    );

    // Memoize rendered items to prevent recalculation on every render
    const renderItems = () => {
        const sections: JSX.Element[] = [];
        const fieldRows: JSX.Element[] = [];

        styleSchema.style.forEach((item) => {
            if ("type" in item) {
                const itemTyped = item as StyleField | StyleGroup;
                if (itemTyped.type === "group") {
                    sections.push(
                        renderGroupAsSection(itemTyped as StyleGroup)
                    );
                } else if (itemTyped.type === "sectionTitle") {
                    sections.push(
                        renderSectionTitleAsSection(itemTyped as StyleGroup)
                    );
                } else if (itemTyped.type === "groupTitle") {
                    sections.push(
                        renderGroupTitleAsSection(itemTyped as StyleGroup)
                    );
                } else {
                    fieldRows.push(renderField(itemTyped as StyleField));
                }
            } else {
                fieldRows.push(renderField(item as StyleField));
            }
        });

        return { sections, fieldRows };
    };

    // Show loading state during initialization to prevent heavy rendering during tab transitions
    if (!styleSchema) {
        return (
            <Box
                sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%"
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    No style schema available for this page
                </Typography>
            </Box>
        );
    }

    const { sections, fieldRows } = renderItems();

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, overflow: "auto" }}>
                {sections}
                {fieldRows.length > 0 && (
                    <TableContainer>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "15%" }}
                                    >
                                        Enable
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "35%" }}
                                    >
                                        Name
                                    </TableCell>
                                    <TableCell
                                        sx={{ fontWeight: 600, width: "50%" }}
                                    >
                                        Control
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>{fieldRows}</TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </Box>
    );
};
