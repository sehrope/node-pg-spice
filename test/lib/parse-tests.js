var _ = require('lodash');
var assert = require('assert');

module.exports = function(spice) {
  function testValid(opts) {
    var sql = opts.sql,
        expectedSql = opts.expectedSql || sql,
        values = opts.values || {},
        expectedNumParams = opts.expectedNumParams || _.size(_.keys(opts.values));
    it('should match the expected parsed SQL', function() {
      var parsed = spice.parseSql(sql);
      assert.equal(parsed.sql, expectedSql);
    });

    it('should match the expected number of parameters', function() {
      var parsed = spice.parseSql(sql),
          params = spice.convertParamValues(parsed, values);
      assert.equal(params.length, expectedNumParams);
    });
  }

  function testInvalid(opts) {
    var text = opts.name || 'should throw an error',
        sql = opts.sql,
        values = opts.values || {};
    it(text, function() {
      assert.throws(function() {
        var parsed = spice.parseSql(sql),
            params = spice.convertParamValues(parsed, values);
      });
    });
  }

  describe('Parse SQL without parameters', function() {
    testValid({
      sql: 'SELECT 1'
    });
  });

  describe('Parse SQL with :foo style parameters', function() {
    testValid({
      sql: 'SELECT :foo',
      values: { foo: 'foo' },
      expectedSql: 'SELECT $1'
    });
  });

  describe('Parse SQL with :{foo} style parameters', function() {
    testValid({
      sql: 'SELECT :{foo}',
      values: { foo: 'foo' },
      expectedSql: 'SELECT $1'
    });
  });

  describe('Parse SQL with $foo style parameters', function() {
    testValid({
      sql: 'SELECT $foo',
      values: { foo: 'foo' },
      expectedSql: 'SELECT $1'
    });
  });

  describe('Parse SQL with multiple :foo style parameters', function() {
    testValid({
      sql: 'SELECT :foo, :bar\nFROM some_table WHERE :baz',
      values: { foo: 'foo', bar: 'bar', 'baz': 'baz' },
      expectedSql: 'SELECT $1, $2\nFROM some_table WHERE $3'
    });
  });

  describe('Parse SQL with multiple of the same :foo style parameters', function() {
    testValid({
      sql: "SELECT :foo, :foo, :bar, :foo\nFROM some_table WHERE :baz AND :foo == 'foo'",
      values: { foo: 'foo', bar: 'bar', 'baz': 'baz' },
      expectedSql: "SELECT $1, $1, $2, $1\nFROM some_table WHERE $3 AND $1 == 'foo'"
    });
  });

  describe('Parse SQL missing parameter value', function() {
    testInvalid({
      sql: 'SELECT :foo',
      values: {}
    });
  });

  describe('Parse SQL with existing numbered parameters', function() {
    testInvalid({
      sql: 'SELECT :foo, $1',
      values: {foo: 'foo', '1': 'bad value'}
    });
  });

  describe('Parse SQL with incomplete parameter name', function() {
    testInvalid({
      sql: 'SELECT :{foobar',
      values: {"foobar": "bad value"}
    });
  });

  describe('Parse SQL parameters in C (/* ... */) style comment block', function() {
    testValid({
      sql: 'SELECT /* :foo :{bar} $baz */ 1',
      values: {}
    });

    testValid({
      sql: 'SELECT /* :foo :{bar} $baz */ 1, :bam',
      values: {bam: 'bam'},
      expectedSql: 'SELECT /* :foo :{bar} $baz */ 1, $1',
    });
  });

  describe('Parse SQL parameters in C (/* ... */) style comment block', function() {
    testValid({
      sql: 'SELECT \n-- :foo :{bar} $baz\n 1',
      values: {}
    });

    testValid({
      sql: 'SELECT \n-- :foo :{bar} $baz\n 1, :bam',
      values: {bam: 'bam'},
      expectedSql: 'SELECT \n-- :foo :{bar} $baz\n 1, $1'
    });
  });

  describe('Parse SQL parameters in single quoted string', function() {
    testValid({
      sql: "SELECT ':foo :{bar} $baz'",
      values: {}
    });

    testValid({
      sql: "SELECT ':foo :{bar} $baz', :bam",
      values: {bam: 'bam'},
      expectedSql: "SELECT ':foo :{bar} $baz', $1"
    });
  });

  describe('Parse SQL parameters in double quoted string', function() {
    testValid({
      sql: 'SELECT ":foo :{bar} $baz"',
      values: {}
    });

    testValid({
      sql: 'SELECT ":foo :{bar} $baz", :bam',
      values: {bam: 'bam'},
      expectedSql: 'SELECT ":foo :{bar} $baz", $1',
    });
  });

  describe('Parse SQL with multiple types of parameters', function() {
    testInvalid({
      sql: 'SELECT :foo, $bar, :{baz}',
      values: {"foo": 1, "bar": 2, "baz": 3}
    });
  });
}