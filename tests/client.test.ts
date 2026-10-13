const mockInstances: any[] = [];
const mockSetFailed = jest.fn();

jest.mock('@actions/core', () => ({ setFailed: (...a: unknown[]) => mockSetFailed(...a) }));
jest.mock('garmin-connect', () => ({
    GarminConnect: jest.fn().mockImplementation((creds: unknown, domain: string) => {
        const inst = {
            creds,
            domain,
            login: jest.fn().mockResolvedValue(undefined),
            exportTokenToFile: jest.fn(),
            loadTokenByFile: jest.fn(),
            getUserProfile: jest.fn().mockResolvedValue({ userName: 'u', location: 'x' }),
        };
        mockInstances.push(inst);
        return inst;
    }),
}));

const mockExists = jest.fn();
jest.mock('fs', () => ({ ...jest.requireActual('fs'), existsSync: (...a: unknown[]) => mockExists(...a) }));

import { getGarminClient } from '../src/garmin/client';

describe('getGarminClient', () => {
    beforeEach(() => {
        mockInstances.length = 0;
        mockSetFailed.mockReset();
        mockExists.mockReset();
        process.env.GARMIN_USERNAME = 'cn-user';
        process.env.GARMIN_PASSWORD = 'cn-pass';
        process.env.GARMIN_GLOBAL_USERNAME = 'g-user';
        process.env.GARMIN_GLOBAL_PASSWORD = 'g-pass';
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });
    afterEach(() => jest.restoreAllMocks());

    it('reuses a saved token without logging in', async () => {
        mockExists.mockReturnValue(true);
        await getGarminClient('CN');
        const c = mockInstances[0];
        expect(c.domain).toBe('garmin.cn');
        expect(c.loadTokenByFile).toHaveBeenCalledWith('tokens/cn');
        expect(c.login).not.toHaveBeenCalled();
    });

    it('logs in once and saves the token when none exists', async () => {
        mockExists.mockReturnValue(false);
        await getGarminClient('GLOBAL');
        const c = mockInstances[0];
        expect(c.domain).toBe('garmin.com');
        expect(c.login).toHaveBeenCalledTimes(1);
        expect(c.exportTokenToFile).toHaveBeenCalledWith('tokens/global');
    });

    it('falls back to a single login when the saved token is invalid', async () => {
        mockExists.mockReturnValue(true);
        const { GarminConnect } = require('garmin-connect');
        let first = true;
        GarminConnect.mockImplementationOnce(() => {
            const inst = {
                login: jest.fn().mockResolvedValue(undefined),
                exportTokenToFile: jest.fn(),
                loadTokenByFile: jest.fn(),
                getUserProfile: jest.fn().mockImplementation(async () => {
                    if (first) {
                        first = false;
                        throw new Error('401');
                    }
                    return { userName: 'u' };
                }),
            };
            mockInstances.push(inst);
            return inst;
        });
        await getGarminClient('CN');
        expect(mockInstances[0].login).toHaveBeenCalledTimes(1);
        expect(mockInstances[0].exportTokenToFile).toHaveBeenCalled();
    });

    it('does not retry when login fails', async () => {
        mockExists.mockReturnValue(false);
        const { GarminConnect } = require('garmin-connect');
        GarminConnect.mockImplementationOnce(() => {
            const inst = { login: jest.fn().mockRejectedValue(new Error('429')) };
            mockInstances.push(inst);
            return inst;
        });
        await expect(getGarminClient('CN')).rejects.toThrow('429');
        expect(mockInstances[0].login).toHaveBeenCalledTimes(1);
        expect(mockSetFailed).toHaveBeenCalled();
    });

    it('rejects when credentials are missing', async () => {
        process.env.GARMIN_USERNAME = '';
        await expect(getGarminClient('CN')).rejects.toThrow('GARMIN_USERNAME');
        expect(mockInstances).toHaveLength(0);
    });
});
