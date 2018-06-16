'use strict';

const fs = require('fs');
const path = require('path');
const objectAssign = require('object-assign');
const mkdirp = require('mkdirp');
const Plugin = require('broccoli-caching-writer');
const helpers = require('broccoli-kitchen-sink-helpers');
const svgstore = require('misvg');
const babel = require('babel-core');
const es2015 = require('babel-preset-es2015');

const defaultSettings = {
	outputFile: '/svg-sprites.js',
	annotation: 'misvg plugin',
	misvgOptions: {}
};

// TOOD: Perhaps be a bit more robust (and thus, more explicit about the proper API) with validation
const validationErrorPrefix = 'Expected a non-falsey argument for `_inputNode`, got ';

function MisvgPlugin(_inputNode, _options) {
	if (!(this instanceof MisvgPlugin)) {
		return new MisvgPlugin(_inputNode, _options);
	}

	const options = objectAssign({}, defaultSettings, _options);

	if (options.name) {
		this._name = options.name;
	} else {
		this._name = (this.constructor && this.constructor.name) ? this.constructor.name : 'MisvgSprites';
	}
	this._annotation = options.annotation;
	this._options = options;

	const label = this._name + ' (' + this._annotation + ')';
	if (!_inputNode) {
		throw new TypeError(label + ': ' + validationErrorPrefix + _inputNode);
	}

	const inputNodes = Array.isArray(_inputNode) ? _inputNode : [_inputNode];

	Plugin.call(this, inputNodes, this._options);
}

MisvgPlugin.prototype = Object.create(Plugin.prototype);
MisvgPlugin.prototype.constructor = MisvgPlugin;
MisvgPlugin.prototype.description = 'misvg';

/**
 * Overrides broccoli-plugin's `build' function.
 * @see: https://github.com/broccolijs/broccoli-plugin#pluginprototypebuild
 * @returns {*}
 */
MisvgPlugin.prototype.build = function () {
	const svgOutput = svgstore(this._options.misvgOptions);

	try {
		// Iterate through `inputPaths` of our `inputNodes` (`inputPaths` is an array of
		// paths on disk corresponding to each node in `inputNodes`)
		for (let i = 0, l = this.inputPaths.length; i < l; i++) {
			const srcDir = this.inputPaths[i];
			const inputFiles = helpers.multiGlob(['**/*.svg'], {cwd: srcDir});

			for (let j = 0, ll = inputFiles.length; j < ll; j++) {
				const inputFileName = inputFiles[j];
				const inputFilePath = path.join(srcDir, inputFileName);
				const stat = fs.statSync(inputFilePath);

				if (stat && stat.isFile()) {
					const fileNameWithoutExtension = inputFileName.replace(/\.[^.]+$/, '');
					const fileContent = fs.readFileSync(inputFilePath, {encoding: 'utf8'});

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

	const outputDestination = path.join(this.outputPath, this._options.outputFile);

	mkdirp.sync(path.dirname(outputDestination));

	const sprites = 'let MISVG_STORE = ' + svgOutput.getObjectString() + ';';
	const result = babel.transform(sprites, {
		presets: [es2015]
	});

	return fs.writeFileSync(outputDestination, result.code);
};

module.exports = MisvgPlugin;
