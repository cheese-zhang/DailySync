import { runTask } from './utils/run_task';
import { doRQGoogleSheets } from './utils/runningquotient';

runTask(() => doRQGoogleSheets(), '同步数据运行失败了，快去检查！');
