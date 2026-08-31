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
