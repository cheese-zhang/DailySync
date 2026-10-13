const mockGetClient = jest.fn();
const mockDownload = jest.fn();
const mockUpload = jest.fn();

jest.mock('../src/garmin/client', () => ({ getGarminClient: (...a: unknown[]) => mockGetClient(...a) }));
jest.mock('../src/garmin/files', () => ({
    downloadGarminActivity: (...a: unknown[]) => mockDownload(...a),
    uploadGarminActivity: (...a: unknown[]) => mockUpload(...a),
}));

import { migrateActivities, syncActivities } from '../src/garmin/sync';

const act = (id: number, start: string) => ({ activityId: id, activityName: `a${id}`, startTimeLocal: start });

describe('garmin sync', () => {
    let cn: { getActivities: jest.Mock };
    let global: { getActivities: jest.Mock };

    beforeEach(() => {
        process.env.GARMIN_SYNC_DELAY_MS = '0';
        cn = { getActivities: jest.fn() };
        global = { getActivities: jest.fn() };
        mockGetClient.mockReset().mockImplementation(async (r: string) => (r === 'CN' ? cn : global));
        mockDownload.mockReset().mockImplementation(async (id: number) => `file-${id}`);
        mockUpload.mockReset().mockResolvedValue(undefined);
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });
    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    const run = async (p: Promise<void>) => {
        // 跳过同步之间的节流等待
        for (let i = 0; i < 10; i++) {
            await Promise.resolve();
            jest.advanceTimersByTime(1000);
        }
        await p;
    };

    it('uploads only newer activities, oldest first, CN -> GLOBAL', async () => {
        cn.getActivities.mockResolvedValue([act(3, '2024-01-03'), act(2, '2024-01-02'), act(1, '2024-01-01')]);
        global.getActivities.mockResolvedValue([act(9, '2024-01-01')]);
        await syncActivities('CN', 'GLOBAL');
        expect(mockDownload.mock.calls.map(c => c[0])).toEqual([2, 3]);
        expect(mockDownload.mock.calls[0][1]).toBe(cn);
        expect(mockUpload.mock.calls.map(c => c[0])).toEqual(['file-2', 'file-3']);
        expect(mockUpload.mock.calls[0][1]).toBe(global);
    });

    it('syncs in the opposite direction', async () => {
        global.getActivities.mockResolvedValue([act(5, '2024-02-01')]);
        cn.getActivities.mockResolvedValue([act(1, '2024-01-01')]);
        await syncActivities('GLOBAL', 'CN');
        expect(mockDownload).toHaveBeenCalledWith(5, global);
        expect(mockUpload).toHaveBeenCalledWith('file-5', cn);
    });

    it('does nothing when latest activities match', async () => {
        cn.getActivities.mockResolvedValue([act(1, '2024-01-01')]);
        global.getActivities.mockResolvedValue([act(1, '2024-01-01')]);
        await syncActivities('CN', 'GLOBAL');
        expect(mockDownload).not.toHaveBeenCalled();
        expect(mockUpload).not.toHaveBeenCalled();
    });

    it('does nothing when the source has no activities', async () => {
        cn.getActivities.mockResolvedValue([]);
        global.getActivities.mockResolvedValue([act(1, '2024-01-01')]);
        await syncActivities('CN', 'GLOBAL');
        expect(mockUpload).not.toHaveBeenCalled();
    });

    it('migrates the configured slice', async () => {
        process.env.GARMIN_MIGRATE_START = '5';
        process.env.GARMIN_MIGRATE_NUM = '2';
        cn.getActivities.mockResolvedValue([act(1, 'a'), act(2, 'b')]);
        await migrateActivities('CN', 'GLOBAL');
        expect(cn.getActivities).toHaveBeenCalledWith(5, 2);
        expect(mockUpload).toHaveBeenCalledTimes(2);
        delete process.env.GARMIN_MIGRATE_START;
        delete process.env.GARMIN_MIGRATE_NUM;
    });

    it('propagates upload failures', async () => {
        cn.getActivities.mockResolvedValue([act(1, 'b')]);
        global.getActivities.mockResolvedValue([act(0, 'a')]);
        mockUpload.mockRejectedValue(new Error('boom'));
        await expect(syncActivities('CN', 'GLOBAL')).rejects.toThrow('boom');
    });
});
