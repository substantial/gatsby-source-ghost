const GhostAPI = require('./api');
const {createNodeFactories} = require('./nodes');

exports.sourceNodes = async ({actions}, configOptions) => {
    const {createNode} = actions;

    return Promise.all([
        GhostAPI.fetchAllPosts(configOptions),
        GhostAPI.fetchAllTags(configOptions),
        GhostAPI.fetchAllUsers(configOptions)
    ]).then(([posts, tags, users]) => {
        const {
            buildPostNode,
            buildTagNode,
            buildAuthorNode
        } = createNodeFactories({posts, tags, users});

        posts.forEach(post => createNode(buildPostNode(post)));
        tags.forEach(tag => createNode(buildTagNode(tag)));
        users.forEach(user => createNode(buildAuthorNode(user)));
    });
};
