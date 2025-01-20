import React, { useEffect, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { useTranslation } from 'react-i18next';
import { info } from 'tauri-plugin-log-api';
import { readTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { appName } from '../../utils/env';

export default function Notify() {
    const [notification, setNotification] = useState({ title: '', content: '' });
    const { t } = useTranslation();

    useEffect(() => {
        info("Notify component mounted");
        const readContent = async () => {
            try {
                const content = await readTextFile('notify_content.json', { dir: BaseDirectory.App });
                info(`Read notification content: ${content}`);
                const data = JSON.parse(content);
                setNotification(data);
            } catch (err) {
                info(`Error reading notification content: ${err}`);
            }
        };
        readContent();
    }, []);

    const handleClose = () => {
        info("Closing notification window");
        appWindow.close();
    };

    return (
        <div className="bg-background min-h-screen select-none cursor-default">
            <div className="flex flex-col min-h-screen p-6 space-y-4">
                {/* App Logo and Name Header */}
                <div className="flex-none flex items-center justify-center space-x-3">
                    <img
                        src="icon.png"
                        className="w-8 h-8"
                        draggable={false}
                        alt={appName}
                    />
                    <h1 className="text-xl font-bold text-foreground">{t('config.about.app_name')}</h1>
                </div>
                
                {/* Important Notice Badge */}
                <div className="flex-none flex justify-center">
                    <span className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-sm font-medium">
                        {t('common.important_notice')}
                    </span>
                </div>

                {/* Notification Content */}
                <div className="flex-1 overflow-auto whitespace-pre-wrap text-foreground border border-border rounded-lg p-6 bg-background/50 shadow-sm">
                    {notification.content}
                </div>

                {/* Action Button */}
                <div className="flex-none flex justify-center pt-4">
                    <button 
                        onClick={handleClose}
                        className="min-w-[120px] px-8 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
                    >
                        {t('common.ok')}
                    </button>
                </div>
            </div>
        </div>
    );
} 