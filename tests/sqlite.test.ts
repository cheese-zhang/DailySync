import { decryptSession, encryptSession } from '../src/utils/sqlite';

describe('session encryption', () => {
    it('round-trips a session when AESKEY is set', () => {
        jest.resetModules();
        process.env.AESKEY = 'test-key';
        const m = require('../src/utils/sqlite');
        const session = { token: 'abc', n: 1 };
        expect(m.decryptSession(m.encryptSession(session))).toEqual(session);
        delete process.env.AESKEY;
    });

    it('refuses to encrypt without AESKEY', () => {
        delete process.env.AESKEY;
        expect(() => encryptSession({ a: 1 })).toThrow('AESKEY');
        expect(() => decryptSession('x')).toThrow('AESKEY');
    });
});