const ContentAPI = require('./content-api');
const {createNodeFactories} = require('./ghost-nodes');
const {getImagesFromApiResults} = require('./lib');
const schema = require('./ghost-schema');

/**
 * Create Temporary Fake Nodes
 * Refs: https://github.com/gatsbyjs/gatsby/issues/10856#issuecomment-451701011
 * Ensures that Gatsby knows about every field in the Ghost schema
 */
const createTemporaryFakeNodes = async ({emitter, actions}, imageArgs) => {
    const {createNode} = actions;

    const {
        PostNode,
        PageNode,
        TagNode,
        AuthorNode,
        SettingsNode,
        MediaNode
    } = createNodeFactories({
        posts: [schema.post],
        tags: [schema.tag],
        authors: [schema.author]
    }, imageArgs);

    const images = getImagesFromApiResults([[schema.post], [schema.page], [schema.tag], [schema.author]]);
    for (const image of images) {
        createNode(await MediaNode(image));
    }

    const fakeNodes = [
        PostNode(schema.post),
        PageNode(schema.page),
        TagNode(schema.tag),
        AuthorNode(schema.author),
        SettingsNode(schema.settings)
    ];

    // Setup our temporary fake nodes
    fakeNodes.forEach((node) => {
        // createTemporaryFakeNodes is called twice. The second time, the node already has an owner
        // This triggers an error, so we clean the node before trying again
        delete node.internal.owner;
        actions.createNode(node);
    });

    const onSchemaUpdate = () => {
        // Destroy our temporary fake nodes
        fakeNodes.forEach((node) => {
            actions.deleteNode({node});
        });
        emitter.off(`SET_SCHEMA`, onSchemaUpdate);
    };

    // Use a Gatsby internal API to cleanup our Fake Nodes
    emitter.on(`SET_SCHEMA`, onSchemaUpdate);
};

exports.sourceNodes = async ({emitter, actions, createNodeId, store, cache}, configOptions) => {
    const {createNode, touchNode} = actions;
    const imageArgs = {createNode, createNodeId, touchNode, store, cache};

    // These temporary nodes ensure that Gatsby knows about every field in the Ghost Schema
    createTemporaryFakeNodes({emitter, actions}, imageArgs);

    const api = ContentAPI.configure(configOptions);

    const postAndPageFetchOptions = {
        limit: 'all',
        include: 'tags,authors',
        formats: 'html,plaintext'
    };

    const tagAndAuthorFetchOptions = {
        limit: 'all',
        include: 'count.posts'
    };

    const [posts, pages, tags, authors, settings] = await Promise.all([
        api.posts.browse(postAndPageFetchOptions),
        api.pages.browse(postAndPageFetchOptions),
        api.tags.browse(tagAndAuthorFetchOptions),
        api.authors.browse(tagAndAuthorFetchOptions),
        api.settings.browse()
    ]);

    const {PostNode, PageNode, TagNode, AuthorNode, SettingsNode, MediaNode} =
         createNodeFactories({posts, tags, authors}, imageArgs);

    const images = getImagesFromApiResults([posts, pages, tags, authors]);
    for (const image of images) {
        createNode(await MediaNode(image));
    }

    for (const post of posts) {
        createNode(await PostNode(post));
    }

    for (const page of pages) {
        createNode(await PageNode(page));
    }

    for (const tag of tags) {
        createNode(TagNode(tag));
    }

    for (const author of authors) {
        createNode(AuthorNode(author));
    }

    // The settings object doesn't have an id, prevent Gatsby from getting 'undefined'
    settings.id = 1;
    createNode(SettingsNode(settings));
};

// Secondary point in build where we have to create fake Nodes
exports.onPreExtractQueries = async ({emitter, actions, createNodeId, store, cache}) => {
    const {createNode, touchNode} = actions;
    const imageArgs = {createNode, createNodeId, touchNode, store, cache};

    // These temporary nodes ensure that Gatsby knows about every field in the Ghost Schema
    createTemporaryFakeNodes({emitter, actions}, imageArgs);
};
