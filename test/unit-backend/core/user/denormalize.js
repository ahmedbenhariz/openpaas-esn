'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The user denormalize module', function() {

  describe('The denormalize function', function() {
    it('should set the document.id and remove _id and password', function() {
      var user = {_id: 1, password: '123'};
      require('mongoose');
      this.helpers.requireBackend('core/db/mongo/models/user');
      var document = this.helpers.requireBackend('core/user/denormalize').denormalize(user);
      expect(document.id).to.equal(user.id);
      expect(document.password).to.not.exist;
      expect(document._id).to.not.exist;
    });
  });

  describe('The getId function', function() {
    it('should return the document._id', function() {
      var user = {_id: 1, password: '123'};
      require('mongoose');
      this.helpers.requireBackend('core/db/mongo/models/user');
      expect(this.helpers.requireBackend('core/user/denormalize').getId(user)).to.equal(user._id);
    });
  });
});
