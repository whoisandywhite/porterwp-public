# PorterWP public resources

This repository contains the public starter theme for [PorterWP](https://porterwp.com/), a developer toolkit for building schema-driven WordPress block themes.

The starter is intended to be copied and adapted for a project. It provides a working block-theme structure, PorterWP configuration files, an ACF block scaffold, and a small Gulp build pipeline. It is not a parent theme and projects should not depend on this repository at runtime.

## Current compatibility target

| Component | Version |
| --- | --- |
| PorterWP Premium | 1.4.95 or newer |
| WordPress | 6.4 or newer |
| Tested through | 7.0.3 |
| PHP | 8.2 or newer |
| ACF | ACF PRO 6.6+ for the starter's ACF Blocks v3 scaffold |
| Development build | Node.js 22 or 24 LTS |

The block scaffold opts into ACF Blocks v3, which requires ACF PRO 6.6 or newer. PorterWP keeps unrelated features running when an optional ACF API is unavailable. See the [PorterWP documentation](https://whoisandywhite.gitbook.io/porterwp) for the precise dependency behavior.

## Start a theme

Copy `resources/theme-skeleton` into `wp-content/themes` under a project-specific folder name:

```bash
cp -R resources/theme-skeleton /path/to/wordpress/wp-content/themes/client-theme
cd /path/to/wordpress/wp-content/themes/client-theme
npm ci
npm test
```

Before activating the theme:

1. Search the copied theme for both `Baseline` and `baseline`, then replace the starter identity across metadata, text domains, PHP packages and namespaces, block categories, and the pattern slug. Keep namespace portions valid PHP identifiers.
2. Replace the URLs, description, text domain, and version in `style.css`.
3. Update the package name and repository fields in `package.json`.
4. Review the design tokens in `theme.json`.
5. Review every file in `porter/config` and enable only the features the project needs.
6. Replace the sample block and placeholder content.
7. Package the generated runtime CSS and JavaScript required by the deployed theme. This public resources repository ignores generated output, but the copied theme's own ignore file allows production artifacts to be committed when its deployment consumes them from version control.

The detailed setup and directory guide is in the [theme skeleton README](resources/theme-skeleton/README.md).

## PorterWP configuration

The starter keeps project configuration under `porter/config`:

| File | Purpose |
| --- | --- |
| `porter.json` | Theme supports, public and editor assets, and premium feature switches. |
| `blocks.json` | Block discovery, styles, patterns, and block visibility. |
| `posttypes.json` | Custom post types and optional local ACF field groups. |
| `taxonomies.json` | Custom taxonomies and their post-type relationships. |
| `acf.json` | ACF option pages and standalone local field groups. |

Theme PHP belongs under `porter/inc`. Filters that control the config or include paths must be registered earlier in the theme's root `functions.php`.

## Development commands

Run these commands from `resources/theme-skeleton`, or from the copied theme root:

```bash
npm ci
npm run watch
npm test
```

The build compiles theme and block Sass, prepares global JavaScript, generates block-style source stubs, and creates placeholder post-type icons. `npm test` validates the source, performs a production build, and verifies the generated output without requiring a WordPress database.

The starter does not enqueue its empty global asset placeholders. Add project-specific handles to `porter/config/porter.json` after adding real CSS or JavaScript.

Set `WP_ENVIRONMENT_TYPE` to `local`, `development`, or `staging` while building. PorterWP reuses its persistent configuration and discovery caches only in `production`.

## Documentation

- [PorterWP documentation](https://whoisandywhite.gitbook.io/porterwp)
- [PorterWP block helper API](https://whoisandywhite.gitbook.io/porterwp/block-helper-api)
- [WordPress block theme handbook](https://developer.wordpress.org/themes/)
- [ACF block documentation](https://www.advancedcustomfields.com/resources/acf-blocks-v3/)

## Licence

The starter theme is provided under the GNU General Public License v3 or later. Review the licence of every third-party asset added to a project.
 
