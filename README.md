# stylelint-component-custom-property

Stylelint plugin that validates CSS custom properties in CSS modules to ensure they follow a component-based naming convention.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Why?](#why)
- [Installation](#installation)
- [Usage](#usage)
- [How it works](#how-it-works)
- [Examples](#examples)
  - [Valid](#valid)
  - [Invalid](#invalid)
  - [Filename warnings](#filename-warnings)
- [Configuration](#configuration)
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

## How it works

The plugin:

1. **Only applies to CSS modules** - files ending with `.module.css`
2. **Extracts component name** - converts the filename to PascalCase (e.g., `user-profile.module.css` → `UserProfile`)
3. **Validates custom properties** - ensures they start with `--ComponentName-`
4. **Provides autofix** - can automatically correct invalid prefixes
5. **Warns about filename format** - suggests renaming files that aren't already in PascalCase

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
```

### Invalid

**Button.module.css**

```css
.button {
  --wrong-color: red; /* Should be --Button-color */
  --color: blue; /* Should be --Button-color */
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

## Configuration

The rule accepts a boolean value:

- `true` - Enable the rule
- `null` or `false` - Disable the rule

## Autofix

The plugin supports stylelint's `--fix` option and will automatically correct invalid custom property prefixes:

```bash
stylelint "**/*.module.css" --fix
```

## License

MIT
