'use strict';

const path = require('path');
const {expect} = require('chai');
const Plugin = require('broccoli-caching-writer');
const MisvgPlugin = require('..');

const SOURCE_DIR_GROUP_1 = path.normalize('test/fixtures');

const OUTPUT_FILE = path.normalize('test');
const ANNOTATION = 'testing plugin';

const DEFAULT_OPTS = {
	annotation: ANNOTATION,
	outputFile: OUTPUT_FILE
};

// KEY ids on their unique source file paths
const ID_MANIFEST = {};
ID_MANIFEST[SOURCE_DIR_GROUP_1] = ['icon-circles', 'icon-triangle', 'icon-star', 'icon-spark'];

let svgProcessor;
let builder;

describe('MisvgPlugin', () => {
	afterEach(() => {
		if (builder) {
			return builder.cleanup();
		}
	});

	describe('construction', () => {
		it('extends `broccoli-caching-writer`', () => {
			svgProcessor = new MisvgPlugin([SOURCE_DIR_GROUP_1], DEFAULT_OPTS);
			expect(svgProcessor).to.be.an.instanceof(Plugin);
		});

		it('throws on falsey `inputNodes`', () => {
			function TestProcessor(inputNodes, options) {
				options = options || DEFAULT_OPTS;
				MisvgPlugin.call(this, inputNodes, options);
			}

			TestProcessor.prototype = Object.create(MisvgPlugin.prototype);
			TestProcessor.prototype.constructor = TestProcessor;
			TestProcessor.prototype.build = function () {};

			const errorMsgPrefix = 'TestProcessor (' + ANNOTATION + '): Expected a non-falsey argument for `_inputNode`, got ';

			expect(() => {
				new TestProcessor();
			}).to.throw(TypeError, errorMsgPrefix + 'undefined');

			expect(() => {
				new TestProcessor(null);
			}).to.throw(TypeError, errorMsgPrefix + 'null');

			expect(() => {
				new TestProcessor(undefined);
			}).to.throw(TypeError, errorMsgPrefix + 'undefined');

			expect(() => {
				new TestProcessor(false);
			}).to.throw(TypeError, errorMsgPrefix + 'false');
		});
	});
});

