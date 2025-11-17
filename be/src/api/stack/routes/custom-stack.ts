/**
 * Custom stack routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/stacks/process-sheet',
            handler: 'api::stack.stack.processSheet',
        },
    ],
};

