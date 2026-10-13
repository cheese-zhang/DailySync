import fs from 'fs';
import { GarminConnect } from 'garmin-connect';
import { getRegionConfig, GarminRegion, RegionConfig } from './regions';

const core = require('@actions/core');

export type GarminClientType = GarminConnect;

const hasSavedToken = (tokenDir: string): boolean =>
    fs.existsSync(`${tokenDir}/oauth1_token.json`) && fs.existsSync(`${tokenDir}/oauth2_token.json`);

const verifyClient = async (client: GarminClientType, cfg: RegionConfig): Promise<void> => {
    const { userName, location } = await client.getUserProfile();
    if (!userName) {
        throw new Error(`佳明${cfg.label}登录失败，请检查账号密码或网络环境`);
    }
    console.log(`Garmin userInfo ${cfg.region}: `, { userName, location });
};

/**
 * 获取佳明客户端。优先复用本地保存的 token，仅在没有 token 或 token 失效时才用账号密码登录，
 * 且只登录一次，不做重试，避免频繁登录触发佳明的限流或 IP 封锁。
 */
export const getGarminClient = async (region: GarminRegion): Promise<GarminClientType> => {
    const cfg = getRegionConfig(region);
    if (!cfg.username || !cfg.password) {
        const errMsg = `请填写${cfg.label}用户名及密码：${cfg.usernameEnv},${cfg.passwordEnv}`;
        core.setFailed(errMsg);
        throw new Error(errMsg);
    }

    const client = new GarminConnect({ username: cfg.username, password: cfg.password }, cfg.domain);

    try {
        if (hasSavedToken(cfg.tokenDir)) {
            try {
                console.log(`Reuse ${region} token`);
                client.loadTokenByFile(cfg.tokenDir);
                await verifyClient(client, cfg);
                return client;
            } catch (e) {
                console.warn(`${region} token 已失效，改用账号密码登录`, (e as Error)?.message);
            }
        }
        await client.login();
        client.exportTokenToFile(cfg.tokenDir);
        await verifyClient(client, cfg);
        return client;
    } catch (err) {
        console.error(err);
        core.setFailed(err);
        throw err;
    }
};
