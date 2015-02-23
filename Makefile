default: view

build:
	jekyll build

view:
	jekyll serve

preview:
	jekyll serve --drafts --watch
