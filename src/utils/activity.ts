import _ from 'lodash';

export interface PaceInfo {
    pace: number;
    paceText: string;
}

/**
 * 根据平均速度(m/s)计算配速(min/km)及文字，如 5:09
 */
export const formatPace = (averageSpeed: number): PaceInfo => {
    const pace = 1 / (averageSpeed / 1000 * 60);
    let min = Math.floor(pace);
    let second = Math.round((pace - min) * 60);
    if (second >= 60) {
        second -= 60;
        min += 1;
    }
    // 秒数小于10前面添加0，避免谷歌表格识别不成分钟数。  5:9 -> 5:09
    const secondText = second < 10 ? '0' + second : String(second);
    return { pace, paceText: `${min}:${secondText}` };
};

/**
 * 选出开始时间晚于目标区最新活动的活动，按时间从早到晚返回
 */
export const selectNewActivities = <T extends Record<string, any>>(
    sourceActs: T[],
    latestTargetStartTime: string,
): T[] => {
    return _.sortBy(
        _.filter(sourceActs, act => (act.startTimeLocal ?? '') > latestTargetStartTime),
        act => act.startTimeLocal,
    );
};