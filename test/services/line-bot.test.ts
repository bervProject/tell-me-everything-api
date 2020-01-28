import app from '../../src/app';

describe('\'line-bot\' service', () => {
  it('registered the service', () => {
    const service = app.service('line-bot');
    expect(service).toBeTruthy();
  });
});
