import fs from 'fs';

const core = require('@actions/core');
import {
    DOWNLOAD_DIR,
    FILE_SUFFIX,
    GARMIN_MIGRATE_NUM_DEFAULT,
    GARMIN_MIGRATE_START_DEFAULT,
    GARMIN_PASSWORD_DEFAULT,
    GARMIN_URL_DEFAULT,
    GARMIN_USERNAME_DEFAULT,
} from '../constant';
import { GarminClientType } from './type';
import _ from 'lodash';
import { formatPace } from './activity';
const decompress = require('decompress');


/**
 * 上传 .fit file
 * @param fitFilePath
 * @param client
 */
export const uploadGarminActivity = async (fitFilePath: string, client: GarminClientType): Promise<void> => {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
    const upload = await client.uploadActivity(fitFilePath);
    console.log('upload to garmin activity', upload);
};

/**
 * 下载 garmin 活动原始数据，并解压保存到本地
 * @param activityId
 * @param client GarminClientType
 */
export const downloadGarminActivity = async (activityId, client: GarminClientType): Promise<string> => {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
    const activity = await client.getActivity({ activityId: activityId });
    await client.downloadOriginalActivityData(activity, DOWNLOAD_DIR);
    const originZipFile = DOWNLOAD_DIR + '/' + activityId + '.zip';
    const baseFilePath = `${DOWNLOAD_DIR}/`;
    const unzipped = await decompress(originZipFile, DOWNLOAD_DIR);
    const unzippedFileName = unzipped?.[0]?.path;
    if (!unzippedFileName) {
        throw new Error(`活动 ${activityId} 解压后没有文件`);
    }
    const path = baseFilePath + unzippedFileName;
    console.log('downloadGarminActivity - path:', path)
    return path;
};

export const getGarminStatistics = async (client: GarminClientType): Promise<Record<string, any>> => {
    // Get a list of default length with most recent activities
    const acts = await client.getActivities(0, 10);
    // console.log('acts', acts);

    //  跑步 typeKey: 'running'
    //  操场跑步 typeKey: 'track_running'
    //  跑步机跑步 typeKey: 'treadmill_running'
    //  沿街跑步 typeKey: 'street_running'

    // 包含running关键字的都算
    const recentRunningAct = _.filter(acts, act => act?.activityType?.typeKey?.includes('running'))[0];
    if (!recentRunningAct) {
        throw new Error('最近的活动中没有跑步记录');
    }
    console.log('recentRunningAct type: ', recentRunningAct.activityType?.typeKey);

    const {
        activityId, // 活动id
        activityName, // 活动名称
        startTimeLocal, // 活动开始时间
        distance, // 距离
        duration, // 时间
        averageSpeed, // 平均速度 m/s
        averageHR, // 平均心率
        maxHR, // 最大心率
        averageRunningCadenceInStepsPerMinute, // 平均每分钟步频
        aerobicTrainingEffect, // 有氧效果
        anaerobicTrainingEffect, // 无氧效果
        avgGroundContactTime, // 触地时间
        avgStrideLength, // 步幅
        vO2MaxValue, // VO2Max
        avgVerticalOscillation, // 垂直振幅
        avgVerticalRatio, // 垂直振幅比
        avgGroundContactBalance, // 触地平衡
        trainingEffectLabel, // 训练效果
        activityTrainingLoad, // 训练负荷
    } = recentRunningAct;

    const { pace, paceText } = formatPace(averageSpeed);

    return {
        activityId, // 活动id
        activityName, // 活动名称
        startTimeLocal, // 活动开始时间
        distance, // 距离
        duration, // 持续时间
        // averageSpeed 是 m/s
        averageSpeed, // 速度
        averagePace: pace,  // min/km
        averagePaceText: paceText,  // min/km
        averageHR, // 平均心率
        maxHR, // 最大心率
        averageRunningCadenceInStepsPerMinute, // 平均每分钟步频
        aerobicTrainingEffect, // 有氧效果
        anaerobicTrainingEffect, // 无氧效果
        avgGroundContactTime, // 触地时间
        avgStrideLength, // 步幅
        vO2MaxValue, // 最大摄氧量
        avgVerticalOscillation, // 垂直振幅
        avgVerticalRatio, // 垂直振幅比
        avgGroundContactBalance, // 触地平衡
        trainingEffectLabel, // 训练效果
        activityTrainingLoad, // 训练负荷
        activityURL: GARMIN_URL_DEFAULT.ACTIVITY_URL + activityId, // 活动链接
    };
    // const detail = await GCClient.getActivity(recentRunningAct);
    // console.log('detail', detail);
};
