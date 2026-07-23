const crypto = require('crypto');
const User = require('../models/User');
const DriverProfile = require('../models/DriverProfile');
const { seed } = require('../scripts/seedUsers');

const makePassword = () => crypto.randomBytes(24).toString('base64url');
const silentLogger = { log: jest.fn() };
const connected = jest.fn().mockResolvedValue(undefined);

const runSeed = (env) => seed({
  env,
  connect: connected,
  UserModel: User,
  DriverProfileModel: DriverProfile,
  logger: silentLogger
});

describe('seed user credential controls', () => {
  beforeEach(() => {
    connected.mockClear();
    silentLogger.log.mockClear();
  });

  test('rejects a missing seed password before connecting', async () => {
    await expect(runSeed({ NODE_ENV: 'development' })).rejects.toThrow('SEED_PASSWORD is required');
    expect(connected).not.toHaveBeenCalled();
  });

  test('preserves production protection before connecting', async () => {
    await expect(runSeed({ NODE_ENV: 'production', SEED_PASSWORD: makePassword() }))
      .rejects.toThrow('Refusing to seed production');
    expect(connected).not.toHaveBeenCalled();
  });

  test('does not log the supplied credential', async () => {
    const password = makePassword();
    await runSeed({ NODE_ENV: 'test', SEED_PASSWORD: password });

    const output = silentLogger.log.mock.calls.flat().join('\n');
    expect(output).not.toContain(password);
  });

  test('hashes a newly created seeded user exactly once and keeps it verifiable', async () => {
    const password = makePassword();
    await runSeed({ NODE_ENV: 'test', SEED_PASSWORD: password });

    const user = await User.findOne({ email: 'admin@taxify.local' }).select('+passwordHash');
    expect(user.passwordHash).not.toBe(password);
    await expect(user.comparePassword(password)).resolves.toBe(true);
  });

  test('preserves existing passwords unless reset is explicitly enabled', async () => {
    const originalPassword = makePassword();
    const replacementPassword = makePassword();

    await runSeed({ NODE_ENV: 'test', SEED_PASSWORD: originalPassword });
    await runSeed({ NODE_ENV: 'test', SEED_PASSWORD: replacementPassword });

    const user = await User.findOne({ email: 'admin@taxify.local' }).select('+passwordHash');
    await expect(user.comparePassword(originalPassword)).resolves.toBe(true);
    await expect(user.comparePassword(replacementPassword)).resolves.toBe(false);
  });

  test('hashes an explicitly authorized password reset exactly once and keeps it verifiable', async () => {
    const originalPassword = makePassword();
    const replacementPassword = makePassword();

    await runSeed({ NODE_ENV: 'test', SEED_PASSWORD: originalPassword });
    await runSeed({
      NODE_ENV: 'test',
      SEED_PASSWORD: replacementPassword,
      RESET_SEEDED_PASSWORDS: 'true'
    });

    const user = await User.findOne({ email: 'admin@taxify.local' }).select('+passwordHash');
    expect(user.passwordHash).not.toBe(replacementPassword);
    await expect(user.comparePassword(replacementPassword)).resolves.toBe(true);
    await expect(user.comparePassword(originalPassword)).resolves.toBe(false);
  });
});
