import { useEffect, useMemo, useRef } from "react";
import Editor from "@monaco-editor/react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    FormControl,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

import {
    setServerResponsesMocks,
    setServerResponsesTabExpandedAccordions,
    setServerResponsesTabFormItems
} from "../../../../store/actions";
import { RootState } from "../../../../store";

import {
    areServerResponsePayloadsEqual,
    buildServerResponsePayload,
    formatResponseForEditor,
    isValidDelayInput,
    validateJsonString
} from "./helpers";
import { ServerResponseFormItem } from "./types";

const DISPATCH_DEBOUNCE_MS = 350;
const RESPONSE_EDITOR_MIN_HEIGHT = 300;

const accordionSx = {
    boxShadow: "none",
    "&:before": { display: "none" },
    "&.Mui-expanded": { margin: 0 }
};

const accordionSummarySx = {
    minHeight: 40,
    borderBottom: "1px solid #e0e0e0",
    "&.Mui-expanded": { minHeight: 40 },
    px: 2,
    "&:hover": {
        backgroundColor: "#f5f5f5"
    }
};

const fieldRowSx = {
    display: "flex",
    alignItems: "center",
    gap: 2,
    py: 1.5,
    px: 2,
    borderBottom: "1px solid #e0e0e0"
};

export const ServerResponsesTab = () => {
    const dispatch = useDispatch();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const {
        componentSchema,
        serverResponsesMocks,
        serverResponsesTabFormItems,
        serverResponsesTabExpandedAccordions
    } =
        useSelector((state: RootState) => state.app);
    const formItems = useMemo(
        () => serverResponsesTabFormItems ?? [],
        [serverResponsesTabFormItems]
    );
    const expandedAccordions = useMemo(
        () => serverResponsesTabExpandedAccordions ?? [],
        [serverResponsesTabExpandedAccordions]
    );
    const lastSentPayloadRef = useRef(serverResponsesMocks);

    useEffect(() => {
        const mocks = componentSchema?.mocks ?? [];

        if (mocks.length === 0) {
            return;
        }

        const formItemsMatchSchema =
            formItems.length === mocks.length &&
            formItems.every((item, i) => item.requestId === mocks[i].requestId);

        if (!formItemsMatchSchema) {
            const nextItems = mocks.map((mock) => ({
                requestId: mock.requestId,
                description: mock.description,
                isEnabled: false,
                responseType: mock.responseType ?? "success",
                responseDelay:
                    typeof mock.delay === "number" &&
                    Number.isFinite(mock.delay) &&
                    mock.delay > 0
                        ? String(mock.delay)
                        : "0",
                responseBody: formatResponseForEditor(mock.response),
                responseBodyError: null
            }));

            dispatch(setServerResponsesTabFormItems(nextItems));
        }
    }, [componentSchema, dispatch, formItems]);

    useEffect(() => {
        lastSentPayloadRef.current = serverResponsesMocks;
    }, [serverResponsesMocks]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }

        const nextPayload =
            formItems.length === 0
                ? []
                : buildServerResponsePayload(formItems);

        if (areServerResponsePayloadsEqual(lastSentPayloadRef.current, nextPayload)) {
            return;
        }

        debounceRef.current = setTimeout(() => {
            lastSentPayloadRef.current = nextPayload;
            dispatch(setServerResponsesMocks(nextPayload));
        }, DISPATCH_DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [dispatch, formItems]);

    const updateFormItem = (
        index: number,
        updater: (prev: ServerResponseFormItem) => ServerResponseFormItem
    ) => {
        const next = [...formItems];
        next[index] = updater(formItems[index]);
        dispatch(setServerResponsesTabFormItems(next));
    };

    const handleMockEnabledChange = (index: number, checked: boolean) => {
        updateFormItem(index, (prev) => ({
            ...prev,
            isEnabled: checked
        }));
    };

    const handleResponseTypeChange = (
        index: number,
        value: "success" | "error"
    ) => {
        updateFormItem(index, (prev) => ({
            ...prev,
            responseType: value
        }));
    };

    const handleResponseDelayChange = (index: number, value: string) => {
        if (!isValidDelayInput(value)) {
            return;
        }

        updateFormItem(index, (prev) => ({
            ...prev,
            responseDelay: value
        }));
    };

    const handleResponseBodyChange = (index: number, value: string = "") => {
        updateFormItem(index, (prev) => ({
            ...prev,
            responseBody: value,
            responseBodyError: validateJsonString(value)
        }));
    };

    const getAccordionId = (item: ServerResponseFormItem) =>
        String(item.requestId);

    const handleAccordionChange = (accordionId: string) => {
        const next = expandedAccordions.includes(accordionId)
            ? expandedAccordions.filter((id) => id !== accordionId)
            : [...expandedAccordions, accordionId];

        dispatch(setServerResponsesTabExpandedAccordions(next));
    };

    if (!componentSchema || !Array.isArray(componentSchema.mocks)) {
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
                    No server responses schema available for this page
                </Typography>
            </Box>
        );
    }

    if (componentSchema.mocks.length === 0) {
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
                    No mock responses configured in schema
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flex: 1, overflow: "auto" }}>
                {formItems.map((item, index) => {
                    const accordionId = getAccordionId(item);
                    const isExpanded = expandedAccordions.includes(accordionId);

                    return (
                        <Box key={item.requestId}>
                            <Accordion
                                expanded={isExpanded}
                                onChange={() =>
                                    handleAccordionChange(accordionId)
                                }
                                sx={accordionSx}
                                disableGutters
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={accordionSummarySx}
                                >
                                    <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600 }}
                                    >
                                        {item.requestId} - {item.description}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails sx={{ p: 0 }}>
                                    <Box>
                                        <Box sx={fieldRowSx}>
                                            <Box
                                                sx={{
                                                    width: "35%",
                                                    minWidth: 120
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    Is mock enabled
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Switch
                                                    checked={item.isEnabled}
                                                    onChange={(event) =>
                                                        handleMockEnabledChange(
                                                            index,
                                                            event.target
                                                                .checked
                                                        )
                                                    }
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                        <Box sx={fieldRowSx}>
                                            <Box
                                                sx={{
                                                    width: "35%",
                                                    minWidth: 120
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    Response type
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <FormControl
                                                    size="small"
                                                    fullWidth
                                                    disabled={!item.isEnabled}
                                                >
                                                    <Select
                                                        value={item.responseType}
                                                        onChange={(event) =>
                                                            handleResponseTypeChange(
                                                                index,
                                                                event.target
                                                                    .value as
                                                                    | "success"
                                                                    | "error"
                                                            )
                                                        }
                                                        variant="outlined"
                                                        sx={{
                                                            fontSize: "0.875rem"
                                                        }}
                                                    >
                                                        <MenuItem value="success">
                                                            Success
                                                        </MenuItem>
                                                        <MenuItem value="error">
                                                            Error
                                                        </MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        </Box>
                                        <Box sx={fieldRowSx}>
                                            <Box
                                                sx={{
                                                    width: "35%",
                                                    minWidth: 120
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    Response delay
                                                </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <TextField
                                                    type="text"
                                                    size="small"
                                                    fullWidth
                                                    disabled={!item.isEnabled}
                                                    placeholder="0"
                                                    value={item.responseDelay}
                                                    onChange={(event) =>
                                                        handleResponseDelayChange(
                                                            index,
                                                            event.target.value
                                                        )
                                                    }
                                                    variant="outlined"
                                                    slotProps={{
                                                        input: {
                                                            sx: {
                                                                fontSize:
                                                                    "0.875rem"
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                        <Box
                                            sx={{
                                                ...fieldRowSx,
                                                alignItems: "flex-start"
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: "35%",
                                                    minWidth: 120,
                                                    pt: 0.5
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{ fontWeight: 500 }}
                                                >
                                                    Response body
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    flex: 1,
                                                    opacity: item.isEnabled
                                                        ? 1
                                                        : 0.7
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        border: "1px solid",
                                                        borderColor: "divider",
                                                        borderRadius: 1,
                                                        overflow: "hidden"
                                                    }}
                                                >
                                                    <Editor
                                                        height={
                                                            RESPONSE_EDITOR_MIN_HEIGHT
                                                        }
                                                        language="json"
                                                        value={
                                                            item.responseBody
                                                        }
                                                        onChange={(value) =>
                                                            handleResponseBodyChange(
                                                                index,
                                                                value
                                                            )
                                                        }
                                                        options={{
                                                            readOnly:
                                                                !item.isEnabled,
                                                            stickyScroll: {
                                                                enabled: false
                                                            },
                                                            minimap: {
                                                                enabled: false
                                                            },
                                                            fontSize: 12,
                                                            lineNumbers: "on",
                                                            lineNumbersMinChars: 2,
                                                            lineDecorationsWidth: 0,
                                                            scrollBeyondLastLine: false,
                                                            renderLineHighlight:
                                                                "gutter"
                                                        }}
                                                    />
                                                </Box>
                                                {item.responseBodyError &&
                                                    item.isEnabled && (
                                                        <Alert
                                                            severity="error"
                                                            sx={{
                                                                mt: 1,
                                                                py: 0,
                                                                "& .MuiAlert-message": {
                                                                    fontSize:
                                                                        "0.75rem"
                                                                }
                                                            }}
                                                        >
                                                            {
                                                                item.responseBodyError
                                                            }
                                                        </Alert>
                                                    )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};
