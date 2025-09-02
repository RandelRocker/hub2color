## EXTREMELY IMPORTANT: Code Quality Checks

**ALWAYS run the following commands before completing any task:**

1. Automatically use the IDE's built-in diagnostics tool to check for linting and type errors:

- Run `mcp__ide__getDiagnostics` to check all files for diagnostics
- Fix any linting or type errors before considering the task complete
- Do this for any file you create or modify
- use configured agents whenever it is possible

## Context 7 MCP Server

When users request the following, use the context7 MCP server to retrieve information:

- Code examples and snippets
- Setup or configuration instructions
- Library/API documentation
- Framework-specific implementation details

## React component structure

Each component structure should strictly follow this pattern:

- folder name - the same as Component name
- Component file name should be the same as Component name
- Types should be in the types.ts file in the root of component
- if there is a need in a constants they should be created in the constants.ts file in the root of component
- if there is a logic that could be exported from components as a plain function it should be placed to helpers.ts file in the root of component
- If component has to have a state like redux, then a folder named "store" should be created at the root of components with following structure:
  - reducer.ts - contains plain reducer with immer js (do not use @reduxjs/toolkit)
  - actions.ts - contains actions (simple functions that do not contain any functional logic just return an object { type, payload } )
  - constants.ts - contains enum type for actions like so `export enum actionTypes = { SET_LANG = "USER:LANG:SET" }
  - types.ts - contains types for reducer
- Reselect should be used for caching selectors
- complex hooks should be exported from the main component into separate files within the "hooks" folder (located in the root of the current component)
- each hook file should be named the same as a hook within
- for HOCs should be applied the same logic as for hooks
- if hook or HOC is used by multiple components it should be moved to the common "hooks" / "hocs" folder located within the "project root -> src -> js" folder

## React component imports

Imports within a react component should be grouped and split by an empty line. Sorted ascending by line width in each group separately.

- First group - all external inputs (meaning outside the current component).
- Second group - all internal input (meaning inside the current component). For internal input a "\*" could be used
- Third group - css, scss inputs

## Project structure

The React project structure should be strictly followed next pattern:

```
|-- webpack.config.js
|-- package.json
|-- package-lock.json
|-- README.md
|-- dist
|-- server
|-- src
    |-- assets
    |-- js
        |-- components
            |-- main
            |-- common
        |-- hooks
        |-- hocs
        |-- utils
        |-- services
        |-- store
    |-- styles
    |-- .eslintrc.js
    |-- tsconfig.json
```
