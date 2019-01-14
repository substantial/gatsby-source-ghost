const GhostContentAPI = require('@tryghost/content-api');
const {createNodeFactories} = require('./nodes');
const {getImagesFromApiResults} = require('./lib');

exports.sourceNodes = async ({actions, createNodeId, store, cache}, configOptions) => {
    const {createNode, touchNode} = actions;
    const imageArgs = {createNode, createNodeId, touchNode, store, cache};

    const api = new GhostContentAPI({
        host: configOptions.apiUrl,
        key: configOptions.contentApiKey,
        version: 'v2'
    });

    const postAndPageFetchOptions = {
        limit: 'all',
        include: 'tags,authors',
        formats: 'html,plaintext'
    };

    const tagAndAuthorFetchOptions = {
        limit: 'all',
        include: 'count.posts,count.pages'
    };

    const [posts, pages, tags, users] = await Promise.all([
        api.posts.browse(postAndPageFetchOptions),
        api.pages.browse(postAndPageFetchOptions),
        api.tags.browse(tagAndAuthorFetchOptions),
        api.authors.browse(tagAndAuthorFetchOptions)
    ]);

    const {
        buildPostNode,
        buildPageNode,
        buildTagNode,
        buildAuthorNode,
        buildMediaNode
    } = createNodeFactories({posts, pages, tags, users}, imageArgs);

    const images = getImagesFromApiResults([posts, pages, tags, users]);
    for (const image of images) {
        createNode(await buildMediaNode(image));
    }

    for (const post of posts) {
        createNode(await buildPostNode(post));
    }

    for (const page of pages) {
        createNode(await buildPageNode(page));
    }

    for (const tag of tags) {
        createNode(buildTagNode(tag));
    }

    for (const user of users) {
        createNode(buildAuthorNode(user));
    }
};
