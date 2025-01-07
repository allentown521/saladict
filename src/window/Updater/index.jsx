import { Code, Card, CardBody, Button, Progress, Skeleton } from '@nextui-org/react';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import React, { useEffect, useState } from 'react';
import { appWindow, WebviewWindow, getAll } from '@tauri-apps/api/window';
import { relaunch } from '@tauri-apps/api/process';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { listen } from '@tauri-apps/api/event';
import ReactMarkdown from 'react-markdown';

import { useConfig, useToastStyle } from '../../hooks';
import { osType } from '../../utils/env';

let unlisten = 0;
let eventId = 0;
const UPDATE_WINDOW_LABEL = 'updater';

export default function Updater() {
    const [transparent] = useConfig('transparent', true);
    const [downloaded, setDownloaded] = useState(0);
    const [total, setTotal] = useState(0);
    const [body, setBody] = useState('');
    const [forceUpdate, setForceUpdate] = useState(false);
    const [shouldUpdate, setShouldUpdate] = useState(false);
    const { t } = useTranslation();
    const toastStyle = useToastStyle();

    useEffect(() => {
        if (appWindow.label === UPDATE_WINDOW_LABEL) {
            appWindow.show();
        }

        checkUpdate().then(
            async (update) => {
                if (update.shouldUpdate) {
                    setBody(update.manifest.body);
                    setShouldUpdate(update.shouldUpdate);
                    // check --forceUpdate-- flag in CHANGELOG
                    const isForceUpdate = update.manifest.body.includes('--forceUpdate--');
                    setForceUpdate(isForceUpdate);
                    if (isForceUpdate) {
                        appWindow.setClosable(false);
                        // listen window created event, close all other windows except updater
                        const unlisten = await listen('tauri://window-created', async () => {
                            const windows = await getAll();
                            for (const window of windows) {
                                if (window.label !== UPDATE_WINDOW_LABEL) {
                                    await window.close();
                                }
                            }
                        });
                    }
                } else {
                    setBody(t('updater.latest'));
                }
            },
            (e) => {
                setBody(e.toString());
                toast.error(e.toString(), { style: toastStyle });
            }
        );

        if (unlisten === 0) {
            unlisten = listen('tauri://update-download-progress', (e) => {
                if (eventId === 0) {
                    eventId = e.id;
                }
                if (e.id === eventId) {
                    setTotal(e.payload.contentLength);
                    setDownloaded((a) => {
                        return a + e.payload.chunkLength;
                    });
                }
            });
        }
    }, []);

    return (
        <div
            className={`${transparent ? 'bg-background/90' : 'bg-background'} h-screen ${
                osType === 'Linux' && 'rounded-[10px] border-1 border-default-100'
            }`}
        >
            <Toaster />
            <div className='p-[5px] h-[35px] w-full select-none cursor-default'>
                <div
                    data-tauri-drag-region='true'
                    className='h-full w-full flex justify-center items-center'
                >
                    <img
                        src='icon.png'
                        className='h-[25px] w-[25px] mr-[10px]'
                        draggable={false}
                    />
                    <h2>{t('updater.title')}</h2>
                </div>
            </div>
            <Card className='mx-[80px] mt-[10px] overscroll-auto h-[calc(100vh-150px)]'>
                <CardBody>
                    {forceUpdate && (
                        <div className='mb-4 p-3 bg-warning-50 rounded-lg border-l-4 border-warning'>
                            <p className='font-medium'>{t('updater.force_update_tip')}</p>
                        </div>
                    )}
                    {body === '' ? (
                        <div className='space-y-3'>
                            <Skeleton className='w-3/5 rounded-lg'>
                                <div className='h-3 w-3/5 rounded-lg bg-default-200'></div>
                            </Skeleton>
                            <Skeleton className='w-4/5 rounded-lg'>
                                <div className='h-3 w-4/5 rounded-lg bg-default-200'></div>
                            </Skeleton>
                            <Skeleton className='w-2/5 rounded-lg'>
                                <div className='h-3 w-2/5 rounded-lg bg-default-300'></div>
                            </Skeleton>
                        </div>
                    ) : (
                        <ReactMarkdown
                            className='markdown-body select-text'
                            components={{
                                code: ({ node, ...props }) => {
                                    const { children } = props;
                                    return <Code size='sm'>{children}</Code>;
                                },
                                h2: ({ node, ...props }) => (
                                    <b>
                                        <h2
                                            className='text-[24px]'
                                            {...props}
                                        />
                                        <hr />
                                        <br />
                                    </b>
                                ),
                                h3: ({ node, ...props }) => (
                                    <b>
                                        <br />
                                        <h3
                                            className='text-[18px]'
                                            {...props}
                                        />
                                        <br />
                                    </b>
                                ),
                                li: ({ node, ...props }) => {
                                    const { children } = props;
                                    return (
                                        <li
                                            className='list-disc list-inside'
                                            children={children}
                                        />
                                    );
                                },
                            }}
                        >
                            {body}
                        </ReactMarkdown>
                    )}
                </CardBody>
            </Card>
            {downloaded !== 0 && (
                <Progress
                    aria-label='Downloading...'
                    label={t('updater.progress')}
                    value={(downloaded / total) * 100}
                    classNames={{
                        base: 'w-full px-[80px]',
                        track: 'drop-shadow-md border border-default',
                        indicator: 'bg-gradient-to-r from-pink-500 to-yellow-500',
                        label: 'tracking-wider font-medium text-default-600',
                        value: 'text-foreground/60',
                    }}
                    showValueLabel
                    size='sm'
                />
            )}

            <div className={`grid gap-4 ${shouldUpdate && !forceUpdate ? 'grid-cols-2' : 'grid-cols-1'} h-[50px] my-[10px] mx-[80px]`}>
                {shouldUpdate && (
                    <Button
                        variant='flat'
                        isLoading={downloaded !== 0}
                        isDisabled={downloaded !== 0}
                        color='primary'
                        onPress={() => {
                            installUpdate().then(
                                () => {
                                    toast.success(t('updater.installed'), { style: toastStyle, duration: 10000 });
                                    relaunch();
                                },
                                (e) => {
                                    toast.error(e.toString(), { style: toastStyle });
                                }
                            );
                        }}
                    >
                        {downloaded !== 0
                            ? downloaded > total
                                ? t('updater.installing')
                                : t('updater.downloading')
                            : t('updater.update')}
                    </Button>
                )}
                {!forceUpdate && (
                    <Button
                        variant='flat'
                        color='danger'
                        onPress={() => {
                            appWindow.close();
                        }}
                    >
                        {t('updater.cancel')}
                    </Button>
                )}
            </div>
        </div>
    );
}
