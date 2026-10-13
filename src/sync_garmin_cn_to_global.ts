import { runTask } from './utils/run_task';
import { syncGarminCN2GarminGlobal } from './utils/garmin_cn';

runTask(() => syncGarminCN2GarminGlobal(), 'Garmin CN -> Garmin Global 同步数据运行失败了，快去检查！');
