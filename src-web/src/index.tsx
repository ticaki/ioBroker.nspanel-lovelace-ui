import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import './style/panel.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App, mockFromLocation, mockModelFromLocation, topicFromLocation } from './App';

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <App
                topic={topicFromLocation()}
                mock={mockFromLocation()}
                mockModel={mockModelFromLocation()}
            />
        </React.StrictMode>,
    );
}
