import Q from 'q';
import React from 'react';

export default class AutocompleteProvider {
    constructor(commandRegex?: RegExp, fuseOpts?: any) {
        if(commandRegex) {
            if(!commandRegex.global) {
                throw new Error('commandRegex must have global flag set');
            }
            this.commandRegex = commandRegex;
        }
    }

    /**
     * Of the matched commands in the query, returns the first that contains or is contained by the selection, or null.
     */
    getCurrentCommand(query: string, selection: {start: number, end: number}): ?Array<string> {
        if (this.commandRegex == null) {
            return null;
        }

        this.commandRegex.lastIndex = 0;
        
        let match;
        while ((match = this.commandRegex.exec(query)) != null) {
            let matchStart = match.index,
                matchEnd = matchStart + match[0].length;
            
            if (selection.start <= matchEnd && selection.end >= matchStart) {
                return {
                    command: match,
                    range: {
                        start: matchStart,
                        end: matchEnd,
                    },
                };
            }
        }
        return {
            command: null,
            range: {
                start: -1,
                end: -1,
            },
        };
    }

    getCompletions(query: string, selection: {start: number, end: number}) {
        return Q.when([]);
    }

    getName(): string {
        return 'Default Provider';
    }

    renderCompletions(completions: [React.Component]): ?React.Component {
        console.error('stub; should be implemented in subclasses');
        return null;
    }
}
