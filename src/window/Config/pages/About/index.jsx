import { Divider, Button, Popover, PopoverTrigger, PopoverContent, Tooltip } from '@nextui-org/react';
import { appLogDir, appConfigDir } from '@tauri-apps/api/path';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/api/shell';
import { BsTencentQq } from 'react-icons/bs';
import { BsTelegram } from 'react-icons/bs';
import { BsGithub } from 'react-icons/bs';
import { invoke } from '@tauri-apps/api';
import React, { use } from 'react';
import { useConfig } from '../../../../hooks/useConfig';
import { appVersion, appName } from '../../../../utils/env';
import { useState, useEffect } from 'react';

export default function About() {
    const { t } = useTranslation();
    const [devMode, setDevMode] = useConfig('dev_mode', false);
    const [isAppStore, setIsAppStore] = useState(false);
    useEffect(() => {
        const fetchIsAppStore = async () => {
            const isAppStore = await invoke('is_app_store_version');
            setIsAppStore(isAppStore);
        };
        fetchIsAppStore();
    }, []);

    return (
        <div className='h-full w-full py-[80px] px-[100px]'>
            <img
                src='icon.png'
                className='mx-auto h-[100px] mb-[5px]'
                draggable={false}
            />
            <div className='content-center'>
                <h1 className='font-bold text-2xl text-center'>{t('config.about.app_name')}</h1>
                <p className='text-center text-sm text-gray-500 mb-[5px]'>{appVersion}</p>
                <Divider />
                <div className='flex justify-between'>
                    <Button
                        variant='light'
                        className='my-[5px]'
                        size='sm'
                        onPress={() => {
                            open('https://saladict-app.aichatone.com');
                        }}
                    >
                        {t('config.about.website')}
                    </Button>
                    <Button
                        variant='light'
                        className='my-[5px]'
                        size='sm'
                        onPress={() => {
                            open('https://saladict-app.aichatone.com/docs');
                        }}
                    >
                        {t('config.about.faq')}
                    </Button>
                    <Popover
                        placement='top'
                        offset={10}
                    >
                        <PopoverTrigger>
                            <Button
                                variant='light'
                                className='my-[5px]'
                                size='sm'
                            >
                                {t('config.about.feedback')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className='flex justify-between'>
                                <Button
                                    variant='light'
                                    className='my-[5px]'
                                    size='sm'
                                    onPress={() => {
                                        open('https://github.com/allentown521/saladict/issues');
                                    }}
                                >
                                    {t('config.about.issue')}
                                </Button>
                                <Button
                                    variant='light'
                                    className='my-[5px]'
                                    size='sm'
                                    onPress={() => {
                                        open('mailto:product@aichatone.com');
                                    }}
                                >
                                    {t('config.about.email')}
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover
                        placement='top'
                        offset={10}
                    >
                        <PopoverTrigger>
                            <Button
                                variant='light'
                                className='my-[5px]'
                                size='sm'
                            >
                                {t('config.about.community')}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <div className='flex justify-between'>
                                <Tooltip content={t('config.about.discussion')}>
                                    <Button
                                        isIconOnly
                                        variant='light'
                                        className='my-[5px]'
                                        size='lg'
                                        onPress={() => {
                                            open('https://github.com/allentown521/saladict/discussions');
                                        }}
                                    >
                                        <BsGithub />
                                    </Button>
                                </Tooltip>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                <Divider />
            </div>
            <div className='content-center px-[40px]'>
                <div className='flex justify-center'>
                    {!isAppStore && <Button
                        variant='light'
                        className='my-[5px]'
                        size='sm'
                        onPress={() => {
                            invoke('updater_window');
                        }}
                    >
                        {t('config.about.check_update')}
                    </Button>}
                    {devMode && <Button
                        variant='light'
                        className='my-[5px]'
                        size='sm'
                        onPress={async () => {
                            const dir = await appLogDir();
                            open(dir);
                        }}
                    >
                        {t('config.about.view_log')}
                    </Button>}
                    {devMode && <Button
                        variant='light'
                        className='my-[5px]'
                        size='sm'
                        onPress={async () => {
                            const dir = await appConfigDir();
                            open(dir);
                        }}
                    >
                        {t('config.about.view_config')}
                    </Button>}
                </div>

                <Divider />
            </div>
        </div>
    );
}
