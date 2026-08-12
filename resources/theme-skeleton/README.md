# Baseline PorterWP starter theme

Baseline is a complete block-theme starting point for PorterWP projects. Copy it into a new theme directory, replace its starter identity and keep the resulting theme in the project's own repository.

## Requirements

- PorterWP Premium 1.4.95 or newer
- WordPress 6.4 or newer, tested through 7.0.3
- PHP 8.2 or newer
- Node.js 22 or 24 LTS for development builds
- ACF PRO 6.6 or newer for the starter's ACF Blocks v3 scaffold

The starter scaffold opts into ACF Blocks v3, which requires ACF PRO 6.6 or newer. PorterWP's post types, taxonomies, assets, PHP loader, caching, and other non-ACF features continue to work when an optional ACF API is unavailable.

## Project setup

1. Rename the copied theme directory.
2. Replace the starter identity throughout the theme. Search for both `Baseline` and `baseline`, then update the theme name, text domain, PHP package and namespaces, block categories and pattern slug. Keep the namespace portions valid PHP identifiers.
3. Replace the starter URLs, description and package metadata in `style.css` and `package.json`.
4. Adjust the palette, typography, spacing, templates, and parts in `theme.json` and the theme root.
5. Review every JSON file under `porter/config`.
6. Install dependencies and build the runtime assets:

   ```bash
   npm ci
   npm test
   ```

7. Install and activate PorterWP Premium. Install ACF PRO when the project uses custom ACF blocks or option pages.
8. Activate the theme and check the frontend, Site Editor, block editor, archives, search, and 404 template.

Use `npm install` instead of `npm ci` only when intentionally changing development dependencies. Commit the resulting `package-lock.json` with `package.json`.

## Directory guide

```text
assets/                 Sass, JavaScript, build helpers, and compiled assets
parts/                  Header and footer block template parts
patterns/               Theme-owned block patterns
porter/blocks/          Theme-owned ACF blocks and the block scaffolder
porter/config/          PorterWP JSON configuration
porter/inc/             Theme PHP loaded by PorterWP on init
templates/              Block templates, including the required index.html
functions.php           Early theme hooks only
style.css               WordPress theme metadata
theme.json              WordPress settings, styles, and design tokens
```

PorterWP loads readable PHP beneath `porter/inc` on `init` priority 3. Put filters that change `porter_wp_config_filepath`, `porter_wp_inc_filepath`, exclusions, or load-first entries in the root `functions.php`, an MU plugin, or an earlier plugin. A callback inside `porter/inc` is too late to control the scan that loads it.

Do not put browser-addressable files such as JavaScript, CSS, images, documents or uploads under `porter/inc`. Its PHP loader recursively discovers readable `.php` files there; keep runtime assets under the theme-root `assets` directory or beside an ACF block under `porter/blocks`.

## Configuration workflow

- Use `porter/config/porter.json` for theme supports, public assets, editor assets, and premium feature switches.
- Use `posttypes.json` and `taxonomies.json` for the project's content model. For a PorterWP taxonomy, its `object_type` value is the authoritative relationship.
- Use `blocks.json` for discovery folders, custom styles, patterns, and block visibility.
- Use `acf.json` for option pages and standalone local field groups.
- Keep all files as strict JSON. Comments belong in project documentation, not in the configuration files.

Premium filters are disabled by default so projects that do not use the Filters block do not load its query parser. Set `premium.filters` to `true` when the project implements PorterWP premium filters.

The starter also leaves public scripts, public styles, and editor styles unregistered until the project adds real code. The build still prepares the conventional files under `assets/dist`. Add project-specific handles to `porter.json` only when those files contain runtime behaviour or styles, which avoids empty HTTP requests in a new theme.

The top-level `version` values are useful deployment markers. PorterWP also signs relevant file paths and metadata, so a normal file edit invalidates its cached configuration. Use **Settings > PorterWP > Clear Cache** if a deployment deliberately preserves timestamps and other metadata.

## Create an ACF block

From `porter/blocks` run:

```bash
./make.sh testimonial components
```

The portable Bash scaffolder validates the slug and category, rejects duplicate block names or callback namespaces, stages a copy of `_block-base`, and replaces its placeholders before moving the finished block into place. Then:

1. Review the generated `block.json` metadata and PHP namespace.
2. Add the block's ACF local JSON under an `acf-json` directory.
3. Implement its render data and template.
4. Run `npm run build` to compile the block CSS.
5. Confirm the category directory is listed in `blocks.settings.folders`.

New blocks use WordPress block API v3 and ACF Blocks v3. The template escapes output by context. Treat the legacy `build_block_class_attrs()` helper as trusted-input-only and do not pass request or unescaped field data to it.

The optional block CSS and `js/block.js` placeholders are not loaded by default. After adding real code, reference the registered `{block-slug}-block-css` handle and the appropriate WordPress script field in `block.json`.

## Build commands

```bash
npm run build              # Generate colors and compile production assets
npm run build:development  # Build with source maps for local debugging
npm run watch              # Build once, then watch source files
npm run clean              # Remove generated assets owned by the build
npm test                   # Validate, build, and verify production output
```

Theme-owned runtime assets use the theme version for browser cache busting. Bump the `Version` header in `style.css` for a production release that changes compiled CSS or JavaScript.

## Environment and deployment

Set the WordPress environment explicitly outside production:

```php
if ( ! defined( 'WP_ENVIRONMENT_TYPE' ) ) {
    define( 'WP_ENVIRONMENT_TYPE', 'development' );
}
```

PorterWP reuses persistent theme configuration and discovery data only in production. Local, development, and staging environments rebuild it so file changes appear immediately.

Before deployment:

1. Run `npm ci` and `npm test` from a clean checkout.
2. Package the compiled CSS and JavaScript used by the theme. The copied theme may commit production output when its deployment consumes build artifacts from version control; source maps remain ignored.
3. Confirm the `style.css` version and project metadata.
4. Validate the JSON config and test both editor and frontend requests.
5. Exercise custom archives, premium filters, cron-backed status helpers, and any theme-owned integrations.

No manual permalink save is normally required after a PorterWP configuration change. PorterWP coordinates one soft rewrite flush on a later ordinary request when the registered configuration signature changes.

## Further reading

- [PorterWP documentation](https://whoisandywhite.gitbook.io/porterwp)
- [WordPress Theme Handbook](https://developer.wordpress.org/themes/)
- [ACF Blocks v3](https://www.advancedcustomfields.com/resources/acf-blocks-v3/)
