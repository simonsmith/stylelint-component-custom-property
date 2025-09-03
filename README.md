# stylelint-component-custom-property

Stylelint plugin that validates CSS custom properties in CSS modules to ensure they follow a component-based naming convention.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Why?](#why)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
  - [Basic validation (default)](#basic-validation-default)
  - [SUIT CSS validation](#suit-css-validation)
  - [Custom pattern validation](#custom-pattern-validation)
  - [Disable the rule](#disable-the-rule)
- [How it works](#how-it-works)
  - [What gets validated](#what-gets-validated)
    - [Direct assignments](#direct-assignments)
    - [Fallback declarations](#fallback-declarations)
    - [What's ignored](#whats-ignored)
- [Examples](#examples)
  - [Valid](#valid)
  - [Invalid](#invalid)
  - [Filename warnings](#filename-warnings)
- [Autofix](#autofix)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why?

When working with CSS modules, it's common to use custom properties (CSS variables) that are scoped to a specific component. This plugin enforces a naming convention where custom properties must be prefixed with the component name derived from the CSS module filename.

For example, if your CSS module is named `Button.module.css`, all custom properties should be prefixed with `--Button-`:

```css
.button {
  --Button-primary-color: #007bff;
  --Button-padding: 0.5rem 1rem;
}
```

This convention helps with:

- **Consistency**: All custom properties follow the same naming pattern
- **Clarity**: It's immediately clear which component a custom property belongs to
- **Avoiding conflicts**: Prevents naming collisions when components are nested or used together, since CSS custom properties inherit through the DOM tree

In the future it's likely that this plugin can also be extended to optionally support the
[SUIT CSS naming conventions](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md#variables).

## Installation

```bash
npm install --save-dev @simonsmith/stylelint-component-custom-property
```

```bash
yarn add --dev @simonsmith/stylelint-component-custom-property
```

```bash
pnpm add --save-dev @simonsmith/stylelint-component-custom-property
```

## Usage

Add the plugin to your stylelint configuration:

```json
{
  "plugins": ["@simonsmith/stylelint-component-custom-property"],
  "rules": {
    "@simonsmith/stylelint-component-custom-property": true
  }
}
```

## Configuration

The rule accepts different validation types:

### Basic validation (default)

Validates only that custom properties match the component name from the filename:

```json
{
  "plugins": ["@simonsmith/stylelint-component-custom-property"],
  "rules": {
    "@simonsmith/stylelint-component-custom-property": true
  }
}
```

### SUIT CSS validation

Enforces [SUIT CSS naming conventions](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md#variables):

```json
{
  "plugins": ["@simonsmith/stylelint-component-custom-property"],
  "rules": {
    "@simonsmith/stylelint-component-custom-property": {
      "validationType": "suitcss"
    }
  }
}
```

Due to the potential ambiguity of the validation pattern in SUIT CSS this option prefers to lean on being more relaxed rather than incorrectly 
flagging properties as invalid.

### Custom pattern validation

Use your own regular expression for suffix validation:

```json
{
  "plugins": ["@simonsmith/stylelint-component-custom-property"],
  "rules": {
    "@simonsmith/stylelint-component-custom-property": {
      "validationType": /^-[a-z][a-zA-Z]*$/
    }
  }
}
```

### Disable the rule

```json
{
  "rules": {
    "@simonsmith/stylelint-component-custom-property": false
  }
}
```

## How it works

The plugin:

1. **Only applies to CSS modules** - files ending with `.module.css`
2. **Extracts component name** - converts the filename to PascalCase (e.g., `user-profile.module.css` → `UserProfile`)
3. **Validates custom properties** - ensures they start with `--ComponentName-` (see below)
4. **Provides autofix** - can automatically correct invalid prefixes
5. **Warns about filename format** - suggests renaming files that aren't already in PascalCase

### What gets validated

The plugin validates custom properties in two specific scenarios:

#### Direct assignments

Direct custom property usage is always validated:

```css
:root {
  --Button-color: red;
  --Button-padding: 1rem;
}
```

#### Fallback declarations

Custom properties used in `var()` functions **with fallback values** are treated as component API declarations:

```css
.container {
  gap: var(--Button-spacing, 1rem);
  width: var(--Button-max-width, 320px);
}
```

This usage allows a user to override the custom properties from a parent
component

```css
/* parent component can override `Button` spacing */
.parent {
  --Button-spacing: 2rem;
  --Button-max-width: 400px;
}
```

This distinction ensures the plugin only validates properties that are being "declared" as part of the component's API, rather than properties being consumed from elsewhere.

#### What's ignored

Custom properties used without fallbacks are considered consumption of existing properties and are ignored:

```css
.button {
  color: var(--theme-primary);
  margin: var(--Button-spacing);
}
```

## Examples

### Valid

**Button.module.css**

```css
.button {
  --Button-primary-color: #007bff;
  --Button-secondary-color: #6c757d;
  --Button-padding: 0.5rem 1rem;
}

/* Using existing custom properties is fine */
.button {
  color: var(--some-global-color);
}

/* API declarations with fallbacks are validated */
.container {
  gap: var(--Button-spacing, 1rem);
  max-width: var(--Button-max-width, 320px);
}
```

### Invalid

**Button.module.css**

```css
.button {
  --wrong-color: red; /* Should be --Button-color */
  --color: blue; /* Should be --Button-color */
}

/* Invalid prefixes in var() with fallbacks */
.container {
  gap: var(--wrong-spacing, 1rem); /* Should be --Button-spacing */
  width: var(--Container-width, 100%); /* Should be --Button-width */
}
```

### Filename warnings

If your CSS module filename isn't in PascalCase, you'll get a warning:

**user-profile.module.css** (should be **UserProfile.module.css**)

```css
.profile {
  --UserProfile-avatar-size: 50px; /* Valid property, but filename warning */
}
```

## Autofix

The plugin supports stylelint's `--fix` option and will automatically correct invalid custom property prefixes:

```bash
stylelint "**/*.module.css" --fix
```

## License

MIT
