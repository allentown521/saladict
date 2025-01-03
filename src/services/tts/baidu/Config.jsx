import { INSTANCE_NAME_CONFIG_KEY } from '../../../utils/service_instance';
import { Button, Input } from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/api/shell';
import React, { useState } from 'react';

import { useConfig } from '../../../hooks/useConfig';
import { useToastStyle } from '../../../hooks';
import { Language } from './index';
import { info } from './info';
import { tts } from './index';

export function Config(props) {
    const { t } = useTranslation();
    const { instanceKey, updateServiceList, onClose } = props;

    return (
        <>
            <div>{t('services.no_need')}</div>
            <div>
                <Button
                    fullWidth
                    color='primary'
                    onPress={() => {
                        updateServiceList('baidu_tts');
                        onClose();
                    }}
                >
                    {t('common.save')}
                </Button>
            </div>
        </>
    );
}
