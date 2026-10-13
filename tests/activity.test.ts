import { formatPace, selectNewActivities } from '../src/utils/activity';
import { number2capital, number2emoji } from '../src/utils/number_tricks';

describe('formatPace', () => {
    it('formats a normal pace', () => {
        // 3.2333 m/s -> 5:09 min/km
        expect(formatPace(1000 / 60 / (5 + 9 / 60)).paceText).toBe('5:09');
    });

    it('pads seconds below 10', () => {
        expect(formatPace(1000 / 60 / (6 + 3 / 60)).paceText).toBe('6:03');
    });

    it('carries over when seconds round up to 60', () => {
        // 5:59.7 would previously render as 5:60
        expect(formatPace(1000 / 60 / (5 + 59.7 / 60)).paceText).toBe('6:00');
    });

    it('returns pace in min/km', () => {
        expect(formatPace(1000 / 60 / 5).pace).toBeCloseTo(5, 10);
    });
});

describe('selectNewActivities', () => {
    const acts = [
        { activityId: 3, startTimeLocal: '2024-01-03 08:00:00' },
        { activityId: 2, startTimeLocal: '2024-01-02 08:00:00' },
        { activityId: 1, startTimeLocal: '2024-01-01 08:00:00' },
    ];

    it('returns only newer activities, oldest first', () => {
        const result = selectNewActivities(acts, '2024-01-01 08:00:00');
        expect(result.map(a => a.activityId)).toEqual([2, 3]);
    });

    it('returns nothing when target is up to date', () => {
        expect(selectNewActivities(acts, '2024-01-03 08:00:00')).toEqual([]);
    });

    it('returns everything when target is empty', () => {
        expect(selectNewActivities(acts, '0')).toHaveLength(3);
    });

    it('does not mutate the input', () => {
        const copy = [...acts];
        selectNewActivities(acts, '0');
        expect(acts).toEqual(copy);
    });

    it('ignores activities without a start time', () => {
        expect(selectNewActivities([{ activityId: 9 }], '0')).toEqual([]);
    });
});

describe('number_tricks', () => {
    it('converts digits to capitals', () => {
        expect(number2capital(1203)).toBe('一二零三');
    });
    it('converts digits to emojis', () => {
        expect(number2emoji(10)).toBe('1️⃣0️⃣');
    });
});