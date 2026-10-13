import { syncActivities } from './garmin/sync';
import { runTask } from './utils/run_task';

runTask(() => syncActivities('GLOBAL', 'CN'), 'Garmin Global -> Garmin CN 同步数据运行失败了，快去检查！');
