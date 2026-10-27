# artuskg.github.io

Source of [artus.ai](https://artus.ai). GitHub Pages builds it from `master` with its classic branch build.

Posts go in `_posts/` as `YYYY-MM-DD-slug.md`, with `title`, `description`, `categories` and `tags` in the front matter.

## Theme

The [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme is copied into this repository, because the classic build accepts only its own themes and whitelisted plugins. `tools/vendor-chirpy.sh VERSION` refreshes the copy and precompiles the theme's stylesheet; afterwards, re-apply the patches marked "Classic GitHub Pages build". Site styles go in `assets/css/custom.scss`.

## Local preview

```sh
docker run --rm -p 127.0.0.1:4000:4000 -v "$PWD":/srv/site -w /srv/site \
  -e BUNDLE_PATH=vendor/bundle ruby:3.3 \
  sh -c 'bundle install && bundle exec jekyll serve --host 0.0.0.0'
```
