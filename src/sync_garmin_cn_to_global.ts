import { syncActivities } from './garmin/sync';
import { runTask } from './utils/run_task';

runTask(() => syncActivities('CN', 'GLOBAL'), 'Garmin CN -> Garmin Global 同步数据运行失败了，快去检查！');
