'use strict';

var path = require('path');
var expect = require('chai').expect;
var Plugin = require('broccoli-caching-writer');
var MisvgPlugin = require('..');

var SOURCE_DIR_GROUP_1 = path.normalize('test/fixtures');

var OUTPUT_FILE = path.normalize('test');
var ANNOTATION = 'testing plugin';

var DEFAULT_OPTS = {
	annotation: ANNOTATION,
	outputFile: OUTPUT_FILE
};

// KEY ids on their unique source file paths
var ID_MANIFEST = {};
ID_MANIFEST[SOURCE_DIR_GROUP_1] = ['icon-circles', 'icon-triangle', 'icon-star', 'icon-spark'];

var svgProcessor;
var builder;

describe('MisvgPlugin', function () {
	afterEach(function () {
		if (builder) {
			return builder.cleanup();
		}
	});

	describe('construction', function () {
		it('extends `broccoli-caching-writer`', function () {
			svgProcessor = new MisvgPlugin([SOURCE_DIR_GROUP_1], DEFAULT_OPTS);
			expect(svgProcessor).to.be.an.instanceof(Plugin);
		});

		it('throws on falsey `inputNodes`', function () {
			function TestProcessor(inputNodes, options) {
				options = options || DEFAULT_OPTS;
				MisvgPlugin.call(this, inputNodes, options);
			}

			TestProcessor.prototype = Object.create(MisvgPlugin.prototype);
			TestProcessor.prototype.constructor = TestProcessor;
			TestProcessor.prototype.build = function () {};

			var errorMsgPrefix = 'TestProcessor (' + ANNOTATION + '): Expected a non-falsey argument for `_inputNode`, got ';

			expect(function () {
				new TestProcessor();
			}).to.throw(TypeError, errorMsgPrefix + 'undefined');

			expect(function () {
				new TestProcessor(null);
			}).to.throw(TypeError, errorMsgPrefix + 'null');

			expect(function () {
				new TestProcessor(undefined);
			}).to.throw(TypeError, errorMsgPrefix + 'undefined');

			expect(function () {
				new TestProcessor(false);
			}).to.throw(TypeError, errorMsgPrefix + 'false');
		});
	});
});

