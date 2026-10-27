# frozen_string_literal: true

source "https://rubygems.org"

# The versions GitHub Pages' classic build uses: https://pages.github.com/versions/
gem "github-pages", "~> 232", group: :jekyll_plugins

gem "html-proofer", "~> 5.0", group: :test

platforms :windows, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

gem "wdm", "~> 0.2.0", :platforms => [:windows]
