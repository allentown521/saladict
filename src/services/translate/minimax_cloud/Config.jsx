import { Input, Button, Switch, Textarea, Card, CardBody, Link } from '@nextui-org/react';
import { DropdownTrigger } from '@nextui-org/react';
import { MdDeleteOutline } from 'react-icons/md';
import { DropdownMenu } from '@nextui-org/react';
import { DropdownItem } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@nextui-org/react';
import { open } from '@tauri-apps/api/shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { translate } from './index';
import { Language } from './index';
import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';

export const defaultRequestArguments = JSON.stringify({
    temperature: 0.1,
    top_p: 0.99,
    frequency_penalty: 0,
    presence_penalty: 0,
});
const availableModels = 'minimax-m2'.split('、').map((it) => it.trim());
export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [minimaxConfig, setServiceConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.minimax_cloud.title'),
            service: 'minimax_cloud',
            requestPath: `${import.meta.env.VITE_API_BASE_URL}/api/chat/completions`,
            model: availableModels[0],
            apiKey: '',
            stream: false,
            promptList: [
                {
                    role: 'system',
                    content:
                        'You are a professional translation engine, please translate the text into a colloquial, professional, elegant and fluent content, without the style of machine translation. You must only translate the text content, never interpret it.',
                },
                { role: 'user', content: `Translate into $to:\n"""\n$text\n"""` },
            ],
            requestArguments: defaultRequestArguments,
        },
        { sync: false }
    );

    const [isLoading, setIsLoading] = useState(false);

    const toastStyle = useToastStyle();

    return (
        minimaxConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setServiceConfig(minimaxConfig, true);
                    updateServiceList(instanceKey);
                    onClose();
                }}
            >
                <Toaster />
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={minimaxConfig[INSTANCE_NAME_CONFIG_KEY]}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                    />
                </div>

                <div className='config-item'>
                    <Switch
                        isSelected={minimaxConfig['stream']}
                        onValueChange={(value) => {
                            setServiceConfig({
                                ...minimaxConfig,
                                stream: value,
                            });
                        }}
                        classNames={{
                            base: 'flex flex-row-reverse justify-between w-full max-w-full',
                        }}
                    >
                        {t('services.translate.minimax_cloud.stream')}
                    </Switch>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.minimax_cloud.model')}</h3>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant='bordered'>{minimaxConfig.model}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            autoFocus='first'
                            aria-label='model'
                            onAction={(key) => {
                                setServiceConfig({
                                    ...minimaxConfig,
                                    model: key,
                                });
                            }}
                        >
                            {availableModels.map((it) => (
                                <DropdownItem key={it}>{it}</DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
                <h3 className='my-auto'>Prompt List</h3>
                <p className='text-[10px] text-default-700'>
                    {t('services.translate.minimax_cloud.prompt_description')}
                </p>

                <div className='bg-content2 rounded-[10px] p-3'>
                    {minimaxConfig.promptList &&
                        minimaxConfig.promptList.map((prompt, index) => {
                            return (
                                <div className='config-item'>
                                    <Textarea
                                        label={prompt.role}
                                        labelPlacement='outside'
                                        variant='faded'
                                        value={prompt.content}
                                        placeholder={`Input Some ${prompt.role} Prompt`}
                                        onValueChange={(value) => {
                                            setServiceConfig({
                                                ...minimaxConfig,
                                                promptList: minimaxConfig.promptList.map((p, i) => {
                                                    if (i === index) {
                                                        if (i === 0) {
                                                            return {
                                                                role: 'system',
                                                                content: value,
                                                            };
                                                        } else {
                                                            return {
                                                                role: index % 2 !== 0 ? 'user' : 'assistant',
                                                                content: value,
                                                            };
                                                        }
                                                    } else {
                                                        return p;
                                                    }
                                                }),
                                            });
                                        }}
                                    />
                                    <Button
                                        isIconOnly
                                        color='danger'
                                        className='my-auto mx-1'
                                        variant='flat'
                                        onPress={() => {
                                            setServiceConfig({
                                                ...minimaxConfig,
                                                promptList: minimaxConfig.promptList.filter((_, i) => i !== index),
                                            });
                                        }}
                                    >
                                        <MdDeleteOutline className='text-[18px]' />
                                    </Button>
                                </div>
                            );
                        })}
                    <Button
                        fullWidth
                        onPress={() => {
                            setServiceConfig({
                                ...minimaxConfig,
                                promptList: [
                                    ...minimaxConfig.promptList,
                                    {
                                        role:
                                            minimaxConfig.promptList.length === 0
                                                ? 'system'
                                                : minimaxConfig.promptList.length % 2 === 0
                                                  ? 'assistant'
                                                  : 'user',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.minimax_cloud.add')}
                    </Button>
                </div>
                <br />

                <h3 className='my-auto'>Request Arguments</h3>
                <div className='config-item'>
                    <Textarea
                        label=''
                        labelPlacement='outside'
                        variant='faded'
                        value={minimaxConfig['requestArguments']}
                        placeholder={`Input API Request Arguments`}
                        onValueChange={(value) => {
                            setServiceConfig({
                                ...minimaxConfig,
                                requestArguments: value,
                            });
                        }}
                    />
                </div>
                <br />
                <Button
                    type='submit'
                    isLoading={isLoading}
                    fullWidth
                    color='primary'
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
