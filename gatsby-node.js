const GhostAPI = require('./api');
const {createNodeFactories} = require('./nodes');
const {getImagesFromApiResults} = require('./lib');

exports.sourceNodes = async ({actions, createNodeId, store, cache}, configOptions) => {
    const {createNode, touchNode} = actions;
    const imageArgs = {createNode, createNodeId, touchNode, store, cache};

    const [posts, tags, users] = await Promise.all([
        GhostAPI.fetchAllPosts(configOptions),
        GhostAPI.fetchAllTags(configOptions),
        GhostAPI.fetchAllUsers(configOptions)
    ]);

    const {
        buildPostNode,
        buildTagNode,
        buildAuthorNode,
        buildMediaNode
    } = createNodeFactories({posts, tags, users}, imageArgs);

    for (const post of posts) {
        createNode(await buildPostNode(post));
    }

    for (const tag of tags) {
        createNode(buildTagNode(tag));
    }

    for (const user of users) {
        createNode(buildAuthorNode(user));
    }

    const images = getImagesFromApiResults([posts, tags, users]);
    for (const image of images) {
        createNode(await buildMediaNode(image));
    }
};
