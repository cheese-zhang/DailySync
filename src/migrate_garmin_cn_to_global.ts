import { runTask } from './utils/run_task';
import { migrateGarminCN2GarminGlobal } from './utils/garmin_cn';

runTask(() => migrateGarminCN2GarminGlobal(), 'Garmin CN -> Garmin Global 迁移数据运行失败了，快去检查！');
