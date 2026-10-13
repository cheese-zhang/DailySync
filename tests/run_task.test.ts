const mockGet = jest.fn();
const mockSetFailed = jest.fn();

jest.mock('axios', () => ({ get: (...args: unknown[]) => mockGet(...args) }));
jest.mock('@actions/core', () => ({ setFailed: (...args: unknown[]) => mockSetFailed(...args) }));

describe('runTask', () => {
    const OLD_ENV = process.env;
    let exitSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.resetModules();
        mockGet.mockReset().mockResolvedValue({});
        mockSetFailed.mockReset();
        process.env = { ...OLD_ENV, BARK_KEY: 'key' };
        exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
        process.env = OLD_ENV;
        jest.restoreAllMocks();
    });

    it('does nothing on success', async () => {
        const { runTask } = require('../src/utils/run_task');
        await runTask(async () => 1, 'title');
        expect(mockGet).not.toHaveBeenCalled();
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('awaits async failures, notifies with encoded URL and exits 1', async () => {
        const { runTask } = require('../src/utils/run_task');
        await runTask(async () => { throw new Error('a/b boom'); }, '失败');
        expect(mockGet).toHaveBeenCalledWith(
            `https://api.day.app/key/${encodeURIComponent('失败')}/${encodeURIComponent('a/b boom')}`);
        expect(mockSetFailed).toHaveBeenCalledWith('a/b boom');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('still fails when Bark notification fails', async () => {
        mockGet.mockRejectedValue(new Error('network'));
        const { runTask } = require('../src/utils/run_task');
        await runTask(async () => { throw new Error('x'); }, 't');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('skips notification without BARK_KEY', async () => {
        delete process.env.BARK_KEY;
        const { runTask } = require('../src/utils/run_task');
        await runTask(async () => { throw new Error('x'); }, 't');
        expect(mockGet).not.toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});