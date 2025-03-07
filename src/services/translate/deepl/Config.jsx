import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { DropdownTrigger } from '@nextui-org/react';
import { Input, Button } from '@nextui-org/react';
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

export function Config(props) {
    const { instanceKey, updateServiceList, onClose } = props;
    const { t } = useTranslation();
    const defaultConfig = {
        [INSTANCE_NAME_CONFIG_KEY]: t('services.translate.deepl.title'),
        type: 'free',
        authKey: '',
        customUrl: '',
    };

    const [deeplConfig, setDeeplConfig] = useConfig(
        instanceKey,
        defaultConfig,
        { sync: false }
    );

    // when disable deepl before user set config, then config is not null, but other fields are empty
    const config = deeplConfig ? { ...defaultConfig, ...deeplConfig } : defaultConfig;
    const [isLoading, setIsLoading] = useState(false);

    const toastStyle = useToastStyle();
    return (
        config !== null && (
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    translate('hello', Language.auto, Language.zh_cn, { config }).then(
                        () => {
                            setIsLoading(false);
                            setDeeplConfig(config, true);
                            updateServiceList(instanceKey);
                            onClose();
                        },
                        (e) => {
                            setIsLoading(false);
                            toast.error(t('config.service.test_failed') + e.toString(), { style: toastStyle });
                        }
                    );
                }}
            >
                <Toaster />
                <div className='config-item'>
                    <Input
                        label={t('services.instance_name')}
                        labelPlacement='outside-left'
                        value={config[INSTANCE_NAME_CONFIG_KEY]}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setDeeplConfig({
                                ...config,
                                [INSTANCE_NAME_CONFIG_KEY]: value,
                            });
                        }}
                    />
                </div>
                <div className={`config-item ${config.type === 'free' && 'hidden'}`}>
                    <h3 className='my-auto'>{t('services.help')}</h3>
                    <Button
                        onPress={() => {
                            const url =
                                config.type === 'api'
                                    ? 'https://saladict-app.aichatone.com/docs/api/translate/deepl.html'
                                    : 'https://github.com/OwO-Network/DeepLX';
                            open(url);
                        }}
                    >
                        {t('services.help')}
                    </Button>
                </div>
                <div className='config-item'>
                    <h3 className='my-auto'>{t('services.translate.deepl.type')}</h3>
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant='bordered'>{t(`services.translate.deepl.${config.type}`)}</Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            autoFocus='first'
                            aria-label='app language'
                            onAction={(key) => {
                                setDeeplConfig({
                                    ...config,
                                    type: key,
                                });
                            }}
                        >
                            <DropdownItem key='free'>{t(`services.translate.deepl.free`)}</DropdownItem>
                            <DropdownItem key='api'>{t(`services.translate.deepl.api`)}</DropdownItem>
                            <DropdownItem key='deeplx'>{t(`services.translate.deepl.deeplx`)}</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
                <div className={`config-item ${config.type !== 'api' && 'hidden'}`}>
                    <Input
                        label={t('services.translate.deepl.auth_key')}
                        labelPlacement='outside-left'
                        type='password'
                        value={config['authKey']}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setDeeplConfig({
                                ...config,
                                authKey: value,
                            });
                        }}
                    />
                </div>
                <div className={`config-item ${config.type !== 'deeplx' && 'hidden'}`}>
                    <Input
                        label={t('services.translate.deepl.custom_url')}
                        labelPlacement='outside-left'
                        value={config.customUrl}
                        variant='bordered'
                        classNames={{
                            base: 'justify-between',
                            label: 'text-[length:--nextui-font-size-medium]',
                            mainWrapper: 'max-w-[50%]',
                        }}
                        onValueChange={(value) => {
                            setDeeplConfig({
                                ...config,
                                customUrl: value,
                            });
                        }}
                    />
                </div>
                <Button
                    type='submit'
                    isLoading={isLoading}
                    color='primary'
                    fullWidth
                >
                    {t('common.save')}
                </Button>
            </form>
        )
    );
}
