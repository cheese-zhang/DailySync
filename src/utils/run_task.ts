import { BARK_KEY_DEFAULT } from '../constant';

const axios = require('axios');
const core = require('@actions/core');

const BARK_KEY = process.env.BARK_KEY ?? BARK_KEY_DEFAULT;

export const runTask = async (task: () => Promise<unknown>, failTitle: string): Promise<void> => {
    try {
        await task();
    } catch (e) {
        const message = e?.message ?? String(e);
        console.error(e);
        if (BARK_KEY) {
            try {
                await axios.get(`https://api.day.app/${encodeURIComponent(BARK_KEY)}/${encodeURIComponent(failTitle)}/${encodeURIComponent(message)}`);
            } catch (notifyErr) {
                console.error('Bark 通知发送失败', notifyErr?.message);
            }
        }
        core.setFailed(message);
        process.exit(1);
    }
};