import {
    GARMIN_GLOBAL_PASSWORD_DEFAULT,
    GARMIN_GLOBAL_USERNAME_DEFAULT,
    GARMIN_PASSWORD_DEFAULT,
    GARMIN_USERNAME_DEFAULT,
} from '../constant';

export type GarminRegion = 'CN' | 'GLOBAL';

export interface RegionConfig {
    region: GarminRegion;
    // 中文名称，用于日志
    label: string;
    domain: 'garmin.cn' | 'garmin.com';
    tokenDir: string;
    usernameEnv: string;
    passwordEnv: string;
    username: string;
    password: string;
}

export const getRegionConfig = (region: GarminRegion): RegionConfig => {
    if (region === 'CN') {
        return {
            region,
            label: '中国区',
            domain: 'garmin.cn',
            tokenDir: 'tokens/cn',
            usernameEnv: 'GARMIN_USERNAME',
            passwordEnv: 'GARMIN_PASSWORD',
            username: process.env.GARMIN_USERNAME ?? GARMIN_USERNAME_DEFAULT,
            password: process.env.GARMIN_PASSWORD ?? GARMIN_PASSWORD_DEFAULT,
        };
    }
    return {
        region,
        label: '国际区',
        domain: 'garmin.com',
        tokenDir: 'tokens/global',
        usernameEnv: 'GARMIN_GLOBAL_USERNAME',
        passwordEnv: 'GARMIN_GLOBAL_PASSWORD',
        username: process.env.GARMIN_GLOBAL_USERNAME ?? GARMIN_GLOBAL_USERNAME_DEFAULT,
        password: process.env.GARMIN_GLOBAL_PASSWORD ?? GARMIN_GLOBAL_PASSWORD_DEFAULT,
    };
};
