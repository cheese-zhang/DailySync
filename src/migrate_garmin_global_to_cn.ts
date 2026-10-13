import { migrateActivities } from './garmin/sync';
import { runTask } from './utils/run_task';

runTask(() => migrateActivities('GLOBAL', 'CN'), 'Garmin Global -> Garmin CN 迁移数据运行失败了，快去检查！');
