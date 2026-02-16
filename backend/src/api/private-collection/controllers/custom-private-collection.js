'use strict';

module.exports = {
    async access(ctx) {
        const { slug, password } = ctx.request.body;

        if (!slug || !password) {
            return ctx.badRequest('Slug and password are required');
        }

        const collection = await strapi.db.query('api::private-collection.private-collection').findOne({
            where: { slug, isActive: true },
            populate: ['products', 'products.variants', 'products.variants.media', 'Images'],
        });

        if (!collection) {
            return ctx.notFound('Collection not found');
        }

        if (collection.password !== password) {
            return ctx.forbidden('Invalid password');
        }

        // Return collection data (sanitize if necessary, but for now raw is okay as password is private in schema so sanitizeEntity might hide it, but here we are returning explicitly found data)
        // Actually, strapi.db.query returns plain objects.
        // We should be careful not to return the password field back to the user, although it's the one they just sent.
        // Let's remove sensitive data just in case.
        delete collection.password;

        return collection;
    },
};
