import { runTask } from './utils/run_task';
import { syncGarminGlobal2GarminCN } from './utils/garmin_global';

runTask(() => syncGarminGlobal2GarminCN(), 'Garmin Global -> Garmin CN 同步数据运行失败了，快去检查！');
