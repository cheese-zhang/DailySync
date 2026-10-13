import { runTask } from './utils/run_task';
import { migrateGarminGlobal2GarminCN } from './utils/garmin_global';

runTask(() => migrateGarminGlobal2GarminCN(), 'Garmin Global -> Garmin CN 迁移数据运行失败了，快去检查！');
