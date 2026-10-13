import { GARMIN_MIGRATE_NUM_DEFAULT, GARMIN_MIGRATE_START_DEFAULT, GARMIN_SYNC_NUM_DEFAULT } from '../constant';
import { selectNewActivities } from '../utils/activity';
import { number2capital } from '../utils/number_tricks';
import { getGarminClient, GarminClientType } from './client';
import { downloadGarminActivity, uploadGarminActivity } from './files';
import { GarminRegion, getRegionConfig } from './regions';

const describeAct = (act: any) => `【 ${act.activityName} 】，开始于 【 ${act.startTimeLocal} 】，活动ID: 【 ${act.activityId} 】`;

const transfer = async (act: any, from: GarminClientType, to: GarminClientType): Promise<void> => {
    const filePath = await downloadGarminActivity(act.activityId, from);
    await uploadGarminActivity(filePath, to);
};

/**
 * 增量同步：把 source 区比 target 区最新活动更新的活动上传到 target 区
 */
export const syncActivities = async (source: GarminRegion, target: GarminRegion): Promise<void> => {
    const syncNum = Number(process.env.GARMIN_SYNC_NUM ?? GARMIN_SYNC_NUM_DEFAULT) || GARMIN_SYNC_NUM_DEFAULT;
    const targetLabel = getRegionConfig(target).label;
    const sourceClient = await getGarminClient(source);
    const targetClient = await getGarminClient(target);

    const sourceActs = await sourceClient.getActivities(0, syncNum);
    const targetActs = await targetClient.getActivities(0, 1);

    const latestTargetStartTime = targetActs[0]?.startTimeLocal ?? '0';
    const latestSourceStartTime = sourceActs[0]?.startTimeLocal ?? '0';
    if (latestSourceStartTime === latestTargetStartTime) {
        console.log(`没有要同步的活动内容, 最近的活动:  【 ${sourceActs[0]?.activityName} 】, 开始于: 【 ${latestSourceStartTime} 】`);
        return;
    }

    // fix: #18
    const newActs = selectNewActivities(sourceActs, latestTargetStartTime);
    let count = 1;
    for (const act of newActs) {
        console.log(`本次开始向${targetLabel}上传第 ${number2capital(count)} 条数据，${describeAct(act)}`);
        await transfer(act, sourceClient, targetClient);
        await new Promise(resolve => setTimeout(resolve, Number(process.env.GARMIN_SYNC_DELAY_MS ?? 1000)));
        count++;
    }
};

/**
 * 迁移：按 GARMIN_MIGRATE_START / GARMIN_MIGRATE_NUM 把 source 区的历史活动全部上传到 target 区
 */
export const migrateActivities = async (source: GarminRegion, target: GarminRegion, defaultCount = 200): Promise<void> => {
    const start = Number(process.env.GARMIN_MIGRATE_START ?? GARMIN_MIGRATE_START_DEFAULT) || 0;
    const total = Number(process.env.GARMIN_MIGRATE_NUM ?? GARMIN_MIGRATE_NUM_DEFAULT) || defaultCount;
    const targetLabel = getRegionConfig(target).label;

    const sourceClient = await getGarminClient(source);
    const targetClient = await getGarminClient(target);

    const acts = await sourceClient.getActivities(start, total);
    for (let j = 0; j < acts.length; j++) {
        const act = acts[j];
        console.log(`本次开始向${targetLabel}上传第 ${number2capital(j + 1)} 条数据，相对总数上传到 ${number2capital(j + 1 + start)} 条，  ${describeAct(act)}`);
        await transfer(act, sourceClient, targetClient);
    }
};
