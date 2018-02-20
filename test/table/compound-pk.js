'use strict';

describe('compound primary keys', function () {
  let db;

  before(function () {
    return resetDb('compound-pk').then(instance => db = instance);
  });

  after(function () {
    return db.instance.$pool.end();
  });

  it('finds', function () {
    return db.compoundpk.findOne().then(res => {
      assert.isOk(res);
      assert.isTrue(res.hasOwnProperty('key_one'));
      assert.isTrue(res.hasOwnProperty('key_two'));
      assert.isTrue(res.hasOwnProperty('value'));
    });
  });

  it('inserts', function () {
    return db.compoundpk.insert({
      key_one: 123,
      key_two: 456,
      value: 'hi'
    }).then(res => {
      assert.isOk(res);
      assert.equal(res.key_one, 123);
      assert.equal(res.key_two, 456);
      assert.equal(res.value, 'hi');
    });
  });

  it('deep inserts', function* () {
    const res = yield db.compoundpk.insert({
      key_one: 234,
      key_two: 567,
      value: 'deep insert test',
      junction: [{
        c_key_one: undefined,
        c_key_two: undefined,
        value: 'other side'
      }]
    });

    assert.isOk(res);
    assert.equal(res.key_one, 234);
    assert.equal(res.key_two, 567);
    assert.equal(res.value, 'deep insert test');

    const junction = yield db.junction.findOne({value: 'other side'});

    assert.isOk(junction);
    assert.equal(junction.c_key_one, 234);
    assert.equal(junction.c_key_two, 567);
  });

  it('detects pk collisions', function () {
    return db.compoundpk.insert({
      key_one: 123,
      key_two: 456,
      value: 'hi'
    }).then(() => assert.fail()).catch(err => {
      assert.equal(err.code, 23505);
    });
  });

  it('detects missing key columns', function () {
    return db.compoundpk.insert({
      key_one: 123,
      value: 'oops'
    }).then(() => assert.fail()).catch(err => {
      assert.equal(err.code, 23502);
    });
  });

  it('updates with the single-record format', function () {
    return db.compoundpk.update({
      key_one: 123,
      key_two: 456,
      value: 'again'
    }).then(res => {
      assert.isOk(res);
      assert.equal(res.key_one, 123);
      assert.equal(res.key_two, 456);
      assert.equal(res.value, 'again');
    });
  });

  it('saves over an existing record if passed both keys', function () {
    return db.compoundpk.save({
      key_one: 123,
      key_two: 456,
      value: 'yet again'
    }).then(res => {
      assert.isOk(res);
      assert.equal(res.key_one, 123);
      assert.equal(res.key_two, 456);
      assert.equal(res.value, 'yet again');
    });
  });

  it('fails to save if a required key is missing', function () {
    return db.compoundpk.save({
      key_one: 123,
      value: 'oops'
    }).then(() => assert.fail()).catch(err => {
      assert.equal(err.code, 23502);
    });
  });

  it('saves and inserts a new record if an autogenerated key is missing', function () {
    return db.compoundserials.save({
      key_one: 123,
      value: 'try this'
    }).then(res => {
      assert.isOk(res);
      assert.equal(res.key_one, 123);
      assert.isTrue(res.key_two > 0);
      assert.equal(res.value, 'try this');
    });
  });

  it('creates one entry per column in the columns array', function () {
    const columnsAreUnique = (new Set(db.compoundpk.columns)).size === db.compoundpk.columns.length;
    assert.isTrue(columnsAreUnique);
  });
});
