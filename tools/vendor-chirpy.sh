#!/usr/bin/env bash
# Copy the Chirpy theme into this repository and precompile its stylesheet, so
# GitHub Pages' classic branch build (Jekyll 3.10, Ruby Sass, whitelisted
# plugins only) can render the site.
#
#   tools/vendor-chirpy.sh 7.6.0
#
# This overwrites the theme's layouts, includes, scripts and origin data. The
# site's own files (_data/locales/en.yml, contact.yml, share.yml, favicons,
# robots.txt, custom.scss) are left alone. Afterwards, re-apply the patches
# marked "Classic GitHub Pages build" (`git diff` shows any that were lost).
set -euo pipefail

version=${1:?usage: tools/vendor-chirpy.sh VERSION}
cd "$(dirname "$0")/.."

docker run --rm -v "$PWD":/site ruby:3.3 bash -euo pipefail -c '
  cd /tmp
  gem fetch jekyll-theme-chirpy -v "$1" >/dev/null
  gem unpack "jekyll-theme-chirpy-$1.gem" >/dev/null
  gem install --no-document sass-embedded -v 1.106.1 >/dev/null
  theme="/tmp/jekyll-theme-chirpy-$1"

  cp -R "$theme/_layouts" "$theme/_includes" /site/
  mkdir -p /site/_data/origin /site/assets/js
  cp "$theme"/_data/origin/*.yml /site/_data/origin/
  cp -R "$theme/assets/js/." /site/assets/js/
  cp "$theme/assets/404.html" "$theme/assets/feed.xml" /site/assets/
  cp "$theme/assets/img/favicons/site.webmanifest" /site/assets/img/favicons/

  # An empty theme follows the reader'"'"'s light or dark system setting.
  printf "@use \"abstracts/variables\" with (\$theme: \"\");\n@use \"main.bundle\";\n" >entry.scss
  sass --no-source-map --style=compressed --load-path="$theme/_sass" \
    entry.scss /site/assets/css/jekyll-theme-chirpy.css
' vendor-chirpy "$version"
