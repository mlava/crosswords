import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import React from 'react';
import Crossword from '@jaredreisinger/react-crossword';

const CrosswordElement = () => {
    return (
        <Crossword data={window.crosswordData} />
    );
};

export const renderCrossword = createComponentRender(
    ({ blockUid }) => <CrosswordElement blockUid={blockUid} style={'display: inline-block;'}/>,
    "crossword-parent"
);