const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const {
  expect
} = chai;

describe('birthday-reminder', function() {
  beforeEach(function() {
    this.robot = {
      respond: sinon.spy(),
      hear: sinon.spy()
    };

    return require('../src/birthday-reminder')(this.robot);
  });

  it('registers a respond listener', function() {
    return expect(this.robot.respond).to.have.been.calledWith(/hello/);
  });

  return it('registers a hear listener', function() {
    return expect(this.robot.hear).to.have.been.calledWith(/orly/);
  });
});
