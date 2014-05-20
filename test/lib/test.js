module.exports = function(options) {
	// Delete from cache as the monkey patch will not apply itself twice:
	delete require.cache[require.resolve('pg.js')]
	delete require.cache[require.resolve('../../index.js')]

	// Require pg and pg-spice:
  var pg = require('pg.js');
  var spice = require('../../index.js');

  // Patch with the specified options:
	spice.patch(pg, options);

	// Run the tests:
	require('./parse-tests')(spice);
}
