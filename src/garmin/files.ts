import fs from 'fs';
import { DOWNLOAD_DIR } from '../constant';
import { GarminClientType } from './client';

const decompress = require('decompress');

/**
 * 上传 .fit file
 */
export const uploadGarminActivity = async (fitFilePath: string, client: GarminClientType): Promise<void> => {
    const upload = await client.uploadActivity(fitFilePath);
    console.log('upload to garmin activity', upload);
};

/**
 * 下载 garmin 活动原始数据，并解压保存到本地
 */
export const downloadGarminActivity = async (activityId: number | string, client: GarminClientType): Promise<string> => {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    const activity = await client.getActivity({ activityId: Number(activityId) });
    await client.downloadOriginalActivityData(activity, DOWNLOAD_DIR);
    const originZipFile = `${DOWNLOAD_DIR}/${activityId}.zip`;
    const unzipped = await decompress(originZipFile, DOWNLOAD_DIR);
    const unzippedFileName = unzipped?.[0]?.path;
    if (!unzippedFileName) {
        throw new Error(`活动 ${activityId} 解压后没有文件`);
    }
    const filePath = `${DOWNLOAD_DIR}/${unzippedFileName}`;
    console.log('downloadGarminActivity - path:', filePath);
    return filePath;
};
