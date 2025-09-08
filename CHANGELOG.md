# [2.1.0](https://github.com/simonsmith/stylelint-component-custom-property/compare/2.0.0...2.1.0) (2025-09-08)


### Features

* remove file name warnings ([d2fb6ed](https://github.com/simonsmith/stylelint-component-custom-property/commit/d2fb6edafa9fe7bfa3b975db788629e6cdc78874))

# [2.0.0](https://github.com/simonsmith/stylelint-component-custom-property/compare/1.0.1...2.0.0) (2025-09-08)


### Code Refactoring

* remove concept of "direct assignments" ([2cdf841](https://github.com/simonsmith/stylelint-component-custom-property/commit/2cdf84156105ec485efa079f79ac8c64439847b3))


### BREAKING CHANGES

* this was prevent legit use of custom properties to
override children:

```css
.root {
  position: relative;

  --SomeChild-width: 960px;
}
```

Instead we now just care about "API declarations"

## [1.0.1](https://github.com/simonsmith/stylelint-component-custom-property/compare/1.0.0...1.0.1) (2025-09-04)


### Bug Fixes

* ensure package files are built ([f1ee091](https://github.com/simonsmith/stylelint-component-custom-property/commit/f1ee0918427726fbc29702eb438b24700cf58326))

# 1.0.0 (2025-09-04)


### Bug Fixes

* ensure component name is validated correctly ([1ef167b](https://github.com/simonsmith/stylelint-component-custom-property/commit/1ef167bbd1c5d74a7ccf0e840552c2e80852fbd3))


### Features

* add suitcss validation utility ([0bb1108](https://github.com/simonsmith/stylelint-component-custom-property/commit/0bb11082001cb09b23cf9cbe1b4f595e6c1416cd))
* add support for custom properties declared as values ([00c9fa2](https://github.com/simonsmith/stylelint-component-custom-property/commit/00c9fa25c2db20a1c1f4eabfbacac88b85d7a614))
