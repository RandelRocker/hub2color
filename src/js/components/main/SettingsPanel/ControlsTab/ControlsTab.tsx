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
    Checkbox,
    ListItemText,
    OutlinedInput,
    Chip
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";

import { RootState } from "../../../../store";
import { setControlValue } from "../../../../store/actions";

export const ControlsTab = () => {
    const dispatch = useDispatch();
    const { controlsSchema, controlValues } = useSelector(
        (state: RootState) => state.app
    );
    const { control, watch, reset } = useForm();
    const isInitializing = useRef(false);

    const watchedValues = watch();

    // Reset form when schema changes (component switching)
    useEffect(() => {
        if (controlsSchema) {
            isInitializing.current = true;
            const defaultValues = { ...controlsSchema.defaults, ...controlValues };
            reset(defaultValues);
            // Small delay to prevent race condition
            setTimeout(() => {
                isInitializing.current = false;
            }, 50);
        }
    }, [controlsSchema, controlValues, reset]);

    // Update store when form values change (but not during initialization)
    useEffect(() => {
        if (isInitializing.current) return;
        
        Object.entries(watchedValues).forEach(([name, value]) => {
            if (
                value !== undefined && 
                controlValues[name] !== value &&
                controlsSchema?.fields.some(f => f.name === name)
            ) {
                dispatch(setControlValue(name, value));
            }
        });
    }, [watchedValues, controlValues, dispatch, controlsSchema]);

    if (!controlsSchema) {
        return (
            <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                    No controls schema available for this page
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
    }) => {
        const { name, type, options, min, max, step } = field;

        switch (type) {
            case "text":
                return (
                    <Controller
                        name={name}
                        control={control}
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
                        render={({ field: fieldProps }) => (
                            <TextField
                                {...fieldProps}
                                type="number"
                                size="small"
                                fullWidth
                                variant="outlined"
                                slotProps={{
                                    input: {
                                        sx: { fontSize: "0.875rem" }
                                    }
                                }}
                                inputProps={{ min, max, step }}
                            />
                        )}
                    />
                );

            case "boolean":
                return (
                    <Controller
                        name={name}
                        control={control}
                        render={({ field: fieldProps }) => (
                            <Switch
                                checked={fieldProps.value}
                                onChange={(e) =>
                                    fieldProps.onChange(e.target.checked)
                                }
                                size="small"
                            />
                        )}
                    />
                );

            case "select":
                return (
                    <Controller
                        name={name}
                        control={control}
                        render={({ field: fieldProps }) => (
                            <FormControl size="small" fullWidth>
                                <Select
                                    {...fieldProps}
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

            case "multi-select":
                return (
                    <Controller
                        name={name}
                        control={control}
                        render={({ field: fieldProps }) => (
                            <FormControl size="small" fullWidth>
                                <Select
                                    {...fieldProps}
                                    multiple
                                    variant="outlined"
                                    input={<OutlinedInput />}
                                    sx={{ fontSize: "0.875rem" }}
                                    renderValue={(selected) => (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: 0.5
                                            }}
                                        >
                                            {selected.map((value: string) => (
                                                <Chip
                                                    key={value}
                                                    label={value}
                                                    size="small"
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {options?.map((option: string) => (
                                        <MenuItem
                                            key={option}
                                            sx={{ fontSize: "0.875rem" }}
                                            value={option}
                                        >
                                            <Checkbox
                                                checked={
                                                    fieldProps.value.indexOf(
                                                        option
                                                    ) > -1
                                                }
                                            />
                                            <ListItemText primary={option} />
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
                        name={name}
                        control={control}
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

            default:
                return (
                    <Typography variant="caption" color="error">
                        Unsupported control type: {type}
                    </Typography>
                );
        }
    };

    return (
        <Box sx={{ height: "100%", overflow: "auto" }}>
            <TableContainer>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600, width: "20%" }}>
                                Name
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: "30%" }}>
                                Description
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, width: "50%" }}>
                                Control
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {controlsSchema.fields.map((field) => (
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
                                <TableCell>{renderControl(field)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
