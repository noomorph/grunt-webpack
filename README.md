# grunt-webpack-zombie-edition
[![Build Status](https://travis-ci.org/noomorph/grunt-webpack-zombie-edition.svg?branch=master)](https://travis-ci.org/noomorph/grunt-webpack-zombie-edition)
[![View this project on NPM](https://img.shields.io/npm/v/grunt-webpack-zombie-edition.svg)](https://npmjs.org/package/grunt-webpack-zombie-edition)
[![View this project on NPM](https://img.shields.io/npm/dm/grunt-webpack-zombie-edition.svg)](https://npmjs.org/package/grunt-webpack-zombie-edition)

This a fork of [1.0 branch of grunt-webpack](https://github.com/webpack-contrib/grunt-webpack/tree/1.0).

The main difference here is that I try to keep everything I can alive between task runs. On one of my projects I achieved 2s time gain (4s vs 6s).

## Getting Started

Install this grunt plugin next to your project's [Gruntfile.js](http://gruntjs.com/getting-started) with: `npm install grunt-webpack --save-dev`

Then add this line to your project's `Gruntfile.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-webpack');
```

## Tasks

There are two tasks available
- `webpack`.
- `webpack-dev-server`: see [webpack-dev-server doc](http://webpack.github.io/docs/webpack-dev-server.html#api) for available options.

## Configuration Example

``` javascript
webpack: {
  someName: {
	// webpack options
	entry: "./client/lib/index.js",
	output: {
		path: "asserts/",
		filename: "[hash].js",
	},

	stats: {
		// Configure the console output
		colors: false,
		modules: true,
		reasons: true
	},
	// stats: false disables the stats output

	storeStatsTo: "xyz", // writes the status to a variable named xyz
	// you may use it later in grunt i.e. <%= xyz.hash %>

	progress: false, // Don't show progress
	// Defaults to true

	failOnError: false, // don't report error to grunt if webpack find errors
	// Use this if webpack errors are tolerable and grunt should continue

	watch: true, // use webpacks watcher
	// You need to keep the grunt process alive

	watchOptions: {
		aggregateTimeout: 500,
		poll: true
	},
	// Use this when you need to fallback to poll based watching (webpack 1.9.1+ only)

	keepalive: true, // don't finish the grunt task
	// Use this in combination with the watch option

	inline: true,  // embed the webpack-dev-server runtime into the bundle
	// Defaults to false

	hot: true, // adds the HotModuleReplacementPlugin and switch the server to hot mode
	// Use this in combination with the inline option

  },
  anotherName: {...}
}
```

`grunt-webpack` uses the [webpack options](http://webpack.github.io/docs/configuration.html).

## License

Copyright (c) 2012-2017 Tobias Koppers @sokra

Copyright (c) 2017- Yaroslav Serhieiev @noomorph

Licensed under the MIT license.
