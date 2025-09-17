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
import { setControlValue } from "../../../../store/actions";

export const ControlsTab = () => {
    const dispatch = useDispatch();
    const { controlsSchema, selectedTemplate, controlValues } = useSelector(
        (state: RootState) => state.app
    );
    const { control, watch, reset } = useForm();
    const isInitializing = useRef(false);

    const watchedValues = watch();

    // Reset form when schema or template changes
    useEffect(() => {
        if (controlsSchema) {
            isInitializing.current = true;
            let defaultValues = {};

            if (controlsSchema.templates && selectedTemplate) {
                const template = controlsSchema.templates.find(
                    (t) => t.templateName === selectedTemplate?.templateName
                );
                if (template) {
                    defaultValues = {
                        ...template.props.defaults,
                        ...controlValues
                    };
                }
            } else if (controlsSchema.defaults) {
                defaultValues = {
                    ...controlsSchema.defaults,
                    ...controlValues
                };
            }

            reset(defaultValues);
            // Small delay to prevent race condition
            setTimeout(() => {
                isInitializing.current = false;
            }, 50);
        }
    }, [controlsSchema, selectedTemplate, controlValues, reset]);

    // Update store when form values change (but not during initialization)
    useEffect(() => {
        if (isInitializing.current) return;

        Object.entries(watchedValues).forEach(([name, value]) => {
            if (value !== undefined && controlValues[name] !== value) {
                let hasField = false;

                if (controlsSchema?.templates && selectedTemplate) {
                    const template = controlsSchema.templates.find(
                        (t) => t.templateName === selectedTemplate?.templateName
                    );
                    hasField =
                        template?.props.fields.some((f) => f.name === name) ||
                        false;
                } else if (controlsSchema?.fields) {
                    hasField = controlsSchema.fields.some(
                        (f) => f.name === name
                    );
                }

                if (hasField) {
                    dispatch(setControlValue(name, value));
                }
            }
        });
    }, [
        watchedValues,
        controlValues,
        dispatch,
        controlsSchema,
        selectedTemplate
    ]);

    if (!controlsSchema) {
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

    const getCurrentSchema = () => {
        if (controlsSchema.templates && selectedTemplate) {
            const template = controlsSchema.templates.find(
                (t) => t.templateName === selectedTemplate?.templateName
            );
            return template?.props;
        }
        return controlsSchema;
    };

    const currentSchema = getCurrentSchema();

    if (!currentSchema?.fields) {
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
        name: string;
        type: string;
        options?: string[];
        min?: number;
        max?: number;
        step?: number;
        defaultValue?: string | number | boolean;
        checkedValue?: string;
        uncheckedValue?: string;
    }) => {
        const {
            name,
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
                                {options?.map((option: string) => (
                                    <FormControlLabel
                                        key={option}
                                        value={option}
                                        control={<Radio size="small" />}
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
                        name={name}
                        control={control}
                        defaultValue={defaultValue ?? 0}
                        render={({ field: fieldProps }) => (
                            <Box sx={{ px: 1 }}>
                                <Slider
                                    {...fieldProps}
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
                                fieldProps.value || ""
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
                            {currentSchema.fields.map((field) => (
                                <TableRow key={field.name}>
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
