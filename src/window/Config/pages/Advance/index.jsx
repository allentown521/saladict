import React from 'react';
import { useTranslation } from 'react-i18next';
import { CardBody } from '@nextui-org/react';
import { Switch } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import { Card } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useConfig } from '../../../../hooks/useConfig';
import { useToastStyle } from '../../../../hooks';

let timer = null;

export default function Advance() {
    const [serverPort, setServerPort] = useConfig('server_port', 60828);
    const [devMode, setDevMode] = useConfig('dev_mode', false);
    const [proxyEnable, setProxyEnable] = useConfig('proxy_enable', false);
    const [proxyHost, setProxyHost] = useConfig('proxy_host', '');
    const [proxyPort, setProxyPort] = useConfig('proxy_port', '');
    const [proxyUsername, setProxyUsername] = useConfig('proxy_username', '');
    const [proxyPassword, setProxyPassword] = useConfig('proxy_password', '');
    const [noProxy, setNoProxy] = useConfig('no_proxy', 'localhost,127.0.0.1');
    const { t } = useTranslation();
    const toastStyle = useToastStyle();

    return (
        <>
            <Toaster />
            <Card className='mb-[10px]'>
                <CardBody>
                    <div className='config-item'>
                        <h3 className='my-auto'>{t('config.general.server_port')}</h3>
                        {serverPort !== null && (
                            <Input
                                type='number'
                                variant='bordered'
                                value={serverPort}
                                labelPlacement='outside-left'
                                onValueChange={(v) => {
                                    if (parseInt(v) !== serverPort) {
                                        if (timer) {
                                            clearTimeout(timer);
                                        }
                                        timer = setTimeout(() => {
                                            toast.success(t('config.general.server_port_change'), {
                                                duration: 3000,
                                                style: toastStyle,
                                            });
                                        }, 1000);
                                    }
                                    if (v === '') {
                                        setServerPort(0);
                                    } else if (parseInt(v) > 65535) {
                                        setServerPort(65535);
                                    } else if (parseInt(v) < 0) {
                                        setServerPort(0);
                                    } else {
                                        setServerPort(parseInt(v));
                                    }
                                }}
                                className='max-w-[100px]'
                            />
                        )}
                    </div>
                    <div className='config-item'>
                        <h3>{t('config.general.dev_mode')}</h3>
                        {devMode !== null && (
                            <Switch
                                isSelected={devMode}
                                onValueChange={(v) => {
                                    setDevMode(v);
                                }}
                            />
                        )}
                    </div>
                </CardBody>
            </Card>
            <Card>
                <CardBody>
                    <div className='config-item'>
                        <h3>{t('config.general.proxy.title')}</h3>
                        {proxyEnable !== null && (
                            <Switch
                                isSelected={proxyEnable}
                                onValueChange={async (v) => {
                                    if (v) {
                                        if (proxyHost === '' || proxyPort === '') {
                                            setProxyEnable(false);
                                            toast.error(t('config.general.proxy_error'), {
                                                duration: 3000,
                                                style: toastStyle,
                                            });
                                            return;
                                        } else {
                                            setProxyEnable(v);
                                        }
                                    } else {
                                        setProxyEnable(v);
                                    }
                                    toast.success(t('config.general.proxy_change'), {
                                        duration: 1000,
                                        style: toastStyle,
                                    });
                                }}
                            />
                        )}
                    </div>
                    <div className='config-item'>
                        {proxyHost !== null && (
                            <Input
                                type='url'
                                variant='bordered'
                                isRequired
                                label={t('config.general.proxy.host')}
                                startContent={<span>http://</span>}
                                value={proxyHost}
                                onValueChange={(v) => {
                                    setProxyHost(v);
                                }}
                                className='mr-2'
                            />
                        )}
                        {proxyPort !== null && (
                            <Input
                                type='number'
                                variant='bordered'
                                isRequired
                                label={t('config.general.proxy.port')}
                                value={proxyPort}
                                onValueChange={(v) => {
                                    if (parseInt(v) > 65535) {
                                        setProxyPort(65535);
                                    } else if (parseInt(v) < 0) {
                                        setProxyPort('');
                                    } else {
                                        setProxyPort(parseInt(v));
                                    }
                                }}
                                className='ml-2'
                            />
                        )}
                    </div>
                    <div className='config-item'>
                        {proxyUsername !== null && (
                            <Input
                                type='text'
                                variant='bordered'
                                isDisabled
                                label={t('config.general.proxy.username')}
                                value={proxyUsername}
                                onValueChange={(v) => {
                                    setProxyUsername(v);
                                }}
                                className='mr-2'
                            />
                        )}
                        {proxyPassword !== null && (
                            <Input
                                type='password'
                                variant='bordered'
                                isDisabled
                                label={t('config.general.proxy.password')}
                                value={proxyPassword}
                                onValueChange={(v) => {
                                    setProxyPassword(v);
                                }}
                                className='ml-2'
                            />
                        )}
                    </div>
                    <div className='config-item'>
                        {noProxy !== null && (
                            <Input
                                variant='bordered'
                                label={t('config.general.proxy.no_proxy')}
                                value={noProxy}
                                onValueChange={(v) => {
                                    setNoProxy(v);
                                }}
                            />
                        )}
                    </div>
                </CardBody>
            </Card>
        </>
    );
} 