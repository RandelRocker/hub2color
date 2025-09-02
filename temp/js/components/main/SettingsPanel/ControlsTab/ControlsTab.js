import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
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
  Chip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from "react-redux";
import { setControlValue } from "../../../../store/actions";
export const ControlsTab = () => {
  const dispatch = useDispatch();
  const { controlsSchema, controlValues } = useSelector((state) => state.app);
  const { control, watch, setValue } = useForm();
  const watchedValues = watch();
  useEffect(() => {
    if (controlsSchema) {
      // Initialize form with current values
      Object.entries(controlValues).forEach(([name, value]) => {
        setValue(name, value);
      });
    }
  }, [controlsSchema, controlValues, setValue]);
  useEffect(() => {
    // Update store when form values change
    Object.entries(watchedValues).forEach(([name, value]) => {
      if (value !== undefined && controlValues[name] !== value) {
        dispatch(setControlValue(name, value));
      }
    });
  }, [watchedValues, controlValues, dispatch]);
  if (!controlsSchema) {
    return _jsx(Box, {
      sx: { p: 2, textAlign: "center" },
      children: _jsx(Typography, {
        variant: "body2",
        color: "text.secondary",
        children: "No controls schema available for this page",
      }),
    });
  }
  const renderControl = (field) => {
    const { name, type, options, min, max, step } = field;
    switch (type) {
      case "text":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || "",
          render: ({ field: fieldProps }) =>
            _jsx(TextField, {
              ...fieldProps,
              size: "small",
              fullWidth: true,
              variant: "outlined",
            }),
        });
      case "number":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || 0,
          render: ({ field: fieldProps }) =>
            _jsx(TextField, {
              ...fieldProps,
              type: "number",
              size: "small",
              fullWidth: true,
              variant: "outlined",
              inputProps: { min, max, step },
            }),
        });
      case "boolean":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || false,
          render: ({ field: fieldProps }) =>
            _jsx(Switch, {
              checked: fieldProps.value,
              onChange: (e) => fieldProps.onChange(e.target.checked),
              size: "small",
            }),
        });
      case "select":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || options?.[0] || "",
          render: ({ field: fieldProps }) =>
            _jsx(FormControl, {
              size: "small",
              fullWidth: true,
              children: _jsx(Select, {
                ...fieldProps,
                variant: "outlined",
                children: options?.map((option) =>
                  _jsx(MenuItem, { value: option, children: option }, option),
                ),
              }),
            }),
        });
      case "multi-select":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || [],
          render: ({ field: fieldProps }) =>
            _jsx(FormControl, {
              size: "small",
              fullWidth: true,
              children: _jsx(Select, {
                ...fieldProps,
                multiple: true,
                variant: "outlined",
                input: _jsx(OutlinedInput, {}),
                renderValue: (selected) =>
                  _jsx(Box, {
                    sx: { display: "flex", flexWrap: "wrap", gap: 0.5 },
                    children: selected.map((value) =>
                      _jsx(Chip, { label: value, size: "small" }, value),
                    ),
                  }),
                children: options?.map((option) =>
                  _jsxs(
                    MenuItem,
                    {
                      value: option,
                      children: [
                        _jsx(Checkbox, {
                          checked: fieldProps.value.indexOf(option) > -1,
                        }),
                        _jsx(ListItemText, { primary: option }),
                      ],
                    },
                    option,
                  ),
                ),
              }),
            }),
        });
      case "radio":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || options?.[0] || "",
          render: ({ field: fieldProps }) =>
            _jsx(RadioGroup, {
              ...fieldProps,
              row: true,
              sx: { gap: 1 },
              children: options?.map((option) =>
                _jsx(
                  FormControlLabel,
                  {
                    value: option,
                    control: _jsx(Radio, { size: "small" }),
                    label: option,
                    sx: { mr: 1 },
                  },
                  option,
                ),
              ),
            }),
        });
      case "slider":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || min || 0,
          render: ({ field: fieldProps }) =>
            _jsx(Box, {
              sx: { px: 1 },
              children: _jsx(Slider, {
                ...fieldProps,
                min: min,
                max: max,
                step: step,
                size: "small",
                valueLabelDisplay: "auto",
              }),
            }),
        });
      case "color":
        return _jsx(Controller, {
          name: name,
          control: control,
          defaultValue: controlValues[name] || "#000000",
          render: ({ field: fieldProps }) =>
            _jsx(TextField, {
              ...fieldProps,
              type: "color",
              size: "small",
              sx: { width: 60 },
            }),
        });
      default:
        return _jsxs(Typography, {
          variant: "caption",
          color: "error",
          children: ["Unsupported control type: ", type],
        });
    }
  };
  return _jsx(Box, {
    sx: { height: "100%", overflow: "auto" },
    children: _jsx(TableContainer, {
      children: _jsxs(Table, {
        size: "small",
        stickyHeader: true,
        children: [
          _jsx(TableHead, {
            children: _jsxs(TableRow, {
              children: [
                _jsx(TableCell, {
                  sx: { fontWeight: 600, width: "20%" },
                  children: "Name",
                }),
                _jsx(TableCell, {
                  sx: { fontWeight: 600, width: "30%" },
                  children: "Description",
                }),
                _jsx(TableCell, {
                  sx: { fontWeight: 600, width: "50%" },
                  children: "Control",
                }),
              ],
            }),
          }),
          _jsx(TableBody, {
            children: controlsSchema.fields.map((field) =>
              _jsxs(
                TableRow,
                {
                  children: [
                    _jsx(TableCell, {
                      children: _jsx(Typography, {
                        variant: "body2",
                        sx: { fontWeight: 500 },
                        children: field.label,
                      }),
                    }),
                    _jsx(TableCell, {
                      children: _jsx(Typography, {
                        variant: "caption",
                        color: "text.secondary",
                        children: field.description,
                      }),
                    }),
                    _jsx(TableCell, { children: renderControl(field) }),
                  ],
                },
                field.name,
              ),
            ),
          }),
        ],
      }),
    }),
  });
};
