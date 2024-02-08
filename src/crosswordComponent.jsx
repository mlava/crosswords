import { createComponentRender } from "roamjs-components/components/ComponentContainer";
import React from 'react';
import Crossword from '@jaredreisinger/react-crossword';

const CrosswordElement = ({ blockUid, sourceData }) => {
    return (
        <Crossword data={sourceData} />
    );
};

export const renderCrossword = createComponentRender(
    ({ blockUid }) => <CrosswordElement blockUid={blockUid} sourceData />,
    "crossword-parent"
);