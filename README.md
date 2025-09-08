# stylelint-component-custom-property

Stylelint plugin that validates CSS custom properties in CSS modules to ensure they follow a component-based naming convention.

![npm version](https://img.shields.io/npm/v/@simonsmith/stylelint-component-custom-property)
![CI](https://github.com/simonsmith/stylelint-component-custom-property/actions/workflows/ci.yml/badge.svg)

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
    - [API declarations (validated)](#api-declarations-validated)
    - [Private properties (ignored)](#private-properties-ignored)
    - [Property consumption (ignored)](#property-consumption-ignored)
- [Examples](#examples)
  - [Valid](#valid)
  - [Invalid](#invalid)
  - [Filename warnings](#filename-warnings)
- [Autofix](#autofix)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Why?

When working with CSS modules, components often expose custom properties as a public API that can be overridden by parent components. This plugin validates that these **public** custom properties follow a consistent naming convention based on the component name.

For example, if your CSS module is named `Button.module.css`:

```css
.button {
  /* Public API - validated */
  background-color: var(--Button-primary-color, #007bff);

  /* Private properties - not validated */
  --internal-state: active;
}
```

This convention helps with:

- **Consistency**: All public custom properties follow the same naming pattern
- **Clarity**: It's immediately clear which properties are part of the component's public API
- **Avoiding conflicts**: Prevents naming collisions when components are nested
- **API documentation**: Fallback values serve as default values and documentation

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

Validates [SUIT CSS naming conventions](https://github.com/suitcss/suit/blob/master/doc/naming-conventions.md#variables):

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
flagging properties as invalid. See [the unit tests](https://github.com/simonsmith/stylelint-custom-property-prefix/blob/e8022cc57466d91de8d868781816a080855d17dd/src/validate.test.ts#L21-L43) for what it covers currently

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

- **Only applies to CSS modules** - files ending with `.module.css`
- **Validates public API custom properties** - ensures they start with `--ComponentName-`
- **Ignores private custom properties** - allows any naming for internal use
- **Autofix** - can automatically correct invalid prefixes in API declarations

### What gets validated

The plugin validates custom properties only when they're used as **public API declarations**.

#### API declarations (validated)

Custom properties used in `var()` functions **with fallback values** are treated as component API declarations:

```css
.container {
  gap: var(--Button-spacing, 1rem);
  width: var(--Button-max-width, 320px);
}
```

#### Private properties (ignored)

Direct custom property assignments are considered private implementation details:

```css
.button {
  --internal-state: hover;
  --computed-size: calc(100% - 2rem);
}
```

#### Property consumption (ignored)

Custom properties used without fallbacks are considered consumption of existing properties:

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
  /* Public API declarations - validated */
  background-color: var(--Button-primary-color, #007bff);
  padding: var(--Button-padding, 0.5rem 1rem);

  /* Private properties - not validated */
  --internal-state: default;
  --computed-width: calc(100% - 2rem);

  /* Consuming existing properties - not validated */
  margin: var(--global-spacing);
  font-family: var(--theme-font);
}

/* Overriding child component APIs - not validated */
.button-container {
  --Icon-size: 16px;
  --Tooltip-background: var(--Button-primary-color);
}
```

### Invalid

**Button.module.css**

```css
.button {
  /* Wrong prefix in API declaration */
  background: var(--wrong-color, red);

  /* No prefix in API declaration */
  padding: var(--spacing, 1rem);
}
```

### Filename warnings

If your CSS module filename isn't in PascalCase, you'll get a warning:

**user-profile.module.css** (should be **UserProfile.module.css**)

```css
.profile {
  /* Valid API declaration, but filename warning */
  gap: var(--UserProfile-avatar-size, 50px);
}
```

## Autofix

The plugin supports stylelint's `--fix` option and will automatically correct invalid custom property prefixes in API declarations:

```bash
stylelint "**/*.module.css" --fix
```

## License

MIT
