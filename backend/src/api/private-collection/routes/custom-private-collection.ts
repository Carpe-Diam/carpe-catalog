export default {
    routes: [
        {
            method: 'POST',
            path: '/private-collections/access',
            handler: 'custom-private-collection.access',
            config: {
                auth: false, // Open access, protected by password in body
            },
        },
    ],
};
