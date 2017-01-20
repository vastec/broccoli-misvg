'use strict';

var fs = require('fs');
var path = require('path');
var objectAssign = require('object-assign');
var mkdirp = require('mkdirp');
var Plugin = require('broccoli-caching-writer');
var helpers = require('broccoli-kitchen-sink-helpers');
var svgstore = require('misvg');
var babel = require('babel-core');
var es2015 = require('babel-preset-es2015');

var defaultSettings = {
	outputFile: '/svg-sprites.js',
	annotation: 'misvg plugin',
	misvgOptions: {}
};

// TOOD: Perhaps be a bit more robust (and thus, more explicit about the proper API) with validation
var validationErrorPrefix = 'Expected a non-falsey argument for `_inputNode`, got ';

function MisvgPlugin(_inputNode, _options) {
	if (!(this instanceof MisvgPlugin)) {
		return new MisvgPlugin(_inputNode, _options);
	}

	var options = objectAssign({}, defaultSettings, _options);

	if (options.name) {
		this._name = options.name;
	} else {
		this._name = (this.constructor && this.constructor.name) ? this.constructor.name : 'MisvgSprites';
	}
	this._annotation = options.annotation;
	this._options = options;

	var label = this._name + ' (' + this._annotation + ')';
	if (!_inputNode) {
		throw new TypeError(label + ': ' + validationErrorPrefix + _inputNode);
	}

	var inputNodes = Array.isArray(_inputNode) ? _inputNode : [_inputNode];

	Plugin.call(this, inputNodes, this._options);
}

MisvgPlugin.prototype = Object.create(Plugin.prototype);
MisvgPlugin.prototype.constructor = MisvgPlugin;
MisvgPlugin.prototype.description = 'misvg';

/**
 * Overrides broccoli-plugin's `build' function.
 * @see: https://github.com/broccolijs/broccoli-plugin#pluginprototypebuild
 */
MisvgPlugin.prototype.build = function () {
	var svgOutput = svgstore(this._options.misvgOptions);

	try {
		// iterate through `inputPaths` of our `inputNodes` (`inputPaths` is an array of
		// paths on disk corresponding to each node in `inputNodes`)
		for (var i = 0, l = this.inputPaths.length; i < l; i++) {
			var srcDir = this.inputPaths[i];
			var inputFiles = helpers.multiGlob(['**/*.svg'], {cwd: srcDir});

			for (var j = 0, ll = inputFiles.length; j < ll; j++) {
				var inputFileName = inputFiles[j];
				var inputFilePath = path.join(srcDir, inputFileName);
				var stat = fs.statSync(inputFilePath);

				if (stat && stat.isFile()) {
					var fileNameWithoutExtension = inputFileName.replace(/\.[^.]+$/, '');
					var fileContent = fs.readFileSync(inputFilePath, {encoding: 'utf8'});

					svgOutput.add(fileNameWithoutExtension, fileContent);
				}
			}
		}
	} catch (err) {
		if (!err.message.match('did not match any files')) {
			throw err;
		}
	}

	helpers.assertAbsolutePaths([this.outputPath]); // ❓❓ QUESTION: Necessary?

	var outputDestination = path.join(this.outputPath, this._options.outputFile);

	mkdirp.sync(path.dirname(outputDestination));

	var sprites = 'var MISVG_STORE = ' + svgOutput.getObjectString() + ';';
	var result = babel.transform(sprites, {
		presets: [es2015]
	});

	return fs.writeFileSync(outputDestination, result.code);
};

module.exports = MisvgPlugin;
