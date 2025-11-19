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
const availableModels = 'claude-4.5-haiku、claude-4.5-sonnet'.split('、').map((it) => it.trim());
export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const [claudeConfig, setOpenaiConfig] = useConfig(
        instanceKey,
        {
            [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.claude_cloud.title'),
            service: 'claude_cloud',
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
        claudeConfig !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setOpenaiConfig(claudeConfig, true);
                    updateServiceList(instanceKey);
                    onClose();
                }}
            >
                <Toaster />
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={claudeConfig[INSTANCE_NAME_CONFIG_KEY]}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        disabled
                    />
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        onPress={() => {
                            open('https://app.saladict.net/docs/api/translate/claude.html');
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>

                <div className='config-item'>
                    <Switch
                        isSelected={claudeConfig['stream']}
                        onValueChange={(value) => {
                            setOpenaiConfig({
                                ...claudeConfig,
                                stream: value,
                            });
                        }}
                        classNames={{
                            base: 'flex flex-row-reverse justify-between w-full max-w-full',
                        }}
                    >
                        {t('services.translate.claude_cloud.stream')}
                    </Switch>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.claude_cloud.model')}</h3>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant='bordered'>{claudeConfig.model}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            autoFocus='first'
                            aria-label='model'
                            onAction={(key) => {
                                setOpenaiConfig({
                                    ...claudeConfig,
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
                    {t('services.translate.claude_cloud.prompt_description')}
                </p>

                <div className='bg-content2 rounded-[10px] p-3'>
                    {claudeConfig.promptList &&
                        claudeConfig.promptList.map((prompt, index) => {
                            return (
                                <div className='config-item'>
                                    <Textarea
                                        label={prompt.role}
                                        labelPlacement='outside'
                                        variant='faded'
                                        value={prompt.content}
                                        placeholder={`Input Some ${prompt.role} Prompt`}
                                        onValueChange={(value) => {
                                            setOpenaiConfig({
                                                ...claudeConfig,
                                                promptList: claudeConfig.promptList.map((p, i) => {
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
                                            setOpenaiConfig({
                                                ...claudeConfig,
                                                promptList: claudeConfig.promptList.filter((_, i) => i !== index),
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
                            setOpenaiConfig({
                                ...claudeConfig,
                                promptList: [
                                    ...claudeConfig.promptList,
                                    {
                                        role:
                                            claudeConfig.promptList.length === 0
                                                ? 'system'
                                                : claudeConfig.promptList.length % 2 === 0
                                                  ? 'assistant'
                                                  : 'user',
                                        content: '',
                                    },
                                ],
                            });
                        }}
                    >
                        {t('services.translate.claude_cloud.add')}
                    </Button>
                </div>
                <br />

                <h3 className='my-auto'>Request Arguments</h3>
                <div className='config-item'>
                    <Textarea
                        label=''
                        labelPlacement='outside'
                        variant='faded'
                        value={claudeConfig['requestArguments']}
                        placeholder={`Input API Request Arguments`}
                        onValueChange={(value) => {
                            setOpenaiConfig({
                                ...claudeConfig,
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
