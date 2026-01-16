import { useEffect, useRef } from "react";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    TextField,
    Switch,
    Select,
    MenuItem,
    FormControl,
    Slider,
    RadioGroup,
    FormControlLabel,
    Radio,
    // Checkbox,
    // ListItemText,
    // OutlinedInput,
    // Chip,
    SelectChangeEvent
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { updateControlsTabValues } from "../../../../store/actions";

export const ControlsTab = () => {
    const dispatch = useDispatch();
    const { componentSchema, controlsTabValues } = useSelector(
        (state: RootState) => state.app
    );
    const currentComponentSchema = useRef(componentSchema);
    const { control, subscribe, reset } = useForm({
        defaultValues: controlsTabValues
    });

    // Reset form when schema changes
    useEffect(() => {
        if (currentComponentSchema.current !== componentSchema) {
            currentComponentSchema.current = componentSchema;
            reset(controlsTabValues);
        }
    }, [componentSchema, controlsTabValues, reset]);

    useEffect(() => {
        const callback = subscribe({
            formState: {
                values: true
            },
            callback: ({ values }) => {
                dispatch(updateControlsTabValues(values));
            }
        });

        return () => callback();
    }, [dispatch, subscribe]);

    if (!componentSchema) {
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
                    No controls schema available for this page
                </Typography>
            </Box>
        );
    }

    if (!componentSchema?.controls) {
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
                    No fields available for this schema
                </Typography>
            </Box>
        );
    }

    const renderControl = (field: {
        id: string;
        type: string;
        options?: string[] | { label: string; value: string }[];
        min?: number;
        max?: number;
        step?: number;
        defaultValue?: string | number | boolean;
        checkedValue?: string;
        uncheckedValue?: string;
    }) => {
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

        const name = id;

        switch (type) {
            case "text":
                return (
                    <Controller
                        name={name}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                size="small"
                                fullWidth
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
                        name={name}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => {
                            const handleNumberChange = (
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                                const inputValue = e.target.value;
                                // Allow only integers (no decimals)
                                const validPattern = /^\d*$/;

                                if (validPattern.test(inputValue)) {
                                    fieldProps.onChange(inputValue);
                                }
                            };

                            return (
                                <TextField
                                    value={fieldProps.value || ""}
                                    onChange={handleNumberChange}
                                    type="text"
                                    size="small"
                                    fullWidth
                                    variant="outlined"
                                    slotProps={{
                                        input: {
                                            sx: { fontSize: "0.875rem" }
                                        }
                                    }}
                                    placeholder="0"
                                />
                            );
                        }}
                    />
                );

            case "boolean":
                return (
                    <Controller
                        name={name}
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
                                />
                            );
                        }}
                    />
                );

            case "select":
                return (
                    <Controller
                        name={name}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <FormControl size="small" fullWidth>
                                <Select
                                    {...fieldProps}
                                    value={fieldProps.value ?? ""}
                                    variant="outlined"
                                    sx={{ fontSize: "0.875rem" }}
                                >
                                    {options?.map((option) => {
                                        const isObject = typeof option === 'object';
                                        const label = isObject ? option.label : option;
                                        const value = isObject ? option.value : option;
                                        return (
                                            <MenuItem
                                                key={value}
                                                sx={{ fontSize: "0.875rem" }}
                                                value={value}
                                            >
                                                {label}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        )}
                    />
                );

            // case "multi-select":
            //     return (
            //         <Controller
            //             name={name}
            //             control={control}
            //             defaultValue={[]}
            //             render={({ field: fieldProps }) => (
            //                 <FormControl size="small" fullWidth>
            //                     <Select
            //                         {...fieldProps}
            //                         multiple
            //                         value={fieldProps.value ?? []}
            //                         variant="outlined"
            //                         input={<OutlinedInput />}
            //                         sx={{ fontSize: "0.875rem" }}
            //                         renderValue={(selected) => (
            //                             <Box
            //                                 sx={{
            //                                     display: "flex",
            //                                     flexWrap: "wrap",
            //                                     gap: 0.5
            //                                 }}
            //                             >
            //                                 {selected.map((value: string) => (
            //                                     <Chip
            //                                         key={value}
            //                                         label={value}
            //                                         size="small"
            //                                     />
            //                                 ))}
            //                             </Box>
            //                         )}
            //                     >
            //                         {options?.map((option: string) => (
            //                             <MenuItem
            //                                 key={option}
            //                                 sx={{ fontSize: "0.875rem" }}
            //                                 value={option}
            //                             >
            //                                 <Checkbox
            //                                     checked={
            //                                         (
            //                                             fieldProps.value ?? []
            //                                         ).indexOf(option) > -1
            //                                     }
            //                                 />
            //                                 <ListItemText primary={option} />
            //                             </MenuItem>
            //                         ))}
            //                     </Select>
            //                 </FormControl>
            //             )}
            //         />
            //     );

            case "radio":
                return (
                    <Controller
                        name={name}
                        control={control}
                        defaultValue={defaultValue}
                        render={({ field: fieldProps }) => (
                            <RadioGroup {...fieldProps} row sx={{ gap: 1 }}>
                                {options?.map((option) => {
                                    const isObject = typeof option === 'object';
                                    const label = isObject ? option.label : option;
                                    const value = isObject ? option.value : option;
                                    return (
                                        <FormControlLabel
                                            key={value}
                                            value={value}
                                            control={<Radio size="small" />}
                                            slotProps={{
                                                typography: {
                                                    sx: { fontSize: "0.875rem" }
                                                }
                                            }}
                                            label={label}
                                            sx={{ mr: 1 }}
                                        />
                                    );
                                })}
                            </RadioGroup>
                        )}
                    />
                );

            case "slider":
                return (
                    <Controller
                        name={name}
                        control={control}
                        defaultValue={defaultValue ?? 0}
                        render={({ field: fieldProps }) => (
                            <Box sx={{ px: 1 }}>
                                <Slider
                                    {...fieldProps}
                                    value={fieldProps.value as number || 0}
                                    min={min}
                                    max={max}
                                    step={step}
                                    size="small"
                                    valueLabelDisplay="auto"
                                />
                            </Box>
                        )}
                    />
                );

            case "color":
                return (
                    <Controller
                        name={name}
                        control={control}
                        defaultValue={defaultValue || "#000000"}
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                type="color"
                                size="small"
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
                        name={name}
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
                                fieldProps.value as string || ""
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

                            const handleUnitChange = (e: SelectChangeEvent) => {
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
                        name={name}
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
                            } = parseTextShadow(fieldProps.value as string || "");

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseTextShadow(
                                    fieldProps.value as string || ""
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
                        name={name}
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
                            } = parseBoxShadow(fieldProps.value as string || "");

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseBoxShadow(
                                    fieldProps.value as string || ""
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
                        name={name}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px 0px"}
                        render={({ field: fieldProps }) => {
                            const parsePadding = (value: string) => {
                                const parts = value.split(/\s+/);
                                return {
                                    top: parts[0] || "0px",
                                    right: parts[1] || parts[0] || "0px",
                                    bottom: parts[2] || parts[0] || "0px",
                                    left: parts[3] || parts[1] || parts[0] || "0px"
                                };
                            };

                            const {
                                top,
                                right,
                                bottom,
                                left
                            } = parsePadding(fieldProps.value as string || "");

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parsePadding(
                                    fieldProps.value as string || ""
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
                                        onChange={handleNumberFieldChange("top")}
                                        size="small"
                                        variant="outlined"
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
                                        onChange={handleNumberFieldChange("right")}
                                        size="small"
                                        variant="outlined"
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
                                        onChange={handleNumberFieldChange("bottom")}
                                        size="small"
                                        variant="outlined"
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
                                        onChange={handleNumberFieldChange("left")}
                                        size="small"
                                        variant="outlined"
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
                        name={name}
                        control={control}
                        defaultValue={defaultValue || "1px solid #000000"}
                        render={({ field: fieldProps }) => {
                            const parseBorder = (value: string) => {
                                const parts = value.split(/\s+/);
                                return {
                                    width: parts[0] || "1px",
                                    style: parts[1] || "solid",
                                    color: parts[2] || "#000000"
                                };
                            };

                            const {
                                width,
                                style,
                                color
                            } = parseBorder(fieldProps.value as string || "");

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseBorder(
                                    fieldProps.value as string || ""
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

                            const handleStyleChange = (e: SelectChangeEvent) => {
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
                                            handleFieldChange("color", e.target.value)
                                        }
                                        size="small"
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
                        name={name}
                        control={control}
                        defaultValue={defaultValue || "0px 0px 0px 0px"}
                        render={({ field: fieldProps }) => {
                            const parseBorderRadius = (value: string) => {
                                const parts = value.split(/\s+/);
                                return {
                                    topLeft: parts[0] || "0px",
                                    topRight: parts[1] || parts[0] || "0px",
                                    bottomRight: parts[2] || parts[0] || "0px",
                                    bottomLeft: parts[3] || parts[1] || parts[0] || "0px"
                                };
                            };

                            const {
                                topLeft,
                                topRight,
                                bottomRight,
                                bottomLeft
                            } = parseBorderRadius(fieldProps.value as string || "");

                            const handleFieldChange = (
                                field: string,
                                value: string
                            ) => {
                                const current = parseBorderRadius(
                                    fieldProps.value as string || ""
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
                                        onChange={handleNumberFieldChange("topLeft")}
                                        size="small"
                                        variant="outlined"
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
                                        onChange={handleNumberFieldChange("topRight")}
                                        size="small"
                                        variant="outlined"
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
                                        onChange={handleNumberFieldChange("bottomRight")}
                                        size="small"
                                        variant="outlined"
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
                                        onChange={handleNumberFieldChange("bottomLeft")}
                                        size="small"
                                        variant="outlined"
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

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, overflow: "auto" }}>
                <TableContainer>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell
                                    sx={{ fontWeight: 600, width: "20%" }}
                                >
                                    Name
                                </TableCell>
                                <TableCell
                                    sx={{ fontWeight: 600, width: "30%" }}
                                >
                                    Description
                                </TableCell>
                                <TableCell
                                    sx={{ fontWeight: 600, width: "50%" }}
                                >
                                    Control
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {componentSchema.controls.map((field) => (
                                <TableRow 
                                    key={field.id}
                                    sx={{
                                        height: 50
                                    }}
                                >
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 500 }}
                                        >
                                            {field.label}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {field.description}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {renderControl(field)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};
