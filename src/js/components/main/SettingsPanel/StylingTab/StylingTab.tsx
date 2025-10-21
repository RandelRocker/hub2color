import { useEffect, useRef, useState, useCallback } from "react";
import {
    Box,
    Typography,
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
    Radio,
    IconButton,
    Menu,
    Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { MoreVert, Restore, RestartAlt } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import {
    updateStylingTheme,
    setStylingUIState
} from "../../../../store/actions";
import { StyleField, StyleGroup, StylingTheme } from "../../../../store/types";

export const StylingTab = () => {
    const dispatch = useDispatch();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { styleSchema, styleSchemaDefaults, stylingUIState, savedTheme } =
        useSelector((state: RootState) => state.app);

    const { control, subscribe, getValues, reset } = useForm({
        defaultValues: styleSchemaDefaults
    });

    const [expandedAccordions, setExpandedAccordions] = useState<string[]>(
        stylingUIState.expandedAccordions || []
    );
    const [fieldMenuAnchor, setFieldMenuAnchor] = useState<{
        element: HTMLElement | null;
        fieldId: string | null;
    }>({ element: null, fieldId: null });

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

    const handleFieldMenuOpen = useCallback(
        (event: React.MouseEvent<HTMLElement>, fieldId: string) => {
            setFieldMenuAnchor({ element: event.currentTarget, fieldId });
        },
        []
    );

    const handleFieldMenuClose = useCallback(() => {
        setFieldMenuAnchor({ element: null, fieldId: null });
    }, []);

    const handleFieldResetToPreviousSaved = useCallback(() => {
        const fieldId = fieldMenuAnchor.fieldId;
        if (!fieldId) return;

        const field = findFieldById(styleSchema?.style || [], fieldId);
        if (!field?.themeKey) return;

        const savedValue = savedTheme?.themeStyles[field.themeKey];
        if (savedValue) {
            const currentValues = getValues();
            const newValues = {
                ...currentValues,
                [fieldId]: savedValue.value,
                [`${fieldId}_enabled`]: savedValue.isEnabled
            };
            reset(newValues);

            // Update the styling theme for this field
            dispatch(
                updateStylingTheme({
                    [field.themeKey]: {
                        value: savedValue.value,
                        isEnabled: savedValue.isEnabled
                    }
                })
            );
        }
        handleFieldMenuClose();
    }, [
        fieldMenuAnchor.fieldId,
        findFieldById,
        styleSchema,
        savedTheme,
        getValues,
        reset,
        dispatch,
        handleFieldMenuClose
    ]);

    const handleFieldResetToDefault = useCallback(() => {
        const fieldId = fieldMenuAnchor.fieldId;
        if (!fieldId) return;

        const field = findFieldById(styleSchema?.style || [], fieldId);
        if (!field?.themeKey) return;

        const defaultValue = field.defaultValue;
        if (defaultValue !== undefined) {
            const currentValues = getValues();
            const newValues = {
                ...currentValues,
                [fieldId]: defaultValue,
                [`${fieldId}_enabled`]: false
            };
            reset(newValues);

            // Update the styling theme for this field
            dispatch(
                updateStylingTheme({
                    [field.themeKey]: {
                        value: defaultValue,
                        isEnabled: false
                    }
                })
            );
        }
        handleFieldMenuClose();
    }, [
        fieldMenuAnchor.fieldId,
        findFieldById,
        styleSchema,
        getValues,
        reset,
        dispatch,
        handleFieldMenuClose
    ]);

    useEffect(() => {
        const callback = subscribe({
            formState: {
                values: true
            },
            callback: ({ values }) => {
                const newThemeValues: StylingTheme = {};

                Object.entries(values).forEach(([key, value]) => {
                    // Check if this field is enabled
                    const enabledKey = `${key}_enabled`;
                    const isEnabled = Boolean(values[enabledKey]);

                    if (value !== undefined) {
                        const field = findFieldById(
                            styleSchema?.style || [],
                            key
                        );
                        if (field?.themeKey) {
                            newThemeValues[field.themeKey] = {
                                value,
                                isEnabled
                            };
                        }
                    }
                });

                dispatch(updateStylingTheme(newThemeValues));
            }
        });

        return () => callback();
    }, [dispatch, findFieldById, styleSchema?.style, subscribe]);

    useEffect(() => {
        reset(styleSchemaDefaults);
    }, [reset, styleSchemaDefaults]);

    // Restore scroll position when component mounts
    useEffect(() => {
        if (scrollContainerRef.current && stylingUIState.scrollPosition) {
            scrollContainerRef.current.scrollTop =
                stylingUIState.scrollPosition;
        }
    }, [stylingUIState.scrollPosition]);

    // Save scroll position when it changes
    const handleScroll = useCallback(
        (e: React.UIEvent<HTMLDivElement>) => {
            const scrollTop = e.currentTarget.scrollTop;
            dispatch(setStylingUIState({ scrollPosition: scrollTop }));
        },
        [dispatch]
    );

    // Save expanded accordions when they change
    useEffect(() => {
        dispatch(setStylingUIState({ expandedAccordions }));
    }, [expandedAccordions, dispatch]);

    // Restore expanded accordions when stylingUIState changes
    useEffect(() => {
        if (stylingUIState.expandedAccordions) {
            setExpandedAccordions(stylingUIState.expandedAccordions);
        }
    }, [stylingUIState.expandedAccordions]);

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
            defaultValue = ""
        } = field;

        const isFieldEnabled = getValues(`${id}_enabled`) || false;

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
                                disabled={!isFieldEnabled}
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
                                disabled={!isFieldEnabled}
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
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const actualCheckedValue =
                                checkedValue !== undefined
                                    ? checkedValue
                                    : true;

                            const isChecked =
                                fieldProps.value === actualCheckedValue;

                            const handleChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const newValue = e.target.checked
                                    ? actualCheckedValue
                                    : "";
                                fieldProps.onChange(newValue);
                            };

                            return (
                                <Switch
                                    checked={isChecked}
                                    onChange={handleChange}
                                    size="small"
                                    disabled={!isFieldEnabled}
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
                                    disabled={!isFieldEnabled}
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
                                                disabled={!isFieldEnabled}
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
                                    disabled={!isFieldEnabled}
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
                                disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                            disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                            disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
                                        disabled={!isFieldEnabled}
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
        <Box
            key={field.id}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                px: 2,
                borderBottom: "1px solid #e0e0e0"
            }}
        >
            <Box sx={{ width: "15%", minWidth: 60 }}>
                <Controller
                    name={`${field.id}_enabled`}
                    control={control}
                    defaultValue={false}
                    render={({ field: checkboxField }) => (
                        <Checkbox
                            checked={(checkboxField.value as boolean) || false}
                            onChange={(e) => {
                                const isChecked = e.target.checked;
                                checkboxField.onChange(isChecked);
                            }}
                            size="small"
                        />
                    )}
                />
            </Box>
            <Box sx={{ width: "35%", minWidth: 120 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {field.label}
                </Typography>
            </Box>
            <Box sx={{ width: "50%", flex: 1 }}>{renderControl(field)}</Box>
            <Box sx={{ width: "auto", minWidth: 32 }}>
                <Tooltip title="Field options">
                    <IconButton
                        size="small"
                        onClick={(e) => handleFieldMenuOpen(e, field.id)}
                        sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                    >
                        <MoreVert fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    const renderGroupAsSection = (group: StyleGroup) => {
        const isExpanded = expandedAccordions.includes(group.id || group.label);

        const handleAccordionChange = () => {
            const accordionId = group.id || group.label;
            setExpandedAccordions((prev) =>
                isExpanded
                    ? prev.filter((id) => id !== accordionId)
                    : [...prev, accordionId]
            );
        };

        return (
            <Box key={group.id}>
                <Accordion
                    expanded={isExpanded}
                    onChange={handleAccordionChange}
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
                            px: 2,
                            "&:hover": {
                                backgroundColor: "#f5f5f5"
                            }
                        }}
                        expandIcon={<ExpandMoreIcon />}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                        >
                            {group.label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box>
                            {group.fields?.map((field) => {
                                if ("type" in field) {
                                    const fieldOrGroup = field as
                                        | StyleField
                                        | StyleGroup;
                                    if (fieldOrGroup.type === "group") {
                                        return renderNestedGroupAsSection(
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
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        );
    };

    const renderSectionTitleAsSection = (group: StyleGroup) => (
        <Box
            key={`section-${group.label}`}
            sx={{
                borderBottom: "1px solid #e0e0e0",
                backgroundColor: "#f8f9fa",
                textAlign: "center"
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

    const renderNestedGroupAsSection = (group: StyleGroup) => {
        const nestedId = `nested-${group.id || group.label}`;
        const isExpanded = expandedAccordions.includes(nestedId);

        const handleAccordionChange = () => {
            setExpandedAccordions((prev) =>
                isExpanded
                    ? prev.filter((id) => id !== nestedId)
                    : [...prev, nestedId]
            );
        };

        return (
            <Box key={group.id} sx={{ margin: "8px 16px" }}>
                <Accordion
                    expanded={isExpanded}
                    onChange={handleAccordionChange}
                    disableGutters
                    sx={{
                        boxShadow: "none",
                        "&:before": { display: "none" },
                        "&.Mui-expanded": { margin: 0 },
                        border: "none",
                        borderRadius: 0
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            minHeight: 36,
                            "&.Mui-expanded": { minHeight: 36 },
                            px: 2,
                            backgroundColor: "#f8f9fa",
                            "&:hover": {
                                backgroundColor: "#f1f1f1"
                            }
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                        >
                            {group.label}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                        <Box>
                            {group.fields?.map((field) => {
                                if ("type" in field) {
                                    const fieldOrGroup = field as
                                        | StyleField
                                        | StyleGroup;
                                    if (fieldOrGroup.type === "group") {
                                        return renderNestedGroupAsSection(
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
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        );
    };

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
            <Box
                ref={scrollContainerRef}
                onScroll={handleScroll}
                sx={{ flex: 1, overflow: "auto" }}
            >
                {sections}
                {fieldRows.length > 0 && (
                    <Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                py: 1.5,
                                px: 2,
                                backgroundColor: "#f8f9fa",
                                borderBottom: "2px solid #e0e0e0",
                                fontWeight: 600,
                                position: "sticky",
                                top: 0,
                                zIndex: 1
                            }}
                        >
                            <Box sx={{ width: "15%", minWidth: 60 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Enable
                                </Typography>
                            </Box>
                            <Box sx={{ width: "35%", minWidth: 120 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Name
                                </Typography>
                            </Box>
                            <Box sx={{ width: "50%", flex: 1 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    Control
                                </Typography>
                            </Box>
                            <Box sx={{ width: "auto", minWidth: 32 }}>
                                <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 600 }}
                                >
                                    {/* Options column header - empty */}
                                </Typography>
                            </Box>
                        </Box>
                        <Box>{fieldRows}</Box>
                    </Box>
                )}
            </Box>

            {/* Field Context Menu */}
            <Menu
                anchorEl={fieldMenuAnchor.element}
                open={Boolean(fieldMenuAnchor.element)}
                onClose={handleFieldMenuClose}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right"
                }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right"
                }}
            >
                <MenuItem
                    onClick={handleFieldResetToPreviousSaved}
                    sx={{ fontSize: "0.875rem" }}
                >
                    <Restore sx={{ mr: 1, fontSize: "1rem" }} />
                    Reset to Previous Saved
                </MenuItem>
                <MenuItem
                    onClick={handleFieldResetToDefault}
                    sx={{ fontSize: "0.875rem" }}
                >
                    <RestartAlt sx={{ mr: 1, fontSize: "1rem" }} />
                    Reset to Default
                </MenuItem>
            </Menu>
        </Box>
    );
};
