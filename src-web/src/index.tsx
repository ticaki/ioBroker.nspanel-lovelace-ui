import './style/panel.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App, mockButtonsFromLocation, mockFromLocation, mockModelFromLocation, topicFromLocation } from './App';

const container = document.getElementById('root');
if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <App
                topic={topicFromLocation()}
                mock={mockFromLocation()}
                mockModel={mockModelFromLocation()}
                mockButtons={mockButtonsFromLocation()}
            />
        </React.StrictMode>,
    );
}
