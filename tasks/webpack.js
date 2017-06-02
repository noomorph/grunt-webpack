module.exports = function gruntWebpackTask(grunt) {
  var partial = require("lodash/partial");
  var merge = require("lodash/merge");
  var mergeWith = require("lodash/mergeWith");
  var forEach = require("lodash/forEach");
  var map = require("lodash/map");
  var isString = require("lodash/isString");
  var isArray = require("lodash/isArray");

  var path = require("path");
  var webpack = require("webpack");
  var CachePlugin = require("webpack/lib/CachePlugin");
  var ProgressPlugin = require("webpack/lib/ProgressPlugin");

  var targetCachePlugins = {};
  var targetDependencies = {};
  var targetDoneCallbacks = {};
  var targetCompilers = {};

  grunt.registerMultiTask('webpack', 'Webpack files.', function() {
    var target = this.target;

    targetDoneCallbacks[target] = this.async();

    if (!targetCompilers.hasOwnProperty(target)) {
      targetCompilers[target] = configureAndRunCompiler({
        name: this.name,
        target: target,
      });
    }
  });

  function configureAndRunCompiler(scope) {
    var name = scope.name,
        target = scope.target;

    var options = prepareOptions({
      name: name,
      target: target,
      getWithPlugins: require("../src/getWithPlugins")(grunt),
      mergeCustomizer: require("../src/mergeCustomizer")
    });

    var watch = options[0].watch;
    var cache = watch ? false : options[0].cache;
    if (cache) {
      options.forEach(function(o) {
        o.cache = false;
      });
    }

    var compiler = webpack(options);

    applyPlugins({
      cache: options[0].cache,
      compiler: compiler,
      progress: options[0].progress,
      target: target,
    });

    var onCompletedCallback = partial(onWebpackCompleted, {
      cache: cache,
      compiler: compiler,
      done: function(err) {
        targetDoneCallbacks[target](err);
        targetDoneCallbacks[target] = function() {};
      },
      failOnError: options[0].failOnError,
      statsOptions: options[0].stats,
      storeStatsTo: options[0].storeStatsTo,
      target: target,
    });

    if (watch) {
      // watchDelay and 0 are for backwards compatibility with webpack <= 1.9.0
      // remove with next major and bump to v1.9.1 / v2
      compiler.watch(options[0].watchOptions || options[0].watchDelay || 0, onCompletedCallback);
    } else {
      compiler.run(onCompletedCallback);
    }
  }

  function prepareOptions(scope) {
    var name = scope.name,
      target = scope.target,
      getWithPlugins = scope.getWithPlugins,
      mergeCustomizer = scope.mergeCustomizer;

    var options = mergeWith({
        x: {
          context: ".",
          output: {
            path: "."
          },
          progress: true,
          stats: {},
          failOnError: true
        }
      }, {
        x: getWithPlugins([name, "options"])
      }, {
        x: getWithPlugins([name, target])
      },
      mergeCustomizer
    ).x;

    options = isArray(options) ? options : [options];

    options.forEach(function(o) {
      convertPathsForObject(o, ["context", "recordsPath", "recordsInputPath", "recordsOutputPath"]);
      convertPathsForObject(o.output, ["path"]);
      convertPathsForObject(o.resolve, ["root", "fallback"]);
      convertPathsForObject(o.resolveLoader, ["root", "fallback"]);
      convertPathsForArrayOfObjects(o.module && o.module.loaders, ["test", "include", "exclude"]);
    });

    return options;
  }

  function applyPlugins(scope) {
    var cache = scope.cache,
      compiler = scope.compiler,
      progress = scope.progress,
      target = scope.target;

    if (cache) {
      var theCachePlugin = targetCachePlugins[target];

      if (!theCachePlugin) {
        theCachePlugin = targetCachePlugins[target] = new CachePlugin();
      }

      compiler.apply(theCachePlugin);

      if (targetDependencies[target]) {
        compiler._lastCompilationFileDependencies = targetDependencies[target].file;
        compiler._lastCompilationContextDependencies = targetDependencies[target].context;
      }
    }

    if (progress) {
      var onProgressCallback = partial(onWebpackProgress, { chars: 0 });
      var progressPlugin = new ProgressPlugin(onProgressCallback);
      compiler.apply(progressPlugin);
    }
  }

  function onWebpackCompleted(scope, err, stats) {
    var cache = scope.cache,
        compiler = scope.compiler,
        done = scope.done,
        failOnError = scope.failOnError,
        statsOptions = scope.statsOptions,
        storeStatsTo = scope.storeStatsTo,
        target = scope.target;

    if (err) {
      return done(err);
    }

    if (cache) {
      targetDependencies[target] = {
        file: compiler._lastCompilationFileDependencies,
        context: compiler._lastCompilationContextDependencies
      };
    }

    if (statsOptions || stats.hasErrors()) {
      grunt.log.notverbose.writeln(stats.toString(merge({
        colors: true,
        hash: false,
        timings: false,
        assets: true,
        chunks: false,
        chunkModules: false,
        modules: false,
        children: true
      }, statsOptions)));
      grunt.verbose.writeln(stats.toString(merge({
        colors: true
      }, statsOptions)));
    }
    if (typeof storeStatsTo === "string") {
      grunt.config.set(storeStatsTo, stats.toJson());
    }
    if (failOnError && stats.hasErrors()) {
      return done(false);
    }

    done();
  }

  function onWebpackProgress(scope, percentage, msg) {
    var chars = scope.chars;

    if (percentage < 1) {
      percentage = Math.floor(percentage * 100);
      msg = percentage + "% " + msg;
      if (percentage < 100) msg = " " + msg;
      if (percentage < 10) msg = " " + msg;
    }
    for (; chars > msg.length; chars--)
      grunt.log.write("\b \b");
    chars = msg.length;
    for (var i = 0; i < chars; i++)
      grunt.log.write("\b");
    grunt.log.write(msg);

    scope.chars = chars;
  }

  function convertPathsForObject(obj, props) {
    if (obj) {
      props.forEach(function(prop) {
        if (obj[prop] != undefined) {
          obj[prop] = convertPath(obj[prop]);
        }
      });
    }
  }

  function convertPathsForArrayOfObjects(objects, props) {
    if (isArray(objects)) {
      forEach(objects, function(obj) {
        convertPathsForObject(obj, props);
      });
    }
  }

  function convertPath(pth) {
    if (isString(pth)) {
      return path.resolve(process.cwd(), pth);
    } else if (isArray(pth)) {
      return map(pth, convertPath);
    } else {
      return pth; // It may have been a RegExp so just send it back
    }
  }
};
